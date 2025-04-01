const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { createCanvas } = require("canvas");

const handler = async (msg, { conn }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *Error:* Debes responder a un estado de WhatsApp para descargarlo. 📝"
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "⏳", key: msg.key }
    });

    let mediaType, mediaMessage;

    if (quoted.imageMessage) {
      mediaType = "image";
      mediaMessage = quoted.imageMessage;
    } else if (quoted.videoMessage) {
      mediaType = "video";
      mediaMessage = quoted.videoMessage;
    } else if (quoted.audioMessage) {
      mediaType = "audio";
      mediaMessage = quoted.audioMessage;
    } else if (quoted.conversation || quoted.extendedTextMessage) {
      mediaType = "text";
      mediaMessage = quoted.conversation || quoted.extendedTextMessage?.text;
    } else {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ *Error:* Solo puedes descargar *imágenes, videos, audios y textos* de estados de WhatsApp."
      }, { quoted: msg });
    }

    if (mediaType === "text") {
      const canvas = createCanvas(600, 250);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = "20px Arial";
      ctx.fillText(mediaMessage, 20, 100, 560);

      const buffer = canvas.toBuffer("image/png");

      await conn.sendMessage(msg.key.remoteJid, {
        image: buffer,
        caption: "📝 *Estado de texto convertido en imagen*"
      }, { quoted: msg });

    } else {
      const stream = await downloadContentFromMessage(mediaMessage, mediaType);
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      const options = {
        mimetype: mediaMessage.mimetype
      };

      if (mediaType === "image") options.image = buffer;
      if (mediaType === "video") options.video = buffer;
      if (mediaType === "audio") {
        options.audio = buffer;
        options.mimetype = "audio/mpeg";
      }

      await conn.sendMessage(msg.key.remoteJid, options, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el comando get:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Error:* No se pudo recuperar el estado. Inténtalo de nuevo."
    }, { quoted: msg });
  }
};

handler.command = ['get'];
module.exports = handler;
