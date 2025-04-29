const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // ajusta la ruta

/* ─────────────────────────────────────────
   Intenta extraer pushName del mensaje citado
   ───────────────────────────────────────── */
function getQuotedPushName(quoted) {
  return (
    quoted?.pushName ||                       // Baileys >6.5
    quoted?.sender?.pushName ||               // por si viene anidado
    quoted?.key?.pushName || ''               // rarísimo, pero por si acaso
  );
}

/**
 * Devuelve un nombre “bonito”:
 *  - pushName de mensaje citado (ya viene limpio)  ← NUEVO
 *  - groupMetadata (notify / name)
 *  - conn.getName()
 *  - contactos en caché
 *  - fallback explícito
 *  - número
 */
async function getNombreBonito(jid, conn, chatId = '', fallback = '', quotedPush = '') {
  // 0) el pushName extraído es lo mejor que existe
  if (quotedPush && quotedPush.trim() && !/^\d+$/.test(quotedPush))
    return quotedPush;

  // 1) metadata del grupo
  if (chatId.endsWith('@g.us')) {
    try {
      const meta = await conn.groupMetadata(chatId);
      const p = meta.participants.find(p => p.id === jid);
      const n = p?.notify || p?.name;
      if (n && n.trim() && !/^\d+$/.test(n)) return n;
    } catch {/* ignorar */}
  }

  // 2) getName()
  try {
    const gName = await conn.getName(jid);
    if (gName && gName.trim() && !/^\d+$/.test(gName) && !gName.includes('@'))
      return gName;
  } catch {/* nada */ }

  // 3) caché de contactos
  const c = conn.contacts?.[jid];
  if (c?.notify && !/^\d+$/.test(c.notify)) return c.notify;
  if (c?.name   && !/^\d+$/.test(c.name))   return c.name;

  // 4) fallback externo (pushName propio en .qc hola)
  if (fallback && fallback.trim() && !/^\d+$/.test(fallback))
    return fallback;

  // 5) número puro
  return jid.split('@')[0];
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId  = msg.key.remoteJid;
    const ctx     = msg.message?.extendedTextMessage?.contextInfo;
    const quoted  = ctx?.quotedMessage;

    let targetJid    = msg.key.participant || msg.key.remoteJid;
    let textoCitado  = '';
    let fallbackName = msg.pushName || '';
    let quotedPush   = '';

    // ── Si citamos, cambia el objetivo ──
    if (quoted && ctx?.participant) {
      targetJid   = ctx.participant;
      textoCitado = quoted.conversation ||
                    quoted.extendedTextMessage?.text || '';

      // nuevo: pushName que viene dentro del mensaje citado
      quotedPush  = getQuotedPushName(quoted);

      /* Si no hay push en el citado, dejamos fallbackName vacío
         para evitar confusión con tu propio nombre. */
      if (quotedPush) fallbackName = '';
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

    // nombre y foto
    const targetName = await getNombreBonito(
      targetJid, conn, chatId, fallbackName, quotedPush
    );

    let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    try { avatar = await conn.profilePictureUrl(targetJid, 'image'); } catch {}

    await conn.sendMessage(chatId, { react: { text: '🎨', key: msg.key } });

    const quoteData = {
      type: 'quote',
      format: 'png',
      backgroundColor: '#000000',
      width: 600,
      height: 900,
      scale: 3,
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
