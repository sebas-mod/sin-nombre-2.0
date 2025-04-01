// plugins2/menu.js
const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn }) => {
  const rawID = conn.user?.id || "";
  const subbotID = rawID.split(":" )[0] + "@s.whatsapp.net";

  const prefixPath = path.resolve("prefixes.json");
  let prefixes = {};
  if (fs.existsSync(prefixPath)) {
    prefixes = JSON.parse(fs.readFileSync(prefixPath, "utf-8"));
  }
  const usedPrefix = prefixes[subbotID] || ".";
  const userId = msg.key.participant || msg.key.remoteJid;

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "📜", key: msg.key }
  });

  const menu = `
╭───〔 𝗔𝘇𝘂𝗿𝗮 𝗨𝗹𝘁𝗿𝗮 𝗦𝘂𝗯𝗯𝗼𝘁 〕───╮
│ Menú completo con comandos por categoría:
│
├─❖ *AI & Respuestas:*
│ • ${usedPrefix}chatgpt - Pregunta a GPT-4
│ • ${usedPrefix}geminis - Consulta a Gemini IA
│
├─❖ *Descargas:*
│ • ${usedPrefix}play / ${usedPrefix}playdoc
│ • ${usedPrefix}play2 
│ • ${usedPrefix}ytmp3 / ${usedPrefix}ytmp3doc 
│ • ${usedPrefix}ytmp4 / ${usedPrefix}ytmp4doc
│ • ${usedPrefix}apk
│ • ${usedPrefix}instagram / ${usedPrefix}ig
│ • ${usedPrefix}tiktok / ${usedPrefix}tt
│
├─❖ *Stickers & Multimedia:*
│ • ${usedPrefix}s 
│ • ${usedPrefix}ver
│ • ${usedPrefix}tts
│
├─❖ *Grupos:*
│ • ${usedPrefix}abrirgrupo
│ • ${usedPrefix}cerrargrupo
│ • ${usedPrefix}infogrupo
│ • ${usedPrefix}kick
│
├─❖ *Usuarios:*
│ • ${usedPrefix}perfil - Obtener foto de perfil
│ • ${usedPrefix}tag - Reenviar mensaje mencionando a todos
│ • ${usedPrefix}tagall / ${usedPrefix}invocar / ${usedPrefix}todos - Mencionar a todos
│
├─❖ *Configuración & Dueño:*
│ • ${usedPrefix}setprefix - Cambiar prefijo del subbot
│ • ${usedPrefix}creador - Contacto del creador
│ • ${usedPrefix}get - Descargar estados
│ • ${usedPrefix}addgrupo - Autorizar grupo
│ • ${usedPrefix}addlista - Autorizar usuario privado
│ • ${usedPrefix}dellista - Quitar usuario autorizado
│ • ${usedPrefix}delgrupo - Eliminar grupo
│ • ${usedPrefix}pong - Medir latencia del bot
│
╰───『 © Azura Ultra Subbot 』───╯`;

  await conn.sendMessage(msg.key.remoteJid, {
    image: { url: `https://cdn.russellxz.click/73a12c4f.jpeg` },
    caption: menu
  }, { quoted: msg });

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key }
  });
};

handler.command = ['menu', 'help', 'ayuda', 'comandos'];
module.exports = handler;
