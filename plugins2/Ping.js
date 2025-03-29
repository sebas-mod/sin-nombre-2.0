const handler = async (msg, { conn }) => {
  const start = Date.now();

  const respuesta = await conn.sendMessage(msg.key.remoteJid, {
    text: "🏓 *Pong!*"
  }, { quoted: msg });

  const end = Date.now();
  const ping = end - start;

  await conn.sendMessage(msg.key.remoteJid, {
    text: `✅ *Ping:* ${ping} ms`,
    quoted: respuesta
  });
};

handler.command = ['ping'];
module.exports = handler;
