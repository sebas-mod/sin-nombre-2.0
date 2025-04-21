const fs = require("fs");
const path = require("path");

const handler = async (msg, { sock, command }) => {
  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  if (!isGroup) return;

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const pack = [
    'https://telegra.ph/file/957fe4031132ef90b66ec.jpg',
    'https://telegra.ph/file/c4b85bd53030cb648382f.jpg',
    'https://telegra.ph/file/df56f8a76145df9c923ad.jpg',
    'https://telegra.ph/file/d5d1c2c710c4b5ee8bc6c.jpg',
    'https://telegra.ph/file/d0c0cd47e87535373ab68.jpg',
    'https://telegra.ph/file/651a5a9dc96c97c8ef8fc.jpg',
    'https://telegra.ph/file/f857ae461ceab18c38de2.jpg',
    'https://telegra.ph/file/5d2a2aeff5e6fbd229eff.jpg',
    'https://telegra.ph/file/b93573531f898ea875dd0.jpg',
    'https://telegra.ph/file/c798b3959f84d345b0f25.jpg'
  ];

  const packgirl = [
    'https://telegra.ph/file/c0da7289bee2d97048feb.jpg',
    'https://telegra.ph/file/b8564166f9cac4d843db3.jpg',
    'https://telegra.ph/file/fdefd621a17712be15e0e.jpg',
    'https://telegra.ph/file/6e1a6dcf1c91bf62d3945.jpg',
    'https://telegra.ph/file/0224c1ecf6b676dda3ac0.jpg',
    'https://telegra.ph/file/b71b8f04772f1b30355f1.jpg',
    'https://telegra.ph/file/6561840400444d2d27d0c.jpg',
    'https://telegra.ph/file/37e445df144e1dfcdb744.jpg',
    'https://telegra.ph/file/155b6ac6757bdd9cd05f9.jpg',
    'https://telegra.ph/file/2255a8a013540c2820a2b.jpg'
  ];

  const packmen = [
    'https://telegra.ph/file/bf303b19b9834f90e9617.jpg',
    'https://telegra.ph/file/36ef2b807251dfccd17c2.jpg',
    'https://telegra.ph/file/bcc34403d16de829ea5d2.jpg',
    'https://telegra.ph/file/5c6b7615662fb53a39e53.jpg',
    'https://telegra.ph/file/1a8183eff48671ea265c2.jpg',
    'https://telegra.ph/file/f9745dcd22f67cbc62e08.jpg',
    'https://telegra.ph/file/02219f503317b0596e101.jpg',
    'https://telegra.ph/file/470c8ec30400a73d03207.jpg',
    'https://telegra.ph/file/c94fa8ed20f2c0cf16786.jpg',
    'https://telegra.ph/file/1b02a1ca6a39e741faec7.jpg'
  ];

  const videosxxxc = [
    'https://telegra.ph/file/4a270d9945ac46f42d95c.mp4',
    'https://telegra.ph/file/958c11e84d271e783ea3f.mp4',
    'https://telegra.ph/file/f753759342337c4012b3f.mp4',
    'https://telegra.ph/file/379cee56c908dd536dd33.mp4',
    'https://telegra.ph/file/411d8f59a5cefc2a1d227.mp4',
    'https://telegra.ph/file/ee2cf1b359d6eef50d7b7.mp4',
    'https://telegra.ph/file/1e316b25c787f94a0f8fd.mp4',
    'https://telegra.ph/file/c229d33edce798cde0ca4.mp4',
    'https://telegra.ph/file/b44223e72dd7e80e415f2.mp4',
    'https://telegra.ph/file/61486d45a8a3ea95a7c86.mp4'
  ];

  const videosxxxc2 = [
    'https://l.top4top.io/m_2257y4pyl0.mp4',
    'https://c.top4top.io/m_2274woesg0.mp4',
    'https://k.top4top.io/m_2257pdwjy0.mp4',
    'https://a.top4top.io/m_2257qulmx0.mp4',
    'https://a.top4top.io/m_2257vxzr62.mp4',
    'https://b.top4top.io/m_2257wjmbh3.mp4',
    'https://b.top4top.io/m_2257sen2a1.mp4',
    'https://c.top4top.io/m_2257hpo9v3.mp4',
    'https://e.top4top.io/m_2257pye7u1.mp4',
    'https://c.top4top.io/m_2257p7xg14.mp4'
  ];

  switch (command) {
    case "pack":
      await sock.sendMessage(chatId, {
        image: { url: getRandom(pack) },
        caption: "🥵 Aquí tienes mi pack."
      }, { quoted: msg });
      break;

    case "pack2":
      await sock.sendMessage(chatId, {
        image: { url: getRandom(packgirl) },
        caption: "🥵 Pack girl activado."
      }, { quoted: msg });
      break;

    case "pack3":
      await sock.sendMessage(chatId, {
        image: { url: getRandom(packmen) },
        caption: "🥵 Pack men activado."
      }, { quoted: msg });
      break;

    case "pack4":
    case "girls":
      await sock.sendMessage(chatId, {
        image: { url: "https://delirius-api-oficial.vercel.app/api/girls" },
        caption: "🥵"
      }, { quoted: msg });
      break;

    case "videoxxx":
    case "vídeoxxx":
      await sock.sendMessage(chatId, {
        video: { url: getRandom(videosxxxc) },
        caption: `🥵 Disfrútalo...`,
        mimetype: "video/mp4"
      }, { quoted: msg });
      break;

    case "videoxxxlesbi":
    case "videolesbixxx":
    case "pornolesbivid":
    case "pornolesbianavid":
    case "pornolesbiv":
    case "pornolesbianav":
    case "pornolesv":
      await sock.sendMessage(chatId, {
        video: { url: getRandom(videosxxxc2) },
        caption: `🥵 Disfrútalo lesb...`,
        mimetype: "video/mp4"
      }, { quoted: msg });
      break;
  }
};

handler.command = [
  "pack", "pack2", "pack3", "pack4", "girls",
  "videoxxx", "vídeoxxx", "videoxxxlesbi", "videolesbixxx",
  "pornolesbivid", "pornolesbianavid", "pornolesbiv",
  "pornolesbianav", "pornolesv"
];

handler.tags = ["nsfw"];
handler.help = handler.command;
handler.register = true;
handler.limit = 2;

module.exports = handler;
