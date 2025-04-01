// plugins2/menu.js
const handler = async (msg, { conn, usedPrefix }) => {
  const userId = msg.key.participant || msg.key.remoteJid;

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "📜", key: msg.key }
  });

 const menu = `
╭───〔 𝗔𝘇𝘂𝗿𝗮 𝗨𝗹𝘁𝗿𝗮 𝗦𝘂𝗯𝗯𝗼𝘁 〕───╮
│ Menú completo con comandos por categoría:
│
├─❖ *AI & Respuestas:*
│ • chatgpt - Pregunta a GPT-4
│ • geminis - Consulta a Gemini IA
│
├─❖ *Descargas:*
│ • play / playdoc 
│ • play2 
│ • ytmp3 / ytmp3doc 
│ • ytmp4 / ytmp4doc 
│ • apk 
│ • instagram / ig 
│ • tiktok / tt 
│
├─❖ *Stickers & Multimedia:*
│ • s 
│ • ver
│ • tts 
│
├─❖ *Grupos:*
│ • abrirgrupo 
│ • cerrargrupo 
│ • infogrupo 
│ • kick 
│
├─❖ *Usuarios:*
│ • perfil - Obtener foto de perfil
│ • tag - Reenviar algo mencionando a todos
│ • tagall / invocar / todos - Mencionar a todos
│ • addlista - Autorizar usuario privado
│ • dellista - Eliminar usuario autorizado
│
├─❖ *Configuración & Dueño:*
│ • setprefix - Cambiar prefijo del subbot
│ • creador - Ver contacto del creador
│ • get - Descargar estados
│ ° delgrupo - Eliminar grupo del subbot
│ ° addgrupo - Autorizar grupo al subbot
│ • pong - Medir latencia del bot
│
╰───『 © Azura Ultra Subbot 』───╯`;
conn.sendMessage(msg.from, { image: { url: `https://cdn.russellxz.click/73a12c4f.jpeg`}, caption: menu }, { quoted: msg })

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key }
  });
};


handler.command = ['menu', 'help', 'ayuda', 'comandos'];
module.exports = handler;
