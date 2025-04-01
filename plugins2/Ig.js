const axios = require('axios');

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: `✳️ Ejemplo de uso:\n\n📌 *${usedPrefix + command}* https://www.instagram.com/p/CCoI4DQBGVQ/`
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: '⏳', key: msg.key }
  });

  try {
    const apiUrl = `https://api.dorratz.com/igdl?url=${text}`;
    const response = await axios.get(apiUrl);
    const { data } = response.data;

    if (!data || data.length === 0) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "❌ No se pudo obtener el contenido de Instagram."
      }, { quoted: msg });
    }

    const caption = `🎬 *Video de Instagram*\n\n> 🍧 Procesado por api.dorratz.com\n───────\n© *Azura Ultra Subbot*`;

    for (let item of data) {
      await conn.sendMessage(msg.key.remoteJid, {
        video: { url: item.url },
        caption
      }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al procesar el enlace de Instagram."
    }, { quoted: msg });
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '❌', key: msg.key }
    });
  }
};

handler.command = ['instagram', 'ig'];
module.exports = handler;
