const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const prefix = global.prefix;

  try {
    // Reacción
    await conn.sendMessage(chatId, { react: { text: "📋", key: msg.key } });

    // Imagen fija
    const imgUrl = 'https://cdn.russellxz.click/92980869.jpeg';

    // Texto del menú
    const texto = `╭──────>⋆☽⋆⋆☾⋆<──────╮
✰ 𝙁𝙍𝙀𝙀 𝙁𝙄𝙍𝙀 𝙈𝙀𝙉𝙐 ✰
╰──────>⋆☽⋆⋆☾⋆<──────╯

🍉 𝗠𝗔𝗣𝗔𝗦 🍉
🍉 ➺ *${prefix}mapas*

📃 𝗥𝗘𝗚𝗟𝗔𝗦 📃
🍉 ➺ *${prefix}reglas*
🍉 ➺ *${prefix}setreglas*

🛡️ 𝗟𝗜𝗦𝗧𝗔 𝗩𝗘𝗥𝗦𝗨𝗦 🥷🏻
🍉 ➺ *${prefix}4vs4*
🍉 ➺ *${prefix}6vs6*
🍉 ➺ *${prefix}12vs12*
🍉 ➺ *${prefix}16vs16*
🍉 ➺ *${prefix}20vs20*
🍉 ➺ *${prefix}24vs24*
🍉 ➺ *${prefix}guerr*`;

    // Enviar menú con imagen fija
    await conn.sendMessage(chatId, {
      image: { url: imgUrl },
      caption: texto
    }, { quoted: msg });

  } catch (err) {
    console.error("❌ Error en .menufree:", err);
    await conn.sendMessage(chatId, {
      text: "❌ No se pudo mostrar el menú."
    }, { quoted: msg });
  }
};

handler.command = ['menufree'];
module.exports = handler;
