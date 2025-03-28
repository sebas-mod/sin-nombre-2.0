
const fs = require("fs");
const chalk = require("chalk");
const { isOwner, setPrefix, allowedPrefixes } = require("./config");
const axios = require("axios");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const os = require("os");
const { execSync } = require("child_process");
const path = require("path");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, toAudio } = require('./libs/fuctions');

const stickersDir = "./stickers";
const stickersFile = "./stickers.json";
global.zrapi = `ex-9bf9dc0318`;

// Crear carpetas y archivos iniciales si no existen
if (!fs.existsSync(stickersDir)) fs.mkdirSync(stickersDir, { recursive: true });
if (!fs.existsSync(stickersFile)) fs.writeFileSync(stickersFile, JSON.stringify({}, null, 2));

const rpgFile = "./rpg.json";
if (!fs.existsSync(rpgFile)) {
    const rpgDataInicial = { usuarios: {}, tiendaMascotas: [], tiendaPersonajes: [], mercadoPersonajes: [] };
    fs.writeFileSync(rpgFile, JSON.stringify(rpgDataInicial, null, 2));
}
let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
function saveRpgData() {
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
}

const configFilePath = "./config.json";
function loadPrefix() {
    if (fs.existsSync(configFilePath)) {
        let configData = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
        global.prefix = configData.prefix || ".";
    } else {
        global.prefix = ".";
    }
}
loadPrefix();
console.log(`📌 Prefijo actual: ${global.prefix}`);

const guarFilePath = "./guar.json";
if (!fs.existsSync(guarFilePath)) fs.writeFileSync(guarFilePath, JSON.stringify({}, null, 2));

function saveMultimedia(key, data) {
    let guarData = JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
    guarData[key] = data;
    fs.writeFileSync(guarFilePath, JSON.stringify(guarData, null, 2));
}
function getMultimediaList() {
    return JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
}
function isValidPrefix(prefix) {
    return typeof prefix === "string" && (prefix.length === 1 || (prefix.length > 1 && [...prefix].length === 1));
}
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    return res.json();
}
async function remini(imageData, operation) {
    return new Promise(async (resolve, reject) => {
        const availableOperations = ["enhance", "recolor", "dehaze"];
        if (!availableOperations.includes(operation)) operation = availableOperations[0];
        const baseUrl = `https://inferenceengine.vyro.ai/${operation}.vyro`;
        const formData = new FormData();
        formData.append("image", Buffer.from(imageData), { filename: "enhance_image_body.jpg", contentType: "image/jpeg" });
        formData.append("model_version", 1, {
            "Content-Transfer-Encoding": "binary",
            contentType: "multipart/form-data; charset=utf-8"
        });
        formData.submit({
            url: baseUrl,
            host: "inferenceengine.vyro.ai",
            path: `/${operation}`,
            protocol: "https:",
            headers: {
                "User-Agent": "okhttp/4.9.3",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip"
            }
        }, function (err, res) {
            if (err) return reject(err);
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        });
    });
}
async function isAdmin(sock, chatId, sender) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        return admins.includes(sender.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
    } catch (error) {
        console.error("⚠️ Error verificando administrador:", error);
        return false;
    }
}
function savePrefix(newPrefix) {
    global.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify({ prefix: newPrefix }, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
}
async function handleDeletedMessage(sock, msg) {
    if (!global.viewonce) return;
    const chatId = msg.key.remoteJid;
    const deletedMessage = msg.message;
    if (deletedMessage) {
        await sock.sendMessage(chatId, {
            text: `⚠️ *Mensaje eliminado reenviado:*

${deletedMessage.conversation || deletedMessage.extendedTextMessage?.text || ''}`
        });
        if (deletedMessage.imageMessage) {
            const imageBuffer = await downloadContentFromMessage(deletedMessage.imageMessage, 'image');
            await sock.sendMessage(chatId, { image: imageBuffer }, { quoted: msg });
        } else if (deletedMessage.audioMessage) {
            const audioBuffer = await downloadContentFromMessage(deletedMessage.audioMessage, 'audio');
            await sock.sendMessage(chatId, { audio: audioBuffer }, { quoted: msg });
        } else if (deletedMessage.videoMessage) {
            const videoBuffer = await downloadContentFromMessage(deletedMessage.videoMessage, 'video');
            await sock.sendMessage(chatId, { video: videoBuffer }, { quoted: msg });
        }
    }
}
function loadPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginDir)) return plugins;
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const plugin = require(path.join(pluginDir, file));
        if (plugin && plugin.command) plugins.push(plugin);
    }
    return plugins;
}

const plugins = loadPlugins();

async function handleCommand(sock, msg, command, args, sender) {
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");
    global.viewonce = true;

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
            quoted: quoted ? quoted : msg,
            ephemeralExpiration: 24 * 60 * 100,
            disappearingMessagesInChat: 24 * 60 * 100
        });
        return buffer;
    };

    // Si existe un plugin para este comando
    const plugin = plugins.find(p => p.command.includes(lowerCommand));
    if (plugin) {
        return plugin.default(msg, {
            conn: sock,
            text,
            args,
            command: lowerCommand,
            usedPrefix: global.prefix
        });
    }

    // Si no existe plugin, usar el sistema case
    switch (lowerCommand) {
        case 'ping':
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong' }, { quoted: msg });
            break;
        
        
    }
}

module.exports = { handleCommand };
