const handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, {
    text: "✅ El sistema de plugins está funcionando correctamente, mi rey."
  }, { quoted: m });
};

handler.command = ['test'];
module.exports = handler;
