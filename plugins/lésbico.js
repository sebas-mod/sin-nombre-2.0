const handler = async (msg, { conn }) => {
  const urls = [
    'https://l.top4top.io/m_2257y4pyl0.mp4',
    'https://k.top4top.io/m_2257pdwjy0.mp4',
    'https://a.top4top.io/m_2257qulmx0.mp4',
    'https://c.top4top.io/m_2257p4v9i3.mp4',
    'https://j.top4top.io/m_2258joebc2.mp4'
  ];
  const url = urls[Math.floor(Math.random() * urls.length)];

  await conn.sendMessage(msg.key.remoteJid, {
    video: { url },
    caption: "👩‍❤️‍👩 Video lésbico +18"
  }, { quoted: msg });
};

handler.command = ["videoxxxlesbi", "pornolesv"];
handler.tags = ["nsfw"];
handler.help = ["videoxxxlesbi"];
module.exports = handler;
