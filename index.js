(async () => { const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys"); const chalk = require("chalk"); const figlet = require("figlet"); const fs = require("fs"); const readline = require("readline"); const pino = require("pino"); const { isOwner, getPrefix, allowedPrefixes } = require("./config"); const { handleCommand } = require("./main");

const subbotsFile = "./subbots.json";
if (!fs.existsSync(subbotsFile)) {
    fs.writeFileSync(subbotsFile, JSON.stringify({}, null, 2));
}

async function generateSubBotCode(sock, phoneNumber) {
    try {
        phoneNumber = phoneNumber.replace(/\D/g, "");
        const code = await sock.requestPairingCode(phoneNumber);
        return code.match(/.{1,4}/g).join("-");
    } catch (error) {
        console.error("❌ Error generando código de sub-bot:", error);
        return null;
    }
}

async function startBot() {
    try {
        let { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState("./sessions");
        const sock = makeWASocket({
            printQRInTerminal: true,
            logger: pino({ level: "silent" }),
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
            browser: ["AzuraBot", "Safari", "1.0.0"],
        });

        console.log(chalk.cyan(figlet.textSync("Azura Ultra Bot", { font: "Standard" })));
        console.log(chalk.green("Iniciando conexión..."));

        sock.ev.on("messages.upsert", async (messageUpsert) => {
            const msg = messageUpsert.messages[0];
            if (!msg) return;

            const sender = msg.key.remoteJid.replace(/[^0-9]/g, "");
            const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "📂 Mensaje no compatible";

            if (messageText.startsWith(global.prefix)) {
                const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
                const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");
                
                if (command === "serbot") {
                    if (!args[0]) {
                        return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes proporcionar un número de teléfono válido." });
                    }
                    const phoneNumber = args[0];
                    const subBotCode = await generateSubBotCode(sock, phoneNumber);
                    if (!subBotCode) {
                        return sock.sendMessage(msg.key.remoteJid, { text: "❌ No se pudo generar el código de vinculación. Intenta de nuevo." });
                    }
                    let subbots = JSON.parse(fs.readFileSync(subbotsFile, "utf-8"));
                    subbots[sender] = { code: subBotCode, mode: "privado", status: "activo" };
                    fs.writeFileSync(subbotsFile, JSON.stringify(subbots, null, 2));
                    return sock.sendMessage(msg.key.remoteJid, { text: `✅ *Sub-bot registrado.*\n🔑 Código: ${subBotCode}\n🔒 Modo por defecto: Privado` });
                }

                if (command === "subot") {
                    let subbots = JSON.parse(fs.readFileSync(subbotsFile, "utf-8"));
                    if (Object.keys(subbots).length === 0) {
                        return sock.sendMessage(msg.key.remoteJid, { text: "🚫 No hay sub-bots conectados." });
                    }
                    let message = "🤖 *Lista de Sub-Bots Activos:*\n\n";
                    Object.keys(subbots).forEach(bot => {
                        message += `🔹 *ID:* ${bot}\n🔑 *Código:* ${subbots[bot].code}\n🔒 *Modo:* ${subbots[bot].mode}\n\n`;
                    });
                    return sock.sendMessage(msg.key.remoteJid, { text: message });
                }
                
                handleCommand(sock, msg, command, args, sender);
            }
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection } = update;
            if (connection === "connecting") {
                console.log(chalk.blue("🔄 Conectando a WhatsApp..."));
            } else if (connection === "open") {
                console.log(chalk.green("✅ ¡Conexión establecida con éxito!"));
            } else if (connection === "close") {
                console.log(chalk.red("❌ Conexión cerrada. Intentando reconectar en 5 segundos..."));
                setTimeout(startBot, 5000);
            }
        });

        sock.ev.on("creds.update", saveCreds);
    } catch (error) {
        console.error(chalk.red("❌ Error en la conexión:"), error);
        console.log(chalk.blue("🔄 Reiniciando en 5 segundos..."));
        setTimeout(startBot, 5000);
    }
}

startBot();

})();

