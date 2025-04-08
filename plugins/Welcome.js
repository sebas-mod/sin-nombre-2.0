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

  await conn.sendMessage(chatId, {
    react: { text: '⏳', key: msg.key }
  });

  try {
    const filePath = path.resolve('./welcome.json');

    // Si no existe, crear archivo vacío
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }

    // Leer, editar y guardar
    const welcomeData = JSON.parse(fs.readFileSync(filePath));
    welcomeData[chatId] = text;

    fs.writeFileSync(filePath, JSON.stringify(welcomeData, null, 2));
    console.log("✅ welcome.json actualizado con:", welcomeData);

    await conn.sendMessage(chatId, {
      text: `✅ Mensaje de bienvenida guardado:\n\n📝 *${text}*`
    }, { quoted: msg });

    await conn.sendMessage(chatId, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error guardando welcome.json:", err);

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
