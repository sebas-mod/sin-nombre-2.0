const axios = require("axios");
const { isUrl } = require("../lib/funciones-utiles"); // Asegúrate de tener esta función

const handler = async (msg, { conn, text, args, usedPrefix, command }) => {
  if (!text) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: `⚠️ *Ejemplo de uso:*\n📌 ${usedPrefix + command} https://vm.tiktok.com/ZMjdrFCtg/`
    }, { quoted: msg });
  }

  if (!isUrl(args[0]) || !args[0].includes("tiktok")) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Enlace de TikTok inválido.*"
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: '⏱️', key: msg.key }
  });

  try {
    const res = await axios.get(`https://api.dorratz.com/v2/tiktok-dl?url=${args[0]}`);
    const data = res.data?.data;

    if (!data?.media?.org) throw new Error("La API no devolvió un video válido.");

    const videoUrl = data.media.org;
    const title = data.title || "Sin título";
    const author = data.author?.nickname || "Desconocido";
    const duration = data.duration ? `${data.duration} segundos` : "No especificado";
    const likes = data.like || "0";
    const comments = data.comment || "0";

    const caption = `
🎥 *Video de TikTok*
📌 *Título:* ${title}
👤 *Autor:* ${author}
⏱️ *Duración:* ${duration}
❤️ *Likes:* ${likes} | 💬 *Comentarios:* ${comments}

───────
🍧 *API utilizada:* https://api.dorratz.com
© Azura Ultra Subbot
    `.trim();

    await conn.sendMessage(msg.key.remoteJid, {
      video: { url: videoUrl },
      caption
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el comando tiktok:", err.message);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al procesar el enlace de TikTok.*\n🔹 _Inténtalo más tarde._"
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['tiktok', 'tt'];
module.exports = handler;
