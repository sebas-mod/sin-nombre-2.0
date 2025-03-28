const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

const handler = async (msg, { conn, text, args }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    const quotedJid = quoted?.participant;

    // Detectar si es un mensaje citado o no
    const isQuoted = !!quotedMsg;
    const authorJid = isQuoted ? quotedJid : msg.key.participant || msg.key.remoteJid;

    // Nombre del usuario
    let targetName;
    try {
      targetName = await conn.getName(authorJid);
    } catch {
      targetName = authorJid.split('@')[0];
    }

    // Foto de perfil
    let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    try {
      avatar = await conn.profilePictureUrl(authorJid, 'image');
    } catch {}

    // Obtener el contenido
    let contenido = args.join(" ").trim();
    if (!contenido && quotedMsg) {
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text || quotedMsg[tipo]?.caption || quotedMsg[tipo] || '';
    }

    if (!contenido || contenido.trim() === '') {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Escribe una palabra o cita un mensaje.'
      }, { quoted: msg });
    }

    // Limpiar menciones
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ El texto no puede tener más de 35 caracteres.'
      }, { quoted: msg });
    }

    // Reacción
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    // Crear quote
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
            photo: { url: avatar }
          },
          text: textoLimpio,
          replyMessage: {}
        }
      ]
    };

    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    const buffer = Buffer.from(res.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (e) {
    console.error("❌ Error en el comando qc:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ Ocurrió un error al generar el sticker.'
    }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
