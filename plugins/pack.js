const handler = async (msg, { conn }) => {
  const urls = [
    'https://telegra.ph/file/957fe4031132ef90b66ec.jpg',
    'https://telegra.ph/file/c4b85bd53030cb648382f.jpg',
    'https://telegra.ph/file/df56f8a76145df9c923ad.jpg',
    'https://telegra.ph/file/d5d1c2c710c4b5ee8bc6c.jpg',
    'https://telegra.ph/file/d0c0cd47e87535373ab68.jpg',
    'https://telegra.ph/file/651a5a9dc96c97c8ef8fc.jpg',
    'https://telegra.ph/file/f857ae461ceab18c38de2.jpg'
  ];
  const url = urls[Math.floor(Math.random() * urls.length)];

  await conn.sendMessage(msg.key.remoteJid, {
    image: { url },
    caption: "🥵 Aquí tienes mi Pack 😏"
  }, { quoted: msg });
};

handler.command = ["pack"];
handler.tags = ["nsfw"];
handler.help = ["pack"];
module.exports = handler;
