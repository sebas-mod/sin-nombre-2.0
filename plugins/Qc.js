const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Bandera según prefijo
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

// Formato bonito para número
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

// Obtener nombre real o número si está oculto
const getNombreBonito = async (jid, conn) => {
  try {
    let name = '';
    if (typeof conn.getName === 'function') { 
      name = await conn.getName(jid); 
    }
    if (!name?.trim() || name.includes('@')) {
      const contacto = conn.contacts?.[jid] || {}; 
      name = contacto.name || contacto.notify || contacto.vname || ''; 
    }
    return name?.trim() ? name : formatPhoneNumber(jid);
  } catch (e) {
    console.log("Error obteniendo nombre:", e);
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, text, args }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    const quotedJid = quoted?.participant;
    
    // Determinar targetJid
    let targetJid;
    if (quotedJid) {
      targetJid = quotedJid;
    } else {
      targetJid = msg.key.fromMe ? conn.user.id : 
        msg.key.remoteJid.endsWith('@s.whatsapp.net') ? 
        msg.key.remoteJid : 
        msg.key.participant;
    }

    // Obtener nombre y foto
    const targetName = await getNombreBonito(targetJid, conn);
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Obtener contenido
    let contenido = args.join(" ").trim();
    if (!contenido && quotedMsg) {
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text || quotedMsg[tipo]?.caption || '';
    }
    
    if (!contenido.trim()) {
      return await conn.sendMessage(msg.key.remoteJid, 
        { text: '⚠️ Escribe una palabra o cita un mensaje.' }, 
        { quoted: msg }
      );
    }

    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, 
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' }, 
        { quoted: msg }
      );
    }

    await conn.sendMessage(msg.key.remoteJid, 
      { react: { text: '🎨', key: msg.key } }
    );

    // Generar sticker
    const quoteData = {
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
    };

    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const buffer = Buffer.from(res.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(msg.key.remoteJid, 
      { sticker: { url: sticker } }, 
      { quoted: msg }
    );
    await conn.sendMessage(msg.key.remoteJid, 
      { react: { text: '✅', key: msg.key } }
    );

  } catch (e) {
    console.error("❌ Error en el comando qc:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ Ocurrió un error al generar el sticker.'
    }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
