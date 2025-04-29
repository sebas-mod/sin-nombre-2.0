const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const axios = require('axios');

const colores = {
  azul: ['#00B4DB', '#0083B0'],
  rojo: ['#F44336', '#FFCDD2'],
  verde: ['#4CAF50', '#C8E6C9'],
  rosa: ['#E91E63', '#F8BBD0'],
  morado: ['#9C27B0', '#E1BEE7'],
  negro: ['#212121', '#9E9E9E'],
  naranja: ['#FF9800', '#FFE0B2'],
  gris: ['#607D8B', '#CFD8DC']
};

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const ctxinfo = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctxinfo?.quotedMessage;

  let targetJid = msg.key.participant || msg.key.remoteJid;
  let quotedText = '';
  let fallbackName = msg.pushName || '';
  let quotedName = '';

  if (quoted && ctxinfo?.participant) {
    targetJid = ctxinfo.participant;
    quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';
    quotedName = quoted?.pushName || '';
    fallbackName = '';
  }

  const contentFull = (args.join(' ').trim() || '').trim();
  const firstWord = contentFull.split(' ')[0].toLowerCase();
  const bgColors = colores[firstWord] || colores['azul'];

  let content = '';
  if (colores[firstWord]) {
    const afterColor = contentFull.split(' ').slice(1).join(' ').trim();
    content = afterColor || quotedText || ' ';
  } else {
    content = contentFull || quotedText || ' ';
  }

  let displayName = fallbackName;
  try {
    const name = await conn.getName(targetJid);
    if (name && name.trim()) displayName = name;
  } catch {
    displayName = targetJid.split('@')[0];
  }

  let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
  try {
    avatar = await conn.profilePictureUrl(targetJid, 'image');
  } catch {}

  await conn.sendMessage(chatId, { react: { text: '🖼️', key: msg.key } });

  const canvas = createCanvas(1080, 1080);
  const draw = canvas.getContext('2d');

  const grad = draw.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, bgColors[0]);
  grad.addColorStop(1, bgColors[1]);
  draw.fillStyle = grad;
  draw.fillRect(0, 0, 1080, 1080);

  // Avatar circular
  const img = await loadImage(avatar);
  draw.save();
  draw.beginPath();
  draw.arc(100, 100, 80, 0, Math.PI * 2);
  draw.clip();
  draw.drawImage(img, 20, 20, 160, 160);
  draw.restore();

  // Nombre del usuario
  draw.font = 'bold 40px Sans-serif';
  draw.fillStyle = '#ffffff';
  draw.fillText(displayName, 220, 100);

  // Texto principal con salto de línea
  draw.font = 'bold 60px Sans-serif';
  draw.fillStyle = '#ffffff';
  draw.textAlign = 'center';
  const words = content.split(' ');
  let line = '', lines = [];
  for (const word of words) {
    const testLine = line + word + ' ';
    if (draw.measureText(testLine).width > 900) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line.trim()) lines.push(line.trim());
  const startY = 550 - (lines.length * 35);
  lines.forEach((l, i) => {
    draw.fillText(l, 540, startY + (i * 80));
  });

  // Logo + marca de agua
  const logo = await loadImage('https://cdn.russellxz.click/e3acfde4.png');
  draw.drawImage(logo, 750, 970, 40, 40);
  draw.font = 'italic 26px Serif';
  draw.textAlign = 'left';
  draw.fillText('Azura & Cortana Bot', 800, 1000);

  // Guardar imagen
  const fileName = `./tmp/texto-${Date.now()}.png`;
  const out = fs.createWriteStream(fileName);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on('finish', async () => {
    await conn.sendMessage(chatId, {
      image: { url: fileName },
      caption: `🖼 Generado por Azura`
    }, { quoted: msg });
    fs.unlinkSync(fileName);
  });
};

handler.command = ['texto'];
module.exports = handler;
