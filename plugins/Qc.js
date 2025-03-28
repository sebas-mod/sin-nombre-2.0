const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Bandera según prefijo
const banderaPorPrefijo = (numero) => {
  const prefijos = {
    '507': '🇵🇦',
    '503': '🇸🇻',
    '502': '🇬🇹',
    '504': '🇭🇳',
    '505': '🇳🇮',
    '506': '🇨🇷',
    '509': '🇭🇹',
    '51': '🇵🇪',
    '52': '🇲🇽',
    '53': '🇨🇺',
    '54': '🇦🇷',
    '55': '🇧🇷',
    '56': '🇨🇱',
    '57': '🇨🇴',
    '58': '🇻🇪',
    '1':  '🇺🇸'
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
    return `${bandera} +${number.slice(0, 2)} ${number.slice(2, 6)}-${number.slice(6)}`;
  } else {
    return `${bandera} +${number}`;
  }
};

/**
 * Intenta obtener un nombre “bonito” (preferencia):
 * 1) conn.getName
 * 2) msg.pushName (nombre que trae el mensaje)
 * 3) conn.contacts
 * 4) Número formateado
 */
const getNombreBonito = async (jid, conn, fallbackPushName = '') => {
  // Si no tenemos JID, retornamos algo genérico
  if (!jid) return '???';

  try {
    let name = '';

    // (1) Intentar usar siempre conn.getName
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }

    // (2) Si sigue vacío, usar pushName
    if (!name || !name.trim() || name.includes('@')) {
      if (fallbackPushName && fallbackPushName.trim()) {
        name = fallbackPushName;
      }
    }

    // (3) Si aún está vacío, revisar contactos
    if (!name || !name.trim() || name.includes('@')) {
      const c = conn.contacts?.[jid] || {};
      const cName = c.name || c.notify || c.vname || '';
      if (cName && cName.trim() && !cName.includes('@')) {
        name = cName;
      }
    }

    // (4) Si no hay nada, usar el número
    if (!name || !name.trim() || name.includes('@')) {
      name = formatPhoneNumber(jid);
    }

    return name;
  } catch (err) {
    console.log("Error en getNombreBonito:", err);
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, args }) => {
  try {
    // Info del mensaje citado
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    const quotedJid = quoted?.participant;

    // En Baileys, si fromMe es true, significa que lo envió el bot
    const isFromBot = !!msg.key.fromMe;

    // Sacar pushName del mensaje
    // (En Baileys MD a veces viene en msg.pushName o msg.pushName)
    const fallbackPushName = msg.pushName || '';

    // Determinar JID objetivo
    let targetJid;
    if (quotedJid) {
      // Si hay mensaje citado, se usa el que se citó
      targetJid = quotedJid;
    } else {
      // Sino, sacamos del participant (en grupos) o remoteJid (en privado)
      targetJid = msg.key.participant || msg.key.remoteJid;

      // Si en privado es el mismo bot (fromMe = true), a veces el remoteJid es nuestro propio JID.
      // Tú decides si quieres forzar que aparezca tu "nombre de usuario" o algo:
      if (msg.key.remoteJid.endsWith('@s.whatsapp.net') && isFromBot) {
        // Por ejemplo, forzamos a que lo identifique con pushName o un alias:
        targetJid = conn.user?.jid || targetJid;
      }
    }

    // Obtener el nombre con la función priorizando getName
    const targetName = await getNombreBonito(targetJid, conn, fallbackPushName);

    // Obtener foto de perfil
    let targetPp;
    try {
      // Usa "image" o "preview", según tu versión de Baileys
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Texto que irá en el sticker
    let contenido = args.join(' ').trim();

    // Si no hay args, tomamos el texto del mensaje citado (si existe)
    if (!contenido && quotedMsg) {
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text
               || quotedMsg[tipo]?.caption
               || quotedMsg[tipo]
               || '';
    }

    // Validar que haya texto
    if (!contenido.trim()) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg }
      );
    }

    // Límite de 35 caracteres
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg }
      );
    }

    // Reacción de procesando
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    // Datos para la API quote
    const quoteData = {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 600,
      height: 900,
      scale: 3,
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

    // Llamada al servicio
    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Base64 -> Buffer
    const buffer = Buffer.from(res.data.result.image, 'base64');

    // Sticker con metadatos
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar sticker
    await conn.sendMessage(
      msg.key.remoteJid,
      { sticker: { url: sticker } },
      { quoted: msg }
    );

    // Reacción final
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en qc:", err);
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: '❌ Error al generar el sticker.' },
      { quoted: msg }
    );
  }
};

handler.command = ['qc'];
module.exports = handler;
