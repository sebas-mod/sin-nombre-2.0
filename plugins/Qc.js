const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Sistema de banderas por prefijo
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
    '1': '🇺🇸'
  };
  const num = numero.split('@')[0];
  return prefijos[Object.keys(prefijos).find(p => num.startsWith(p))] || '🌎';
};

// Formateo de número con bandera
const formatPhoneNumber = (jid) => {
  const number = jid.split('@')[0];
  const bandera = banderaPorPrefijo(jid);
  const format = (digits, splits) => {
    const parts = [];
    splits.forEach((split, i) => parts.push(number.slice(digits[i], digits[i] + split)));
    return parts.join('-');
  };

  if (number.length === 12) return `${bandera} +${format([0,3,7], [3,4,4])}`;
  if (number.length === 11) return `${bandera} +${format([0,2,6], [2,4,5])}`;
  return `${bandera} +${number}`;
};

// Sistema inteligente de nombres
const getNombreBonito = async (jid, conn, pushName = '') => {
  try {
    let name = '';
    // 1. Prioridad: Nombre público
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid).catch(() => '');
      if (name?.trim() && !name.includes('@')) return name;
    }

    // 2. Contactos del bot
    const contacto = conn.contacts?.[jid] || {};
    name = contacto.name || contacto.notify || contacto.vname || '';
    if (name?.trim() && !name.includes('@')) return name;

    // 3. PushName del mensaje
    if (pushName?.trim() && !pushName.includes('@')) return pushName;

    // 4. Número formateado
    return formatPhoneNumber(jid);
  } catch {
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, args }) => {
  try {
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = contextInfo?.quotedMessage;

    // Identificar usuario objetivo y contenido
    let targetJid, targetPushName, contenido;
    if (quoted) { // Modo cita usando lógica similar al comando "s"
      targetJid = contextInfo.participant || msg.key.remoteJid;
      // Usamos el pushName del que cita, ya que en el objeto citado no se incluye
      targetPushName = msg.pushName;
      // Obtener texto citado
      const tipo = Object.keys(quoted)[0];
      contenido = quoted[tipo]?.text || quoted[tipo]?.caption || '';
    } else { // Mensaje directo
      targetJid = msg.key.fromMe
        ? conn.user.id
        : isGroup
          ? msg.key.participant.split(':')[0]
          : msg.key.remoteJid;
      targetPushName = msg.pushName;
      contenido = args.join(" ").trim();
    }

    // Validar contenido
    if (!contenido?.trim()) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Escribe un texto o cita un mensaje',
        quoted: msg
      });
    }

    // Obtener metadatos
    const targetName = await getNombreBonito(targetJid, conn, targetPushName);
    const targetPp = await conn.profilePictureUrl(targetJid, 'image').catch(() =>
      'https://telegra.ph/file/24fa902ead26340f3df2c.png'
    );
    // Limitar texto
    const textoLimpio = contenido.replace(/@\d+/g, '').trim();
    if (textoLimpio.length > 35) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Máximo 35 caracteres',
        quoted: msg
      });
    }
    // Generar stickerz
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '🎨', key: msg.key } });

    const { data } = await axios.post('https://bot.lyo.su/quote/generate', {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 600,
      height: 900,
      scale: 3,
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
    }, { headers: { 'Content-Type': 'application/json' } });
    const sticker = await writeExifImg(Buffer.from(data.result.image, 'base64'), {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });
    await conn.sendMessage(msg.key.remoteJid,
      { sticker: { url: sticker } },
      { quoted: msg }
    );
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
  } catch (e) {
    console.error("Error en qc:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ Error generando sticker',
      quoted: msg
    });
  }
};

handler.command = ['qc'];
module.exports = handler;
