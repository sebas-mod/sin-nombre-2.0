const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg = context?.quotedMessage;

  const defaultColor = 'azul';
  const inputColor = args[0]?.toLowerCase();
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

  const colorValido = colores[inputColor] ? inputColor : defaultColor;
  const gradColors = colores[colorValido];

  let texto = '';
  if (quotedMsg) {
    texto = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
  } else {
    texto = colores[inputColor] ? args.slice(1).join(' ') : args.join(' ');
  }

  if (!texto || texto.length === 0) {
    return conn.sendMessage(chatId, {
      text: '⚠️ Usa el comando así:\n\n*.texto [color opcional] tu mensaje*\n\nEj: *.texto rosa Te amo*\n\nColores disponibles:\n- azul\n- rojo\n- verde\n- rosa\n- morado\n- negro\n- naranja\n- gris'
    }, { quoted: msg });
  }

  const displayText = texto.slice(0, 300);
  const targetJid = context?.participant || msg.key.participant || msg.key.remoteJid;
  const contacto = conn.contacts?.[targetJid] || {};
  const targetName = contacto.name || contacto.notify || targetJid.split('@')[0];

  let profilePic;
  try {
    profilePic = await conn.profilePictureUrl(targetJid, 'image');
  } catch {
    profilePic = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
  }

  // Reacción al usar el comando
  await conn.sendMessage(chatId, {
    react: { text: '🖼️', key: msg.key }
  });

  // Crear canvas
  const canvas = createCanvas(1080, 1080);
  const ctx = canvas.getContext('2d');

  // Fondo degradado
  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, gradColors[0]);
  grad.addColorStop(1, gradColors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Avatar circular
  const avatar = await loadImage(profilePic);
  ctx.save();
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, 20, 20, 160, 160);
  ctx.restore();

  // Nombre
  ctx.font = 'bold 40px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(targetName, 200, 100);

  // Texto principal
  ctx.font = 'bold 60px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(displayText, canvas.width / 2, 600, 900);

  // Guardar temporal y enviar
  const fileName = `./tmp/texto-${Date.now()}.png`;
  const out = fs.createWriteStream(fileName);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on('finish', async () => {
    await conn.sendMessage(chatId, {
      image: { url: fileName },
      caption: `🖼 Publicación generada por Azura Ultra`
    }, { quoted: msg });
    fs.unlinkSync(fileName);
  });
};

handler.command = ['texto'];
module.exports = handler;
