const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// (banderaPorPrefijo, formatPhoneNumber, getNombreBonito)
// aquí van tus funciones de siempre...
// ========================================

const handler = async (msg, { conn, args }) => {
  try {
    // DEBUG: Imprime datos para ver dónde sale el autor real
    console.log('-- msg completo --');
    console.log(JSON.stringify(msg, null, 2));

    // Determinar si el mensaje es del bot
    const isFromBot = !!msg.key.fromMe;

    // Leer contextInfo para ver el mensaje citado
    const context = msg.message?.extendedTextMessage?.contextInfo;
    console.log('-- contextInfo --');
    console.log(JSON.stringify(context, null, 2));

    const quotedMsg = context?.quotedMessage;
    if (quotedMsg) {
      console.log('-- quotedMessage --');
      console.log(JSON.stringify(quotedMsg, null, 2));
      console.log('-- quotedMsg.key --');
      console.log(JSON.stringify(quotedMsg.key, null, 2));
    }

    // Determinar JID de la persona a quien se le creará el sticker
    let targetJid;

    if (quotedMsg) {
      // 1. Checar si hay un "quotedMsg.key.participant" (o sender)
      const quotedParticipant = quotedMsg.key?.participant;     // <--- REVISAR si te sale
      const quotedSender      = quotedMsg.key?.sender;          // <--- REVISAR si existe
      const quotedFromMe      = !!quotedMsg.key?.fromMe;
      console.log('quotedParticipant:', quotedParticipant);
      console.log('quotedSender     :', quotedSender);
      console.log('quotedFromMe     :', quotedFromMe);

      // 2. Si no es del bot, asumimos que "quotedParticipant" es el autor real
      if (quotedParticipant && !quotedFromMe) {
        targetJid = quotedParticipant;
      } 
      // SI NO, prueba con "quotedSender" si existe
      else if (quotedSender && !quotedFromMe) {
        targetJid = quotedSender;
      } 
      // Sino, fallback a context?.participant
      else {
        // A veces context.participant = autor del msg
        // O a veces sale en context.remoteJid
        targetJid = context?.participant || context?.remoteJid;
      }
    }

    // Si no hubo quotedMsg (no se citó nada)
    if (!targetJid) {
      // fallback normal
      targetJid = msg.key.participant || msg.key.remoteJid;
    }

    // En privado, si fromMe es true, es el bot
    // y tal vez quieras forzar un alias
    if (msg.key.remoteJid.endsWith('@s.whatsapp.net') && isFromBot) {
      // Podrías forzar
      // targetJid = conn.user.jid;
      // O dejarlo tal cual si no te importa
    }

    // === Obtener el texto (args o texto del citado)
    let contenido = args.join(' ').trim();
    if (!contenido && quotedMsg) {
      // Si no hay texto en comando, usa el contenido del msg citado
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text 
               || quotedMsg[tipo]?.caption 
               || quotedMsg[tipo]
               || '';
    }

    if (!contenido.trim()) {
      return conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg }
      );
    }

    // Limitar a 35 chars
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg }
      );
    }

    // Nombre y foto
    const targetName = await getNombreBonito(targetJid, conn);
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Reaccionar “procesando”
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    // Construir quoteData
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

    // Llamar a la API
    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });
    const buffer = Buffer.from(res.data.result.image, 'base64');

    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar
    await conn.sendMessage(msg.key.remoteJid, {
      sticker: { url: sticker }
    }, { quoted: msg });

    // Reaccionar “finalizado”
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error('❌ Error en qc:', err);
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: '❌ Error al generar el sticker.' },
      { quoted: msg }
    );
  }
};

handler.command = ['qc'];
module.exports = handler;
