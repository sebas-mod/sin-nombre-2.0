const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');  // Ajusta tu ruta si es distinta

async function getNombreBonito(jid, conn) {
  if (!jid) return '???';
  try {
    const name = await conn.getName(jid);
    if (name && name.trim() && !name.includes('@')) {
      return name;
    }
    return jid.split('@')[0]; // fallback al número
  } catch (err) {
    return jid.split('@')[0];
  }
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId = msg.key.remoteJid;
    const isFromBot = !!msg.key.fromMe;

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage;

    let targetJid;
    let fallbackName;
    let textoCitado = '';

    if (quotedMsg && context?.participant) {
      // Si citas a alguien
      targetJid = context.participant;
      fallbackName = ''; // No usar tu nombre
      textoCitado = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
    } else {
      // Si no citas
      targetJid = msg.key.participant || msg.key.remoteJid;
      fallbackName = msg.pushName || '';
    }

    let contenido = args.join(' ').trim();
    if (!contenido) contenido = textoCitado;

    if (!contenido.trim()) {
      return await conn.sendMessage(chatId, {
        text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.'
      }, { quoted: msg });
    }

    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(chatId, {
        text: '⚠️ El texto no puede tener más de 35 caracteres.'
      }, { quoted: msg });
    }

    // Sacar el nombre bonito
    const targetName = await getNombreBonito(targetJid, conn) || fallbackName || targetJid.split('@')[0];

    // Sacar la foto de perfil
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // respaldo si no tiene foto
    }

    // Reacción de "procesando"
    await conn.sendMessage(chatId, {
      react: { text: '🎨', key: msg.key }
    });

    const quoteData = {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 600,
      height: 900,
      scale: 3,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: targetName,
            photo: { url: targetPp }
          },
          text: textoLimpio,
          replyMessage: {}
        }
      ]
    };

    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    const buffer = Buffer.from(res.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(chatId, {
      sticker: { url: sticker }
    }, { quoted: msg });

    await conn.sendMessage(chatId, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en qc:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ Error al generar el sticker.'
    }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
