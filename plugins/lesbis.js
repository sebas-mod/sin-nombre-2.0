const axios = require("axios");

const handler = async (msg, { conn, command }) => {
  try {
    const resError = (await axios.get("https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/imagenlesbians.json")).data;
    const resApi = await axios.get("https://api-fgmods.ddns.net/api/nsfw/lesbian?apikey=fg-dylux");
    let url = resApi.data || resError[Math.floor(Math.random() * resError.length)];

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url },
      caption: `_${command}_`
    }, { quoted: msg });
  } catch (e) {
    console.error("❌ Error en comando imagenlesbians:", e);
  //  await msg.reply("❌ No se pudo obtener la imagen.");
  }
};

handler.command = ["imagenlesbians"];
handler.tags = ["nsfw"];
handler.help = ["imagenlesbians"];
module.exports = handler;
