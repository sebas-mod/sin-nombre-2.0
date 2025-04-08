const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  await conn.sendMessage(chatId, {
    text: `✨ Este es un menú de prueba del bot Azura Ultra 2.0.

Aquí debería aparecer un botón arriba para unirte al canal.`,
    contextInfo: {
      externalAdReply: {
        title: "Canal Oficial de Azura Ultra",
        body: "Únete para ver comandos, actualizaciones y novedades.",
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true,
        sourceUrl: "https://whatsapp.com/channel/0029VaWABAMG8l5K8K9PAB3v"
      }
    }
  }, { quoted: msg });
};

handler.command = ['menup'];
module.exports = handler;
