const fs = require("fs");
const path = require("path");

const handler = async (msg, { args, conn }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderClean = senderId.replace(/[^0-9]/g, "");
  const command = (args[0] || "").toLowerCase();
  const activosPath = "./activos.json";

  // Solo admins o dueños
  const metadata = chatId.endsWith("@g.us") ? await conn.groupMetadata(chatId) : null;
  const participante = metadata?.participants?.find(p => p.id === senderId);
  const isAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
  const isOwner = global.owner?.some(([id]) => id === senderClean) || false;

  if (!isAdmin && !isOwner) {
    return conn.sendMessage(chatId, {
      text: "🚫 Este comando solo puede ser usado por *admins* o *el owner del bot*."
    }, { quoted: msg });
  }

  if (!["on", "off"].includes(command)) {
    return conn.sendMessage(chatId, {
      text: `✴️ Usa el comando correctamente:\n\n*• autodes on*  (Activa descargas automáticas)\n*• autodes off* (Desactiva descargas automáticas)`
    }, { quoted: msg });
  }

  const activos = fs.existsSync(activosPath)
    ? JSON.parse(fs.readFileSync(activosPath))
    : {};

  if (!activos.autodes) activos.autodes = {};

  if (command === "on") {
    activos.autodes[chatId] = true;
    await conn.sendMessage(chatId, {
      text: "✅ *Descargas automáticas activadas.*\nSolo envía un enlace de YouTube, Facebook, Instagram o TikTok y el bot lo descargará automáticamente."
    }, { quoted: msg });
  } else {
    delete activos.autodes[chatId];
    await conn.sendMessage(chatId, {
      text: "❌ *Descargas automáticas desactivadas.*"
    }, { quoted: msg });
  }

  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));
};

handler.command = ["autodes"];
module.exports = handler;
