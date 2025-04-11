const axios = require("axios");
const FormData = require("form-data");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// Función que mejora la imagen usando la API de Neoxr
async function remini(buffer, mode = "enhance") {
  const form = new FormData();
  form.append("image", buffer, { filename: "image.jpg" });
  form.append("type", mode);

  const res = await axios.post(
    "https://api.neoxr.eu/api/remini",
    form,
    {
      headers: {
        ...form.getHeaders(),
        apikey: "russellxz"
      },
      responseType: "arraybuffer"
    }
  );

  if (res.status !== 200) throw new Error("❌ Falló la mejora con Remini API.");
  return Buffer.from(res.data);
}

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

    const mejorada = await remini(buffer, "enhance");

    await conn.sendMessage(msg.key.remoteJid, {
      image: mejorada,
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
