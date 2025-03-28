const handler = async (m, { conn, command, usedPrefix }) => {
  await conn.sendMessage(m.chat, {
    text: `✅ ¡Comando *${usedPrefix}${command}* ejecutado correctamente!\n\nTu bot está funcionando con el sistema *plugins* sin problemas.`
  }, { quoted: m });
};

handler.command = ['test'];
export default handler;
