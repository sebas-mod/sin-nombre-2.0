const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, args }) => {
  const sender = msg.key.participant || msg.key.remoteJid;
  const senderClean = sender.replace(/[^0-9]/g, "");
  const isBot = msg.key.fromMe;
  const isOwner = global.owner.some(([num]) => num === senderClean);

  if (!isOwner && !isBot) {
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
    return conn.sendMessage(msg.key.remoteJid, {
      text: "🚫 Solo el owner o el mismo bot pueden liberar comandos restringidos."
    }, { quoted: msg });
  }

  const cmd = args[0]?.toLowerCase();
  if (!cmd) {
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "⚠️", key: msg.key }
    });
    return conn.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Usa el comando así:\n\n📌 *unre play*"
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key }
  });

  const filePath = path.resolve("./re.json");
  let data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : [];

  if (!data.includes(cmd)) {
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "⚠️", key: msg.key }
    });
    return conn.sendMessage(msg.key.remoteJid, {
      text: `❌ El comando *${cmd}* no está restringido.`
    }, { quoted: msg });
  }

  data = data.filter(c => c !== cmd);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key }
  });

  await conn.sendMessage(msg.key.remoteJid, {
    text: `✅ El comando *${cmd}* ha sido liberado.`
  }, { quoted: msg });
};

handler.command = ["unre"];
module.exports = handler;
