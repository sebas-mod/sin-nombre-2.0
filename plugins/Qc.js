const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');   // ajusta si es otra ruta

//───────────────────────────────────────────────
async function getNombreBonito(jid, conn, fallbackPushName = '') {
  if (!jid) return '???';
  try {
    let name = '';

    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }

    /* 🆕 descartar strings que sean solo dígitos */
    if (!name || !name.trim() || name.includes('@') || /^\d+$/.test(name)) {
      name = fallbackPushName;
    }

    if (!name || !name.trim() || name.includes('@') || /^\d+$/.test(name)) {
      /* 🆕 probar la libreta interna */
      const c = conn.contacts?.[jid];
      name = c?.notify || c?.name || '';
    }

    if (!name || !name.trim() || name.includes('@') || /^\d+$/.test(name)) {
      name = jid.split('@')[0];
    }

    return name;

  } catch {
    return jid.split('@')[0];
  }
}
//───────────────────────────────────────────────
const handler = async (msg, { conn, args }) => {
  try {
    const chatId   = msg.key.remoteJid;
    const context  = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage;

    let targetJid    = null;
    let fallbackName = msg.pushName || '';
    let textoCitado  = '';

    if (quotedMsg && context?.participant) {
      targetJid    = context.participant;
      textoCitado  = quotedMsg.conversation ||
                     quotedMsg.extendedTextMessage?.text || '';

      /* 🆕 fallback = notify del citado si existe */
      const c = conn.contacts?.[targetJid];
      fallbackName = c?.notify || c?.name || '';
    }

    if (!targetJid) {
      targetJid = msg.key.participant || msg.key.remoteJid;
    }

    let contenido = args.join(' ').trim();
    if (!contenido) contenido = textoCitado;

    if (!contenido.trim()) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg });
    }

    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return conn.sendMessage(chatId,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg });
    }

    // nombre y foto
    const targetName = await getNombreBonito(targetJid, conn, fallbackName);

    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    await conn.sendMessage(chatId, { react: { text: '🎨', key: msg.key } });

    const quoteData = {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 600,
      height: 900,
      scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: { id: 1, name: targetName, photo: { url: targetPp } },
        text: textoLimpio,
        replyMessage: {}
      }]
    };

    const res     = await axios.post('https://bot.lyo.su/quote/generate',
                                     quoteData,
                                     { headers: { 'Content-Type': 'application/json' } });
    const buffer  = Buffer.from(res.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
                      packname: "Azura Ultra 2.0 Bot",
                      author:   "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
                    });

    await conn.sendMessage(chatId, { sticker: { url: sticker } }, { quoted: msg });
    await conn.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ Error en qc:', err);
    await conn.sendMessage(msg.key.remoteJid,
      { text: '❌ Error al generar el sticker.' },
      { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
