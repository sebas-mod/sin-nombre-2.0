const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg = context?.quotedMessage;

  // Mapa de colores disponibles
  const defaultColor = 'azul';
  const colores = {
    azul: ['#2196F3', '#E3F2FD'],
    rojo: ['#F44336', '#FFCDD2'],
    verde: ['#4CAF50', '#C8E6C9'],
    rosa: ['#E91E63', '#F8BBD0'],
    morado: ['#9C27B0', '#E1BEE7'],
    negro: ['#212121', '#9E9E9E'],
    naranja: ['#FF9800', '#FFE0B2'],
    gris: ['#607D8B', '#CFD8DC']
  };

  // Sacar texto
  let texto = '';
  if (quotedMsg) {
    texto = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
  } else {
    texto = colores[args[0]?.toLowerCase()] ? args.slice(1).join(' ') : args.join(' ');
  }

  if (!texto || texto.length === 0) {
    return conn.sendMessage(chatId, {
      text: '⚠️ Usa el comando así:\n\n*.texto [color opcional] tu mensaje*\n\nColores disponibles:\n- azul\n- rojo\n- verde\n- rosa\n- morado\n- negro\n- naranja\n- gris'
    }, { quoted: msg });
  }

  const displayText = texto.slice(0, 300);
  const inputColor = args[0]?.toLowerCase();
  const gradColors = colores[inputColor] || colores[defaultColor];

  const targetJid = context?.participant || msg.key.participant || msg.key.remoteJid;
  const contacto = conn.contacts?.[targetJid] || {};
  const nombreUsuario = contacto.name || contacto.notify || targetJid.split('@')[0];

  let avatarUrl;
  try {
    avatarUrl = await conn.profilePictureUrl(targetJid, 'image');
  } catch {
    avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
  }

  await conn.sendMessage(chatId, { react: { text: '🖼️', key: msg.key } });

  const canvas = createCanvas(1080, 1080);
  const ctx = canvas.getContext('2d');

  // Fondo degradado
  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, gradColors[0]);
  grad.addColorStop(1, gradColors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Avatar circular
  const avatar = await loadImage(avatarUrl);
  ctx.save();
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, 20, 20, 160, 160);
  ctx.restore();

  // Nombre del usuario
  ctx.font = 'bold 40px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(nombreUsuario, 220, 100);

  // Texto principal (romper líneas si es muy largo)
  ctx.font = 'bold 60px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  const lines = [];
  const words = displayText.split(' ');
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const { width } = ctx.measureText(testLine);
    if (width > 900) {
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

  // Marca de agua (Azura Ultra & Cortana Bot + logo)
  const logo = await loadImage('https://cdn.russellxz.click/e3acfde4.png');
  const marcaTexto = "Azura Ultra & Cortana Bot";

  // Dibujar logo pequeño
  ctx.drawImage(logo, 750, 970, 40, 40);

  // Dibujar texto de marca
  ctx.font = 'italic 26px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(marcaTexto, 800, 1000);

  // Guardar y enviar
  const fileName = `./tmp/texto-${Date.now()}.png`;
  const out = fs.createWriteStream(fileName);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on('finish', async () => {
    await conn.sendMessage(chatId, {
      image: { url: fileName },
      caption: `🖼 Texto generado por Azura Ultra`
    }, { quoted: msg });
    fs.unlinkSync(fileName);
  });
};

handler.command = ['texto'];
module.exports = handler;
