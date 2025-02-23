const fs = require("fs");
const chalk = require("chalk");
const { isOwner } = require("./config");
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
case 'play2': case 'play': { 
    const yts = require('yt-search'); 
    const fetch = require('node-fetch'); 
    
    if (!text || text.trim() === '') {
        return sock.sendMessage(msg.key.remoteJid, { text: 'Por favor, proporciona el nombre o término de búsqueda del video.' });
    } 

    const query = args.join(' ') || text; 
    let video = {}; 

    try { 
        const yt_play = await yts(query); 
        if (!yt_play || yt_play.all.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron resultados para tu búsqueda.' });
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
        return sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al buscar el video.' });
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

    const sentMessage = await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: video.thumbnail }, 
        caption: `╭───≪~*╌◌ᰱ•••⃙❨͟͞P̸͟͞L̸͟A̸͟͞Y̸͟͞❩⃘•••ᰱ◌╌*~* │║◈ Título: ${video.title} │║◈ Duración: ${secondString(video.timestamp || 0)} │║◈ Vistas: ${video.views || 0} │║◈ Autor: ${video.author || 'Desconocido'} │║◈ Link: ${video.url} ╰─•┈┈┈•••✦𝒟ℳ✦•••┈┈┈•─╯⟤`, 
        footer: "𝙲𝙾𝚁𝚃𝙰𝙽𝙰 𝟸.𝟶", 
        viewOnce: false, 
        headerType: 4, 
        mentions: [msg.key.participant || msg.key.remoteJid], 
    }, { quoted: msg });

    // Guardar el mensaje para reaccionar después
    global.videoRequests = global.videoRequests || {};
    global.videoRequests[sentMessage.key.id] = { 
        remoteJid: msg.key.remoteJid, 
        videoUrl: video.url 
    };

    break; 
}

// ESCUCHAR REACCIONES AL MENSAJE
sock.ev.on('messages.reaction', async (reaction) => {
    const messageId = reaction.key.id;
    if (!global.videoRequests || !global.videoRequests[messageId]) return;

    const { remoteJid, videoUrl } = global.videoRequests[messageId];

    if (reaction.text === '👍') {
        await sock.sendMessage(remoteJid, { text: `🎼 Descargando audio...` });
        await sock.sendMessage(remoteJid, { text: `${global.prefix}ytmp3 ${videoUrl}` });
    } else if (reaction.text === '❤️') {
        await sock.sendMessage(remoteJid, { text: `🎬 Descargando video...` });
        await sock.sendMessage(remoteJid, { text: `${global.prefix}ytmp4 ${videoUrl}` });
    }
});

// ESCUCHAR RESPUESTAS AL MENSAJE
sock.ev.on('messages.upsert', async (messageUpsert) => {
    const msg = messageUpsert.messages[0];
    if (!msg || !msg.message || !msg.message.conversation) return;

    const replyText = msg.message.conversation.toLowerCase().trim();
    const repliedTo = msg.message.extendedTextMessage?.contextInfo?.stanzaId;

    if (repliedTo && global.videoRequests && global.videoRequests[repliedTo]) {
        const { remoteJid, videoUrl } = global.videoRequests[repliedTo];

        if (replyText.includes('audio')) {
            await sock.sendMessage(remoteJid, { text: `🎼 Descargando audio...` });
            await sock.sendMessage(remoteJid, { text: `${global.prefix}ytmp3 ${videoUrl}` });
        } else if (replyText.includes('video')) {
            await sock.sendMessage(remoteJid, { text: `🎬 Descargando video...` });
            await sock.sendMessage(remoteJid, { text: `${global.prefix}ytmp4 ${videoUrl}` });
        }
    }
});
                          
            case 'ytmp3': {
    const fs = require('fs');
    const path = require('path');
    const fetch = require('node-fetch');
    const ytdl = require('./libs/ytdl');
    const yts = require('yt-search');

    if (!args.length || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(args[0])) {
        return sock.sendMessage(msg.key.remoteJid, { text: 'Por favor, ingresa un enlace de YouTube válido.' });
    }

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

        case "setprefix":
    if (!isOwner(sender)) {
        await sock.sendMessage(msg.key.remoteJid, { text: "⛔ Solo los dueños pueden cambiar el prefijo." });
        return;
    }
    if (!args[0]) {
        await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes especificar un nuevo prefijo." });
        return;
    }
    if (!isValidPrefix(args[0])) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Prefijo inválido. Usa un solo carácter o un emoji de la lista permitida."
        });
        return;
    }
    setPrefix(args[0]);
    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Prefijo cambiado a: *${args[0]}* 🚀` });
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
