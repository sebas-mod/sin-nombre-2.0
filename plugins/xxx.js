const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const Checker = require("../libs/nsfw"); // Ubicado en libs/nsfw.js

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  // Reacción de espera
  await conn.sendMessage(chatId, {
    react: { text: "🔍", key: msg.key }
  });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(chatId, {
      text: "❌ *Responde a una imagen o sticker para analizar contenido NSFW.*"
    }, { quoted: msg });
  }

  try {
    const mediaType = quoted.imageMessage ? "image" : "sticker";
    const media = quoted[mediaType + "Message"];

    // Descargar el archivo como buffer
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (!buffer || buffer.length === 0) {
      return conn.sendMessage(chatId, {
        text: "⚠️ *No se pudo obtener el contenido del archivo.*",
        quoted: msg
      });
    }

    const nsfw = new Checker();
    const result = await nsfw.response(buffer);

    if (!result?.status) {
      return conn.sendMessage(chatId, {
        text: `❌ *Error al analizar:* ${result.msg || "Desconocido"}`,
        quoted: msg
      });
    }

    const { NSFW, percentage, response } = result.result;
    const statusText = NSFW ? "🔞 *NSFW detectado*" : "✅ *Contenido seguro*";

    await conn.sendMessage(chatId, {
      text: `${statusText}\n📊 *Confianza:* ${percentage}\n\n${response}`,
      quoted: msg
    });

  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    await conn.sendMessage(chatId, {
      text: "❌ *Error inesperado al analizar el archivo.*",
      quoted: msg
    });
  }
};

handler.command = ["xxx"];
handler.tags = ["tools"];
handler.help = ["xxx <responde a una imagen o sticker>"];
handler.reaction = "🔞";

module.exports = handler;
