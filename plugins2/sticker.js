const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { spawn } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');

const handler = async (msg, { conn, usedPrefix }) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Responde a una imagen o video con el comando \`${usedPrefix}s\` para crear un sticker.*`
      }, { quoted: msg });
    }

    const mediaType = quoted.imageMessage ? 'image' : quoted.videoMessage ? 'video' : null;
    if (!mediaType) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ *Solo puedes convertir imágenes o videos en stickers.*'
      }, { quoted: msg });
    }

    const senderName = msg.pushName || 'Usuario Desconocido';
    const now = new Date();
    const fechaCreacion = `📅 ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} 🕒 ${now.getHours()}:${now.getMinutes()}`;

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🛠️', key: msg.key }
    });

    const mediaStream = await downloadContentFromMessage(quoted[`${mediaType}Message`], mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of mediaStream) buffer = Buffer.concat([buffer, chunk]);

    if (!buffer || buffer.length === 0) throw new Error('No se pudo descargar el archivo multimedia.');

    const metadata = {
      packname: `✨ Lo Mandó Hacer: ${senderName} ✨`,
      author: `🤖 Bot Creador: Azura Ultra 2.0 Subbot\n🛠️ Desarrollado por: 𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻\n${fechaCreacion}`
    };

    const sticker = mediaType === 'image'
      ? await writeExifImg(buffer, metadata)
      : await writeExifVid(buffer, metadata);

    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error('❌ Error en sticker s:', err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ *Hubo un error al procesar el sticker. Inténtalo de nuevo.*'
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '❌', key: msg.key }
    });
  }
};

handler.command = ['s'];
module.exports = handler;

/* ============ FUNCIONES DE CONVERSIÓN EXIF ============ */

// IMAGEN
async function writeExifImg(buffer, metadata) {
  const imgTemp = path.join(tmpdir(), `azura_${Date.now()}.jpg`);
  const webpTemp = path.join(tmpdir(), `azura_${Date.now()}.webp`);
  fs.writeFileSync(imgTemp, buffer);

  await new Promise((resolve, reject) => {
    spawn('ffmpeg', ['-i', imgTemp, '-vcodec', 'libwebp', '-filter:v', 'fps=fps=15', '-lossless', '1', '-loop', '0', '-preset', 'default', '-an', '-vsync', '0', webpTemp])
      .on('error', reject)
      .on('close', resolve);
  });

  const img = new webp.Image();
  await img.load(webpTemp);
  img.exif = createExif(metadata);
  await img.save();

  return webpTemp;
}

// VIDEO
async function writeExifVid(buffer, metadata) {
  const vidTemp = path.join(tmpdir(), `azura_${Date.now()}.mp4`);
  const webpTemp = path.join(tmpdir(), `azura_${Date.now()}.webp`);
  fs.writeFileSync(vidTemp, buffer);

  await new Promise((resolve, reject) => {
    spawn('ffmpeg', ['-i', vidTemp, '-vcodec', 'libwebp', '-filter:v', 'fps=fps=15,scale=320:320:force_original_aspect_ratio=decrease', '-lossless', '1', '-loop', '0', '-preset', 'default', '-an', '-vsync', '0', webpTemp])
      .on('error', reject)
      .on('close', resolve);
  });

  const img = new webp.Image();
  await img.load(webpTemp);
  img.exif = createExif(metadata);
  await img.save();

  return webpTemp;
}

// EXIF METADATA GENERADOR
function createExif({ packname, author }) {
  const json = {
    "sticker-pack-id": "azura-ultra-2.0",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    emojis: ["🧠", "💥"]
  };
  const exifAttr = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]),
    Buffer.from(JSON.stringify(json), 'utf8')
  ]);
  return exifAttr;
}
