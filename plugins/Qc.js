const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Bandera según prefijo
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
    '1': '🇺🇸'
  };
  const numeroSinArroba = numero.split('@')[0];
  let bandera = '';
  Object.keys(prefijos).forEach(pref => {
    if (numeroSinArroba.startsWith(pref)) {
      bandera = prefijos[pref];
    }
  });
  return bandera || '🌎';
};

// Formato bonito para número
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

// Obtener nombre real con preferencia a conn.getName
// Si no existe nombre público, se usa el número.
const getNombreBonito = async (jid, conn) => {
  try {
    let name = '';

    // 1) Intentar usar siempre conn.getName (Baileys)
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }

    // 2) Si sigue vacío, revisamos contactos
    if (!name || name.trim() === '' || name.includes('@')) {
      const contacto = conn.contacts?.[jid] || {};
      name = contacto.name || contacto.notify || contacto.vname || '';
    }

    // 3) Si de plano no hay nada, o está oculto, formateamos el número
    if (!name || name.trim() === '' || name.includes('@')) {
      name = formatPhoneNumber(jid);
    }

    return name;
  } catch (e) {
    console.log("Error obteniendo nombre:", e);
    // Fallback: número formateado
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, text, args }) => {
  try {
    // Info de mensaje citado
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quoted?.quotedMessage;
    const quotedJid = quoted?.participant;

    // Determinar el JID de quien generará el sticker
    let targetJid;

    if (quotedJid) {
      // Si se está citando a alguien
      targetJid = quotedJid;
    } else {
      // Sin cita: en grupos tomamos participant, en privado tomamos remoteJid
      targetJid = msg.key.participant || msg.key.remoteJid;
    }

    // Verificación extra para evitar confusiones si el bot y el usuario son el mismo.
    // (Esto depende de tu lógica, ajusta según necesidades)
    // Ejemplo: si en privado el remoteJid es el mismo que conn.user.id,
    // usaremos mejor msg.key.id o algo que no confunda. Pero normalmente no haría falta.
    if (targetJid === conn.user.jid) {
      // Si el comando viene de 'sí mismo' en privado, por ejemplo,
      // podrías forzar el sticker con el remitente original (msg.key.id, etc.)
      console.log("-> Es el mismo bot, ajustando target...");
      // Ajusta esta línea según tu preferencia. 
      // A veces se deja tal cual si no te afecta.
    }

    // Obtener el nombre con preferencia a getName
    const targetName = await getNombreBonito(targetJid, conn);

    // Obtener foto de perfil
    let targetPp;
    try {
      targetPp = await conn.profilePictureUrl(targetJid, 'image');
    } catch {
      targetPp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    }

    // Obtener el texto: si no hay args, lo tomamos del mensaje citado
    let contenido = args.join(" ").trim();
    if (!contenido && quotedMsg) {
      const tipo = Object.keys(quotedMsg)[0];
      contenido = quotedMsg[tipo]?.text 
               || quotedMsg[tipo]?.caption 
               || quotedMsg[tipo] 
               || '';
    }

    if (!contenido || contenido.trim() === '') {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ Escribe algo o cita un mensaje para convertirlo en sticker.' },
        { quoted: msg }
      );
    }

    // Límite de caracteres
    const textoLimpio = contenido.replace(/@[\d\-]+/g, '').trim();
    if (textoLimpio.length > 35) {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: '⚠️ El texto no puede tener más de 35 caracteres.' },
        { quoted: msg }
      );
    }

    // Reacción de "procesando"
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '🎨', key: msg.key } });

    // Datos para la API de quote
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

    // Petición a la API
    const res = await axios.post('https://bot.lyo.su/quote/generate', quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Pasar el base64 a buffer
    const buffer = Buffer.from(res.data.result.image, 'base64');

    // Agregar metadata para sticker
    const sticker = await writeExifImg(buffer, {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    // Enviar sticker
    await conn.sendMessage(
      msg.key.remoteJid,
      { sticker: { url: sticker } },
      { quoted: msg }
    );

    // Reacción de "finalizado"
    await conn.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (e) {
    console.error("❌ Error en el comando qc:", e);
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: '❌ Ocurrió un error al generar el sticker.' },
      { quoted: msg }
    );
  }
};

handler.command = ['qc'];
module.exports = handler;
