const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

/*==================================================
  FUNCIONES DE APOYO
==================================================*/
const banderaPorPrefijo = (numero) => {
  const prefijos = {
    '507': '🇵🇦',
    '503': '🇸🇻',
    '502': '🇬🇹',
    '504': '🇭🇳',
    '505': '🇳🇮',
    '506': '🇨🇷',
    '509': '🇭🇹',
    '51': '🇵🇪',
    '52': '🇲🇽',
    '53': '🇨🇺',
    '54': '🇦🇷',
    '55': '🇧🇷',
    '56': '🇨🇱',
    '57': '🇨🇴',
    '58': '🇻🇪',
    '1':  '🇺🇸'
  };
  const numeroSinArroba = numero.split('@')[0];
  let bandera = '';
  for (const pref of Object.keys(prefijos)) {
    if (numeroSinArroba.startsWith(pref)) {
      bandera = prefijos[pref];
      break;
    }
  }
  return bandera || '🌎';
};

const formatPhoneNumber = (jid) => {
  const number = jid.split('@')[0];
  const bandera = banderaPorPrefijo(jid);

  if (number.length === 12) {
    return `${bandera} +${number.slice(0, 3)} ${number.slice(3, 7)}-${number.slice(7)}`;
  } else if (number.length === 11) {
    return `${bandera} +${number.slice(0, 2)} ${number.slice(2, 6)}-${number.slice(6)}`;
  } else {
    return `${bandera} +${number}`;
  }
};

const getNombreBonito = async (jid, conn, fallbackPushName = '') => {
  if (!jid) return '???';
  try {
    let name = '';
    // 1) conn.getName primero
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }
    // 2) Si sigue vacío, intentamos con pushName
    if (!name || !name.trim() || name.includes('@')) {
      if (fallbackPushName && fallbackPushName.trim()) {
        name = fallbackPushName;
      }
    }
    // 3) Revisamos contactos de Baileys
    if (!name || !name.trim() || name.includes('@')) {
      const c = conn.contacts?.[jid] || {};
      const cName = c.name || c.notify || c.vname || '';
      if (cName && cName.trim() && !cName.includes('@')) {
        name = cName;
      }
    }
    // 4) Si nada funcionó, usamos número formateado
    if (!name || !name.trim() || name.includes('@')) {
      name = formatPhoneNumber(jid);
    }
    return name;
  } catch (err) {
    console.log("Error en getNombreBonito:", err);
    return formatPhoneNumber(jid);
  }
};

/*==================================================
  HANDLER PRINCIPAL
==================================================*/
const handler = async (msg, { conn, args }) => {
  try {
    // Para saber si lo envió el bot (fromMe = true)
    const isFromBot = !!msg.key.fromMe;
    // Este es el "pushName" que a veces Baileys adjunta
    const fallbackPushName = msg.pushName || '';

    // Contexto de mensaje citado
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage || null;

    //===============================================
    // OBTENER JID DEL USUARIO CITADO O EMISOR
    //===============================================
    let targetJid;
    
    if (quotedMsg) {
      // Si hay mensaje citado
      // 1. Tratamos de usar participant
      const qParticipant = context.participant; 
      // 2. Como segunda opción, remoteJid
      const qRemote = context.remoteJid;

      // A veces, participant = quien cita en vez del citado.  
      // Vamos a imprimir para debug (si quieres, coméntalo en producción):
      console.log('[DEBUG QUOTED]', {
        qParticipant,
        qRemote,
        messageSender: msg.key.participant
      });

      // Escogemos en orden:
      // - Preferimos qParticipant si existe y es distinto a msg.key.participant
      //   (porque en grupos, qParticipant normalmente es quien escribió el msg)
      // - Si no, probamos qRemote
      // - Si aún así no hay nada, fallback a msg.key.participant
      if (qParticipant && qParticipant !== msg.key.participant) {
        targetJid = qParticipant;
      } else if (qRemote && qRemote !== msg.key.participant) {
        targetJid = qRemote;
      } else {
        // De último, si no hay nada diferente, fallback
        targetJid = qParticipant || qRemote || msg.key.participant || msg.key.remoteJid;
      }
    } else {
      // SIN mensaje citado
      // En grupos: msg.key.participant = JID de quien lo mandó
      // En privado: msg.key.remoteJid = chat con la otra persona
      targetJid = msg.key.participant || msg.key.remoteJid;

      // Si es el bot mismo, en privado (fromMe = true), podríamos forzar algo distinto
      if (msg.key.remoteJid.endsWith('@s.whatsapp.net') && isFromBot) {
        // Por ejemplo, se asume que en un privado "bot" = "usuario"
        // O le pones un alias "Mi Bot"
        console.log("-> Comando desde bot en privado (fromMe)");
        // Forzar a usar el JID del bot
        // (depende de tu lógica; si lo dejas así, ‘targetJid’ = JID del bot)
        targetJid = conn.user?.jid || targetJid;
      }
    }

    //===============================================
    // OBTENER NOMBRE Y FOTO
    //===============================================
    const targetName = await getNombreBonito(targetJid, conn, fallbackPushName);

    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    //===============================================
    // OBTENER TEXTO FINAL
    //===============================================
    let contenido = args.join(" ").trim();

    // Si no se mandó texto en el comando, usar el texto del citado
    if (!contenido && quotedMsg) {
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text 
               || quotedMsg[tipo]?.caption 
               || quotedMsg[tipo] 
               || '';
    }

    // Validar si quedó vacío
    if (!contenido.trim()) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ Escribe algo o cita un mensaje para crear el sticker.' },
        { quoted: msg }
      );
    }

    // Límite de 35 caracteres
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg }
      );
    }

    // Reacción de “procesando”
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '🎨', key: msg.key }
    });

    //===============================================
    // GENERAR LA IMAGEN TIPO "QUOTE"
    //===============================================
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

    // Llamada a la API
    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    const buffer = Buffer.from(res.data.result.image, 'base64');

    // Crear sticker con exif (packname/author)
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar como sticker
    await conn.sendMessage(
      msg.key.remoteJid,
      { sticker: { url: sticker } },
      { quoted: msg }
    );

    // Reacción de finalizado
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
