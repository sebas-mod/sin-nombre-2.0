const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // ajusta la ruta

async function getNombreBonito(jid, conn, fallback = '') {
  if (!jid) return '???';
  try {
    let name = await conn.getName(jid);             // 1) getName()
    if (!name || /^\d+$/.test(name) || name.includes('@')) name = '';

    if (!name) {                                    // 2) caché local
      const c = conn.contacts?.[jid];
      name = c?.notify || c?.name || '';
    }
    if (!name) name = fallback;                     // 3) fallback externo
    if (!name) name = jid.split('@')[0];            // 4) número
    return name;
  } catch { return jid.split('@')[0]; }
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId   = msg.key.remoteJid;
    const ctx      = msg.message?.extendedTextMessage?.contextInfo;
    const quoted   = ctx?.quotedMessage;

    let targetJid    = msg.key.participant || msg.key.remoteJid;
    let textoCitado  = '';
    let fallbackName = msg.pushName || '';

    /*── Si citamos, cambiamos target y buscamos su 'notify' en el servidor ──*/
    if (quoted && ctx?.participant) {
      targetJid   = ctx.participant;
      textoCitado = quoted.conversation || quoted.extendedTextMessage?.text || '';

      // ⇩ Nueva línea: consulta en vivo para obtener el nick/notify
      try {
        const wa = await conn.onWhatsApp(targetJid);
        fallbackName = wa?.[0]?.notify || '';
      } catch { fallbackName = ''; }
    }

    let contenido = args.join(' ').trim() || textoCitado;
    if (!contenido.trim())
      return conn.sendMessage(chatId,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg });

    const limpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (limpio.length > 35)
      return conn.sendMessage(chatId,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg });

    const targetName = await getNombreBonito(targetJid, conn, fallbackName);

    let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    try { avatar = await conn.profilePictureUrl(targetJid, 'image'); } catch {}

    await conn.sendMessage(chatId, { react: { text: '🎨', key: msg.key } });

    const quoteData = {
      type: "quote", format: "png", backgroundColor: "#000000",
      width: 600, height: 900, scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: { id: 1, name: targetName, photo: { url: avatar } },
        text: limpio,
        replyMessage: {}
      }]
    };

    const { data } = await axios.post(
      'https://bot.lyo.su/quote/generate',
      quoteData,
      { headers: { 'Content-Type': 'application/json' } });

    const stickerBuf = Buffer.from(data.result.image, 'base64');
    const sticker    = await writeExifImg(stickerBuf, {
                       packname: 'Azura Ultra 2.0 Bot',
                       author:   '𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻'
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
