const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // ajusta la ruta si cambia

/*────────────────────────────────────
  Obtiene un nombre “bonito” (contacto,
  notify, nombre de participante, push)
  ────────────────────────────────────*/
async function resolveName(jid, conn, chatId, fallback = '') {
  try {
    // 1) getName() de Baileys
    let name = await conn.getName(jid);
    if (name && name.trim() && !name.includes('@')) return name;

    // 2) contacto en caché
    const c = conn.contacts?.[jid];
    if (c?.notify) return c.notify;

    // 3) metadata de grupo ⇒ participants[].name / notify
    if (chatId.endsWith('@g.us')) {
      try {
        const meta = await conn.groupMetadata(chatId);
        const p = meta.participants.find(p => p.id === jid);
        if (p?.name)   return p.name;
        if (p?.notify) return p.notify;
      } catch {/* ignorar */}
    }

    // 4) pushName que recibimos
    if (fallback && fallback.trim() && !fallback.includes('@')) return fallback;

  } catch {/* ignorar absolutamente todo */}
  // 5) número si todo falla
  return jid.split('@')[0];
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId  = msg.key.remoteJid;
    const ctx     = msg.message?.extendedTextMessage?.contextInfo;
    const quoted  = ctx?.quotedMessage;

    /* ── Definir objetivo y texto ── */
    let targetJid    = msg.key.participant || msg.key.remoteJid;
    let fallbackName = msg.pushName || '';
    let textoCitado  = '';

    if (quoted && ctx?.participant) {
      targetJid    = ctx.participant;                     // usuario citado
      fallbackName = '';                                  // evita tu propio nombre
      textoCitado  = quoted.conversation ||
                     quoted.extendedTextMessage?.text || '';
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

    /* ── Nombre y avatar del target ── */
    const targetName = await resolveName(targetJid, conn, chatId, fallbackName);

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
      { headers: { 'Content-Type': 'application/json' } }
    );

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
