const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const handler = async (msg, { conn }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *Error:* Debes responder a un mensaje de *ver una sola vez* (imagen, video o audio) para poder verlo nuevamente."
      }, { quoted: msg });
    }

    let mediaType, mediaMessage;

    if (quoted.imageMessage?.viewOnce) {
      mediaType = "image";
      mediaMessage = quoted.imageMessage;
    } else if (quoted.videoMessage?.viewOnce) {
      mediaType = "video";
      mediaMessage = quoted.videoMessage;
    } else if (quoted.audioMessage?.viewOnce) {
      mediaType = "audio";
      mediaMessage = quoted.audioMessage;
    } else {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *Error:* Solo puedes usar este comando en mensajes de *ver una sola vez*."
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "⏳", key: msg.key }
    });

    const mediaBuffer = await new Promise(async (resolve, reject) => {
      try {
        const stream = await downloadContentFromMessage(mediaMessage, mediaType);
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        resolve(buffer);
      } catch {
        reject(null);
      }
    });

    if (!mediaBuffer || mediaBuffer.length === 0) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *Error:* No se pudo descargar el archivo. Intenta de nuevo."
      }, { quoted: msg });
    }

    const messageOptions = {
      [mediaType]: mediaBuffer,
      mimetype: mediaMessage.mimetype
    };

    await conn.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el comando ver:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Error:* No se pudo recuperar el mensaje de *ver una sola vez*. Inténtalo de nuevo."
    }, { quoted: msg });
  }
};

handler.command = ['ver'];
module.exports = handler;
