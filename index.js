(async () => {
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
    const chalk = require("chalk");
    const figlet = require("figlet");
    const fs = require("fs");
    const readline = require("readline");
    const pino = require("pino");
    const { isOwner, getPrefix, allowedPrefixes } = require("./config");
    const { handleCommand } = require("./main"); 
const path = "./activos.json";

// 📂 Cargar configuración de modos desde el archivo JSON
function cargarModos() {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify({ modoPrivado: false, modoAdmins: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}

// 📂 Guardar configuración de modos en el archivo JSON
function guardarModos(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

let modos = cargarModos();
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
    try {
        const msg = messageUpsert.messages[0];
        if (!msg) return;

        const sender = msg.key.remoteJid.replace(/[^0-9]/g, ""); // Extrae solo el número
        const fromMe = msg.key.fromMe ? chalk.blue("[Tú]") : chalk.red("[Usuario]");
        let messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        let messageType = Object.keys(msg.message || {})[0]; // Tipo de mensaje (text, image, video, etc.)
        const chatId = msg.key.remoteJid; // ID del grupo o usuario

        // 🔥 Detectar si el mensaje fue eliminado
        if (msg.message?.protocolMessage?.type === 0) {
            console.log(chalk.red(`🗑️ Un mensaje fue eliminado por ${sender}`));
            return;
        }

        // 🔍 Mostrar en consola el mensaje recibido
        console.log(chalk.yellow(`\n📩 Nuevo mensaje recibido`));
        console.log(chalk.green(`📨 De: ${fromMe} ${chalk.bold(sender)}`));
        console.log(chalk.cyan(`💬 Tipo: ${messageType}`));
        console.log(chalk.cyan(`💬 Mensaje: ${chalk.bold(messageText || "📂 (Mensaje multimedia)")}`));
        console.log(chalk.gray("──────────────────────────"));

        // ⚠️ Si el "modo privado" está activado y el usuario no es dueño ni el bot, ignorar mensaje
        if (modos.modoPrivado && !isOwner(sender) && !msg.key.fromMe) return;

        // ⚠️ Si el "modo admins" está activado en este grupo y el usuario no es admin, dueño o el bot, ignorar mensaje
        if (modos.modoAdmins[chatId]) {
            const chat = await sock.groupMetadata(chatId).catch(() => null);
            const isAdmin = chat ? chat.participants.some(p => p.id.includes(sender) && p.admin) : false;
            if (!isAdmin && !isOwner(sender) && !msg.key.fromMe) return;
        }

        // ✅ Detectar si es un comando
        if (messageText.startsWith(global.prefix)) {
            const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
            const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");

            // ⚙️ Comando para activar/desactivar "modo privado"
            if (command === "modoprivado" && isOwner(sender)) {
                if (!["on", "off"].includes(args[0])) {
                    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Usa `.modoprivado on` o `.modoprivado off`" });
                    return;
                }
                modos.modoPrivado = args[0] === "on";
                guardarModos(modos);
                await sock.sendMessage(msg.key.remoteJid, { text: `🔒 *Modo privado ${args[0] === "on" ? "activado" : "desactivado"}*` });
                return;
            }

            // ⚙️ Comando para activar/desactivar "modo admins" solo en el grupo donde se usa
            if (command === "modoadmins") {
                const chat = await sock.groupMetadata(chatId).catch(() => null);
                const isAdmin = chat ? chat.participants.some(p => p.id.includes(sender) && p.admin) : false;

                if (!isAdmin && !isOwner(sender) && !msg.key.fromMe) {
                    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ *Solo los administradores pueden usar este comando.*" });
                    return;
                }

                if (!["on", "off"].includes(args[0])) {
                    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Usa `.modoadmins on` o `.modoadmins off` en un grupo." });
                    return;
                }

                if (args[0] === "on") {
                    modos.modoAdmins[chatId] = true; // Activar en este grupo
                } else {
                    delete modos.modoAdmins[chatId]; // Desactivar en este grupo
                }

                guardarModos(modos);
                await sock.sendMessage(msg.key.remoteJid, { text: `👑 *Modo admins ${args[0] === "on" ? "activado" : "desactivado"} en este grupo*` });
                return;
            }

            // 🔄 Enviar el comando a `main.js`
            handleCommand(sock, msg, command, args, sender);
        }

    } catch (error) {
        console.error("❌ Error en el evento messages.upsert:", error);
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
