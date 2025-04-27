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
      text: "🚫 Solo administradores o owners pueden usar este comando."
    }, { quoted: msg });
    return;
  }

  const fantasmas = global.listaFantasmas?.[chatId] || [];

  if (fantasmas.length === 0) {
    await conn.sendMessage(chatId, {
      text: "⚠️ No hay fantasmas pendientes por eliminar. Usa .fankick primero."
    }, { quoted: msg });
    return;
  }

  try {
    for (const jid of fantasmas) {
      await conn.groupParticipantsUpdate(chatId, [jid], "remove");
    }

    await conn.sendMessage(chatId, {
      text: `✅ Eliminados ${fantasmas.length} fantasmas del grupo.`,
    }, { quoted: msg });

    // Limpiar después de eliminar
    delete global.listaFantasmas[chatId];

  } catch (error) {
    console.error("❌ Error eliminando fantasmas:", error);
    await conn.sendMessage(chatId, {
      text: "❌ Error al intentar eliminar a los fantasmas."
    }, { quoted: msg });
  }
};

handler.command = ["okfan"];
module.exports = handler;
