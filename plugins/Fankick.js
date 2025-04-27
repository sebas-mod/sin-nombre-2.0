const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderClean = senderId.replace(/[^0-9]/g, "");
  const isGroup = chatId.endsWith("@g.us");

  if (!isGroup) {
    await conn.sendMessage(chatId, {
      text: "❌ Este comando solo puede usarse en grupos."
    }, { quoted: msg });
    return;
  }

  const metadata = await conn.groupMetadata(chatId);
  const participante = metadata.participants.find(p => p.id === senderId);
  const isAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
  const isOwner = global.owner.some(([id]) => id === senderClean);
  const isFromMe = msg.key.fromMe;

  if (!isAdmin && !isOwner && !isFromMe) {
    await conn.sendMessage(chatId, {
      text: "🚫 Solo los administradores del grupo o el owner pueden usar este comando."
    }, { quoted: msg });
    return;
  }

  const quotedMessage = msg.message?.extendedTextMessage?.contextInfo;
  const mentionedJids = quotedMessage?.mentionedJid || [];

  if (mentionedJids.length === 0) {
    await conn.sendMessage(chatId, {
      text: "⚠️ Responde al mensaje que contiene las menciones de los fantasmas para expulsarlos."
    }, { quoted: msg });
    return;
  }

  const conteoPath = path.resolve("./conteo.json");
  let conteoData = {};

  if (fs.existsSync(conteoPath)) {
    conteoData = JSON.parse(fs.readFileSync(conteoPath, "utf-8"));
  }

  const groupConteo = conteoData[chatId] || {};

  const expulsar = mentionedJids.filter(jid => !groupConteo[jid]);

  if (expulsar.length === 0) {
    await conn.sendMessage(chatId, {
      text: "✅ No hay fantasmas válidos para eliminar. Todos han participado."
    }, { quoted: msg });
    return;
  }

  try {
    for (const jid of expulsar) {
      await conn.groupParticipantsUpdate(chatId, [jid], "remove");
    }

    await conn.sendMessage(chatId, {
      text: `✅ Eliminados ${expulsar.length} fantasmas que no participaron.`
    }, { quoted: msg });

  } catch (error) {
    console.error("❌ Error eliminando fantasmas:", error);
    await conn.sendMessage(chatId, {
      text: "❌ Error al intentar eliminar a los fantasmas."
    }, { quoted: msg });
  }
};

handler.command = ["fankick"];
module.exports = handler;
