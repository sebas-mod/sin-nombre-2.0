const os = require("os");

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const start = Date.now();

  // Reacción inicial
  await conn.sendMessage(chatId, {
    react: { text: '📡', key: msg.key }
  });

  const temp = await conn.sendMessage(chatId, { text: '🏓 Calculando ping...' }, { quoted: msg });

  const latency = Date.now() - start;
  const memoryUsage = process.memoryUsage();
  const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const usedMemGB = (memoryUsage.rss / 1024 / 1024 / 1024).toFixed(2);

  const info = `*📍 LATENCIA DEL BOT*\n\n` +
    `🏓 *Velocidad:* ${latency} ms\n` +
    `📦 *RAM usada:* ${usedMemGB} GB / ${totalMemGB} GB\n` +
    `📡 *Estado del bot:* En línea ✅\n` +
    `🧠 *CPU:* ${os.cpus()[0].model}\n\n` +
    `⏱️ *Uptime:* ${(process.uptime() / 60).toFixed(1)} minutos`;

  // Editar el mensaje anterior con los resultados
  await conn.sendMessage(chatId, {
    edit: temp.key,
    text: info
  });
};

handler.command = ['p'];
module.exports = handler;
