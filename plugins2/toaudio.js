const { toAudio } = require('../libs/converter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const handler = async (msg, { conn }) => {
    try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return conn.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a un video o audio con el comando `.toaudio` para convertirlo a MP3.*" 
            }, { quoted: msg });
        }

        const mediaType = quoted.videoMessage ? "video" : quoted.audioMessage ? "audio" : null;
        
        if (!mediaType) {
            return conn.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Solo puedes convertir videos o audios a MP3.*" 
            }, { quoted: msg });
        }

        await conn.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛠️", key: msg.key } 
        });

        const mediaStream = await downloadContentFromMessage(quoted[`${mediaType}Message`], mediaType);
        let buffer = Buffer.alloc(0);
        
        for await (const chunk of mediaStream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
            throw new Error("No se pudo descargar el archivo.");
        }

        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        
        const inputPath = path.join(tmpDir, `${Date.now()}_input.mp4`);
        const outputPath = path.join(tmpDir, `${Date.now()}_output.mp3`);

        fs.writeFileSync(inputPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioCodec('libmp3lame')
                .audioBitrate(128)
                .format('mp3')
                .on('end', () => {
                    fs.unlinkSync(inputPath);
                    resolve();
                })
                .on('error', (err) => {
                    fs.unlinkSync(inputPath);
                    reject(err);
                })
                .save(outputPath);
        });

        const audioBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);

        await conn.sendMessage(msg.key.remoteJid, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: 'converted.mp3'
        }, { quoted: msg });

        await conn.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("Error en el comando toaudio:", error);
        await conn.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al convertir el contenido a MP3. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
};

handler.command = ['toaudio', 'tomp3'];
handler.tags = ['tools'];
handler.help = [
    'toaudio <responder a video/audio> - Convierte a formato MP3',
    'tomp3 <responder a video/audio> - Convierte a formato MP3'
];
module.exports = handler;
