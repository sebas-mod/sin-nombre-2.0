const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // Asegúrate de tener esta función disponible

const handler = async (msg, { conn, text, args }) => {
  try {
    // Obtener información del mensaje citado, si existe
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    const quotedJid = quoted?.participant;

    // Determinar el JID objetivo: el del citado si existe, o el del remitente
    const targetJid = quotedJid || msg.key.participant || msg.key.remoteJid;

    // Obtener el nombre del usuario objetivo
    let targetName = "";
    try {
      if (typeof conn.getName === "function") {
        targetName = await conn.getName(targetJid);
      } else {
        const contact = conn.contacts?.[targetJid] || {};
        targetName = contact.notify || contact.vname || contact.name || targetJid;
      }
    } catch (e) {
      targetName = targetJid;
    }

    // Si el nombre está vacío o contiene "@", usar el número
    if (!targetName || targetName.trim() === "" || targetName.includes('@')) {
      targetName = targetJid.split('@')[0];
    }

    // Obtener la foto de perfil del usuario objetivo
    let pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // URL de imagen por defecto
    try {
      pp = await conn.profilePictureUrl(targetJid);
    } catch {}

    // Obtener el contenido del texto: de los argumentos o del mensaje citado
    let contenido = args.join(" ").trim() || quotedMsg?.conversation?.trim();
    if (!contenido) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Escribe una palabra o cita un mensaje."
      }, { quoted: msg });
    }

    // Remover menciones del contenido
    const mentionRegex = new RegExp(`@${targetJid.split('@')[0].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*`, 'g');
    const textoLimpio = contenido.replace(mentionRegex, "").trim();

    // Verificar la longitud del texto
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ El texto no puede tener más de 35 caracteres."
      }, { quoted: msg });
    }

    // Construir la data para el quote con dimensiones aumentadas
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

    // Enviar reacción mientras se genera el sticker
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    // Generar la imagen del quote
    const json = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Convertir la imagen a buffer y agregar metadata de sticker
    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar el sticker generado
    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    // Enviar reacción de éxito
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
