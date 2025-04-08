const fs = require('fs');
const path = require('path');

const handler = async (msg, { conn, text, usedPrefix }) => {
  const chatId = msg.key.remoteJid;

  if (!chatId.endsWith('@g.us')) {
    return conn.sendMessage(chatId, {
      text: '❌ Este comando solo funciona en grupos.'
    }, { quoted: msg });
  }

  if (!text) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${usedPrefix}setwelcome* Hola, bienvenido a Azura Ultra.`
    }, { quoted: msg });
  }

  // Reacciona con reloj
  await conn.sendMessage(chatId, {
    react: { text: '⏳', key: msg.key }
  });

  try {
    const welcomeFile = path.resolve(__dirname, 'welcome.json');

    // Crear el archivo si no existe
    if (!fs.existsSync(welcomeFile)) fs.writeFileSync(welcomeFile, JSON.stringify({}, null, 2));

    const welcomeData = JSON.parse(fs.readFileSync(welcomeFile));
    welcomeData[chatId] = text;
    fs.writeFileSync(welcomeFile, JSON.stringify(welcomeData, null, 2));

    await conn.sendMessage(chatId, {
      text: `✅ Mensaje de bienvenida guardado:\n\n📝 *${text}*`
    }, { quoted: msg });

    await conn.sendMessage(chatId, {
      react: { text: '✅', key: msg.key }
    });

  } catch (error) {
    console.error('Error guardando welcome.json:', error);

    await conn.sendMessage(chatId, {
      text: '❌ Hubo un error al guardar el mensaje.'
    }, { quoted: msg });

    await conn.sendMessage(chatId, {
      react: { text: '❌', key: msg.key }
    });
  }
};

handler.command = ['setwelcome'];
module.exports = handler;
