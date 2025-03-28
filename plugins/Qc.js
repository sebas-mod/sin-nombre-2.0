const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

const handler = async (msg, { conn, text, args }) => {
  conn.getName = async (jid) => {
    try {
      const contact = await conn.fetchStatus(jid).catch(() => null);
      if (contact && contact.status) return contact.status;
      const vcard = await conn.fetchBlocklist().catch(() => null);
      if (vcard && vcard.includes(jid)) return 'Usuario';
      return jid.split('@')[0];
    } catch {
      return jid.split('@')[0];
    }
  };

  try {
    const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targetJid = quotedJid || (msg.key.participant || msg.key.remoteJid);
    let targetName = await conn.getName(targetJid);
    if (!targetName || targetName === targetJid) targetName = targetJid.split('@')[0];

    const pp = await conn.profilePictureUrl(targetJid).catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');

    let contenido = "";
    if (args.length > 0 && args.join(" ").trim() !== "") {
      contenido = args.join(" ").trim();
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      contenido = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation.trim();
    } else {
      return await conn.sendMessage(msg.key.remoteJid, { text: "⚠️ Escribe una palabra o cita un mensaje." }, { quoted: msg });
    }

    const textoLimpio = contenido.replace(new RegExp(`@${targetJid.split('@')[0].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*`, 'g'), "").trim();

    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, { text: "⚠️ El texto no puede tener más de 35 caracteres." }, { quoted: msg });
    }

    await conn.sendMessage(msg.key.remoteJid, { react: { text: '🎨', key: msg.key } });

    const json = await axios.post('https://bot.lyo.su/quote/generate', {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 600,
      height: 900,
      scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: targetName,
          photo: { url: pp }
        },
        text: textoLimpio,
        replyMessage: {}
      }]
    }, { headers: { 'Content-Type': 'application/json' } });

    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(msg.key.remoteJid, { sticker: { url: sticker } }, { quoted: msg });
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
    
  } catch (err) {
    console.error("❌ Error en el comando qc:", err);
    await conn.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al generar el sticker." }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
