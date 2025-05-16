const fs = require('fs');

const handler = async (msg, { conn, isAdmin, isOwner }) => {
  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith('@g.us');

  if (isGroup && !isAdmin && !isOwner) {
    return conn.sendMessage(chatId, {
      text: '❌ Solo *admins* o *dueños* pueden usar este comando.'
    }, { quoted: msg });
  }

  if (!isGroup && !isOwner) {
    return conn.sendMessage(chatId, {
      text: '❌ Solo el *dueño* puede usar este comando en privado.'
    }, { quoted: msg });
  }

  const files = ['./antidelete.json', './antideletepri.json'];
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify({}, null, 2));
    }
  }

  await conn.sendMessage(chatId, {
    text: '✅ *Los registros del sistema antidelete fueron limpiados correctamente.*'
  }, { quoted: msg });
};

handler.command = ['limpiar'];
module.exports = handler;
