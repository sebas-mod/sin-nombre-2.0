const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith('@g.us');

  if (!isGroup) {
    return await conn.sendMessage(chatId, {
      text: '❌ Este comando solo puede usarse en grupos.'
    }, { quoted: msg });
  }

  try {
    // Reacción mientras procesa
    await conn.sendMessage(chatId, {
      react: { text: '🔍', key: msg.key }
    });

    const metadata = await conn.groupMetadata(chatId);
    const participantes = metadata.participants || [];

    const conLib = [];
    const sinLib = [];

    for (const p of participantes) {
      if (p.id.endsWith('@s.whatsapp.net')) {
        conLib.push(p.id.split('@')[0]);
      } else if (p.id.endsWith('@lid')) {
        sinLib.push(p.id);
      }
    }

    const mensaje = `
📄 *Estado de LIB en el grupo:*
👥 *Total miembros:* ${participantes.length}

✅ *Con LIB (número visible):* ${conLib.length}
${conLib.map(n => `• +${n}`).join('\n') || 'Ninguno'}

❌ *Sin LIB (ocultos - lid):* ${sinLib.length}
${sinLib.map(j => `• ${j}`).join('\n') || 'Ninguno'}

ℹ️ WhatsApp está ocultando números reales con el formato *@lid* para proteger la privacidad.
`;

    await conn.sendMessage(chatId, {
      text: mensaje.trim()
    }, { quoted: msg });
  } catch (err) {
    console.error("❌ Error en verlib:", err);
    await conn.sendMessage(chatId, {
      text: '❌ Ocurrió un error al obtener la información del grupo.'
    }, { quoted: msg });
  }
};

handler.command = ['verlib'];
module.exports = handler;
