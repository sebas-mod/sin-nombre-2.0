const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const Checker = require("../lib/nsfw"); // Asegúrate que nsfw.js esté en lib/

const handler = async (msg, { conn }) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const chatId = msg.key.remoteJid;

  // Reacción de carga
  await conn.sendMessage(chatId, {
    react: { text: "🔍", key: msg.key }
  });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(chatId, {
      text: "❌ *Responde a una imagen o sticker para analizar contenido NSFW.*"
    }, { quoted: msg });
  }

  const mediaType = quoted.imageMessage ? "image" : "sticker";
  const media = quoted[mediaType + "Message"];

  try {
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    const checker = new Checker();
    const result = await checker.response(buffer);

    if (!result?.status) {
      throw new Error(result.msg || "No se pudo analizar el archivo.");
    }

    const { NSFW, percentage, response } = result.result;
    const estado = NSFW ? "🔞 *NSFW detectado*" : "✅ *Contenido seguro*";

    await conn.sendMessage(chatId, {
      text: `${estado}\n📊 *Confianza:* ${percentage}\n\n${response}`,
      quoted: msg
    });

  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    await conn.sendMessage(chatId, {
      text: "❌ *Ocurrió un error al analizar el archivo.*",
      quoted: msg
    });
  }
};

handler.command = ["xxx"];
handler.tags = ["tools"];
handler.help = ["xxx <responde a una imagen o sticker>"];

module.exports = handler;
