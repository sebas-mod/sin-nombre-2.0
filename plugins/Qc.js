const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // ⇦ ajusta la ruta si la tienes en otro lado

// ──────────────────────────────────────────
// Utilidad: obtiene un nombre “bonito” seguro
// ──────────────────────────────────────────
async function getDisplayName(jid, conn) {
  if (!jid) return '???';
  try {
    // 1) intento directo
    const name = await conn.getName(jid);
    if (name && name.trim() && !name.includes('@')) return name;

    // 2) contacto en caché
    const contact = conn.contacts?.[jid] || {};
    if (contact.notify) return contact.notify;

    // 3) fallback: número “puro”
    return jid.split('@')[0];
  } catch {
    return jid.split('@')[0];
  }
}

// ──────────────────────────────────────────
// Handler principal
// ──────────────────────────────────────────
const handler = async (m, { conn, args }) => {
  try {
    const chatId   = m.chat;
    const isQuoted = !!m.quoted;

    /* ─── Datos por defecto (cuando NO se cita) ─── */
    let targetJid    = m.sender;
    let fallbackName = m.pushName || '';
    let contenido    = args.join(' ').trim();

    /* ─── Si se citó un mensaje, reasignamos todo ─── */
    if (isQuoted) {
      const q = await m.getQuotedObj();                 // ← asegura el objeto completo
      targetJid    = q.sender || q.key?.participant || q.key?.remoteJid;
      fallbackName = q.pushName || fallbackName;
      if (!contenido) contenido = q.text || '';
    }

    /* ─── Validaciones del texto ─── */
    if (!contenido.trim()) {
      return conn.sendMessage(chatId, { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' }, { quoted: m });
    }

    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return conn.sendMessage(chatId, { text: '⚠️ El texto no puede tener más de 35 caracteres.' }, { quoted: m });
    }

    /* ─── Nombre y avatar del objetivo ─── */
    const displayName = await getDisplayName(targetJid, conn);
    let avatarUrl;
    try {
      avatarUrl = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // imagen de respaldo
    }

    /* ─── Feedback de “procesando” ─── */
    await conn.sendMessage(chatId, { react: { text: '🎨', key: m.key } });

    /* ─── Armamos el payload para el generador de quotes ─── */
    const quotePayload = {
      type: 'quote',
      format: 'png',
      backgroundColor: '#000000',
      width: 600,
      height: 900,
      scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: displayName,
          photo: { url: avatarUrl }
        },
        text: textoLimpio,
        replyMessage: {}
      }]
    };

    /* ─── Generamos la imagen y la convertimos en sticker ─── */
    const { data } = await axios.post(
      'https://bot.lyo.su/quote/generate',
      quotePayload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const buffer      = Buffer.from(data.result.image, 'base64');
    const stickerPath = await writeExifImg(buffer, {
      packname: 'Azura Ultra 2.0 Bot',
      author:   '𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻'
    });

    await conn.sendMessage(chatId, { sticker: { url: stickerPath } }, { quoted: m });
    await conn.sendMessage(chatId, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error('❌ Error en qc:', err);
    await conn.sendMessage(m.chat, { text: '❌ Error al generar el sticker.' }, { quoted: m });
  }
};

handler.command = ['qc'];
module.exports = handler;
