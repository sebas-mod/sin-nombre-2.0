const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const axios = require('axios');

const flagMap = [
  ['598', '🇺🇾'], ['595', '🇵🇾'], ['593', '🇪🇨'], ['591', '🇧🇴'],
  ['590', '🇧🇶'], ['509', '🇭🇹'], ['507', '🇵🇦'], ['506', '🇨🇷'],
  ['505', '🇳🇮'], ['504', '🇭🇳'], ['503', '🇸🇻'], ['502', '🇬🇹'],
  ['501', '🇧🇿'], ['599', '🇨🇼'], ['597', '🇸🇷'], ['596', '🇬🇫'],
  ['594', '🇬🇫'], ['592', '🇬🇾'], ['590', '🇬🇵'], ['549', '🇦🇷'],
  ['58', '🇻🇪'], ['57', '🇨🇴'], ['56', '🇨🇱'], ['55', '🇧🇷'],
  ['54', '🇦🇷'], ['53', '🇨🇺'], ['52', '🇲🇽'], ['51', '🇵🇪'],
  ['34', '🇪🇸'], ['1', '🇺🇸']
];

function numberWithFlag(num) {
  const clean = num.replace(/[^0-9]/g, '');
  for (const [code, flag] of flagMap) {
    if (clean.startsWith(code)) return `${num} ${flag}`;
  }
  return num;
}

async function niceName(jid, conn, chatId, qPush, fallback = '') {
  if (qPush && qPush.trim() && !/^[0-9]+$/.test(qPush)) return qPush;
  if (chatId.endsWith('@g.us')) {
    try {
      const meta = await conn.groupMetadata(chatId);
      const p = meta.participants.find(p => p.id === jid);
      const n = p?.notify || p?.name;
      if (n && n.trim() && !/^[0-9]+$/.test(n)) return n;
    } catch {}
  }
  try {
    const g = await conn.getName(jid);
    if (g && g.trim() && !/^[0-9]+$/.test(g) && !g.includes('@')) return g;
  } catch {}
  const c = conn.contacts?.[jid];
  if (c?.notify && !/^[0-9]+$/.test(c.notify)) return c.notify;
  if (c?.name && !/^[0-9]+$/.test(c.name)) return c.name;
  if (fallback && fallback.trim() && !/^[0-9]+$/.test(fallback)) return fallback;
  return numberWithFlag(jid.split('@')[0]);
}

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
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;

  let targetJid = msg.key.participant || msg.key.remoteJid;
  let textQuoted = '';
  let fallbackPN = msg.pushName || '';
  let qPushName = '';

  if (quoted && ctx?.participant) {
    targetJid = ctx.participant;
    textQuoted = quoted.conversation || quoted.extendedTextMessage?.text || '';
    qPushName = quoted?.pushName || '';
    fallbackPN = '';
  }

  const contentFull = (args.join(' ').trim() || '').trim();
  const firstWord = contentFull.split(' ')[0].toLowerCase();
  const bgColors = colores[firstWord] || colores['azul'];

  let content = '';
  if (colores[firstWord]) {
    const afterColor = contentFull.split(' ').slice(1).join(' ').trim();
    content = afterColor || textQuoted || ' ';
  } else {
    content = contentFull || textQuoted || ' ';
  }

  const displayName = await niceName(targetJid, conn, chatId, qPushName, fallbackPN);

  let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
  try {
    avatar = await conn.profilePictureUrl(targetJid, 'image');
  } catch {}

  await conn.sendMessage(chatId, { react: { text: '🖼️', key: msg.key } });

  const canvas = createCanvas(1080, 1080);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, bgColors[0]);
  grad.addColorStop(1, bgColors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // avatar
  const img = await loadImage(avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 20, 20, 160, 160);
  ctx.restore();

  // nombre
  ctx.font = 'bold 40px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName, 220, 100);

  // texto con salto de línea
  ctx.font = 'bold 60px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  const words = content.split(' ');
  let line = '', lines = [];
  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > 900) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line.trim()) lines.push(line.trim());
  const startY = 550 - (lines.length * 35);
  lines.forEach((l, i) => {
    ctx.fillText(l, 540, startY + (i * 80));
  });

  // marca + logo
  const logo = await loadImage('https://cdn.russellxz.click/e3acfde4.png');
  ctx.drawImage(logo, 750, 970, 40, 40);
  ctx.font = 'italic 26px Serif';
  ctx.textAlign = 'left';
  ctx.fillText('Azura & Cortana Bot', 800, 1000);

  const fileName = `./tmp/texto-${Date.now()}.png`;
  const out = fs.createWriteStream(fileName);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on('finish', async () => {
    await conn.sendMessage(chatId, {
      image: { url: fileName },
      caption: `🖼 Publicación generada por Azura`
    }, { quoted: msg });
    fs.unlinkSync(fileName);
  });
};

handler.command = ['texto'];
module.exports = handler;
