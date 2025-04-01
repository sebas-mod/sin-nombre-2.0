const FormData = require("form-data");

const handler = async (msg, { conn, usedPrefix }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted || !quoted.imageMessage) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Responde a una imagen con el comando \`${usedPrefix}hd\` para mejorarla.*`
      }, { quoted: msg });
    }

    const mime = quoted.imageMessage.mimetype || "";
    if (!/image\/(jpe?g|png)/.test(mime)) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *Solo se admiten imágenes en formato JPG o PNG.*"
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🛠️", key: msg.key }
    });

    const imgStream = await downloadContentFromMessage(quoted.imageMessage, "image");
    let buffer = Buffer.alloc(0);
    for await (const chunk of imgStream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("No se pudo descargar la imagen.");
    }

    const result = await remini(buffer, "enhance");

    await conn.sendMessage(msg.key.remoteJid, {
      image: result,
      caption: "✨ *Imagen mejorada con éxito.*\n\n© Azura Ultra Subbot"
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (e) {
    console.error("❌ Error en el comando hd:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Hubo un error al mejorar la imagen. Inténtalo de nuevo.*"
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['hd'];
module.exports = handler;
