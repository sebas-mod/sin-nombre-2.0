const fs = require("fs");
const chalk = require("chalk");
const { isOwner, setPrefix, allowedPrefixes } = require("./config");
const axios = require("axios");
const fetch = require("node-fetch");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
// Cargar prefijo desde archivo de configuración
if (fs.existsSync("./config.json")) {
    let configData = JSON.parse(fs.readFileSync("./config.json"));
    global.prefix = configData.prefix || ".";
} else {
    global.prefix = ".";
}

//sistema de mascota y personaje

// Carga los datos del archivo 'cartera.json'

// Verificar si guar.json existe, si no, crearlo
const guarFilePath = "./guar.json";
if (!fs.existsSync(guarFilePath)) {
    fs.writeFileSync(guarFilePath, JSON.stringify({}, null, 2));
}

// Función para guardar multimedia en guar.json
function saveMultimedia(key, data) {
    let guarData = JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
    guarData[key] = data;
    fs.writeFileSync(guarFilePath, JSON.stringify(guarData, null, 2));
}

// Función para obtener la lista de multimedia guardado
function getMultimediaList() {
    return JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
}

// Exportamos las funciones para usarlas en los comandos
module.exports = {
    saveMultimedia,
    getMultimediaList
};
// Verificar si un prefijo es válido
function isValidPrefix(prefix) {
    return typeof prefix === "string" && (prefix.length === 1 || (prefix.length > 1 && [...prefix].length === 1));
}

async function isAdmin(sock, chatId, sender) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);
        return admins.includes(sender.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
    } catch (error) {
        console.error("⚠️ Error verificando administrador:", error);
        return false;
    }
}

// Guardar nuevo prefijo en el archivo de configuración
function savePrefix(newPrefix) {
    global.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify({ prefix: newPrefix }, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
}

// Función para verificar si una URL es válida
function isUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

async function handleCommand(sock, msg, command, args, sender) {
    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) 
? Buffer.from(path.split`,`[1], 'base64') 
: /^https?:\/\//.test(path) 
? await (await getBuffer(path)) 
: fs.existsSync(path) 
? fs.readFileSync(path) 
: Buffer.alloc(0);

let buffer;
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options);
} else {
buffer = await imageToWebp(buff);
}

await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { 
quoted: quoted ? quoted : m, 
ephemeralExpiration: 24 * 60 * 100, 
disappearingMessagesInChat: 24 * 60 * 100 
});

return buffer;
};
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");

    switch (lowerCommand) {


// ESCUCHAR REACCIONES AL MENSAJE
// 💾 Manejo del comando "setprefix"
case "perfil": {
    try {
        let userJid = null;

        // Si no hay argumentos, menciones ni respuesta, mostrar la guía de uso
        if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length &&
            !msg.message.extendedTextMessage?.contextInfo?.participant &&
            args.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: `🔍 *¿Cómo usar el comando .perfil?*\n\n` +
                      `📌 *Ejemplos de uso:*\n\n` +
                      `🔹 *Para obtener la foto de perfil de alguien:* \n` +
                      `   - *Responde a su mensaje con:* _.perfil_\n\n` +
                      `🔹 *Para obtener la foto de perfil de un número:* \n` +
                      `   - _.perfil +1 555-123-4567_\n\n` +
                      `🔹 *Para obtener la foto de perfil de un usuario mencionado:* \n` +
                      `   - _.perfil @usuario_\n\n` +
                      `⚠️ *Nota:* Algunos usuarios pueden tener su foto de perfil privada y el bot no podrá acceder a ella.`
            }, { quoted: msg });
        }

        // Verifica si se mencionó un usuario
        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Verifica si se respondió a un mensaje
        else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
            userJid = msg.message.extendedTextMessage.contextInfo.participant;
        } 
        // Verifica si se ingresó un número
        else if (args.length > 0) {
            let number = args.join("").replace(/[^0-9]/g, ""); // Limpia el número de caracteres no numéricos
            userJid = number + "@s.whatsapp.net";
        }

        // Si no se encontró un usuario válido, termina la ejecución
        if (!userJid) return;

        // Intentar obtener la imagen de perfil
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(userJid, "image"); // "image" para foto de perfil normal
        } catch {
            ppUrl = "https://i.imgur.com/3J8M0wG.png"; // Imagen de perfil por defecto si el usuario no tiene foto
        }

        // Enviar la imagen de perfil solo si se encontró un usuario válido
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: ppUrl },
            caption: `🖼️ *Foto de perfil de:* @${userJid.split("@")[0]}`,
            mentions: [userJid]
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando perfil:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo obtener la foto de perfil." }, { quoted: msg });
    }
    break;
}
        
case 'creador': {
    const ownerNumber = "15167096032@s.whatsapp.net"; // Número del dueño en formato WhatsApp
    const ownerName = "Russell 🤖"; // Nombre del dueño
    const messageText = "📞 *Contacto del Creador:*\n\nSi tienes dudas, preguntas o sugerencias sobre el bot, puedes contactar a mi creador.\n\n📌 *Nombre:* Russell\n📌 *Número:* +1 (516) 709-6032\n💬 *Mensaje directo:* Pulsa sobre el contacto y chatea con él.";

    // Enviar mensaje con el contacto del dueño
    await sock.sendMessage(msg.key.remoteJid, {
        contacts: {
            displayName: ownerName,
            contacts: [{
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;waid=${ownerNumber.split('@')[0]}:+${ownerNumber.split('@')[0]}\nEND:VCARD`
            }]
        }
    });

    // Enviar mensaje adicional con información
    await sock.sendMessage(msg.key.remoteJid, { text: messageText }, { quoted: msg });

    break;
}
        
case "s": case "stiker": { if (!msg.message.imageMessage && !msg.message.extendedTextMessage) { return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Responde a una imagen o envía una imagen con el comando." }, { quoted: msg }); }

let quotedMessage = msg.message.extendedTextMessage ? msg.message.extendedTextMessage.contextInfo.quotedMessage : null;
let mediaMessage = msg.message.imageMessage || (quotedMessage && quotedMessage.imageMessage);

if (!mediaMessage) {
    return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Solo puedes usar imágenes para hacer stickers." }, { quoted: msg });
}

const mediaStream = await downloadContentFromMessage(mediaMessage, "image");
let mediaBuffer = Buffer.alloc(0);
for await (const chunk of mediaStream) {
    mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
}

let stickerBuffer = await sock.sendImageAsSticker(msg.key.remoteJid, mediaBuffer, msg, { packname: "Mi Pack", author: "EliasarYT" });
break;
}
            
case 'vercomandos':
case 'verco': {
    const fs = require("fs");

    // Leer el archivo main.js
    const mainFilePath = "./main.js";
    if (!fs.existsSync(mainFilePath)) {
        return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se encontró el archivo de comandos." }, { quoted: msg });
    }

    // Leer contenido del archivo
    const mainFileContent = fs.readFileSync(mainFilePath, "utf-8");

    // Extraer los nombres de los comandos dentro de `case 'comando':`
    const commandRegex = /case\s+['"]([^'"]+)['"]:/g;
    let commands = [];
    let match;
    while ((match = commandRegex.exec(mainFileContent)) !== null) {
        commands.push(match[1]);
    }

    // Filtrar y ordenar los comandos
    commands = [...new Set(commands)].sort();

    // Construir mensaje con formato de lista
    let commandList = "📜 *Lista de Comandos Disponibles:*\n\n";
    commands.forEach(cmd => {
        commandList += `🔹 *${global.prefix}${cmd}*\n`;
    });

    // Enviar el mensaje con el menú de comandos
    await sock.sendMessage(
        msg.key.remoteJid,
        { text: commandList, footer: "📌 Usa los comandos con el prefijo actual.", quoted: msg },
    );

    break;
}
            
case 'play': { 
    const yts = require('yt-search'); 

    if (!text || text.trim() === '') {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso correcto del comando:*\n\n📌 Ejemplo: *${global.prefix}play boza yaya*\n🔍 _Proporciona el nombre o término de búsqueda del Audio._` 
        });
    } 

    const query = args.join(' ') || text; 
    let video = {}; 

    try { 
        const yt_play = await yts(query); 
        if (!yt_play || yt_play.all.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* No se encontraron resultados para tu búsqueda.' });
        } 

        const firstResult = yt_play.all[0]; 
        video = { 
            url: firstResult.url, 
            title: firstResult.title, 
            thumbnail: firstResult.thumbnail || 'default-thumbnail.jpg', 
            timestamp: firstResult.duration.seconds, 
            views: firstResult.views, 
            author: firstResult.author.name, 
        }; 
    } catch { 
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* Ocurrió un problema al buscar el video.' });
    } 

    function secondString(seconds) { 
        const h = Math.floor(seconds / 3600); 
        const m = Math.floor((seconds % 3600) / 60); 
        const s = seconds % 60; 
        return [h, m, s]
            .map(v => v < 10 ? `0${v}` : v)
            .filter((v, i) => v !== '00' || i > 0)
            .join(':'); 
    } 

    // Reacción antes de enviar el mensaje
    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🎼", key: msg.key } 
    });

    await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: video.thumbnail }, 
        caption: `🎵 *Título:* ${video.title}\n⏱️ *Duración:* ${secondString(video.timestamp || 0)}\n👁️ *Vistas:* ${video.views || 0}\n👤 *Autor:* ${video.author || 'Desconocido'}\n🔗 *Link:* ${video.url}\n\n📌 *Para descargar el audio usa el comando:* \n➡️ *${global.prefix}play* _nombre del video_\n➡️ *Para descargar el video usa:* \n*${global.prefix}play2* _nombre del video_`, 
        footer: "𝙲𝙾𝚁𝚃𝙰𝙽𝙰 𝟸.𝟶", 
    }, { quoted: msg });

    // Ejecutar el comando .ytmp3 directamente
    handleCommand(sock, msg, "ytmp3", [video.url]);

    break; 
}

case 'play2': { 
    const yts = require('yt-search'); 

    if (!text || text.trim() === '') {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso correcto del comando:*\n\n📌 Ejemplo: *${global.prefix}play2 boza yaya*\n🎬 _Proporciona el nombre o término de búsqueda del video._` 
        });
    } 

    const query = args.join(' ') || text; 
    let video = {}; 

    try { 
        const yt_play = await yts(query); 
        if (!yt_play || yt_play.all.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* No se encontraron resultados para tu búsqueda.' });
        } 

        const firstResult = yt_play.all[0]; 
        video = { 
            url: firstResult.url, 
            title: firstResult.title, 
            thumbnail: firstResult.thumbnail || 'default-thumbnail.jpg', 
            timestamp: firstResult.duration.seconds, 
            views: firstResult.views, 
            author: firstResult.author.name, 
        }; 
    } catch { 
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* Ocurrió un problema al buscar el video.' });
    } 

    function secondString(seconds) { 
        const h = Math.floor(seconds / 3600); 
        const m = Math.floor((seconds % 3600) / 60); 
        const s = seconds % 60; 
        return [h, m, s]
            .map(v => v < 10 ? `0${v}` : v)
            .filter((v, i) => v !== '00' || i > 0)
            .join(':'); 
    } 

    // Reacción antes de enviar el mensaje
    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🎬", key: msg.key } 
    });

    await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: video.thumbnail }, 
        caption: `🎬 *Título:* ${video.title}\n⏱️ *Duración:* ${secondString(video.timestamp || 0)}\n👁️ *Vistas:* ${video.views || 0}\n👤 *Autor:* ${video.author || 'Desconocido'}\n🔗 *Link:* ${video.url}\n\n📌 *Para descargar el video usa el comando:* \n➡️ *${global.prefix}play2* _nombre del video_\n➡️ *Para descargar solo el audio usa:* \n*${global.prefix}play* _nombre del video_`, 
        footer: "𝙲𝙾𝚁𝚃𝙰𝙽𝙰 𝟸.𝟶", 
    }, { quoted: msg });

    // Ejecutar el comando .ytmp4 directamente
    handleCommand(sock, msg, "ytmp4", [video.url]);

    break; 
}
            
case 'kill': {
    const searchKey = args.join(' ').trim().toLowerCase(); // Convertir clave a minúsculas
    if (!searchKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Error:* Debes proporcionar una palabra clave para eliminar el multimedia. 🗑️" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Verificar si la palabra clave existe
    if (!guarData[searchKey]) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ *Error:* No se encontró multimedia guardado con la clave: *"${searchKey}"*.` },
            { quoted: msg }
        );
    }

    const storedMedia = guarData[searchKey];
    const savedBy = storedMedia.savedBy;
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Verificar si el usuario es Owner
    const isUserOwner = global.owner.some(owner => owner[0] === senderId.replace("@s.whatsapp.net", ""));
    const isSavedByOwner = global.owner.some(owner => owner[0] === savedBy.replace("@s.whatsapp.net", ""));

    // Verificar si el usuario es admin
    const isAdminUser = await isAdmin(sock, msg.key.remoteJid, senderId);

    // Reglas de eliminación:
    if (isUserOwner) {
        // El owner puede eliminar cualquier multimedia
        delete guarData[searchKey];
    } else if (isAdminUser) {
        // Los admins pueden eliminar cualquier multimedia excepto los del owner
        if (isSavedByOwner) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "🚫 *Acceso denegado:* No puedes eliminar multimedia guardado por el Owner." },
                { quoted: msg }
            );
        }
        delete guarData[searchKey];
    } else {
        // Un usuario solo puede eliminar su propio multimedia
        if (savedBy !== senderId) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "⛔ *Acceso denegado:* Solo puedes eliminar los multimedia que tú guardaste." },
                { quoted: msg }
            );
        }
        delete guarData[searchKey];
    }

    // Guardar los cambios en guar.json
    fs.writeFileSync("./guar.json", JSON.stringify(guarData, null, 2));

    return sock.sendMessage(
        msg.key.remoteJid,
        { text: `✅ *Multimedia eliminado con éxito:* "${searchKey}" ha sido eliminado. 🗑️` },
        { quoted: msg }
    );
}
break;
        
case 'clavelista': {
    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));
    
    if (Object.keys(guarData).length === 0) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "📂 *Lista vacía:* No hay palabras clave registradas." },
            { quoted: msg }
        );
    }

    // Construir el mensaje con la lista de palabras clave y quién las guardó
    let listaMensaje = "📜 *Lista de palabras clave guardadas:*\n\n";
    let mentions = [];

    for (let clave in guarData) {
        let user = guarData[clave].savedBy || "Desconocido"; // Evitar undefined
        if (user.includes("@s.whatsapp.net")) {
            user = user.replace("@s.whatsapp.net", ""); // Obtener solo el número
            mentions.push(`${user}@s.whatsapp.net`);
        }

        listaMensaje += `🔹 *${clave}* → Guardado por: @${user}\n`;
    }

    // Enviar la lista de palabras clave mencionando a los usuarios
    return sock.sendMessage(
        msg.key.remoteJid,
        {
            text: listaMensaje,
            mentions: mentions // Mencionar a los que guardaron multimedia
        },
        { quoted: msg }
    );
}
break;
        
        
case 'g': {
    const removeEmojis = (text) => text.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ""); // Remover emojis
    const normalizeText = (text) => removeEmojis(text).toLowerCase().trim(); // Normalizar texto

    const searchKey = normalizeText(args.join(' ')); // Convertir clave a minúsculas y sin emojis
    if (!searchKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Error:* Debes proporcionar una palabra clave para recuperar el multimedia. 🔍" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Buscar la clave ignorando mayúsculas, minúsculas y emojis
    const keys = Object.keys(guarData);
    const foundKey = keys.find(key => normalizeText(key) === searchKey);

    if (!foundKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ *Error:* No se encontró multimedia guardado con la clave: *"${searchKey}"*.` },
            { quoted: msg }
        );
    }

    const storedMedia = guarData[foundKey];

    // Convertir la base64 nuevamente a Buffer
    const mediaBuffer = Buffer.from(storedMedia.buffer, "base64");

    // Verificar el tipo de archivo y enviarlo correctamente
    let messageOptions = {
        mimetype: storedMedia.mimetype,
    };

    if (storedMedia.mimetype.startsWith("image") && storedMedia.extension !== "webp") {
        messageOptions.image = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("video")) {
        messageOptions.video = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("audio")) {
        messageOptions.audio = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("application")) {
        messageOptions.document = mediaBuffer;
        messageOptions.fileName = `Archivo.${storedMedia.extension}`;
    } else if (storedMedia.mimetype === "image/webp" || storedMedia.extension === "webp") {
        // Si es un sticker (webp), se envía como sticker
        messageOptions.sticker = mediaBuffer;
    } else {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No se pudo enviar el archivo. Tipo de archivo desconocido." },
            { quoted: msg }
        );
    }

    // Enviar el multimedia almacenado
    await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

    break;
}
        
case 'guar': {
    if (!msg.message.extendedTextMessage || 
        !msg.message.extendedTextMessage.contextInfo || 
        !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* Debes responder a un multimedia (imagen, video, audio, sticker, etc.) con una palabra clave para guardarlo. 📂" },
            { quoted: msg }
        );
    }

    const saveKey = args.join(' ').trim().toLowerCase(); // Clave en minúsculas
    if (!saveKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Aviso:* Escribe una palabra clave para guardar este multimedia. 📝" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe, si no, crearlo
    if (!fs.existsSync("./guar.json")) {
        fs.writeFileSync("./guar.json", JSON.stringify({}, null, 2));
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Verificar si la palabra clave ya existe
    if (guarData[saveKey]) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `⚠️ *Aviso:* La palabra clave *"${saveKey}"* ya está en uso. Usa otra diferente. ❌` },
            { quoted: msg }
        );
    }

    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    let mediaType, mediaMessage, fileExtension;

    if (quotedMsg.imageMessage) {
        mediaType = "image";
        mediaMessage = quotedMsg.imageMessage;
        fileExtension = "jpg";
    } else if (quotedMsg.videoMessage) {
        mediaType = "video";
        mediaMessage = quotedMsg.videoMessage;
        fileExtension = "mp4";
    } else if (quotedMsg.audioMessage) {
        mediaType = "audio";
        mediaMessage = quotedMsg.audioMessage;
        fileExtension = "mp3";
    } else if (quotedMsg.stickerMessage) {
        mediaType = "sticker";
        mediaMessage = quotedMsg.stickerMessage;
        fileExtension = "webp"; // Stickers son .webp
    } else if (quotedMsg.documentMessage) {
        mediaType = "document";
        mediaMessage = quotedMsg.documentMessage;
        fileExtension = mediaMessage.mimetype.split("/")[1] || "bin"; // Obtener la extensión real
    } else {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* Solo puedes guardar imágenes, videos, audios, stickers y documentos. 📂" },
            { quoted: msg }
        );
    }

    // Descargar el multimedia
    const mediaStream = await downloadContentFromMessage(mediaMessage, mediaType);
    let mediaBuffer = Buffer.alloc(0);
    for await (const chunk of mediaStream) {
        mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
    }

    // Guardar multimedia con la palabra clave y la información del usuario que lo guardó
    guarData[saveKey] = {
        buffer: mediaBuffer.toString("base64"), // Convertir a base64
        mimetype: mediaMessage.mimetype,
        extension: fileExtension,
        savedBy: msg.key.participant || msg.key.remoteJid, // Número del usuario que guardó el archivo
    };

    // Escribir en guar.json
    fs.writeFileSync("./guar.json", JSON.stringify(guarData, null, 2));

    return sock.sendMessage(
        msg.key.remoteJid,
        { text: `✅ *Listo:* El multimedia se ha guardado con la palabra clave: *"${saveKey}"*. 🎉` },
        { quoted: msg }
    );
}
break;
        
case "setprefix":
    if (!isOwner(sender.replace("@s.whatsapp.net", ""))) { // Asegurar que se compara correctamente
        await sock.sendMessage(msg.key.remoteJid, { text: "⛔ Solo los dueños pueden cambiar el prefijo." });
        return;
    }
    if (!args[0]) {
        await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes especificar un nuevo prefijo." });
        return;
    }
    if (!allowedPrefixes.includes(args[0])) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Prefijo inválido. Usa un solo carácter o un emoji de la lista permitida."
        });
        return;
    }
    setPrefix(args[0]);
    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Prefijo cambiado a: *${args[0]}* 🚀` });
    break;
        
        
case 'play3': {
    const { Client } = require('youtubei');
    const { ytmp3 } = require("@hiudyy/ytdl");
    const yt = new Client();

    if (!text || text.trim() === '') return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre o término de búsqueda del video." });

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });

        const search = await yt.search(text, { type: "video" });
        if (!search || !search.items || search.items.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { quoted: msg });
        }

        const result = search.items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${result.id}`;

        const str = `Youtube Play\n✧ *Título:* ${result.title}\n✧ *Fecha:* ${result.uploadDate}\n✧ *Descripción:* ${result.description}\n✧ *URL:* ${videoUrl}\n✧➢ Para video, usa:\n.play4 ${videoUrl}\n\nEnviando audio....`;

        await sock.sendMessage(msg.key.remoteJid, { image: { url: result.thumbnails[0].url }, caption: str }, { quoted: msg });

        const audiodl = await ytmp3(videoUrl, {
            quality: 'highest',
        });

        await sock.sendMessage(msg.key.remoteJid, {
            audio: audiodl,
            mimetype: "audio/mpeg",
            caption: `Aquí está tu audio: ${result.title}`,
        }, { quoted: msg });

    } catch (error) {
        console.error("Error durante la búsqueda en YouTube:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al procesar tu solicitud." }, { quoted: msg });
    }
    break;
}          case 'play4': {
    const fetch = require("node-fetch");
    const { ytmp4 } = require("@hiudyy/ytdl");

    if (!text || !text.includes('youtube.com') && !text.includes('youtu.be')) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de YouTube." });
    }

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });

        const video = await ytmp4(args[0]);

        await sock.sendMessage(msg.key.remoteJid, {
            video: { url: video },
            caption: "✅ Aquí está tu video.",
        }, { quoted: msg });

    } catch (error) {
        console.error("Error al descargar el video:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al descargar el video." }, { quoted: msg });
    }
    break;
}
            
                          
            case 'ytmp3': {
    const fs = require('fs');
    const path = require('path');
    const fetch = require('node-fetch');
    const ytdl = require('./libs/ytdl');
    const yts = require('yt-search');

    if (!args.length || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(args[0])) {
        return sock.sendMessage(msg.key.remoteJid, { text: 'Por favor, ingresa un enlace de YouTube válido.' });
    }
await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });
                
    await sock.sendMessage(msg.key.remoteJid, { text: '🚀 Procesando tu solicitud...' });
    const videoUrl = args[0];

    try {
        const searchResult = await yts({ videoId: videoUrl.split('v=')[1] || videoUrl.split('/').pop() });
        if (!searchResult || !searchResult.title || !searchResult.thumbnail) {
            throw new Error('No se pudo obtener la información del video.');
        }

        const videoInfo = {
            title: searchResult.title,
            thumbnail: await (await fetch(searchResult.thumbnail)).buffer()
        };

        const ytdlResult = await ytdl(videoUrl);
        if (ytdlResult.status !== 'success' || !ytdlResult.dl) {
            throw new Error('No se pudo obtener el enlace de descarga.');
        }

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filePath = path.join(tmpDir, `${Date.now()}.mp3`);
        const response = await fetch(ytdlResult.dl);
        const buffer = await response.buffer();
        fs.writeFileSync(filePath, buffer);

        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mpeg',
            fileName: `${videoInfo.title}.mp3`,
        }, { quoted: msg });

        fs.unlinkSync(filePath);
    } catch (error) {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al intentar descargar el audio.' });
    }
    break;
}
            case 'ytmp4': {
    const fetch = require('node-fetch');

    if (!text) return sock.sendMessage(msg.key.remoteJid, { text: 'Proporciona un enlace de YouTube válido.' });
    const url = args[0];

    if (!url.includes('youtu')) return sock.sendMessage(msg.key.remoteJid, { text: 'Proporciona un enlace válido de YouTube.' });

    await sock.sendMessage(msg.key.remoteJid, { text: '🔄 Obteniendo información del video...' });

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });
        
        const infoResponse = await fetch(`https://ytdownloader.nvlgroup.my.id/info?url=${url}`);
        const info = await infoResponse.json();

        if (!info.resolutions || info.resolutions.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ No se encontraron resoluciones disponibles.' });
        }

        const randomResolution = info.resolutions[Math.floor(Math.random() * info.resolutions.length)];
        const selectedHeight = randomResolution.height;

        await sock.sendMessage(msg.key.remoteJid, { text: `🔄 Descargando el video en ${selectedHeight}p, espera...` });

        const videoUrl = `https://ytdownloader.nvlgroup.my.id/download?url=${url}&resolution=${selectedHeight}`;

        await sock.sendMessage(msg.key.remoteJid, {
            video: { url: videoUrl },
            caption: `✅ Aquí está tu video en ${selectedHeight}p.`,
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}\n\nNo se pudo obtener información del video.` });
    }
    break;
}

        
        case "ping":
            await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong! El bot está activo." });
            break;

case "info":
    await sock.sendMessage(msg.key.remoteJid, {
        text: `╭─ *🤖 AZURA ULTRA 2.0 BOT* ─╮
│ 🔹 *Prefijo actual:* ${global.prefix}
│ 👑 *Dueño:* Russell
│ 🛠️ *Bot desarrollado desde cero* con la ayuda de ChatGPT.
│ 🚀 *Creado por:* Russell
│  
├─〔 📥 *Colaboraciones en Descargas* 〕─
│ 📌 *Instagram, TikTok y Facebook*  
│    - 👤 *Colaboró:* DIEGO-OFC  
│  
│ 📌 *Audios y Videos* (.play, .play2, .ytmp3, .ytmp4)  
│    - 👤 *Colaboró:* Eliasar54  
│  
├─〔 📜 *Menús y Comandos* 〕─
│ 📌 Usa *${global.prefix}menu* para ver los comandos principales.  
│ 📌 Usa *${global.prefix}allmenu* para ver todos los comandos disponibles.  
╰──────────────────╯
    `
    });
    break;

            

        case "cerrargrupo":
            try {
                if (!msg.key.remoteJid.includes("@g.us")) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Este comando solo funciona en grupos.*" }, { quoted: msg });
                }

                const chat = await sock.groupMetadata(msg.key.remoteJid);
                const senderId = msg.key.participant.replace(/@s.whatsapp.net/, '');
                const isOwner = global.owner.some(o => o[0] === senderId);
                const groupAdmins = chat.participants.filter(p => p.admin);
                const isAdmin = groupAdmins.some(admin => admin.id === msg.key.participant);

                if (!isAdmin && !isOwner) {
                    return sock.sendMessage(
                        msg.key.remoteJid,
                        { text: "🚫 *No tienes permisos para cerrar el grupo.*\n⚠️ *Solo administradores o el dueño del bot pueden usar este comando.*" },
                        { quoted: msg }
                    );
                }

                await sock.groupSettingUpdate(msg.key.remoteJid, 'announcement');

                return sock.sendMessage(
                    msg.key.remoteJid,
                    { text: "🔒 *El grupo ha sido cerrado.*\n📢 *Solo los administradores pueden enviar mensajes ahora.*" },
                    { quoted: msg }
                );

            } catch (error) {
                console.error('❌ Error en el comando cerrargrupo:', error);
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al intentar cerrar el grupo.*" }, { quoted: msg });
            }
            break;

        case "abrirgrupo":
            try {
                if (!msg.key.remoteJid.includes("@g.us")) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Este comando solo funciona en grupos.*" }, { quoted: msg });
                }

                const chat = await sock.groupMetadata(msg.key.remoteJid);
                const senderId = msg.key.participant.replace(/@s.whatsapp.net/, '');
                const isOwner = global.owner.some(o => o[0] === senderId);
                const groupAdmins = chat.participants.filter(p => p.admin);
                const isAdmin = groupAdmins.some(admin => admin.id === msg.key.participant);

                if (!isAdmin && !isOwner) {
                    return sock.sendMessage(
                        msg.key.remoteJid,
                        { text: "🚫 *No tienes permisos para abrir el grupo.*\n⚠️ *Solo administradores o el dueño del bot pueden usar este comando.*" },
                        { quoted: msg }
                    );
                }

                await sock.groupSettingUpdate(msg.key.remoteJid, 'not_announcement');

                return sock.sendMessage(
                    msg.key.remoteJid,
                    { text: "🔓 *El grupo ha sido abierto.*\n📢 *Todos los miembros pueden enviar mensajes ahora.*" },
                    { quoted: msg }
                );

            } catch (error) {
                console.error('❌ Error en el comando abrirgrupo:', error);
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al intentar abrir el grupo.*" }, { quoted: msg });
            }
            break;

        case "kick":
            try {
                if (!msg.key.remoteJid.includes("@g.us")) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Este comando solo funciona en grupos.*" }, { quoted: msg });
                }

                const chat = await sock.groupMetadata(msg.key.remoteJid);
                const senderId = msg.key.participant.replace(/@s.whatsapp.net/, '');
                const isOwner = global.owner.some(o => o[0] === senderId);
                const groupAdmins = chat.participants.filter(p => p.admin);
                const isAdmin = groupAdmins.some(admin => admin.id === msg.key.participant);

                if (!isAdmin && !isOwner) {
                    return sock.sendMessage(
                        msg.key.remoteJid,
                        { text: "🚫 *No tienes permisos para expulsar a miembros del grupo.*\n⚠️ *Solo los administradores o el dueño del bot pueden usar este comando.*" },
                        { quoted: msg }
                    );
                }

                let userToKick = null;

                if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                    userToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
                }

                if (!userToKick && msg.message.extendedTextMessage?.contextInfo?.participant) {
                    userToKick = msg.message.extendedTextMessage.contextInfo.participant;
                }

                if (!userToKick) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ *Debes mencionar o responder a un usuario para expulsarlo.*" }, { quoted: msg });
                }

                await sock.groupParticipantsUpdate(msg.key.remoteJid, [userToKick], "remove");

                return sock.sendMessage(
                    msg.key.remoteJid,
                    { text: `🚷 *El usuario @${userToKick.split('@')[0]} ha sido expulsado del grupo.*`, mentions: [userToKick] },
                    { quoted: msg }
                );

            } catch (error) {
                console.error('❌ Error en el comando kick:', error);
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al intentar expulsar al usuario.*" }, { quoted: msg });
            }
            break;

        case "owner":
            await sock.sendMessage(msg.key.remoteJid, {
                text: `👑 *Lista de Owners:* \n${global.owner.map(o => `📌 ${o[1] || "Sin nombre"} - ${o[0]}`).join("\n")}`
            });
            break;

        case "tiktok":
        case "tt":
            if (!text) return sock.sendMessage(msg.key.remoteJid, { text: `Ejemplo de uso:\n${global.prefix + command} https://vm.tiktok.com/ZMjdrFCtg/` });
            if (!isUrl(args[0]) || !args[0].includes('tiktok')) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Enlace de TikTok inválido." }, { quoted: msg });

            try {
                sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '⏱️',
          key: msg.key,
        },
      });
                const response = await axios.get(`https://api.dorratz.com/v2/tiktok-dl?url=${args[0]}`);
                const videoData = response.data.data.media;
                const videoUrl = videoData.org;
                const videoDetails = `*Título*: ${response.data.data.title}\n` +
                                    `*Autor*: ${response.data.data.author.nickname}\n` +
                                    `*Duración*: ${response.data.data.duration}s\n` +
                                    `*Likes*: ${response.data.data.like}\n` +
                                    `*Comentarios*: ${response.data.data.comment}`;

                await sock.sendMessage(msg.key.remoteJid, { video: { url: videoUrl }, caption: videoDetails }, { quoted: msg });
               
            } catch (error) {
                console.error(error);
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al procesar el enlace de TikTok." });
            }
            break;

        case "instagram":
        case "ig":
            if (!text) return sock.sendMessage(msg.key.remoteJid, { text: `Ejemplo de uso:\n${global.prefix + command} https://www.instagram.com/p/CCoI4DQBGVQ/` }, { quoted: msg });

            try {
                sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '⏱️',
          key: msg.key,
        },
      });
                const apiUrl = `https://api.dorratz.com/igdl?url=${text}`;
                const response = await axios.get(apiUrl);
                const { data } = response.data;
                const caption = `> 🌙 Solicitud procesada por api.dorratz.com`;

                for (let item of data) {
                    await sock.sendMessage(msg.key.remoteJid, { video: { url: item.url }, caption: caption }, { quoted: msg });
                }
            } catch (error) {
                console.error(error);
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al procesar el enlace de Instagram." }, { quoted: msg });
            }
            break;

        

        case "facebook":
        case "fb":
            if (!text) return sock.sendMessage(msg.key.remoteJid, { text: `Ejemplo de uso:\n${global.prefix + command} https://fb.watch/ncowLHMp-x/` }, { quoted: msg });

            if (!text.match(/www.facebook.com|fb.watch/g)) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Enlace de Facebook inválido.\nEjemplo de uso:\n${global.prefix + command} https://fb.watch/ncowLHMp-x/`
                });
            }

            try {
                sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '⏱️',
          key: msg.key,
        },
      });
                const response = await axios.get(`https://api.dorratz.com/fbvideo?url=${encodeURIComponent(text)}`);
                const results = response.data;

                if (!results || results.length === 0) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ No se pudo obtener el video." });
                }

                const message = `Resoluciones disponibles:
${results.map((res, index) => `- ${res.resolution}`).join('\n')}

🔥 Enviado en 720p

> 🍧 Solicitud procesada por api.dorratz.com`.trim();

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: results[0].url },
                    caption: message
                }, { quoted: msg });

            } catch (error) {
                console.error(error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: "❌ Ocurrió un error al procesar el enlace de Facebook."
                });
            }
            break;

        default:
            break;
    }
}

module.exports = { handleCommand };
