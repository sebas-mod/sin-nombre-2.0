const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeExifImg, writeExifVid } = require("../lib/sticker"); // Asegúrate de tener esto en tu bot

const handler = async (msg, { conn, usedPrefix }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Responde a una imagen o video con el comando \`${usedPrefix}s\` para crear un sticker.*`
      }, { quoted: msg });
    }

    const mediaType = quoted.imageMessage ? "image" : quoted.videoMessage ? "video" : null;
    if (!mediaType) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *Solo puedes convertir imágenes o videos en stickers.*"
      }, { quoted: msg });
    }

    const senderName = msg.pushName || "Usuario Desconocido";
    const now = new Date();
    const fecha = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} 🕒 ${now.getHours()}:${now.getMinutes()}`;

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🛠️", key: msg.key }
    });

    const stream = await downloadContentFromMessage(quoted[`${mediaType}Message`], mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    if (!buffer || buffer.length === 0) throw new Error("❌ No se pudo descargar el archivo.");

    const metadata = {
      packname: `✨ Lo Mandó Hacer: ${senderName} ✨`,
      author: `🤖 Azura Ultra Subbot\n🛠️ Desarrollado por: Russell xz\n📅 ${fecha}`
    };

    const stickerBuffer = mediaType === "image"
      ? await writeExifImg(buffer, metadata)
      : await writeExifVid(buffer, metadata);

    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: stickerBuffer }
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el comando s:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Error:* No se pudo crear el sticker. Intenta de nuevo."
    }, { quoted: msg });
  }
};

handler.command = ['s'];
module.exports = handler;
