const axios = require("axios");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn }) => {
  const chat = msg.key.remoteJid;

  // Validar si se respondió a una imagen
  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
    return conn.sendMessage(chat, {
      text: "❌ Responde a una imagen para aplicar el efecto de *payaso*."
    }, { quoted: msg });
  }

  await conn.sendMessage(chat, { react: { text: "🤡", key: msg.key } });

  try {
    const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
    const stream = await downloadContentFromMessage(quoted, "image");

    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // Subir imagen a russell.click
    const form = new FormData();
    form.append("file", buffer, {
      filename: "imagen.jpg",
      contentType: quoted.mimetype || "image/jpeg"
    });

    const upload = await axios.post("https://cdn.russellxz.click/upload.php", form, {
      headers: form.getHeaders()
    });

    const imageUrl = upload.data?.url;
    if (!imageUrl) {
      return conn.sendMessage(chat, { text: "❌ Error al subir la imagen." }, { quoted: msg });
    }

    // Aplicar efecto con la API
    const apiUrl = `https://api.neoxr.eu/api/effect?style=clown&image=${encodeURIComponent(imageUrl)}&apikey=russellxz`;
    const result = await axios.get(apiUrl);
    const imgUrl = result.data?.data;

    if (!imgUrl) {
      return conn.sendMessage(chat, { text: "❌ No se pudo aplicar el efecto payaso." }, { quoted: msg });
    }

    // Enviar imagen final
    await conn.sendMessage(chat, {
      image: { url: imgUrl },
      caption: "🤡 *Aquí tienes tu versión payasa.*\n\n© azura ultra & cortana"
    }, { quoted: msg });

  } catch (err) {
    console.error("❌ Error en comando payaso:", err);
    await conn.sendMessage(chat, { text: "❌ Hubo un error al procesar la imagen." }, { quoted: msg });
  }
};

handler.command = ["payaso"];
module.exports = handler;
