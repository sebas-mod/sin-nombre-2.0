const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const Checker = require("../libs/nsfw"); 

const handler = async (msg, { conn }) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "🔍", key: msg.key }
  });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Responde a una imagen o sticker para analizar si contiene contenido NSFW.*"
    }, { quoted: msg });
  }

  const media = quoted.imageMessage || quoted.stickerMessage;
  const mediaType = quoted.imageMessage ? "image" : "sticker";

  try {
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const checker = new Checker();
    const result = await checker.response(buffer);

    if (!result?.status) throw new Error("No se pudo analizar la imagen.");

    const status = result.result?.NSFW ? "🔞 *Contenido NSFW detectado*" : "✅ *Contenido seguro*";
    const porcentaje = result.result?.percentage || "0%";
    const comentario = result.result?.response || "";

    await conn.sendMessage(msg.key.remoteJid, {
      text: `${status}\n📊 *Confianza:* ${porcentaje}\n\n${comentario}`,
      quoted: msg
    });

  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Error al analizar la imagen. Intenta con otra.",
      quoted: msg
    });
  }
};

handler.command = ["xxx"];
module.exports = handler;
