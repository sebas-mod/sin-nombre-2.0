const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  // Solo funciona si el mensaje viene de un canal
  if (!chatId.endsWith("@newsletter")) {
    return conn.sendMessage(chatId, {
      text: "❌ Este comando solo puede usarse dentro de un *canal de WhatsApp*."
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    text: `✅ *ID del canal:* \n\`\`\`${chatId}\`\`\`\n\nGuarda este ID para reenviar mensajes desde el canal.`
  }, { quoted: msg });
};

handler.command = ['idcanal'];
module.exports = handler;
