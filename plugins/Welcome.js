const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, text, usedPrefix }) => {
  const chatId = msg.key.remoteJid;

  if (!chatId.endsWith("@g.us")) {
    return await conn.sendMessage(chatId, {
      text: "❌ Este comando solo puede usarse en grupos."
    }, { quoted: msg });
  }

  if (!text) {
    return await conn.sendMessage(chatId, {
      text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${usedPrefix}setwelcome* Hola, bienvenido al grupo Azura Ultra.`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    react: { text: "⏳", key: msg.key }
  });

  try {
    const filePath = path.join(__dirname, "welcome.json");
    let welcomeData = {};

    // Crear el archivo si no existe
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }

    // Leer y actualizar
    welcomeData = JSON.parse(fs.readFileSync(filePath));
    welcomeData[chatId] = text;
    fs.writeFileSync(filePath, JSON.stringify(welcomeData, null, 2));

    await conn.sendMessage(chatId, {
      text: `✅ Mensaje de bienvenida personalizado guardado:\n\n📝 *${text}*`
    }, { quoted: msg });

    await conn.sendMessage(chatId, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error al guardar bienvenida:", err);

    await conn.sendMessage(chatId, {
      text: "❌ Hubo un error al guardar el mensaje de bienvenida."
    }, { quoted: msg });

    await conn.sendMessage(chatId, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['setwelcome'];
module.exports = handler;
