const fs = require("fs");
const path = require("path");
const activosPath = path.join(__dirname, "..", "activos.json");

const handler = async (msg, { conn, args, isOwner }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant
    ? msg.key.participant.replace(/[^0-9]/g, "")
    : msg.key.remoteJid.replace(/[^0-9]/g, "");

  const isGroup = chatId.endsWith("@g.us");

  if (!isGroup) {
    return await conn.sendMessage(chatId, { text: "❌ Solo puede usarse en grupos." }, { quoted: msg });
  }

  const metadata = await conn.groupMetadata(chatId);
  const participant = metadata.participants.find(p => p.id.includes(sender));
  const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";

  if (!isAdmin && !isOwner(sender)) {
    return await conn.sendMessage(chatId, { text: "❌ Solo administradores o el owner pueden usar este comando." }, { quoted: msg });
  }

  if (!["on", "off"].includes(args[0])) {
    return await conn.sendMessage(chatId, {
      text: "✳️ Usa correctamente:\n\n.modoadmins on / off"
    }, { quoted: msg });
  }

  const activos = fs.existsSync(activosPath)
    ? JSON.parse(fs.readFileSync(activosPath))
    : {};

  activos.modoAdmins = activos.modoAdmins || {};
  if (args[0] === "on") {
    activos.modoAdmins[chatId] = true;
  } else {
    delete activos.modoAdmins[chatId];
  }

  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));

  await conn.sendMessage(chatId, {
    text: `👑 Modo admins *${args[0] === "on" ? "activado" : "desactivado"}* en este grupo.`
  }, { quoted: msg });
};

handler.command = ["modoadmins"];
module.exports = handler;
