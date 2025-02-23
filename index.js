(async () => {
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
    const chalk = require("chalk");
    const figlet = require("figlet");
    const fs = require("fs");
    const readline = require("readline");
    const pino = require("pino");
    const { isOwner, setPrefix } = require("./config"); 
    const { handleCommand } = require("./main"); 

    // Carga de credenciales y estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState("./sessions");

    // Configuración de consola
    console.log(chalk.cyan(figlet.textSync("Azura Ultra Bot", { font: "Standard" })));    
    console.log(chalk.green("Iniciando conexión..."));

    // Manejo de entrada de usuario
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));

    let method = "1"; // Por defecto: Código QR
    if (!fs.existsSync("./sessions/creds.json")) {
        method = await question("¿Cómo deseas conectarte? (1: Código QR, 2: Código de 8 dígitos) > ");
        if (!["1", "2"].includes(method)) {
            console.log(chalk.red("❌ Opción inválida. Reinicia el bot y elige 1 o 2."));
            process.exit(1);
        }
    }

    async function startBot() {
        try {
            let { version } = await fetchLatestBaileysVersion();
            const socketSettings = {
                printQRInTerminal: method === "1",
                logger: pino({ level: "silent" }),
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
                browser: method === "1" ? ["AzuraBot", "Safari", "1.0.0"] : ["Ubuntu", "Chrome", "20.0.04"],
            };

            const sock = makeWASocket(socketSettings);

            // Si la sesión no existe y se usa el código de 8 dígitos
            if (!fs.existsSync("./sessions/creds.json") && method === "2") {
                let phoneNumber = await question("📞 Ingresa tu número (Ej: 5491168XXXX): ");
                phoneNumber = phoneNumber.replace(/\D/g, "");
                setTimeout(async () => {
                    let code = await sock.requestPairingCode(phoneNumber);
                    console.log(chalk.magenta("🔑 Código de vinculación: ") + chalk.yellow(code.match(/.{1,4}/g).join("-")));
                }, 2000);
            }

            // Función para verificar si un usuario es administrador en un grupo
            async function isAdmin(sock, chatId, sender) {
                try {
                    const groupMetadata = await sock.groupMetadata(chatId);
                    const admins = groupMetadata.participants
                        .filter(p => p.admin)
                        .map(p => p.id);
                    return admins.includes(sender) || isOwner(sender);
                } catch (error) {
                    console.error("Error verificando administrador:", error);
                    return false;
                }
            }

            // 🟢 Consola de mensajes entrantes con diseño
            sock.ev.on("messages.upsert", async (messageUpsert) => {
                const msg = messageUpsert.messages[0];
                if (!msg) return;

                const sender = msg.key.remoteJid.replace(/[^0-9]/g, ""); // Extrae solo el número
                const fromMe = msg.key.fromMe ? chalk.blue("[Tú]") : chalk.red("[Usuario]");
                let messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "📂 Mensaje no compatible";

                console.log(chalk.yellow(`\n📩 Nuevo mensaje recibido`));
                console.log(chalk.green(`📨 De: ${fromMe} ${chalk.bold(sender)}`));
                console.log(chalk.cyan(`💬 Mensaje: ${chalk.bold(messageText)}`));
                console.log(chalk.gray("──────────────────────────"));

                // Detectar si es un comando
                if (messageText.startsWith(global.prefix)) {
                    const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
                    const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");
                    
                    if (command === "setprefix" && isOwner(sender)) {
                        if (!args[0]) {
                            sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes especificar un nuevo prefijo." });
                            return;
                        }
                        setPrefix(args[0]);
                        sock.sendMessage(msg.key.remoteJid, { text: `✅ Prefijo cambiado a: *${args[0]}*` });
                        return;
                    }

                    // Enviar el comando a `main.js`
                    handleCommand(sock, msg, command, args, sender, isAdmin);
                }
            });

            sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (connection === "connecting") {
                    console.log(chalk.blue("🔄 Conectando a WhatsApp..."));
                } else if (connection === "open") {
                    console.log(chalk.green("✅ ¡Conexión establecida con éxito!"));
                } else if (connection === "close") {
                    console.log(chalk.red("❌ Conexión cerrada. Intentando reconectar en 5 segundos..."));
                    setTimeout(startBot, 5000); // Intentar reconectar después de 5 segundos
                }
            });

            sock.ev.on("creds.update", saveCreds);

            // Manejo de errores global para evitar que el bot se detenga
            process.on("uncaughtException", (err) => {
                console.error(chalk.red("⚠️ Error no manejado:"), err);
            });

            process.on("unhandledRejection", (reason, promise) => {
                console.error(chalk.red("🚨 Promesa rechazada sin manejar:"), promise, "razón:", reason);
            });

        } catch (error) {
            console.error(chalk.red("❌ Error en la conexión:"), error);
            console.log(chalk.blue("🔄 Reiniciando en 5 segundos..."));
            setTimeout(startBot, 5000); // Intentar reconectar después de 5 segundos en caso de error
        }
    }

    startBot();
})();
