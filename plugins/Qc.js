const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

const defaultPhoto = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';

// Función para obtener la bandera según el prefijo
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

// Función para obtener el nombre y la foto del contacto
const getContactData = async (jid, conn, msg) => {
  let name = '';
  let photo = defaultPhoto;
  
  // Primero intenta obtener datos del contacto en la lista
  if (conn.contacts && conn.contacts[jid]) {
    const contact = conn.contacts[jid];
    name = contact.pushname || contact.name || '';
  }
  // Si no se obtuvo nombre, intenta con conn.getName
  if (!name || name.trim() === '' || name.includes('@')) {
    if (typeof conn.getName === 'function') {
      try {
        name = await conn.getName(jid);
      } catch (e) {
        name = '';
      }
    }
  }
  // Si sigue sin nombre, utiliza msg.pushName (si es el bot) o el número formateado
  if (!name || name.trim() === '' || name.includes('@')) {
    if (jid === msg.sender || jid === conn.user.id) {
      name = msg.pushName || "Sin nombre";
    } else {
      name = formatPhoneNumber(jid);
    }
  }
  
  // Intenta obtener la foto real
  try {
    photo = await conn.profilePictureUrl(jid, 'image');
  } catch (e) {
    photo = defaultPhoto;
  }
  return { name, photo };
};

const handler = async (msg, { conn, text, args }) => {
  try {
    let targetJid = '';
    let quotedMessage = null;
    
    // Detecta si hay mensaje citado
    if (msg.quoted && msg.quoted.sender) {
      // Si existe msg.quoted (estructura similar a otros comandos)
      targetJid = msg.quoted.sender;
      quotedMessage = msg.quoted;
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      // Alternativamente, usa contextInfo
      targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    } else if (msg.mentionedJid && msg.mentionedJid.length > 0) {
      targetJid = msg.mentionedJid[0];
    } else if (msg.key && msg.key.fromMe) {
      targetJid = conn.user.id;
    } else {
      targetJid = msg.sender;
    }
    
    // Obtén el nombre y la foto usando la misma lógica de otros comandos
    const { name: targetName, photo: targetPp } = await getContactData(targetJid, conn, msg);
    
    // Obtener el texto para el sticker: si hay argumentos, se usan; sino, se extrae del mensaje citado
    let contenido = args.join(" ").trim();
    if (!contenido) {
      if (msg.quoted && msg.quoted.text) {
        contenido = msg.quoted.text;
      } else if (quotedMessage) {
        const keys = Object.keys(quotedMessage);
        if (keys.length > 0) {
          const key = keys[0];
          contenido = quotedMessage[key]?.text || quotedMessage[key]?.caption || '';
        }
      }
    }
    
    if (!contenido || contenido.trim() === '') {
      return await conn.sendMessage(msg.key.remoteJid, { text: '⚠️ Escribe una palabra o cita un mensaje.' }, { quoted: msg });
    }
    
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, { text: '⚠️ El texto no puede tener más de 35 caracteres.' }, { quoted: msg });
    }
    
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '🎨', key: msg.key } });
    
    const quoteData = {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 512,
      height: 768,
      scale: 2,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: targetName,
          photo: { url: targetPp }
        },
        text: textoLimpio,
        replyMessage: {}
      }]
    };
    
    const json = await axios.post('https://bot.lyo.su/quote/generate', quoteData, { headers: { 'Content-Type': 'application/json' } });
    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, { packname: "Azura Ultra 2.0 Bot", author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻" });
    await conn.sendMessage(msg.key.remoteJid, { sticker: { url: sticker } }, { quoted: msg });
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
    
  } catch (e) {
    console.error("❌ Error en el comando qc:", e);
    await conn.sendMessage(msg.key.remoteJid, { text: '❌ Ocurrió un error al generar el sticker.' }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
