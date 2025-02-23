const fs = require("fs");
const chalk = require("chalk");
const { isOwner } = require("./config");

// Cargar prefijo desde config.json si existe, sino usar "."
if (fs.existsSync("./config.json")) {
    let configData = JSON.parse(fs.readFileSync("./config.json"));
    global.prefix = configData.prefix || ".";
} else {
    global.prefix = ".";
}

// Verifica que el prefijo tenga 1 carácter o un emoji completo
function isValidPrefix(prefix) {
    return typeof prefix === "string" && (prefix.length === 1 || prefix.length > 1 && [...prefix].length === 1);
}

// Guarda el prefijo en config.json
function savePrefix(newPrefix) {
    global.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify({ prefix: newPrefix }, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
}

// Manejador de comandos
async function handleCommand(sock, msg, command, args, sender) {
    const lowerCommand = command.toLowerCase();

    switch (lowerCommand) {
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
                    text: "❌ Prefijo inválido. Usa un solo carácter o un emoji."
                });
                return;
            }
            savePrefix(args[0]);
            await sock.sendMessage(msg.key.remoteJid, { text: `✅ Prefijo cambiado a: *${args[0]}*` });
            break;
// 📌 Comando para CERRAR grupo (Solo admins y owners)

case 'cerrargrupo': {
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
}
break;

case 'abrirgrupo': {
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
}
break;

case 'kick': {
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

        // 📌 1️⃣ Verificar si el usuario fue mencionado
        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        // 📌 2️⃣ Verificar si se respondió a un mensaje
        if (!userToKick && msg.message.extendedTextMessage?.contextInfo?.participant) {
            userToKick = msg.message.extendedTextMessage.contextInfo.participant;
        }

        // ⚠️ Si no hay usuario seleccionado, enviar error
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
}
break;

        
        case "owner":
            await sock.sendMessage(msg.key.remoteJid, {
                text: `👑 *Lista de Owners:* \n${global.owner.map(o => `📌 ${o[1] || "Sin nombre"} - ${o[0]}`).join("\n")}`
            });
            break;

        default:
            // Comando desconocido: No enviar respuesta, solo ignorar
            break;
    }
}

module.exports = { handleCommand };
