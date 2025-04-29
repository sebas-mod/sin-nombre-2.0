const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // ajusta la ruta

/*───────────────────────────────────────────────
  Mapa de prefijos → emoji de bandera
  (ordenado por longitud para matchear el más largo primero)
───────────────────────────────────────────────*/
const flagMap = [
  ['598', '🇺🇾'], ['595', '🇵🇾'], ['593', '🇪🇨'], ['591', '🇧🇴'],
  ['590', '🇧🇶'], ['509', '🇭🇹'], ['507', '🇵🇦'], ['506', '🇨🇷'],
  ['505', '🇳🇮'], ['504', '🇭🇳'], ['503', '🇸🇻'], ['502', '🇬🇹'],
  ['501', '🇧🇿'], ['599', '🇨🇼'], ['598', '🇺🇾'], ['597', '🇸🇷'],
  ['596', '🇬🇫'], ['594', '🇬🇫'], ['592', '🇬🇾'], ['591', '🇧🇴'],
  ['590', '🇬🇵'], ['549', '🇦🇷'], // móvil argentino “9” intermedio
  ['598', '🇺🇾'], // repetidos para seguridad
  ['598', '🇺🇾'],
  ['598', '🇺🇾'],
  ['598', '🇺🇾'],
  ['58',  '🇻🇪'], ['57',  '🇨🇴'], ['56',  '🇨🇱'], ['55',  '🇧🇷'],
  ['54',  '🇦🇷'], ['53',  '🇨🇺'], ['52',  '🇲🇽'], ['51',  '🇵🇪'],
  ['34',  '🇪🇸'], ['1',   '🇺🇸'] // EE. UU., PR y otros NANP
];

/*───────────────────────────────────────────────
  Devuelve número + bandera si existe mapeo
───────────────────────────────────────────────*/
function numberWithFlag(num) {
  const clean = num.replace(/[^0-9]/g, '');
  for (const [code, flag] of flagMap) {
    if (clean.startsWith(code)) return `${num} ${flag}`;
  }
  return num;
}

/*───────────────────────────────────────────────
  Extrae pushName del mensaje citado
───────────────────────────────────────────────*/
const quotedPush = q => (
  q?.pushName || q?.sender?.pushName || ''
);

/*───────────────────────────────────────────────*/
async function niceName(jid, conn, chatId, qPush, fallback = '') {
  // 0) pushName del citado
  if (qPush && qPush.trim() && !/^\d+$/.test(qPush)) return qPush;

  // 1) metadata de grupo
  if (chatId.endsWith('@g.us')) {
    try {
      const meta = await conn.groupMetadata(chatId);
      const p = meta.participants.find(p => p.id === jid);
      const n = p?.notify || p?.name;
      if (n && n.trim() && !/^\d+$/.test(n)) return n;
    } catch {}
  }

  // 2) getName()
  try {
    const g = await conn.getName(jid);
    if (g && g.trim() && !/^\d+$/.test(g) && !g.includes('@')) return g;
  } catch {}

  // 3) caché local
  const c = conn.contacts?.[jid];
  if (c?.notify && !/^\d+$/.test(c.notify)) return c.notify;
  if (c?.name   && !/^\d+$/.test(c.name))   return c.name;

  // 4) fallback (tu pushName en .qc hola)
  if (fallback && fallback.trim() && !/^\d+$/.test(fallback)) return fallback;

  // 5) número + bandera
  return numberWithFlag(jid.split('@')[0]);
}

/*───────────────────────────────────────────────
  Handler principal
───────────────────────────────────────────────*/
const handler = async (msg, { conn, args }) => {
  try {
    const chatId  = msg.key.remoteJid;
    const ctx     = msg.message?.extendedTextMessage?.contextInfo;
    const quoted  = ctx?.quotedMessage;

    let targetJid   = msg.key.participant || msg.key.remoteJid;
    let textQuoted  = '';
    let fallbackPN  = msg.pushName || '';
    let qPushName   = '';

    if (quoted && ctx?.participant) {
      targetJid  = ctx.participant;
      textQuoted = quoted.conversation ||
                   quoted.extendedTextMessage?.text || '';
      qPushName  = quotedPush(quoted);
      fallbackPN = ''; // no usar tu nombre en caso de cita
    }

    const content = (args.join(' ').trim() || textQuoted).trim();
    if (!content)
      return conn.sendMessage(chatId,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg });

    const plain = content.replace(/@[\d\-]+/g, '');
    if (plain.length > 35)
      return conn.sendMessage(chatId,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg });

    const displayName = await niceName(
      targetJid, conn, chatId, qPushName, fallbackPN
    );

    let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    try { avatar = await conn.profilePictureUrl(targetJid, 'image'); } catch {}

    await conn.sendMessage(chatId, { react: { text: '🎨', key: msg.key } });

    const quoteData = {
      type: 'quote', format: 'png', backgroundColor: '#000000',
      width: 600, height: 900, scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: { id: 1, name: displayName, photo: { url: avatar } },
        text: plain,
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

  } catch (e) {
    console.error('❌ Error en qc:', e);
    await conn.sendMessage(msg.key.remoteJid,
      { text: '❌ Error al generar el sticker.' },
      { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
