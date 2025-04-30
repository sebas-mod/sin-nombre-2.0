const { createCanvas, loadImage, Image } = require('canvas');
const fs = require('fs');
const path = require('path');

const fondoUrl = 'https://cdn.russellxz.click/3f64bf97.jpeg';
const sinPerfilUrl = 'https://cdn.russellxz.click/c354a72a.jpeg';
const logoUrl = 'https://cdn.russellxz.click/a46036ec.png';
const regPath = './reg.json';

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const numero = sender.split('@')[0];

  if (args.length < 4) {
    return await conn.sendMessage(chatId, {
      text: `⚠️ Usa el comando correctamente:\n\n*reg nombre edad sexo fecha*\n\nEjemplo:\n*reg Russell 26 hombre 19/06/1998*`,
    }, { quoted: msg });
  }

  const [nombre, edad, sexo, nacimiento] = args;
  const ahora = new Date();
  const emitida = ahora.toLocaleDateString('es-PA');
  const vence = new Date(ahora.setFullYear(ahora.getFullYear() + 10)).toLocaleDateString('es-PA');

  // Cargar imágenes
  const fondo = await loadImage(fondoUrl);
  let avatar;
  try {
    avatar = await loadImage(await conn.profilePictureUrl(sender, 'image'));
  } catch {
    avatar = await loadImage(sinPerfilUrl);
  }
  const logo = await loadImage(logoUrl);

  const canvas = createCanvas(1080, 720);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(fondo, 0, 0, 1080, 720);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(50, 120, 980, 450);

  ctx.fillStyle = '#0a3c6b';
  ctx.fillRect(50, 80, 980, 50);
  ctx.font = 'bold 32px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CIUDADANO DE AZURA ULTRA & CORTANA', 60, 115);

  ctx.drawImage(avatar, 80, 150, 200, 200);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Sans-serif';
  ctx.fillText(`Nombre: ${nombre}`, 300, 180);
  ctx.fillText(`Edad: ${edad}`, 300, 220);
  ctx.fillText(`Sexo: ${sexo}`, 300, 260);
  ctx.fillText(`Nacimiento: ${nacimiento}`, 300, 300);
  ctx.fillText(`Número: ${numero}`, 300, 340);
  ctx.fillText(`Emitida: ${emitida}`, 300, 380);
  ctx.fillText(`Vence: ${vence}`, 300, 420);

  ctx.drawImage(logo, 930, 470, 100, 100);

  const file = `./tmp/reg-${numero}.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(file, buffer);

  // Guardar info
  const regData = fs.existsSync(regPath) ? JSON.parse(fs.readFileSync(regPath)) : {};
  regData[numero] = {
    nombre,
    edad,
    sexo,
    nacimiento,
    emitida,
    vence,
    imagen: buffer.toString('base64'),
  };
  fs.writeFileSync(regPath, JSON.stringify(regData, null, 2));

  await conn.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
  await conn.sendMessage(chatId, {
    image: fs.readFileSync(file),
    caption: `🪪 Registro completado correctamente.`,
  }, { quoted: msg });

  fs.unlinkSync(file);
};

handler.command = ['reg'];
module.exports = handler;
