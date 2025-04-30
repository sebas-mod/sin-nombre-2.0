const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const fondoURL = 'https://cdn.russellxz.click/3f64bf97.jpeg';
const sinFotoURL = 'https://cdn.russellxz.click/c354a72a.jpeg';
const logoURL = 'https://cdn.russellxz.click/a46036ec.png';

function formatearFecha(fecha = new Date()) {
  const d = new Date(fecha);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const pushName = msg.pushName || 'Usuario';
  const isGroup = chatId.endsWith('@g.us');

  if (args.length < 4) {
    return conn.sendMessage(chatId, {
      text: `🪪 *Registro de Cédula Digital*\n\nUsa el comando así:\n*reg nombre edad sexo fecha*\n\nEjemplo:\n*reg Russell 26 Hombre 19/06/1998*`,
    }, { quoted: msg });
  }

  const [nombre, edad, sexo, fechaNac] = args;
  const grupo = isGroup ? (await conn.groupMetadata(chatId)).subject : 'Chat Privado';
  const fechaHoy = new Date();
  const fechaEmision = formatearFecha(fechaHoy);
  const fechaVencimiento = formatearFecha(new Date(fechaHoy.setFullYear(fechaHoy.getFullYear() + 10)));

  await conn.sendMessage(chatId, { react: { text: '🪪', key: msg.key } });

  // Crear canvas
  const canvas = createCanvas(1080, 720);
  const ctx = canvas.getContext('2d');

  // Fondo desenfocado
  const fondo = await loadImage(fondoURL);
  ctx.drawImage(fondo, 0, 0, 1080, 720);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(20, 20, 1040, 680);

  // Avatar
  let avatarURL = sinFotoURL;
  try { avatarURL = await conn.profilePictureUrl(senderId, 'image'); } catch {}
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(160, 160, 100, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, 60, 60, 200, 200);
  ctx.restore();

  // Logo
  const logo = await loadImage(logoURL);
  ctx.drawImage(logo, 900, 590, 130, 110);

  // Texto
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px Sans-serif';
  ctx.fillText('CIUDADANO DE AZURA ULTRA & CORTANA', 320, 80);

  ctx.font = 'italic 26px Sans-serif';
  ctx.fillText(`Registrado en: ${grupo}`, 320, 120);

  ctx.font = 'bold 30px Sans-serif';
  ctx.fillText(`Nombre: ${nombre}`, 320, 200);
  ctx.fillText(`Edad: ${edad}`, 320, 250);
  ctx.fillText(`Sexo: ${sexo}`, 320, 300);
  ctx.fillText(`Nacimiento: ${fechaNac}`, 320, 350);
  ctx.fillText(`Número: ${senderId.split('@')[0]}`, 320, 400);
  ctx.fillText(`Emitida: ${fechaEmision}`, 320, 450);
  ctx.fillText(`Vence: ${fechaVencimiento}`, 320, 500);

  // Guardar imagen temporal
  const buffer = canvas.toBuffer('image/png');
  const fileName = `./tmp/cedula-${Date.now()}.png`;
  fs.writeFileSync(fileName, buffer);

  // Enviar imagen
  await conn.sendMessage(chatId, {
    image: fs.readFileSync(fileName),
    caption: `✅ Registro completado. ¡Bienvenido ciudadano!`
  }, { quoted: msg });

  // Guardar en JSON
  const regPath = './reg.json';
  let data = {};
  if (fs.existsSync(regPath)) {
    data = JSON.parse(fs.readFileSync(regPath));
  }
  data[senderId] = {
    nombre, edad, sexo, nacimiento: fechaNac,
    grupo, fecha: fechaEmision, vence: fechaVencimiento,
    cedula: buffer.toString('base64')
  };
  fs.writeFileSync(regPath, JSON.stringify(data, null, 2));
  fs.unlinkSync(fileName); // limpiar
};

handler.command = ['reg'];
module.exports = handler;
