const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const filePath = "./ventas365.json";

  let ventas = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : {};

  const texto = args.join(" ").trim();
  const isImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

  if (!texto && !isImage) {
    return conn.sendMessage(chatId, {
      text: `✏️ Usa el comando así:\n*• setstock texto aquí*\nO responde a una imagen con el comando + texto.`,
    }, { quoted: msg });
  }

  let imagenBase64 = null;
  if (isImage) {
    const quoted = msg.message.extendedTextMessage.contextInfo;
    const buffer = await conn.downloadMediaMessage({ message: quoted.quotedMessage });
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
