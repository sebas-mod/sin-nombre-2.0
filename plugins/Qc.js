const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');   // ← ajusta la ruta si es distinta

/* ─────────────────────────────────────
   Obtiene un nombre “bonito” seguro
   ──────────────────────────────────── */
async function getNombreBonito(jid, conn) {
  if (!jid) return '???';
  try {
    // 1) intento directo via getName()
    let name = await (typeof conn.getName === 'function' ? conn.getName(jid) : '');
    // 2) contacto en caché
    if (!name || !name.trim() || name.includes('@')) {
      const contact = conn.contacts?.[jid];
      name = contact?.notify || '';
    }
    // 3) fallback: número limpio
    if (!name || !name.trim() || name.includes('@')) name = jid.split('@')[0];
    return name;
  } catch {
    return jid.split('@')[0];
  }
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId   = msg.key.remoteJid;
    const context  = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage;

    /* ── Datos base (cuando NO se cita) ── */
    let targetJid   = msg.key.participant || msg.key.remoteJid;
    let textoCitado = '';
    let fallbackName = msg.pushName || '';

    /* ── Si se citó un mensaje, usamos al otro usuario ── */
    if (quotedMsg && context?.participant) {
      targetJid    = context.participant;     // ← jid del mensaje citado
      fallbackName = '';                      // ← evitamos usar TU nombre por error
      textoCitado  = quotedMsg.conversation ||
                     quotedMsg.extendedTextMessage?.text || '';
    }

    /* ── Texto a poner en el sticker ── */
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

    /* ── Nombre y avatar del objetivo ── */
    const targetName = await getNombreBonito(targetJid, conn);
    let targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // respaldo
    try { targetPp = await conn.profilePictureUrl(targetJid, 'image'); } catch {}

    /* ── Feedback mientras procesa ── */
    await conn.sendMessage(chatId, { react: { text: '🎨', key: msg.key } });

    /* ── Payload para la API de quote ── */
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

    const res     = await axios.post(
                      'https://bot.lyo.su/quote/generate',
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
    console.error("❌ Error en qc:", err);
    await conn.sendMessage(msg.key.remoteJid,
      { text: '❌ Error al generar el sticker.' },
      { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
