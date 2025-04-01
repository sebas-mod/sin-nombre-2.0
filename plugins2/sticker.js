const axios = require('axios');
const { writeExifImg, writeExifVid } = require('./libs/functions');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const handler = async (msg, { conn, usedPrefix, command }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quoted) {
      await conn.sendMessage(msg.key.remoteJid, {
        text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${usedPrefix + command}* respondiendo a una imagen/video`
      }, { quoted: msg });
      return;
    }

    const mediaType = quoted.imageMessage ? 'image' : quoted.videoMessage ? 'video' : null;
    if (!mediaType) throw '⚠️ Solo puedes convertir imágenes o videos en stickers';

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '⏳', key: msg.key }
    });

    const mediaStream = await downloadContentFromMessage(quoted[`${mediaType}Message`], mediaType);
    let buffer = Buffer.alloc(0);
    
    for await (const chunk of mediaStream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (buffer.length === 0) throw '❌ Error al descargar el archivo';

    const metadata = {
      packname: '✦ Azura Ultra 2.0 SubBot ✦',
      author: '𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻',
      categories: ['Azura', 'Sticker', 'SubBot']
    };

    let stickerBuffer;
    if (mediaType === 'image') {
      stickerBuffer = await writeExifImg(buffer, metadata);
    } else {
      if (quoted.videoMessage.seconds > 10) throw '⚠️ El video no puede superar los 10 segundos';
      stickerBuffer = await writeExifVid(buffer, metadata);
    }

    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: stickerBuffer }
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (error) {
    console.error(error);
    await conn.sendMessage(msg.key.remoteJid, {
      text: `❌ *Error:* ${typeof error === 'string' ? error : 'Ocurrió un error al crear el sticker'}`
    }, { quoted: msg });
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '❌', key: msg.key }
    });
  }
};

handler.command = ['s', 'sticker', 'stick'];
handler.help = ['s <responder a imagen/video>'];
handler.tags = ['sticker'];
module.exports = handler;
