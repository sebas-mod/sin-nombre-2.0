const axios = require("axios");

const handler = async (msg, { conn, command }) => {
try {
    const resError = (await axios.get("https://raw.githubusercontent.com/elrebelde21/NovaBot-MD/master/src/nsfw/tetas.json")).data;
    const resApi = await axios.get("https://api-fgmods.ddns.net/api/nsfw/boobs?apikey=fg-dylux");
    let url = resApi.data || resError[Math.floor(Math.random() * resError.length)];

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url },
      caption: "🥵 dame lechita de ahí 🥵"
    }, { quoted: msg });
  } catch (e) {
    console.error("❌ Error en comando tetas:", e)
  }
};

handler.command = ["tetas"];
handler.tags = ["nsfw"];
handler.help = ["tetas"];
module.exports = handler;
