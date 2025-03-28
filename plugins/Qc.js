const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

const defaultPhoto = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';

// Función para obtener la bandera según el prefijo del número
const banderaPorPrefijo = (numero) => {
  const prefijos = {
    '507': '🇵🇦', '503': '🇸🇻', '502': '🇬🇹', '504': '🇭🇳',
    '505': '🇳🇮', '506': '🇨🇷', '509': '🇭🇹', '51': '🇵🇪',
    '52': '🇲🇽', '53': '🇨🇺', '54': '🇦🇷', '55': '🇧🇷',
    '56': '🇨🇱', '57': '🇨🇴', '58': '🇻🇪', '1': '🇺🇸'
  };
  const numeroSinArroba = numero.split('@')[0];
  let bandera = '';
  Object.keys(prefijos).forEach(pref => {
    if (numeroSinArroba.startsWith(pref)) {
      bandera = prefijos[pref];
    }
  });
  return bandera || '🌎';
};

// Formatear número para mostrarlo bonito
const formatPhoneNumber = (jid) => {
  const number = jid.split('@')[0];
  const bandera = banderaPorPrefijo(jid);
  if (number.length === 12) {
    return `${bandera} +${number.slice(0, 3)} ${number.slice(3, 7)}-${number.slice(7)}`;
  } else if (number.length === 11) {
    return `${bandera} +${number.slice(0, 1)} ${number.slice(1, 5)} ${number.slice(5, 8)} ${number.slice(8)}`;
  } else {
    return `${bandera} +${number}`;
  }
};

// Función para obtener los datos de contacto (nombre y foto) usando la misma lógica
// que se usa en otros comandos (por ejemplo, en qc hola)
const getContactData = async (jid, conn, msg) => {
  let name = '';
  let photo = defaultPhoto;

  // Primero, si existe en los contactos, se obtiene el pushname o name
  if (conn.contacts && conn.contacts[jid]) {
    const contact = conn.contacts[jid];
    name = contact.pushname || contact.name || '';
  }
  // Si no se obtuvo un nombre válido, se intenta con conn.getName
  if (!name || name.trim() === '' || name.includes('@')) {
    if (typeof conn.getName === 'function') {
      try {
        name = await conn.getName(jid);
      } catch (e) {
        name = '';
      }
    }
  }
  // Si sigue sin haber un nombre correcto, se utiliza el nombre del remitente (si es el bot) o se formatea el número
  if (!name || name.trim() === '' || name.includes('@')) {
    if (jid === msg.sender || jid === conn.user.id) {
      name = msg.pushName || "Sin nombre";
    } else {
      name = formatPhoneNumber(jid);
    }
  }

  // Obtener foto de perfil
  try {
    photo = await conn.profilePictureUrl(jid, 'image');
  } catch (e) {
    photo = defaultPhoto;
  }
  return { name, photo };
};

const handler = async (msg, { conn, text, args }) => {
  try {
    // Determinar a quién se le debe obtener la información:
    // Si se cita un mensaje, se toma el participante citado.
    // Si hay menciones, se toma la primera.
    // Sino, se usa el bot si el mensaje es de él o el remitente.
    let targetJid = '';
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    if (quoted && quoted.participant) {
      targetJid = quoted.participant;
    } else if (msg.mentionedJid && msg.mentionedJid.length > 0) {
      targetJid = msg.mentionedJid[0];
    } else if (msg.key && msg.key.fromMe) {
      targetJid = conn.user.id;
    } else {
      targetJid = msg.sender;
    }

    // Obtener nombre y foto del contacto
    const { name: targetName, photo: targetPp } = await getContactData(targetJid, conn, msg);

    // Obtener el texto a mostrar en el sticker
    let contenido = args.join(" ").trim();
    if (!contenido && quoted && quoted.quotedMessage) {
      const tipo = Object.keys(quoted.quotedMessage)[0];
      contenido = quoted.quotedMessage[tipo]?.text || quoted.quotedMessage[tipo]?.caption || '';
    }
    if (!contenido || contenido.trim() === '') {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Escribe una palabra o cita un mensaje.'
      }, { quoted: msg });
    }
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ El texto no puede tener más de 35 caracteres.'
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    const quoteData = {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: targetName,
            photo: { url: targetPp }
          },
          text: textoLimpio,
          replyMessage: {}
        }
      ]
    };

    const json = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });
    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });
    await conn.sendMessage(msg.key.remoteJid, { sticker: { url: sticker } }, { quoted: msg });
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
  } catch (e) {
    console.error("❌ Error en el comando qc:", e);
    await conn.sendMessage(msg.key.remoteJid, { text: '❌ Ocurrió un error al generar el sticker.' }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
