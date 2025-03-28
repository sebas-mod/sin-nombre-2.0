const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // Asegúrate de que esta función esté disponible

const handler = async (msg, { conn, text, args }) => {
  try {
    // Si se cita un mensaje, se recoge el JID del remitente citado
    const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
    // Si no hay mensaje citado, usamos al remitente actual (participante en grupo o remoto en privado)
    const senderJid = msg.key.participant || msg.key.remoteJid;
    // Elegimos cuál JID usar
    const targetJid = quotedJid || senderJid;

    // --- OBTENCIÓN DEL NOMBRE ---
    let targetName = "";

    // 1) Intentar primero con conn.getName (si existe)
    if (typeof conn.getName === 'function') {
      targetName = await conn.getName(targetJid);
    }

    // 2) Si seguimos sin nombre o nos devolvió exactamente el JID (típico en algunos casos),
    //    vamos a intentar usar la info de "conn.contacts" como fallback.
    if (
      !targetName ||
      targetName.trim() === "" ||
      targetName === targetJid
    ) {
      const contactData = conn.contacts[targetJid] || {};
      targetName =
        contactData.name ||
        contactData.notify ||
        contactData.vname ||
        targetJid.split('@')[0];
    }

    // 3) Si aún así quedó vacío, forzamos al menos el número
    if (!targetName || targetName.trim() === "") {
      targetName = targetJid.split('@')[0];
    }

    // Obtener la foto de perfil (avatar) con fallback
    const pp = await conn.profilePictureUrl(targetJid).catch(
      () => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
    );

    // Obtener el contenido del texto (ya sea mediante argumentos o del mensaje citado)
    let contenido = "";
    if (args.length > 0 && args.join(" ").trim() !== "") {
      contenido = args.join(" ").trim();
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
      contenido = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation.trim();
    } else {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Escribe una palabra o cita un mensaje."
      }, { quoted: msg });
    }

    // Remover menciones (si existieran) del contenido
    const mentionRegex = new RegExp(
      `@${targetJid.split('@')[0].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*`,
      'g'
    );
    const textoLimpio = contenido.replace(mentionRegex, "").trim();

    // Limite de 35 caracteres
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ El texto no puede tener más de 35 caracteres."
      }, { quoted: msg });
    }

    // Construir los parámetros para generar el sticker con quote
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

    // Generar la imagen usando el servicio de quote
    const json = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Convertir a Buffer y luego a sticker con metadatos
    const buffer = Buffer.from(json.data.result.image, 'base64');
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar sticker
    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    // Enviar reacción de confirmación
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
