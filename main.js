const fs = require("fs");
const chalk = require("chalk");
const { isOwner, setPrefix, allowedPrefixes } = require("./config");
const axios = require("axios");
const fetch = require("node-fetch");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const os = require("os");
const { execSync } = require("child_process");
const path = require("path");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, toAudio } = require('./libs/fuctions');
// Cargar prefijo desde archivo de configuración
if (fs.existsSync("./config.json")) {
    let configData = JSON.parse(fs.readFileSync("./config.json"));
    global.prefix = configData.prefix || ".";
} else {
    global.prefix = ".";
}
//orivado


// Si el modo privado está activado, bloquear comandos para quienes no sean dueños o el mismo bot

//modoprivado ariba
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
  let buff = Buffer.isBuffer(path) 
    ? path 
    : /^data:.*?\/.*?;base64,/i.test(path) 
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

            
case "git":
    try {
        // Verificar si se proporcionó un comando
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⚠️ *Debes especificar el nombre de un comando.*\nEjemplo: `.git rest`"
            }, { quoted: msg });
            return;
        }

        // Leer el archivo main.js
        const mainFilePath = "./main.js";
        if (!fs.existsSync(mainFilePath)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ *Error:* No se encontró el archivo de comandos."
            }, { quoted: msg });
            return;
        }

        // Leer el contenido del archivo main.js
        const mainFileContent = fs.readFileSync(mainFilePath, "utf-8");

        // Buscar el comando solicitado
        const commandName = args[0].toLowerCase();
        const commandRegex = new RegExp(`case\\s+['"]${commandName}['"]:\\s*([\\s\\S]*?)\\s*break;`, "g");
        const match = commandRegex.exec(mainFileContent);

        if (!match) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *Error:* No se encontró el comando *${commandName}* en el archivo main.js.`
            }, { quoted: msg });
            return;
        }

        // Extraer el código del comando
        const commandCode = `📜 *Código del comando ${commandName}:*\n\n\`\`\`${match[0]}\`\`\``;

        // Enviar el código como mensaje
        await sock.sendMessage(msg.key.remoteJid, {
            text: commandCode
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando git:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Error al obtener el código del comando.*"
        }, { quoted: msg });
    }
    break;
        
        
case "rest":
    try {
        // Obtener el número del remitente
        const senderNumber = (msg.key.participant || sender).replace("@s.whatsapp.net", "");

        // Obtener el número del bot
        const botNumber = sock.user.id.split(":")[0]; // Obtener el número del bot correctamente

        // Verificar si el mensaje fue enviado por el bot o por un dueño autorizado
        const isBotMessage = msg.key.fromMe; // True si el mensaje es del bot
        if (!isOwner(senderNumber) && !isBotMessage) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden reiniciar el servidor.*"
            }, { quoted: msg });
            return;
        }

        // 🟢 Enviar reacción antes de reiniciar
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔄", key: msg.key } // Emoji de reinicio
        });

        // Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            text: "🔄 *Reiniciando el servidor...* \nEspera unos segundos..."
        }, { quoted: msg });

        // Esperar unos segundos antes de reiniciar
        setTimeout(() => {
            process.exit(1); // Reiniciar el bot (depende de tu gestor de procesos)
        }, 3000);

    } catch (error) {
        console.error("❌ Error en el comando rest:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al intentar reiniciar el servidor.*"
        }, { quoted: msg });
    }
    break;

        
        
case "info":
    try {
        // Reacción antes de enviar la información
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "ℹ️", key: msg.key } 
        });

        // Construcción del mensaje con información del bot
        const infoMessage = `╭─ *🤖 AZURA ULTRA 2.0 BOT* ─╮
│ 🔹 *Prefijo actual:* ${global.prefix}
│ 👑 *Dueño:* Russell
│ 🛠️ *Bot desarrollado desde cero* con la ayuda de ChatGPT.
│ 🚀 *Creado por:* Russell
│  
├─〔 📥 *Descargas Redes* 〕─
│ 📌 *IG, TikTok y FB*  
│    - 👤 *Colaboró:* DIEGO-OFC  
│  
│ 📌 *Descargas youtube*
│     (.play, .play2, .ytmp3, .ytmp4)  
│    - 👤 *Colaboró:* Eliasar54  
│  
├─〔 📜 *Menús y Comandos* 〕─
│ 📌 Usa *${global.prefix}menu* para ver los comandos principales.  
│ 📌 Usa *${global.prefix}allmenu* para ver todos los comandos disponibles.  
│ 📌 Usa *${global.prefix}menu2* para ver los comandos de multimedia y guardado.  
╰──────────────────╯`;

        // Enviar el mensaje con GIF animado
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740372626884.mp4" }, 
            gifPlayback: true, // Esto hace que se reproduzca como GIF
            caption: infoMessage
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando info:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar la información. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
        
        
case "menu": {
    try {
        // Reacción antes de enviar el menú
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "📜", key: msg.key } 
        });

        // Definir la URL del archivo GIF/Video
        const mediaUrl = "https://cdn.dorratz.com/files/1740370321585.mp4"; 
        const filePath = path.join(__dirname, "menu_video.mp4");

        // Descargar el archivo si no existe localmente
        if (!fs.existsSync(filePath)) {
            const response = await axios({
                method: "GET",
                url: mediaUrl,
                responseType: "stream"
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });
        }

        // Construcción del menú con formato mejorado y prefijo dinámico
        const menuMessage = `┏━━━━━━━━━━━━━━━┓
┃  🤖 *AZURA ULTRA 2.0 BOT*  
┃  🚀 *Tu Asistente Inteligente*  
┗━━━━━━━━━━━━━━━┛

📌 *Usa los siguientes comandos para ver más menús:*  
${global.prefix}allmenu  
${global.prefix}info  
${global.prefix}menu2  

🌟 *Prefijo actual:* ${global.prefix}  
💡 *Usa ${global.prefix} antes de cada comando.*

📥 *Comandos de Descarga* 📥  
━━━━━━━━━━━━━━━━━━  
${global.prefix}play → Descargar música.  
${global.prefix}play2 → Descargar videos.  
${global.prefix}ytmp3 → Descargar a MP3.  
${global.prefix}ytmp4 → Descargar a MP4.  
${global.prefix}tiktok → Descargar video.  
${global.prefix}fb → Descargar video.  
${global.prefix}ig → Descargar video.  

👥 *Comandos de Grupo* 👥  
━━━━━━━━━━━━━━━━━━  
${global.prefix}cerrargrupo → Cierra el grupo.  
${global.prefix}abrirgrupo → Abre el grupo.  
${global.prefix}kick → Expulsar del grupo.  

🔍 *Otros Comandos* 🔍  
━━━━━━━━━━━━━━━━━━  
${global.prefix}ver → Ver mensajes de "ver una vez".  
${global.prefix}perfil → Descargar la foto de perfil de alguien.  
${global.prefix}get → Descargar estados de WhatsApp.  
${global.prefix}ping → Ver el estado del bot y el servidor.  
${global.prefix}creador → Ver el contacto del creador.  
${global.prefix}info → Ver detalles del bot.  

📂 *Comandos de Multimedia* 📂  
━━━━━━━━━━━━━━━━━━  
${global.prefix}guar → Guardar archivos con una clave.  
${global.prefix}g → Recuperar archivos guardados.  
${global.prefix}kill → Eliminar un archivo guardado.  
${global.prefix}clavelista → Ver todas las claves guardadas.  

💡 *Azura Ultra 2.0 está en constante desarrollo. Se agregarán más funciones pronto.*  
⚙️ *Desarrollado por Russell* 🚀`;

        // Enviar el archivo local como video/GIF con el menú
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: filePath }, 
            gifPlayback: true,
            caption: menuMessage 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error al enviar el menú:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar el menú. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case "menu2": {
    try {
        // Reacción antes de enviar el menú
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "📂", key: msg.key } 
        });

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
        
        let listaMensaje = `┏━━━━━━━━━━━━━━━┓
┃  📂 *MENÚ DE MULTIMEDIA*  
┃  🔑 *Palabras Clave Guardadas*  
┗━━━━━━━━━━━━━━━┛

📌 *¿Cómo recuperar un archivo guardado?*  
Usa el comando:  
➡️ _${global.prefix}g palabra_clave_  

📂 *Lista de palabras clave guardadas:*  
━━━━━━━━━━━━━━━━━━━\n`;

        let claves = Object.keys(guarData);
        
        if (claves.length === 0) {
            listaMensaje += "🚫 *No hay palabras clave guardadas.*\n";
        } else {
            claves.forEach((clave, index) => {
                listaMensaje += `*${index + 1}.* ${clave}\n`;
            });
        }

        listaMensaje += `\n━━━━━━━━━━━━━━━━━━━  
📥 *Otros Comandos de Multimedia*  

${global.prefix}guar → Guarda archivos con una clave.  
${global.prefix}g → Recupera archivos guardados.  
${global.prefix}kill → Elimina un archivo guardado.  

💡 *Azura Ultra 2.0 sigue mejorando. Pronto más funciones.*  
⚙️ *Desarrollado por Russell* 🚀`;

        // Enviar el menú con video como GIF
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740372045635.mp4" }, 
            gifPlayback: true, // Esto hace que se reproduzca como GIF
            caption: listaMensaje 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error al enviar el menú2:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar el menú2. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}    

case "ping":
    try {
        const now = new Date();
        const options = { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric", 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit", 
            timeZoneName: "short" 
        };
        const formattedDate = now.toLocaleDateString("es-ES", options);

        // Obtener el tiempo activo en días, horas, minutos y segundos
        const uptime = os.uptime();
        const uptimeDays = Math.floor(uptime / 86400);
        const uptimeHours = Math.floor((uptime % 86400) / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);
        const uptimeSeconds = Math.floor(uptime % 60);
        const uptimeFormatted = `${uptimeDays} días, ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

        // Información del sistema
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const freeMemGB = (freeMem / 1024 / 1024 / 1024).toFixed(2);
        const totalMemGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);
        const usedMemGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);

        const cpuModel = os.cpus()[0].model;
        const numCores = os.cpus().length;
        const loadAvg = os.loadavg()[0].toFixed(2);
        const diskUsage = execSync("df -h / | awk 'NR==2 {print $3 \" / \" $2}'").toString().trim();

        // Reaccionar al mensaje con un emoji
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: "🏓",
                key: msg.key
            }
        });

        // Enviar mensaje con imagen y detalles del servidor
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: "https://cdn.dorratz.com/files/1740372224017.jpg" }, 
            caption: `🏓 *Pong! El bot está activo.*\n\n` +
                     `📅 *Fecha y hora actual:* ${formattedDate}\n\n` +
                     `🕒 *Tiempo Activo:* ${uptimeFormatted}\n\n` +
                     `💻 *Información del Servidor:*\n` +
                     `🔹 *CPU:* ${cpuModel}\n` +
                     `🔹 *Núcleos:* ${numCores}\n` +
                     `🔹 *Carga del sistema:* ${loadAvg}\n\n` +
                     `🖥️ *Memoria RAM:*\n` +
                     `🔹 *Usada:* ${usedMemGB}GB\n` +
                     `🔹 *Libre:* ${freeMemGB}GB\n` +
                     `🔹 *Total:* ${totalMemGB}GB\n\n` +
                     `💾 *Disco:* ${diskUsage}\n\n` +
                     `🌐 *Alojado en:* *Sky Ultra Plus* 🚀\n` +
                     `📌 *Proveedor de Hosting de Confianza*`,
            quoted: msg // Responder citando al mensaje original
        });

    } catch (error) {
        console.error("❌ Error en el comando ping:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Error al obtener información del servidor.*",
            quoted: msg // Responder citando al mensaje original
        });
    }
    break;

case "setprefix":
    try {
        // Obtener el número del remitente
        const senderNumber = (msg.key.participant || sender).replace("@s.whatsapp.net", "");

        // Obtener el número del bot
        const botNumber = sock.user.id.split(":")[0]; // Obtener el número del bot correctamente

        // Verificar si el mensaje fue enviado por el bot o por un dueño autorizado
        const isBotMessage = msg.key.fromMe; // True si el mensaje es del bot
        if (!isOwner(senderNumber) && !isBotMessage) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden cambiar el prefijo global.*"
            }, { quoted: msg });
            return;
        }

        // Verificar si se proporcionó un nuevo prefijo
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar un nuevo prefijo.*\nEjemplo: `.setprefix !`"
            }, { quoted: msg });
            return;
        }

        // Validar si el prefijo está permitido
        if (!allowedPrefixes.includes(args[0])) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ *Prefijo inválido.*\nUsa un solo carácter o un emoji de la lista permitida."
            }, { quoted: msg });
            return;
        }

        // 🟢 Enviar reacción antes de procesar el cambio
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⚙️", key: msg.key } // Engranaje para indicar que está cambiando el prefijo
        });

        // Cambiar el prefijo globalmente
        setPrefix(args[0]);

        // Confirmar el cambio en el chat donde se ejecutó el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Prefijo global cambiado a:* *${args[0]}* 🚀`
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando setprefix:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al intentar cambiar el prefijo global.*"
        }, { quoted: msg });
    }
    break;

            
case "get": {
    try {
        if (!msg.message.extendedTextMessage || 
            !msg.message.extendedTextMessage.contextInfo || 
            !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Debes responder a un estado de WhatsApp para descargarlo. 📝" },
                { quoted: msg }
            );
        }

        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        let mediaType, mediaMessage;

        if (quotedMsg.imageMessage) {
            mediaType = "image";
            mediaMessage = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage) {
            mediaType = "video";
            mediaMessage = quotedMsg.videoMessage;
        } else if (quotedMsg.audioMessage) {
            mediaType = "audio";
            mediaMessage = quotedMsg.audioMessage;
        } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
            mediaType = "text";
            mediaMessage = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Solo puedes descargar *imágenes, videos, audios y textos* de estados de WhatsApp." },
                { quoted: msg }
            );
        }

        // Enviar reacción mientras procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key } 
        });

        if (mediaType === "text") {
            // Convertir el texto en una imagen
            const { createCanvas, loadImage } = require("canvas");
            const canvas = createCanvas(500, 250);
            const ctx = canvas.getContext("2d");

            // Fondo blanco
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Configurar texto
            ctx.fillStyle = "#000000";
            ctx.font = "20px Arial";
            ctx.fillText(mediaMessage, 20, 100, 460); // Ajustar el texto dentro del cuadro

            // Guardar la imagen en buffer
            const buffer = canvas.toBuffer("image/png");

            // Enviar la imagen del estado de texto
            await sock.sendMessage(msg.key.remoteJid, { 
                image: buffer, 
                caption: "📝 *Estado de texto convertido en imagen*" 
            }, { quoted: msg });

        } else {
            // Descargar el multimedia
            const mediaStream = await new Promise(async (resolve, reject) => {
                try {
                    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                    let buffer = Buffer.alloc(0);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    resolve(buffer);
                } catch (err) {
                    reject(null);
                }
            });

            if (!mediaStream || mediaStream.length === 0) {
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo descargar el estado. Intenta de nuevo." }, { quoted: msg });
                return;
            }

            // Enviar el archivo descargado al chat
            let messageOptions = {
                mimetype: mediaMessage.mimetype,
            };

            if (mediaType === "image") {
                messageOptions.image = mediaStream;
            } else if (mediaType === "video") {
                messageOptions.video = mediaStream;
            } else if (mediaType === "audio") {
                messageOptions.audio = mediaStream;
                messageOptions.mimetype = "audio/mpeg"; // Especificar que es un audio
            }

            await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });
        }

        // Confirmar que el estado ha sido enviado con éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando get:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo recuperar el estado. Inténtalo de nuevo." }, { quoted: msg });
    }
    break;
}
        
    
case "ver": {
    try {
        if (!msg.message.extendedTextMessage || 
            !msg.message.extendedTextMessage.contextInfo || 
            !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Debes responder a un mensaje de *ver una sola vez* (imagen, video o audio) para poder verlo nuevamente." },
                { quoted: msg }
            );
        }

        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        let mediaType, mediaMessage;

        if (quotedMsg.imageMessage?.viewOnce) {
            mediaType = "image";
            mediaMessage = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage?.viewOnce) {
            mediaType = "video";
            mediaMessage = quotedMsg.videoMessage;
        } else if (quotedMsg.audioMessage?.viewOnce) {
            mediaType = "audio";
            mediaMessage = quotedMsg.audioMessage;
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Solo puedes usar este comando en mensajes de *ver una sola vez*." },
                { quoted: msg }
            );
        }

        // Enviar reacción mientras procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key } 
        });

        // Descargar el multimedia de forma segura
        const mediaStream = await new Promise(async (resolve, reject) => {
            try {
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                let buffer = Buffer.alloc(0);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                resolve(buffer);
            } catch (err) {
                reject(null);
            }
        });

        if (!mediaStream || mediaStream.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo descargar el archivo. Intenta de nuevo." }, { quoted: msg });
            return;
        }

        // Enviar el archivo descargado al grupo o chat
        let messageOptions = {
            mimetype: mediaMessage.mimetype,
        };

        if (mediaType === "image") {
            messageOptions.image = mediaStream;
        } else if (mediaType === "video") {
            messageOptions.video = mediaStream;
        } else if (mediaType === "audio") {
            messageOptions.audio = mediaStream;
        }

        await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

        // Confirmar que el archivo ha sido enviado con éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando ver:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo recuperar el mensaje de *ver una sola vez*. Inténtalo de nuevo." }, { quoted: msg });
    }
    break;
}
        
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
        
  case "s":
  case "sticker": {
    try {
      if (quoted && /image/.test(mime)) {
        const mediaStream = await downloadContentFromMessage(quoted, mime);
        let encmedia = await sock.sendImageAsSticker(msg.key.remoteJid, mediaStream, {
          quoted: msg,
          packname: "",
          author: JSON.stringify({
            Dueño: "rusell xz",
            Developer: "by EliasarYT",
            Bot: "azúra bot"
          })
        });
        await fs.unlinkSync(encmedia);
      } else if (quoted && /video/.test(mime)) {
        if ((quoted.msg || quoted).seconds > 20) {
          sock.sendMessage(msg.key.remoteJid, { text: 'El video no puede durar más de 20 segundos.' }, { quoted: msg });
        } else {
          const mediaStream = await downloadContentFromMessage(quoted, mime);
          let encmedia = await sock.sendVideoAsSticker(msg.key.remoteJid, mediaStream, {
            quoted: msg,
            packname: "",
            author: JSON.stringify({
              Dueño: "rusell xz",
              Developer: "by EliasarYT",
              Bot: "azúra bot"
            })
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await fs.unlinkSync(encmedia);
        }
      } else {
        sock.sendMessage(msg.key.remoteJid, { text: 'Por favor responde a una imagen o video para convertirlo en sticker.' }, { quoted: msg });
      }
    } catch (err) {
      console.error('Error al enviar el sticker:', err);
      sock.sendMessage(msg.key.remoteJid, { text: 'Hubo un error al procesar tu solicitud.' }, { quoted: msg });
    }
    break;
  }
            
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
