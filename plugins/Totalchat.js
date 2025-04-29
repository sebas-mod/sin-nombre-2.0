const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  if (!isGroup) return;

  const conteoPath = path.resolve('./conteo.json');
  if (!fs.existsSync(conteoPath)) {
    return conn.sendMessage(chatId, {
      text: '⚠️ No hay datos suficientes para generar estadísticas aún.'
    }, { quoted: msg });
  }

  const data = JSON.parse(fs.readFileSync(conteoPath, 'utf8'));
  const groupData = data[chatId];
  if (!groupData) {
    return conn.sendMessage(chatId, {
      text: '⚠️ Este grupo aún no tiene mensajes registrados.'
    }, { quoted: msg });
  }

  const entries = Object.entries(groupData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = entries.map(([id]) => id.replace(/@.*/, ''));
  const values = entries.map(([, count]) => count);

  const width = 1080;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, width, height);

  const barWidth = 80;
  const barGap = 40;
  const maxHeight = 400;
  const maxValue = Math.max(...values);

  ctx.font = '30px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Estadísticas del grupo (Top 10)', 30, 50);

  labels.forEach((label, i) => {
    const barHeight = (values[i] / maxValue) * maxHeight;
    const x = 100 + i * (barWidth + barGap);
    const y = height - 100 - barHeight;

    ctx.fillStyle = '#00B4DB';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Sans-serif';
    ctx.fillText(values[i], x + 10, y - 10);

    ctx.save();
    ctx.translate(x + barWidth / 2, height - 60);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  const outPath = `./tmp/totalchat-${Date.now()}.png`;
  const out = fs.createWriteStream(outPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on('finish', async () => {
    await conn.sendMessage(chatId, {
      image: fs.readFileSync(outPath),
      caption: '📊 Estadísticas de mensajes en el grupo'
    }, { quoted: msg });
    fs.unlinkSync(outPath);
  });
};

handler.command = ['totalchat'];
module.exports = handler;
