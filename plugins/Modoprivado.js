const fs = require("fs");
const path = require("path");
const activosPath = path.join(__dirname, "..", "activos.json");

const handler = async (msg, { conn, args, isOwner }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant
    ? msg.key.participant.replace(/[^0-9]/g, "")
    : msg.key.remoteJid.replace(/[^0-9]/g, "");

  if (!isOwner(sender)) {
    return await conn.sendMessage(chatId, { text: "❌ Solo el dueño del bot puede usar este comando." }, { quoted: msg });
  }

  if (!["on", "off"].includes(args[0])) {
    return await conn.sendMessage(chatId, {
      text: "✳️ Usa correctamente:\n\n.modoprivado on / off"
    }, { quoted: msg });
  }

  const activos = fs.existsSync(activosPath)
    ? JSON.parse(fs.readFileSync(activosPath))
    : {};

  activos.modoPrivado = args[0] === "on";
  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));

  await conn.sendMessage(chatId, {
    text: `🔐 Modo privado *${args[0] === "on" ? "activado" : "desactivado"}*.`
  }, { quoted: msg });
};

handler.command = ["modoprivado"];
module.exports = handler;
