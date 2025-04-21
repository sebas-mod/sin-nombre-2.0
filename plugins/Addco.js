// plugins/addco.js
const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;

  if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
    return conn.sendMessage(chatId, {
      text: "❌ *Responde a un sticker para asignarle un comando.*"
    }, { quoted: msg });
  }

  const comando = args.join(" ").trim();
  if (!comando) {
    return conn.sendMessage(chatId, {
      text: "⚠️ *Debes especificar el comando a asignar. Ejemplo:* addco kick"
    }, { quoted: msg });
  }

  const sticker = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
  const fileSha = sticker.fileSha256?.toString("base64");
  if (!fileSha) {
    return conn.sendMessage(chatId, {
      text: "❌ *No se pudo obtener el ID único del sticker.*"
    }, { quoted: msg });
  }

  const jsonPath = path.resolve("./comandos.json");
  const data = fs.existsSync(jsonPath)
    ? JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
    : {};

  data[fileSha] = comando;
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

  await conn.sendMessage(chatId, {
    react: { text: "✅", key: msg.key }
  });

  return conn.sendMessage(chatId, {
    text: `✅ *Sticker vinculado al comando:* \`${comando}\``,
    quoted: msg
  });
};

handler.command = ["addco"];
handler.tags = ["tools"];
handler.help = ["addco <comando>"];
module.exports = handler;
