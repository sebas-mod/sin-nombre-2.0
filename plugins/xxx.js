// plugins/xxx.js
const Checker = require("../libs/nsfw");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const handler = async (msg, { conn }) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const chatId = msg.key.remoteJid;

  await conn.sendMessage(chatId, { react: { text: "🔍", key: msg.key } });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(
      chatId,
      { text: "❌ *Responde a una imagen o sticker para analizar contenido NSFW.*" },
      { quoted: msg }
    );
  }

  // Detecta el tipo real de la imagen
  const mimeType = quoted.imageMessage?.mimetype
    || quoted.stickerMessage?.mimetype
    || "image/png";
  const mediaType = quoted.imageMessage ? "image" : "sticker";
  const media = quoted.imageMessage || quoted.stickerMessage;

  try {
    // Descarga y concatena el buffer
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    const checker = new Checker();
    // Pasa el mimeType detectado
    const result = await checker.response(buffer, mimeType);

    if (!result.status) throw new Error(result.msg || "Error desconocido.");

    const { NSFW, percentage, response } = result.result;
    const estado = NSFW ? "🔞 *NSFW detectado*" : "✅ *Contenido seguro*";

    await conn.sendMessage(
      chatId,
      { text: `${estado}\n📊 *Confianza:* ${percentage}\n\n${response}` },
      { quoted: msg }
    );
  } catch (err) {
    console.error("❌ Error en comando xxx:", err);
    await conn.sendMessage(
      chatId,
      { text: `❌ *Error al analizar el archivo:* ${err.message}` },
      { quoted: msg }
    );
  }
};

handler.command = ["xxx"];
handler.tags = ["tools"];
handler.help = ["xxx <responde a una imagen o sticker>"];
module.exports = handler;
