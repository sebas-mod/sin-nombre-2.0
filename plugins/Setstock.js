const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const filePath = "./ventas365.json";

  let ventas = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : {};

  const texto = args.join(" ").trim();
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quotedImage = ctx?.quotedMessage?.imageMessage;

  if (!texto && !quotedImage) {
    return conn.sendMessage(chatId, {
      text: `✏️ Usa el comando así:\n\n*• setstock [texto]*\n*• Responde a una imagen con: setstock [texto]*`,
    }, { quoted: msg });
  }

  let imagenBase64 = null;
  if (quotedImage) {
    const stream = await downloadContentFromMessage(quotedImage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    imagenBase64 = buffer.toString("base64");
  }

  if (!ventas[chatId]) ventas[chatId] = {};
  ventas[chatId]["setstock"] = {
    texto,
    imagen: imagenBase64
  };

  fs.writeFileSync(filePath, JSON.stringify(ventas, null, 2));
  await conn.sendMessage(chatId, { text: "✅ *STOCK actualizado con éxito.*" }, { quoted: msg });
};

handler.command = ["setstock"];
module.exports = handler;
