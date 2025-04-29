const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // ajusta la ruta

/*────────────────────────────────────
  Obtiene un nombre “bonito”
  ───────────────────────────────────*/
async function resolveName(jid, conn, fallback = '') {
  try {
    // 1) getName() (trae push / contacto)
    let name = await conn.getName(jid);
    if (name && name.trim() && !name.includes('@')) return name;

    // 2) Libreta interna
    const c = conn.contacts?.[jid];
    if (c?.notify) return c.notify;
    if (c?.name)   return c.name;

    // 3) Fallback que le pasamos
    if (fallback && fallback.trim() && !fallback.includes('@')) return fallback;

  } catch {/* ignorar */}
  // 4) Último recurso: número
  return jid.split('@')[0];
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId  = msg.key.remoteJid;
    const ctx     = msg.message?.extendedTextMessage?.contextInfo;
    const quoted  = ctx?.quotedMessage;

    /* ── Definir objetivo y texto ── */
    let targetJid    = msg.key.participant || msg.key.remoteJid;
    let textoCitado  = '';
    let fallbackName = msg.pushName || '';

    if (quoted && ctx?.participant) {
      targetJid    = ctx.participant;               // usuario citado
      textoCitado  = quoted.conversation ||
                     quoted.extendedTextMessage?.text || '';
      // ← intentar sacar su "notify" de contactos
      fallbackName = conn.contacts?.[targetJid]?.notify ||
                     conn.contacts?.[targetJid]?.name   || '';
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

    /* ── Nombre y avatar ── */
    const targetName = await resolveName(targetJid, conn, fallbackName);

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
