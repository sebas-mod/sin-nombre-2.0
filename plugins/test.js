const handler = async (msg, { conn }) => {
  await conn.sendMessage(msg.key.remoteJid, {
    text: "✅ El sistema de plugins está funcionando correctamente, azura ultra 2.0 bot activo mi rey."
  }, { quoted: msg });
};

handler.command = ['test'];
module.exports = handler;
