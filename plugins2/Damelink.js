const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  if (!chatId.endsWith("@g.us")) {
    return await conn.sendMessage(chatId, {
      text: "⚠️ Este comando solo funciona en grupos."
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    react: { text: "📝", key: msg.key }
  });

  try {
    const metadata = await conn.groupMetadata(chatId);
    const groupDesc = metadata.desc || "Este grupo no tiene descripción.";

    await conn.sendMessage(chatId, {
      text: `📄 *Descripción del grupo:*\n\n${groupDesc}`
    }, { quoted: msg });

  } catch (e) {
    await conn.sendMessage(chatId, {
      text: "❌ Error al obtener la descripción del grupo."
    }, { quoted: msg });
  }
};

handler.command = ["infogrupo"];
module.exports = handler;
