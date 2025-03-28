const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Bandera según prefijo (sin cambios)
const banderaPorPrefijo = (numero) => {/* ... */};

// Formato de número (sin cambios)
const formatPhoneNumber = (jid) => {/* ... */};

// Función para obtener nombres (optimizada)
const getNombreBonito = async (jid, conn, pushName = '') => {/* ... */};

const handler = async (msg, { conn, text, args }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    
    // Lógica mejorada para citas
    let targetJid, targetPushName, contenido;
    if (quoted) {
      // Obtener JID del mensaje citado
      targetJid = quoted.participant 
        ? quoted.participant.split('@')[0].split(':')[0] // Fix grupos
        : quoted.remoteJid; // Para privados
      
      // Obtener pushName del mensaje original
      targetPushName = quoted.pushName || '';
      
      // Obtener contenido del mensaje citado
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text || quotedMsg[tipo]?.caption || '';
    } else {
      // Lógica para mensajes no citados
      targetJid = msg.key.fromMe 
        ? conn.user.id 
        : msg.key.remoteJid.includes('@g.us')
          ? msg.key.participant.split(':')[0]
          : msg.key.remoteJid;
      
      targetPushName = msg.pushName;
      contenido = args.join(" ").trim();
    }

    // Validación de contenido
    if (!contenido.trim()) {
      return await conn.sendMessage(msg.key.remoteJid, 
        { text: '⚠️ Escribe una palabra o cita un mensaje.' }, 
        { quoted: msg }
      );
    }

    // Obtener nombre y foto (lógica mejorada)
    const targetName = await getNombreBonito(targetJid, conn, targetPushName);
    
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
      if (!targetPp.startsWith('http')) throw new Error();
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Limpieza de texto
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, 
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' }, 
        { quoted: msg }
      );
    }

    // Generar sticker
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '🎨', key: msg.key } });
    
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
    console.error("❌ Error en qc:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ Error al generar sticker'
    }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
