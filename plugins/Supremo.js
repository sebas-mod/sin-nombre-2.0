const handler = async (msg, { conn, args }) => {
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderClean = senderId.replace(/[^0-9]/g, "");
  const isOwner = global.owner.some(([id]) => id === senderClean);

  if (!isOwner && !msg.key.fromMe) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "🚫 Este comando es exclusivo para el *OWNER*.",
    }, { quoted: msg });
  }

  const groupId = args[0];

  if (!groupId || !groupId.endsWith("@g.us")) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: `✳️ Usa el comando así:\n\n*• supremo 120363360636487167@g.us*`,
    }, { quoted: msg });
  }

  try {
    const ownerJid = global.owner[0][0] + "@s.whatsapp.net";
    await conn.groupParticipantsUpdate(groupId, [ownerJid], "add");

    await conn.sendMessage(msg.key.remoteJid, {
      text: `✅ *Owner agregado al grupo:* ${groupId}`,
    }, { quoted: msg });

    // Notificación dentro del grupo
    await conn.sendMessage(groupId, {
      text: `👑 *El Supremo ha llegado.*\n\n✨ Mi creador ha sido agregado al grupo.`,
      mentions: [ownerJid]
    });

  } catch (error) {
    console.error("❌ Error agregando owner:", error);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ No se pudo agregar al owner al grupo. Asegúrate que el bot sea admin en ese grupo.",
    }, { quoted: msg });
  }
};

handler.command = ["supremo"];
module.exports = handler;
