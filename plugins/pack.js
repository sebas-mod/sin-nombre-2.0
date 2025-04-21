const handler = async (msg, { conn }) => {
  const urls = [
    'https://telegra.ph/file/c0da7289bee2d97048feb.jpg',
    'https://telegra.ph/file/b8564166f9cac4d843db3.jpg',
    'https://telegra.ph/file/6e1a6dcf1c91bf62d3945.jpg',
    'https://telegra.ph/file/0224c1ecf6b676dda3ac0.jpg',
    'https://telegra.ph/file/b71b8f04772f1b30355f1.jpg'
  ];
  const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];
  const imageUrl = getRandom(urls);

  try {
    // Reacción de carga
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🔄", key: msg.key }
    });

    // Envío de la imagen
    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: imageUrl },
      caption: "🥵 Aquí tienes más pack 😏"
    }, { quoted: msg });

    // Reacción de éxito
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en comando pack2:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al enviar la imagen.",
    }, { quoted: msg });
  }
};

handler.command = ["pack2"];
handler.tags = ["nsfw"];
handler.help = ["pack2"];

module.exports = handler;
