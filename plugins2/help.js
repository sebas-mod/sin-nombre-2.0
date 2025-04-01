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
│ • play / playdoc - Descargar música MP3
│ • play2 - Descargar video en calidad óptima
│ • ytmp3 / ytmp3doc - MP3 desde YouTube o Music
│ • ytmp4 / ytmp4doc - Videos desde YouTube
│ • apk - Descargar APK desde Play Store
│ • instagram / ig - Descargas desde Instagram
│ • tiktok / tt - Descarga de videos de TikTok
│ • get - Descargar estados de WhatsApp
│
├─❖ *Stickers & Multimedia:*
│ • s - Crear sticker desde imagen o video
│ • ver - Ver mensajes de una sola vista
│ • tts - Texto a voz (audios hablados)
│
├─❖ *Grupos:*
│ • abrirgrupo - Abrir grupo (permitir mensajes)
│ • cerrargrupo - Cerrar grupo (solo admins)
│ • infogrupo - Ver nombre y descripción
│ • addgrupo - Autorizar grupo al subbot
│ • delgrupo - Eliminar grupo del subbot
│ • kick - Expulsar usuario
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
│ • pong - Medir latencia del bot
│
╰───『 © Azura Ultra Subbot 』───╯`;
 
  await conn.sendMessage(msg.key.remoteJid, {
    text: menu,
    mentions: [userId],
    contextInfo: {
      externalAdReply: {
        title: "Azura Ultra Subbot",
        body: "Menú actualizado con todos los comandos disponibles.",
        thumbnailUrl: "https://cdn.russellxz.click/73a12c4f.jpeg",
        sourceUrl: "https://github.com/russellxz",
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: msg });

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key }
  });
};

handler.command = ['menu', 'help', 'ayuda', 'comandos'];
module.exports = handler;
