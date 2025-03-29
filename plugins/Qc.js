// EJEMPLO DE HANDLER MINIMALISTA PARA "qc"
// Sin banderas, ni formateos extra

const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions'); // Ajusta la ruta si es diferente

// Obtener el nombre de un JID usando conn.getName.
// Si no lo encuentra, devolvemos el número crudo sin "@s.whatsapp.net".
async function getNameOrNumber(jid, conn) {
  let name = '';
  try {
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }
    // Si sigue vacío, tomamos el número (parte antes de @)
    if (!name || !name.trim()) {
      name = jid.split('@')[0];
    }
  } catch (err) {
    console.log('Error en getNameOrNumber:', err);
    name = jid.split('@')[0];
  }
  return name;
}

const handler = async (msg, { conn, args }) => {
  try {
    // Info del mensaje citado
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage || null;

    // Determinar el JID objetivo
    let targetJid;

    if (quotedMsg) {
      // Revisamos si hay un participant distinto al que envía
      // (Muchas veces "context.participant" es quien escribió el msj original en grupos)
      // Si no te funciona, pon un console.log para ver realmente dónde llega el JID.
      const quotedFromMe = !!quotedMsg.key?.fromMe;
      if (!quotedFromMe && context?.participant) {
        targetJid = context.participant; 
      } else {
        // Si no existe o es del bot, fallback al que manda el comando
        targetJid = msg.key.participant || msg.key.remoteJid;
      }
    } else {
      // Sin mensaje citado, usamos el remitente
      targetJid = msg.key.participant || msg.key.remoteJid;
    }

    // Obtener el texto final
    let contenido = args.join(" ").trim();

    // Si no hay texto en el comando, pero sí hay mensaje citado, usamos el texto del citado
    if (!contenido && quotedMsg) {
      // Intentar extraer el texto del mensaje citado
      const tipo = Object.keys(quotedMsg)[0];
      contenido =
        quotedMsg[tipo]?.text ||
        quotedMsg[tipo]?.caption ||
        quotedMsg[tipo] ||
        '';
    }

    // Validar que haya algo de texto
    if (!contenido || !contenido.trim()) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg }
      );
    }

    // Límite de caracteres
    if (contenido.length > 35) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg }
      );
    }

    // Nombre y foto
    const targetName = await getNameOrNumber(targetJid, conn);
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      // Si falla, imagen por defecto
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Reacción de “procesando”
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    // Construir los datos para la API
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
          text: contenido,
          replyMessage: {}
        }
      ]
    };

    // Llamar a la API
    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Convertir la respuesta base64 a buffer
    const buffer = Buffer.from(res.data.result.image, 'base64');

    // Crear el sticker con metadatos
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar el sticker
    await conn.sendMessage(
      msg.key.remoteJid,
      { sticker: { url: sticker } },
      { quoted: msg }
    );

    // Reacción final
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (e) {
    console.error("❌ Error en qc:", e);
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: '❌ Ocurrió un error al generar el sticker.' },
      { quoted: msg }
    );
  }
};

handler.command = ['qc'];
module.exports = handler;
