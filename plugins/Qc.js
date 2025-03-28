const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Sistema de banderas mejorado
const banderaPorPrefijo = (numero) => {
  const prefijos = {
    '507': '🇵🇦', '503': '🇸🇻', '502': '🇬🇹', '504': '🇭🇳',
    '505': '🇳🇮', '506': '🇨🇷', '509': '🇭🇹', '51': '🇵🇪',
    '52': '🇲🇽', '53': '🇨🇺', '54': '🇦🇷', '55': '🇧🇷',
    '56': '🇨🇱', '57': '🇨🇴', '58': '🇻🇪', '1': '🇺🇸'
  };
  const num = numero.split('@')[0];
  return prefijos[Object.keys(prefijos).sort((a,b) => b.length - a.length)
    .find(p => num.startsWith(p))] || '🌎';
};

// Formateo de número con bandera
const formatPhoneNumber = (jid) => {
  const number = jid.replace(/[^0-9]/g, '');
  const bandera = banderaPorPrefijo(number);
  
  const formatear = (start, ...cuts) => {
    let resultado = `${bandera} +${number.slice(0, start)}`;
    let prev = start;
    cuts.forEach(cut => {
      resultado += ` ${number.slice(prev, prev + cut)}`;
      prev += cut;
    });
    return resultado;
  };

  if (number.length === 12) return formatear(3, 4, 4); // +507 6123 4567
  if (number.length === 11) return formatear(2, 4, 5); // +1 2345 67890
  return `${bandera} +${number}`;
};

// Sistema de nombres optimizado
const getNombreBonito = async (jid, conn) => {
  try {
    let nombre = await conn.getName(jid).catch(() => '');
    if (nombre?.trim() && !nombre.includes('@')) return nombre;

    const contacto = conn.contacts?.[jid] || {};
    nombre = contacto.name || contacto.notify || contacto.vname || '';
    return nombre.trim() || formatPhoneNumber(jid);
  } catch {
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, args }) => {
  try {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const esGrupo = msg.key.remoteJid.endsWith('@g.us');

    // Lógica de citas corregida
    let jidObjetivo, contenido;
    if (ctx?.quotedMessage) {
      jidObjetivo = ctx.participant 
        ? ctx.participant.split('@')[0]  // Grupos: participante original
        : ctx.remoteJid.split('@')[0];  // Privados: remitente
      
      // Obtener texto citado
      const tipoMensaje = Object.keys(ctx.quotedMessage)[0];
      contenido = ctx.quotedMessage[tipoMensaje]?.text 
                || ctx.quotedMessage[tipoMensaje]?.caption 
                || '';
    } else {
      jidObjetivo = msg.key.fromMe 
        ? conn.user.id 
        : esGrupo
          ? msg.key.participant.split('@')[0]
          : msg.key.remoteJid.split('@')[0];
      contenido = args.join(" ").trim();
    }

    // Validaciones
    if (!contenido.trim()) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Escribe un texto o cita un mensaje',
        quoted: msg
      });
    }

    // Limpieza de texto
    const textoFinal = contenido.replace(/@\d+/g, '').trim().slice(0, 35);

    // Obtener metadatos
    const nombre = await getNombreBonito(jidObjetivo, conn);
    const foto = await conn.profilePictureUrl(jidObjetivo, 'image')
      .catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');

    // Generar sticker
    const { data } = await axios.post('https://bot.lyo.su/quote/generate', {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 600,
      height: 900,
      scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: nombre,
          photo: { url: foto }
        },
        text: textoFinal,
        replyMessage: {}
      }]
    });

    const sticker = await writeExifImg(Buffer.from(data.result.image, 'base64'), {
      packname: "Azura Ultra 2.0 Bot",
      author: "𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻"
    });

    await conn.sendMessage(msg.key.remoteJid, 
      { sticker: { url: sticker } }, 
      { quoted: msg }
    );

  } catch (e) {
    console.error("Error en qc:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ Error generando sticker',
      quoted: msg
    });
  }
};

handler.command = ['qc'];
module.exports = handler;
