const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

const play10Cache = {};

const handler = async (msg, { conn, text }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;

  if (!text) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${global.prefix}play10* bad bunny - diles`
    }, { quoted: msg });
  }

  // Si el mensaje es una respuesta con "1", "audio", "2" o "video"
  const isReply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const replyText = msg.message?.conversation?.toLowerCase() || msg.message?.extendedTextMessage?.text?.toLowerCase();

  if (isReply && (["1", "audio", "2", "video"].includes(replyText))) {
    const ref = msg.message.extendedTextMessage.contextInfo;
    const refKey = `${chatId}:${senderId}`;
    const lastQuery = play10Cache[refKey];
    if (!lastQuery) {
      return conn.sendMessage(chatId, {
        text: "⚠️ No encontré resultados recientes. Usa el comando *play10* primero."
      }, { quoted: msg });
    }

    const isAudio = replyText === "1" || replyText === "audio";
    const tipo = isAudio ? "audio" : "video";
    const calidad = isAudio ? "128kbps" : "360p";

    const urlApi = `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(lastQuery.url)}&type=${tipo}&quality=${calidad}&apikey=russellxz`;

    await conn.sendMessage(chatId, {
      react: { text: '⏳', key: msg.key }
    });

    try {
      const res = await axios.get(urlApi);
      const data = res.data;

      if (!data.status || !data.data?.url) {
        throw new Error("No se pudo obtener el archivo.");
      }

      const tmpDir = path.join(__dirname, "../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      const filename = `${Date.now()}_${tipo}.${isAudio ? "mp3" : "mp4"}`;
      const filePath = path.join(tmpDir, filename);

      const fileRes = await axios.get(data.data.url, { responseType: "stream" });
      await streamPipeline(fileRes.data, fs.createWriteStream(filePath));

      if (isAudio) {
        await conn.sendMessage(chatId, {
          audio: fs.readFileSync(filePath),
          mimetype: "audio/mpeg",
          fileName: `${lastQuery.title}.mp3`
        }, { quoted: msg });
      } else {
        await conn.sendMessage(chatId, {
          video: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${lastQuery.title}.mp4`,
          caption: "🎬 Aquí está tu video. Disfrútalo."
        }, { quoted: msg });
      }

      fs.unlinkSync(filePath);
      delete play10Cache[refKey];

      await conn.sendMessage(chatId, {
        react: { text: "✅", key: msg.key }
      });

    } catch (e) {
      console.error("Error en play10:", e);
      await conn.sendMessage(chatId, {
        text: `❌ Error al descargar: ${e.message}`
      }, { quoted: msg });
    }

    return;
  }

  // Si no es respuesta, iniciar la búsqueda
  const yts = require("yt-search");
  await conn.sendMessage(chatId, {
    react: { text: '🔍', key: msg.key }
  });

  try {
    const search = await yts(text);
    const video = search.videos[0];
    if (!video) throw new Error("No se encontraron resultados.");

    const info = `🔎 Resultado encontrado:\n\n*🎵 Título:* ${video.title}\n*📺 Canal:* ${video.author.name}\n*⏱️ Duración:* ${video.timestamp}\n\n_Responde con:_\n*1* o *audio* para obtener el audio\n*2* o *video* para obtener el video`;

    play10Cache[`${chatId}:${senderId}`] = {
      url: video.url,
      title: video.title
    };

    await conn.sendMessage(chatId, {
      image: { url: video.thumbnail },
      caption: info
    }, { quoted: msg });

  } catch (e) {
    console.error("Error en búsqueda:", e);
    await conn.sendMessage(chatId, {
      text: `❌ No se pudo realizar la búsqueda: ${e.message}`
    }, { quoted: msg });
  }
};

handler.command = ["play10"];
module.exports = handler;
