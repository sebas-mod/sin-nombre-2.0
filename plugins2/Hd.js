const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const FormData = require("form-data");

// Tu función remini debe estar definida o importada en otro lado.
// Asegúrate que `remini()` exista o lo implemente tu API local/externa.

const handler = async (msg, { conn }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *Responde a una imagen con el comando `.hd` para mejorarla.*"
      }, { quoted: msg });
    }

    const mime = quoted.imageMessage?.mimetype || "";
    if (!mime) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *El mensaje citado no contiene una imagen.*"
      }, { quoted: msg });
    }

    if (!/image\/(jpe?g|png)/.test(mime)) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *Solo se admiten imágenes en formato JPG o PNG.*"
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🛠️", key: msg.key }
    });

    const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (buffer.length === 0) {
      throw new Error("❌ Error: No se pudo descargar la imagen.");
    }

    // Ejecuta función externa de mejora
    const pr = await remini(buffer, "enhance");

    await conn.sendMessage(msg.key.remoteJid, {
      image: pr,
      caption: "✨ *Imagen mejorada con éxito.*\n\n© Azura Ultra 2.0 Bot"
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (e) {
    console.error("❌ Error en el comando .hd:", e);
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
