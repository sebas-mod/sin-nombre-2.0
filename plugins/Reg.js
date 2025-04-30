const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const fondoURL = 'https://cdn.russellxz.click/3f64bf97.jpeg';
const sinFotoURL = 'https://cdn.russellxz.click/c354a72a.jpeg';
const logoURL = 'https://cdn.russellxz.click/a46036ec.png';

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const pushName = msg.pushName || 'Usuario';
  const isGroup = chatId.endsWith('@g.us');

  // Si no hay argumentos, explicar
  if (args.length < 4) {
    return conn.sendMessage(chatId, {
      text: `✳️ Para registrarte, usa el comando así:\n\n*reg nombre edad sexo fecha*\n\n📌 Ejemplo:\n*reg Russell 26 Hombre 19/06/1998*`,
    }, { quoted: msg });
  }

  const [nombre, edad, sexo, fecha] = args;
  const grupo = isGroup ? (await conn.groupMetadata(chatId)).subject : 'Chat Privado';

  // Confirmación visual
  await conn.sendMessage(chatId, { react: { text: '🪪', key: msg.key } });

  // Cargar fondo desenfocado
  const fondo = await loadImage(fondoURL);
  const canvas = createCanvas(1080, 720);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(fondo, 0, 0, 1080, 720);

  // Avatar del usuario
  let avatarURL = sinFotoURL;
  try {
    avatarURL = await conn.profilePictureUrl(senderId, 'image');
  } catch {}

  const avatarImg = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(130, 130, 90, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatarImg, 40, 40, 180, 180);
  ctx.restore();

  // Logo en esquina inferior derecha
  const logo = await loadImage(logoURL);
  ctx.drawImage(logo, 900, 590, 150, 120);

  // Título
  ctx.font = 'bold 42px Sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CIUDADANO DE AZURA ULTRA & CORTANA', 250, 80);

  // Grupo donde se registró
  ctx.font = 'italic 28px Sans-serif';
  ctx.fillText(`Registrado en: ${grupo}`, 250, 120);

  // Datos del usuario
  ctx.font = 'bold 36px Sans-serif';
  ctx.fillText(`Nombre: ${nombre}`, 250, 200);
  ctx.fillText(`Edad: ${edad}`, 250, 260);
  ctx.fillText(`Sexo: ${sexo}`, 250, 320);
  ctx.fillText(`Nacimiento: ${fecha}`, 250, 380);
  ctx.fillText(`Número: ${senderId.split('@')[0]}`, 250, 440);

  // Guardar imagen
  const filePath = `./tmp/cedula-${senderId.split('@')[0]}.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  // Enviar imagen
  await conn.sendMessage(chatId, {
    image: fs.readFileSync(filePath),
    caption: '✅ Registro completado con éxito.'
  }, { quoted: msg });

  // Guardar en reg.json
  const regPath = './reg.json';
  let data = {};
  if (fs.existsSync(regPath)) {
    data = JSON.parse(fs.readFileSync(regPath));
  }
  const base64img = buffer.toString('base64');
  data[senderId] = { nombre, edad, sexo, fecha, grupo, cedula: base64img };
  fs.writeFileSync(regPath, JSON.stringify(data, null, 2));
  fs.unlinkSync(filePath); // limpiar

};

handler.command = ['reg'];
module.exports = handler;
