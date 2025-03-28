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

// Función mejorada para obtener nombres
const getNombreBonito = async (jid, conn, pushName = '') => {
  try {
    // 1. Obtener nombre público con conn.getName
    let publicName = '';
    if (typeof conn.getName === 'function') {
      publicName = await conn.getName(jid).catch(() => '');
    }
    
    // 2. Si existe nombre público válido
    if (publicName?.trim() && !publicName.includes('@')) {
      return publicName;
    }
    
    // 3. Verificar en contactos del bot
    const contacto = conn.contacts?.[jid] || {};
    const contactName = contacto.name || contacto.notify || contacto.vname || '';
    
    // 4. Usar pushName si no hay nombres anteriores
    if (contactName?.trim() && !contactName.includes('@')) {
      return contactName;
    } else if (pushName?.trim() && !pushName.includes('@')) {
      return pushName;
    }
    
    // 5. Último recurso: número formateado
    return formatPhoneNumber(jid);
  } catch (e) {
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, text, args }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    
    // Determinar JID objetivo y pushName
    let targetJid, targetPushName;
    if (quoted) {
      targetJid = (quoted.participant || quoted.remoteJid).split('@')[0].split(':')[0];
      targetPushName = quoted.pushName || msg.pushName;
    } else if (msg.key.fromMe) {
      targetJid = conn.user.id;
      targetPushName = conn.user.name;
    } else {
      targetJid = msg.key.remoteJid.includes('@g.us') 
        ? (msg.key.participant || msg.key.remoteJid).split(':')[0]
        : msg.key.remoteJid;
      targetPushName = msg.pushName;
    }

    // Obtener nombre y foto
    const targetName = await getNombreBonito(targetJid, conn, targetPushName);
    
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
      if (!targetPp.startsWith('http')) throw new Error('URL inválida');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Obtener contenido del mensaje
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
