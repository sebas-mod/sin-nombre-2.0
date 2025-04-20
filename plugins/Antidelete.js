const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderClean = senderId.replace(/[^0-9]/g, "");
  const isGroup = chatId.endsWith("@g.us");
  const isFromMe = msg.key.fromMe;
  const isOwner = global.owner.some(([id]) => id === senderClean);

  const activosPath = path.resolve("activos.json");
  let activos = {};
  if (fs.existsSync(activosPath)) {
    activos = JSON.parse(fs.readFileSync(activosPath, "utf-8"));
  }

  const type = args[0]?.toLowerCase();
  if (!type || !["on", "off"].includes(type)) {
    return conn.sendMessage(chatId, {
      text: `⚙️ Usa:\n\n📌 *antidelete on/off* (solo admins del grupo)\n📌 *antideletepri on/off* (solo owner o el mismo bot)`
    }, { quoted: msg });
  }

  if (msg.command === "antideletepri") {
    // Solo privado
    if (isGroup) {
      return conn.sendMessage(chatId, {
        text: "❌ Este comando solo se usa en chats privados."
      }, { quoted: msg });
    }

    if (!isOwner && !isFromMe) {
      return conn.sendMessage(chatId, {
        text: "🚫 Solo el owner o el mismo bot pueden usar este comando."
      }, { quoted: msg });
    }

    if (type === "on") {
      activos.antideletepri = true;
      await conn.sendMessage(chatId, {
        text: "✅ Antidelete privado *activado*."
      }, { quoted: msg });
    } else {
      delete activos.antideletepri;
      await conn.sendMessage(chatId, {
        text: "✅ Antidelete privado *desactivado*."
      }, { quoted: msg });
    }

  } else if (msg.command === "antidelete") {
    // Solo grupo
    if (!isGroup) {
      return conn.sendMessage(chatId, {
        text: "❌ Este comando solo puede usarse en grupos."
      }, { quoted: msg });
    }

    const metadata = await conn.groupMetadata(chatId);
    const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin;

    if (!isAdmin && !isOwner) {
      return conn.sendMessage(chatId, {
        text: "🚫 Solo los administradores del grupo o el owner del bot pueden usar este comando."
      }, { quoted: msg });
    }

    if (!activos.antidelete) activos.antidelete = {};

    if (type === "on") {
      activos.antidelete[chatId] = true;
      await conn.sendMessage(chatId, {
        text: "✅ Antidelete *activado* en este grupo."
      }, { quoted: msg });
    } else {
      delete activos.antidelete[chatId];
      await conn.sendMessage(chatId, {
        text: "✅ Antidelete *desactivado* en este grupo."
      }, { quoted: msg });
    }
  }

  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));

  await conn.sendMessage(chatId, {
    react: { text: "✅", key: msg.key }
  });
};

handler.command = ["antidelete", "antideletepri"];
module.exports = handler;
