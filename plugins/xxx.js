const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const Checker = require("../libs/nsfw"); // Asegúrate de que esté en libs/nsfw.js

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  // Reacción de análisis
  await conn.sendMessage(chatId, {
    react: { text: "🔍", key: msg.key }
  });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(chatId, {
      text: "❌ *Debes responder a una imagen o sticker para analizar contenido NSFW.*"
    }, { quoted: msg });
  }

  const isImage = quoted.imageMessage !== undefined;
  const mediaType = isImage ? "image" : "sticker";
  const media = isImage ? quoted.imageMessage : quoted.stickerMessage;

  try {
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    if (!buffer || buffer.length === 0) {
      return conn.sendMessage(chatId, {
        text: "⚠️ *No se pudo obtener el contenido del archivo.*",
        quoted: msg
      });
    }

    const checker = new Checker();
    const result = await checker.response(buffer);

    if (!result?.status) {
      return conn.sendMessage(chatId, {
        text: `❌ *Error al analizar el archivo:* ${result.msg || "Desconocido"}`,
        quoted: msg
      });
    }

    const { NSFW, percentage, response } = result.result;
    const statusText = NSFW ? "🔞 *NSFW detectado*" : "✅ *Contenido seguro*";

    return conn.sendMessage(chatId, {
      text: `${statusText}\n📊 *Confianza:* ${percentage}\n\n${response}`,
      quoted: msg
    });

  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    return conn.sendMessage(chatId, {
      text: "❌ *Error inesperado al procesar el archivo.*",
      quoted: msg
    });
  }
};

handler.command = ["xxx"];
handler.tags = ["tools"];
handler.help = ["xxx <responde a una imagen o sticker>"];

module.exports = handler;
