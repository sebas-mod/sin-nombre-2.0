const yts = require('yt-search'); const axios = require('axios'); const fs = require('fs'); const path = require('path'); const { pipeline } = require('stream'); const { promisify } = require('util'); const ffmpeg = require('fluent-ffmpeg'); const streamPipeline = promisify(pipeline);

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];

const ddownr = { download: async (url, format) => { if (!formatAudio.includes(format)) { throw new Error('Formato no soportado.'); }

const config = {
  method: 'GET',
  url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
  headers: { 'User-Agent': 'Mozilla/5.0' }
};

const response = await axios.request(config);
if (response.data && response.data.success) {
  const { id, title, info } = response.data;
  const downloadUrl = await ddownr.cekProgress(id);
  return { title, downloadUrl, thumbnail: info.image };
} else {
  throw new Error('No se pudo obtener la info del video.');
}

},

cekProgress: async (id) => { const config = { method: 'GET', url: https://p.oceansaver.in/ajax/progress.php?id=${id}, headers: { 'User-Agent': 'Mozilla/5.0' } };

while (true) {
  const response = await axios.request(config);
  if (response.data?.success && response.data.progress === 1000) {
    return response.data.download_url;
  }
  await new Promise(resolve => setTimeout(resolve, 5000));
}

} };

const handler = async (msg, { conn, text, usedPrefix }) => { await conn.sendMessage(msg.key.remoteJid, { react: { text: "🎶", key: msg.key } });

try { if (!text || text.trim() === "") { await conn.sendMessage(msg.key.remoteJid, { text: ⚠️ Escribe el nombre de la canción. 📌 Ejemplo: *${usedPrefix}play1 Boza Yaya* }, { quoted: msg }); return; }

const search = await yts(text);
if (!search.videos || search.videos.length === 0) {
  throw new Error('No se encontraron resultados.');
}

const video = search.videos[0];
const { title, url, thumbnail } = video;

const { downloadUrl } = await ddownr.download(url, 'mp3');

const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
const finalPath = path.join(tmpDir, `${Date.now()}_compressed.mp3`);

const audioRes = await axios.get(downloadUrl, {
  responseType: 'stream',
  headers: { 'User-Agent': 'Mozilla/5.0' }
});

await streamPipeline(audioRes.data, fs.createWriteStream(rawPath));

await new Promise((resolve, reject) => {
  ffmpeg(rawPath)
    .audioBitrate('128k')
    .format('mp3')
    .on('end', resolve)
    .on('error', reject)
    .save(finalPath);
});

await conn.sendMessage(msg.key.remoteJid, {
  audio: fs.readFileSync(finalPath),
  fileName: `${title}.mp3`,
  mimetype: "audio/mpeg",
  contextInfo: {
    externalAdReply: {
      title: title,
      body: "Azura Ultra Subbot",
      mediaType: 1,
      previewType: "PHOTO",
      thumbnailUrl: thumbnail,
      showAdAttribution: true,
      renderLargerThumbnail: true
    }
  }
}, { quoted: msg });

fs.unlinkSync(rawPath);
fs.unlinkSync(finalPath);

} catch (error) { console.error(error); await conn.sendMessage(msg.key.remoteJid, { text: "⚠️ Hubo un pequeño error :(" }, { quoted: msg }); } };

handler.command = ['play1']; module.exports = handler;

