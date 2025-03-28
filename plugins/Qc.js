const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // Asegúrate de tener esta función disponible

const handler = async (msg, { conn, text, args }) => {
  try {
    // Verificar si el mensaje está citando otro
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    const quotedJid = quoted?.participant;

    // Si se cita un mensaje, usar datos del citado
    let targetJid, targetName, targetPp;

    if (quotedJid) {
      targetJid = quotedJid;
      try {
        targetName = await conn.getName(quotedJid);
        targetPp = await conn.profilePictureUrl(quotedJid);
      } catch {
        targetName = targetJid.split('@')[0];
        targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }
    } else {
      // Si no se cita, usar datos del propio bot (remitente)
      targetJid = msg.key.remoteJid;
      const botNumber = conn.user?.id || conn.user?.jid || msg.key.participant || msg.key.remoteJid;
      try {
        targetName = await conn.getName(botNumber);
        targetPp = await conn.profilePictureUrl(botNumber);
      } catch {
        targetName = botNumber.split('@')[0];
        targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }
    }

    // Texto: ya sea de los args o del mensaje citado
    let contenido = args.join(" ").trim() || quotedMsg?.conversation?.trim();
    if (!contenido) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Escribe una palabra o cita un mensaje."
      }, { quoted: msg });
    }

    // Limpiar menciones
    const mentionRegex = new RegExp(`@${targetJid.split('@')[0].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*`, 'g');
    const textoLimpio = contenido.replace(mentionRegex, "").trim();

    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ El texto no puede tener más de 35 caracteres."
      }, { quoted: msg });
    }

    // Enviar reacción mientras se genera el sticker
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    // Datos para generar el quote
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

    const json = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el comando qc:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al generar el sticker."
    }, { quoted: msg });
  }
};

handler.command = ['qc'];
module.exports = handler;
