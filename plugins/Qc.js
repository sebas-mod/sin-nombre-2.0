const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

//=================================================
// Funciones helper (banderas, formatear número, etc.)
//=================================================
const banderaPorPrefijo = (numero) => {
  const prefijos = {
    '507': '🇵🇦',
    '503': '🇸🇻',
    '502': '🇬🇹',
    '504': '🇭🇳',
    '505': '🇳🇮',
    '506': '🇨🇷',
    '509': '🇭🇹',
    '51':  '🇵🇪',
    '52':  '🇲🇽',
    '53':  '🇨🇺',
    '54':  '🇦🇷',
    '55':  '🇧🇷',
    '56':  '🇨🇱',
    '57':  '🇨🇴',
    '58':  '🇻🇪',
    '1':   '🇺🇸'
  };

  const numeroSinArroba = numero.split('@')[0];
  for (const pref of Object.keys(prefijos)) {
    if (numeroSinArroba.startsWith(pref)) {
      return prefijos[pref];
    }
  }
  return '🌎';
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

/**
 * Obtiene un nombre “bonito” con prioridad:
 * 1) conn.getName (Baileys)
 * 2) pushName (si lo pasamos como fallback)
 * 3) contactos (conn.contacts)
 * 4) número formateado
 */
const getNombreBonito = async (jid, conn, fallbackPushName = '') => {
  if (!jid) return '???';
  try {
    let name = '';

    // 1) conn.getName
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }

    // 2) Si sigue vacío, usar pushName
    if (!name || !name.trim() || name.includes('@')) {
      if (fallbackPushName && fallbackPushName.trim()) {
        name = fallbackPushName;
      }
    }

    // 3) Revisamos contactos
    if (!name || !name.trim() || name.includes('@')) {
      const c = conn.contacts?.[jid] || {};
      const cName = c.name || c.notify || c.vname || '';
      if (cName && cName.trim() && !cName.includes('@')) {
        name = cName;
      }
    }

    // 4) Si nada funcionó, número
    if (!name || !name.trim() || name.includes('@')) {
      name = formatPhoneNumber(jid);
    }

    return name;
  } catch (err) {
    console.log("Error en getNombreBonito:", err);
    return formatPhoneNumber(jid);
  }
};

//=================================================
// Handler principal
//=================================================
const handler = async (msg, { conn, args }) => {
  try {
    // Saber si es el bot (fromMe)
    const isFromBot = !!msg.key.fromMe;
    // pushName del emisor (Baileys MD suele ponerlo en msg)
    const fallbackPushName = msg.pushName || '';

    // Datos del mensaje citado
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = context?.quotedMessage || null;

    let targetJid = null;
    let textoCitado = '';

    if (quotedMsg) {
      // ============================
      // 1) OBTENER QUIÉN ES EL AUTOR DEL MENSAJE CITADO
      //    USANDO quotedMsg.key.participant
      // ============================
      const quotedParticipant = quotedMsg.key?.participant || null;
      const quotedFromMe = !!quotedMsg.key?.fromMe; // si el mensaje citado lo escribió el bot

      // Si existe quotedParticipant y no es del bot,
      // significa que es el usuario real que escribió ese mensaje.
      if (quotedParticipant && !quotedFromMe) {
        targetJid = quotedParticipant;
      } else {
        // A veces no está, o es del bot
        // Podemos intentar fallback a context.participant
        targetJid = context.participant || msg.key.participant || msg.key.remoteJid;
      }

      // ============================
      // 2) SACAR EL TEXTO DEL MENSAJE CITADO
      // ============================
      const tipo = Object.keys(quotedMsg)[0];
      textoCitado = quotedMsg[tipo]?.text
                 || quotedMsg[tipo]?.caption
                 || quotedMsg[tipo]
                 || '';
    }

    // Sin mensaje citado, o no sacamos un targetJid todavía
    if (!targetJid) {
      // En grupo: msg.key.participant es quien envía
      // En privado: msg.key.remoteJid es el chat
      targetJid = msg.key.participant || msg.key.remoteJid;

      // Si en privado fromMe es true, es el bot enviándose a sí mismo
      if (msg.key.remoteJid.endsWith('@s.whatsapp.net') && isFromBot) {
        // Puedes, por ejemplo, dejarlo así:
        targetJid = conn.user?.jid || targetJid;
      }
    }

    //============================
    // Obtener el texto final (del comando)
    //============================
    let contenido = args.join(" ").trim();
    if (!contenido) {
      // Si no hay texto en el comando y sí había mensaje citado, usa el texto citado
      contenido = textoCitado;
    }

    // Si de plano no hay nada
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

    //============================
    // NOMBRE Y FOTO DEL targetJid
    //============================
    const targetName = await getNombreBonito(targetJid, conn, fallbackPushName);

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

    //============================
    // Generar la “quote”
    //============================
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

    // Crear sticker con metadata
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Mandar sticker
    await conn.sendMessage(
      msg.key.remoteJid,
      { sticker: { url: sticker } },
      { quoted: msg }
    );

    // Reaccionar “finalizado”
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en qc:", err);
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: '❌ Ocurrió un error al generar el sticker.' },
      { quoted: msg }
    );
  }
};

handler.command = ['qc'];
module.exports = handler;
