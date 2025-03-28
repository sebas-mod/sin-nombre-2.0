const axios = require('axios');
const { writeExifImg } = require('../libs/fuctions');

// Bandera según prefijo
const banderaPorPrefijo = (numero) => {
  const prefijos = {
    '507': '🇵🇦', '503': '🇸🇻', '502': '🇬🇹', '504': '🇭🇳',
    '505': '🇳🇮', '506': '🇨🇷', '509': '🇭🇹', '51': '🇵🇪',
    '52': '🇲🇽', '53': '🇨🇺', '54': '🇦🇷', '55': '🇧🇷',
    '56': '🇨🇱', '57': '🇨🇴', '58': '🇻🇪', '1': '🇺🇸'
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

// Obtener nombre real o, si no está público, el número bonito
const getNombreBonito = async (jid, conn) => {
  try {
    let name = '';
    // Intentar con getName (opción principal)
    if (typeof conn.getName === 'function') {
      name = await conn.getName(jid);
    }
    // Si no se obtuvo un nombre válido, revisa los contactos
    if (!name || name.trim() === '' || name.includes('@')) {
      const contacto = conn.contacts?.[jid] || {};
      name = contacto.pushname || contacto.name || contacto.notify || contacto.vname || '';
    }
    // Si sigue sin haber nombre, se formatea el número
    if (!name || name.trim() === '' || name.includes('@')) {
      return formatPhoneNumber(jid);
    }
    return name;
  } catch (e) {
    console.log("Error obteniendo nombre:", e);
    return formatPhoneNumber(jid);
  }
};

const handler = async (msg, { conn, text, args }) => {
  try {
    let textContent;
    if (args.length >= 1) {
      textContent = args.join(" ");
    } else if (msg.quoted && msg.quoted.text) {
      textContent = msg.quoted.text;
    } else {
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: "*⚠️ Y el texto?, Agregue un texto!*" },
        { quoted: msg }
      );
    }
    if (!textContent)
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: "*⚠️ Y el texto?, agregue un texto!*" },
        { quoted: msg }
      );

    const who =
      (msg.mentionedJid && msg.mentionedJid[0])
        ? msg.mentionedJid[0]
        : (msg.fromMe ? conn.user.jid : msg.sender);

    // Se remueve la mención del texto
    const mentionRegex = new RegExp(
      `@${who.split('@')[0].replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*`,
      'g'
    );
    const mishi = textContent.replace(mentionRegex, '');
    if (mishi.length > 35)
      return await conn.sendMessage(
        msg.key.remoteJid,
        { text: "*⚠️ El texto no puede tener mas de 35 caracteres*" },
        { quoted: msg }
      );

    const pp = await conn.profilePictureUrl(who).catch(
      (_) => 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
    );
    const nombre =
      (conn.contacts && conn.contacts[who] && (conn.contacts[who].pushname || conn.contacts[who].name))
        || msg.pushName || "Sin nombre";

    const obj = {
      "type": "quote",
      "format": "png",
      "backgroundColor": "#000000",
      "width": 512,
      "height": 768,
      "scale": 2,
      "messages": [{
        "entities": [],
        "avatar": true,
        "from": { "id": 1, "name": nombre, "photo": { url: pp } },
        "text": mishi,
        "replyMessage": {}
      }]
    };

    const json = await axios.post('https://bot.lyo.su/quote/generate', obj, {
      headers: { 'Content-Type': 'application/json' }
    });
    const buffer = Buffer.from(json.data.result.image, 'base64');
    let sticker = await conn.sendImageAsSticker(
      msg.chat,
      buffer,
      msg,
      {
        packname: global.packname,
        author: global.author,
        contextInfo: {
          'forwardingScore': 200,
          'isForwarded': false,
          externalAdReply: {
            showAdAttribution: false,
            title: global.botname,
            body: `h`,
            mediaType: 2,
            sourceUrl: global.n2,
            thumbnail: global.imagen1
          }
        }
      }
    );
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
