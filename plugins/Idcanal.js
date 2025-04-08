const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;

  // Solo válido si se ejecuta desde un canal
  if (!chatId.endsWith("@newsletter")) {
    return conn.sendMessage(chatId, {
      text: "❌ Este comando solo puede usarse *dentro de un canal de WhatsApp*."
    }, { quoted: msg });
  }

  // Extraer número limpio del que ejecutó el comando
  const number = senderId.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  try {
    await conn.sendMessage(number, {
      text: `✅ *ID del canal:* \n\`\`\`${chatId}\`\`\`\n\nGuárdalo si quieres hacer reenvíos desde este canal.`
    });

    // Reacción en el canal para confirmar
    await conn.sendMessage(chatId, {
      react: { text: "✅", key: msg.key }
    });

  } catch (e) {
    console.error("❌ No se pudo enviar el ID al privado:", e);
    await conn.sendMessage(chatId, {
      text: "❌ No pude enviarte el ID al privado. ¿Tienes el chat abierto conmigo?"
    }, { quoted: msg });
  }
};

handler.command = ['idcanal'];
module.exports = handler;
