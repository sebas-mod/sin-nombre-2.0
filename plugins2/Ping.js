module.exports = async (m, { conn, usedPrefix }) => {
  try {
    const start = Date.now();
    const msg = await conn.sendMessage(m.key.remoteJid, {
      text: "🏓 *Pong!*"
    }, { quoted: m });

    const end = Date.now();
    const ping = end - start;

    await conn.sendMessage(m.key.remoteJid, {
      text: `✅ *Ping:* ${ping} ms`,
      quoted: msg
    });
  } catch (err) {
    console.error("❌ Error en comando ping:", err);
    await conn.sendMessage(m.key.remoteJid, {
      text: "❌ Hubo un error al ejecutar el comando.",
      quoted: m
    });
  }
};
