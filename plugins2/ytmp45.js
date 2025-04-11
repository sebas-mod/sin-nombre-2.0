const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

const handler = async (msg, { conn, text }) => {
    const ddownr = {
        download: async (url) => {
            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/download.php?format=mp4&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            const response = await axios.request(config);
            if (response.data && response.data.success) {
                const { id, title, info } = response.data;
                const downloadUrl = await ddownr.cekProgress(id);
                return { 
                    title, 
                    downloadUrl, 
                    thumbnail: info.image, 
                    duration: info.duration 
                };
            } else {
                throw new Error('No se pudo obtener el video.');
            }
        },
        cekProgress: async (id) => {
            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            while (true) {
                const response = await axios.request(config);
                if (response.data?.success && response.data.progress === 1000) {
                    return response.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    };

    if (!text) {
        return await conn.sendMessage(msg.key.remoteJid, {
            text: `✳️ Uso correcto:\n\n📌 Ejemplo: *${global.prefix}ytmp45* Bad Bunny - Diles`
        }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
        react: { text: '⏳', key: msg.key }
    });

    try {
        const search = await yts(text);
        if (!search.videos || search.videos.length === 0) {
            throw new Error('No se encontraron resultados para tu búsqueda.');
        }

        const video = search.videos[0];
        const videoData = {
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnail,
            timestamp: video.timestamp
        };

        const { title, url, thumbnail, timestamp } = videoData;

        await conn.sendMessage(msg.key.remoteJid, {
            image: { url: thumbnail },
            caption: `╭───〔 🎬 *AZURA ULTRA 2.0* 〕───╮
│
│ 📌 *Título:* ${title}
│ ⏱️ *Duración:* ${timestamp}
│
│ ⏳ *Procesando tu video...*
│
╰───────────────────────╯`
        }, { quoted: msg });

        const { downloadUrl } = await ddownr.download(url);

        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        
        const filePath = path.join(tmpDir, `${Date.now()}.mp4`);

        const videoRes = await axios.get(downloadUrl, {
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        await streamPipeline(videoRes.data, fs.createWriteStream(filePath));

        await conn.sendMessage(msg.key.remoteJid, {
            video: fs.readFileSync(filePath),
            mimetype: 'video/mp4',
            caption: `🎬 *${title.substring(0, 100)}*`
        }, { quoted: msg });

        fs.unlinkSync(filePath);

        await conn.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error('Error en ytmp45:', err);
        
        await conn.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error al procesar el video:*\n${err.message}`
        }, { quoted: msg });

        await conn.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }
};

handler.command = ['ytmp45', 'ytvideo'];
handler.tags = ['downloader'];
handler.help = [
    'ytmp45 <búsqueda> - Descarga video de YouTube'
];
module.exports = handler;
