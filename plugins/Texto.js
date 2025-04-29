const { createCanvas, loadImage } = require('canvas'); const fs = require('fs'); const path = require('path'); const axios = require('axios'); const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const handler = async (msg, { conn, args }) => { const chatId = msg.key.remoteJid; const context = msg.message?.extendedTextMessage?.contextInfo; const quotedMsg = context?.quotedMessage;

const defaultColor = 'azul'; const colorInput = args[0]?.toLowerCase(); const texto = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || args.slice(1).join(' ') || args.join(' ');

if (!texto || texto.length < 1) { return conn.sendMessage(chatId, { text: '⚠️ Usa el comando así: .texto [color opcional] tu mensaje

Ej: .texto rosa Te amo

Colores disponibles:

azul

rojo

verde

rosa

morado

negro

naranja

gris' }, { quoted: msg }); }

const colores = { azul: ['#2196F3', '#E3F2FD'], rojo: ['#F44336', '#FFCDD2'], verde: ['#4CAF50', '#C8E6C9'], rosa: ['#E91E63', '#F8BBD0'], morado: ['#9C27B0', '#E1BEE7'], negro: ['#212121', '#9E9E9E'], naranja: ['#FF9800', '#FFE0B2'], gris: ['#607D8B', '#CFD8DC'] };

const gradColors = colores[colorInput] || colores[defaultColor]; const messageText = texto.trim().slice(0, 300);

const targetJid = context?.participant || msg.key.participant || msg.key.remoteJid; const targetName = await conn.getName(targetJid);

let profilePic; try { profilePic = await conn.profilePictureUrl(targetJid, 'image'); } catch { profilePic = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; }

const canvas = createCanvas(1080, 1080); const ctx = canvas.getContext('2d');

// Fondo degradado const grad = ctx.createLinearGradient(0, 0, 1080, 1080); grad.addColorStop(0, gradColors[0]); grad.addColorStop(1, gradColors[1]); ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1080);

// Avatar redondo const avatar = await loadImage(profilePic); ctx.save(); ctx.beginPath(); ctx.arc(100, 100, 80, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); ctx.drawImage(avatar, 20, 20, 160, 160); ctx.restore();

// Nombre ctx.font = 'bold 36px Sans-serif'; ctx.fillStyle = '#ffffff'; ctx.fillText(targetName || 'Usuario', 200, 100);

// Texto principal ctx.font = 'bold 60px Sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText(messageText, canvas.width / 2, 600, 900);

const filePath = path.resolve(__dirname, texto-${Date.now()}.png); const out = fs.createWriteStream(filePath); const stream = canvas.createPNGStream(); stream.pipe(out); out.on('finish', async () => { await conn.sendMessage(chatId, { image: { url: filePath }, caption: 🖼 Texto generado por Azura Ultra }, { quoted: msg }); fs.unlinkSync(filePath); }); };


handler.command = ['texto']; module.exports = handler;

