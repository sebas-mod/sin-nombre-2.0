const axios = require("axios");

const handler = async (msg, { conn, command }) => {
  try {
    const fallback = await axios.get("https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/imagenlesbians.json");
    const api = await axios.get("https://api-fgmods.ddns.net/api/nsfw/lesbian?apikey=fg-dylux");

    const url = api.data || fallback.data[Math.floor(Math.random() * fallback.data.length)];

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url },
      caption: "🥵"
    }, { quoted: msg });
  } catch (e) {
    console.error("❌ Error en comando imagenlesbians:", e);
   // await msg.reply("❌ No se pudo obtener la imagen.");
  }
};

handler.command = ["imagenlesbians"];
handler.tags = ["nsfw"];
handler.help = ["imagenlesbians"];
module.exports = handler;
