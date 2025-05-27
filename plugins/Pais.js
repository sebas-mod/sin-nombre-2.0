const fs = require('fs');

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const metadata = await conn.groupMetadata(chatId);
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderNum = senderId.replace(/[^0-9]/g, '');
  const isOwner = global.owner.some(([id]) => id === senderNum);
  const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin;

  if (!isAdmin && !isOwner) {
    return conn.sendMessage(chatId, {
      text: "❌ Este comando solo puede ser usado por *admins* o *el owner*."
    }, { quoted: msg });
  }

  const code = (args[0] || "").replace(/\D/g, "");
  if (!code) {
    return conn.sendMessage(chatId, {
      text: "⚠️ Usa el comando correctamente:\n\n*.pais +507*"
    }, { quoted: msg });
  }

  const flagMap = {
    "591": "🇧🇴", "593": "🇪🇨", "595": "🇵🇾", "598": "🇺🇾", "507": "🇵🇦",
    "505": "🇳🇮", "506": "🇨🇷", "502": "🇬🇹", "503": "🇸🇻", "504": "🇭🇳",
    "509": "🇭🇹", "549": "🇦🇷", "54": "🇦🇷", "55": "🇧🇷", "56": "🇨🇱",
    "57": "🇨🇴", "58": "🇻🇪", "52": "🇲🇽", "53": "🇨🇺", "51": "🇵🇪",
    "1": "🇺🇸", "34": "🇪🇸"
  };
  const flag = flagMap[code] || "🌐";

  const participants = metadata.participants.map(p => p.id);
  const matches = participants.filter(id => id.endsWith("@s.whatsapp.net") && id.replace(/[^0-9]/g, "").startsWith(code));

  if (!matches.length) {
    return conn.sendMessage(chatId, {
      text: `❌ No hay usuarios con código +${code} en este grupo.`
    }, { quoted: msg });
  }

  const mentions = matches;
  const lines = mentions.map(id => `• @${id.split("@")[0]}`);
  const caption = `🌎 *Usuarios del país +${code} ${flag} han sido llamados:*\n\n${lines.join("\n")}`;

  await conn.sendMessage(chatId, {
    text: caption,
    mentions
  }, { quoted: msg });

  await conn.sendMessage(chatId, {
    react: { text: "📍", key: msg.key }
  });
};

handler.command = ["pais"];
module.exports = handler;
