const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // Asegúrate de tener esta función disponible

const handler = async (msg, { conn, text, args }) => {
  try {
    const who = msg.key.participant || msg.key.remoteJid;
    const mentionJid = msg.mentionedJid && msg.mentionedJid[0] ? msg.mentionedJid[0] : who;
    const nombre = msg.pushName || "Sin nombre";

    let contenido = '';
    if (args.length > 0) {
      contenido = args.join(' ');
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      contenido = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    } else {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *Y el texto?, agrega un texto o responde uno.*"
      }, { quoted: msg });
    }

    const mentionRegex = new RegExp(`@${mentionJid.split('@')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
    const textoLimpio = contenido.replace(mentionRegex, '');

    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *El texto no puede tener más de 35 caracteres.*"
      }, { quoted: msg });
    }

    const pp = await conn.profilePictureUrl(mentionJid).catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');

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
            name: nombre,
            photo: { url: pp }
          },
          text: textoLimpio,
          replyMessage: {}
        }
      ]
    };

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    const json = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el comando qc:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al generar el sticker.*"
    }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
