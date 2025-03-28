const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

const handler = async (msg, { conn, args }) => {
  try {
    // Determinar si hay mensaje citado y obtener el JID objetivo
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const targetJid = quotedJid || senderJid;

    // Obtener el nombre del usuario objetivo
    let targetName = "";
    if (quotedJid) {
      if (typeof conn.getName === 'function') {
        targetName = await conn.getName(quotedJid);
      }
      if (!targetName && conn.contacts && conn.contacts[quotedJid]) {
        targetName = conn.contacts[quotedJid].notify ||
                     conn.contacts[quotedJid].vname ||
                     conn.contacts[quotedJid].name ||
                     "";
      }
      if (!targetName || targetName.trim() === "" || targetName === "Sin nombre") {
        targetName = quotedJid.split('@')[0];
      }
    } else {
      targetName = msg.pushName || "";
      if (!targetName || targetName.trim() === "" || targetName === "Sin nombre") {
        targetName = senderJid.split('@')[0];
      }
    }

    // Obtener avatar con fallback por defecto
    const pp = await conn.profilePictureUrl(targetJid).catch(() =>
      'https://telegra.ph/file/24fa902ead26340f3df2c.png'
    );

    // Obtener el contenido del texto (ya sea en args o del mensaje citado)
    let contenido = "";
    if (args.length > 0 && args.join(" ").trim() !== "") {
      contenido = args.join(" ").trim();
    } else if (quotedMsg && quotedMsg.conversation) {
      contenido = quotedMsg.conversation.trim();
    } else {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Escribe una palabra o cita un mensaje."
      }, { quoted: msg });
    }

    // Remover menciones del contenido (si existen)
    const mentionRegex = new RegExp(`@${targetJid.split('@')[0].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*`, 'g');
    const textoLimpio = contenido.replace(mentionRegex, "").trim();

    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ El texto no puede tener más de 35 caracteres."
      }, { quoted: msg });
    }

    // Enviar reacción mientras se genera el sticker
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '🎨', key: msg.key } });

    // Construir la data para el quote
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
            photo: { url: pp }
          },
          text: textoLimpio,
          replyMessage: {}
        }
      ]
    };

    const { data } = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    const sticker = await writeExifImg(Buffer.from(data.result.image, 'base64'), {
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
