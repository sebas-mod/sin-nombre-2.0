const fs = require("fs");
const chalk = require("chalk");
const { isOwner, setPrefix, allowedPrefixes } = require("./config");
const axios = require("axios");
const fetch = require("node-fetch");

if (fs.existsSync("./config.json")) {
    let configData = JSON.parse(fs.readFileSync("./config.json"));
    global.prefix = configData.prefix || ".";
} else {
    global.prefix = ".";
}

function isValidPrefix(prefix) {
    return typeof prefix === "string" && (prefix.length === 1 || prefix.length > 1 && [...prefix].length === 1);
}

function savePrefix(newPrefix) {
    global.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify({ prefix: newPrefix }, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
}

function isUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

async function handleCommand(sock, msg, command, args, sender) {
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");

    switch (lowerCommand) {


// ESCUCHAR REACCIONES AL MENSAJE
// 💾 Manejo del comando "setprefix"
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
                text: `🤖 *Azura Ultra Bot*\n\n📌 Prefijo actual: *${global.prefix}*\n👤 Dueño: *${global.owner[0][1]}*`
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
