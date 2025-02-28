(async () => {
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
    const chalk = require("chalk");
    const figlet = require("figlet");
    const fs = require("fs");
    const readline = require("readline");
    const pino = require("pino");
    const { isOwner, getPrefix, allowedPrefixes } = require("./config");
    const { handleCommand } = require("./main"); 
    // Carga de credenciales y estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState("./sessions");
//privado y admins

// Ruta del archivo JSON de configuración
const activosFile = "./activos.json";

// Función para cargar el archivo `activos.json`
function cargarActivos() {
    if (!fs.existsSync(activosFile)) {
        const datosIniciales = { modoPrivado: false, modoAdmins: {}, geminiActivos: {} };
        fs.writeFileSync(activosFile, JSON.stringify(datosIniciales, null, 2));
    }
    return JSON.parse(fs.readFileSync(activosFile, "utf-8"));
}

// Función para guardar cambios en `activos.json`
function guardarActivos(datos) {
    fs.writeFileSync(activosFile, JSON.stringify(datos, null, 2));
}

// Cargar los datos al iniciar el bot
let activos = cargarActivos();
    
    // Configuración de consola
    console.log(chalk.cyan(figlet.textSync("Azura Ultra Bot", { font: "Standard" })));    
    console.log(chalk.green("\n✅ Iniciando conexión...\n"));
    
    // ✅ Mostrar opciones de conexión bien presentadas
    console.log(chalk.yellow("📡 ¿Cómo deseas conectarte?\n"));
    console.log(chalk.green("  [1] ") + chalk.white("📷 Escanear código QR"));
    console.log(chalk.green("  [2] ") + chalk.white("🔑 Ingresar código de 8 dígitos\n"));

    // Manejo de entrada de usuario
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));

    let method = "1"; // Por defecto: Código QR
    if (!fs.existsSync("./sessions/creds.json")) {
        method = await question(chalk.magenta("📞 Ingresa tu número (Ej: 5491168XXXX) "));

        if (!["1", "2"].includes(method)) {
            console.log(chalk.red("\n❌ Opción inválida. Reinicia el bot y elige 1 o 2."));
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
                let phoneNumber = await question("😎Fino vamos aya😎: ");
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
// Almacenar los usuarios en línea por cada grupo

// Almacenar los usuarios en línea por cada grupo (hacerlo accesible globalmente)
global.onlineUsers = {};
// Detectar cambios de presencia (quién está en línea y quién no)
// Detectar cambios de presencia (quién está en línea y quién no)
sock.ev.on("presence.update", async (presence) => {
    const chatId = presence.id;
    const userId = presence.participant;

    if (!chatId.endsWith("@g.us")) return; // Solo en grupos

    if (presence.presence === "available") {
        if (!global.onlineUsers[chatId]) global.onlineUsers[chatId] = new Set();
        global.onlineUsers[chatId].add(userId);
    } else if (presence.presence === "unavailable" || presence.presence === "composing") {
        if (global.onlineUsers[chatId]) global.onlineUsers[chatId].delete(userId);
    }
});

            
            // 🟢 Consola de mensajes entrantes con diseño
sock.ev.on("messages.upsert", async (messageUpsert) => {
    try {
        const msg = messageUpsert.messages[0];
        if (!msg) return;

        const chatId = msg.key.remoteJid; // ID del chat o grupo
        const isGroup = chatId.endsWith("@g.us"); // Verifica si es un grupo
        const sender = msg.key.participant ? msg.key.participant.replace(/[^0-9]/g, "") : msg.key.remoteJid.replace(/[^0-9]/g, "");
        const botNumber = sock.user.id.split(":")[0];
        const fromMe = msg.key.fromMe || sender === botNumber;
        let messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        let messageType = Object.keys(msg.message || {})[0];

        // 🔥 Detectar mensaje eliminado
        if (msg.message?.protocolMessage?.type === 0) {
            console.log(`🗑️ Un mensaje fue eliminado por ${sender}`);
            return;
        }

        // 🔍 Mostrar en consola el mensaje recibido
        console.log(`📩 Nuevo mensaje recibido`);
        console.log(`📨 De: ${fromMe ? "[Tú]" : "[Usuario]"} ${sender}`);
        console.log(`💬 Tipo: ${messageType}`);
        console.log(`💬 Mensaje: ${messageText || "📂 (Mensaje multimedia)"}`);
        console.log(`──────────────────────────`);

        // 🔽 Cargar configuraciones
        let activosData = cargarActivos();

        // ⚠️ Si el "modo privado" está activado y el usuario no es dueño ni el bot, ignorar mensaje
        if (activosData.modoPrivado && !isOwner(sender) && !fromMe) return;

        // ⚠️ Si el "modo admins" está activado en este grupo, validar si el usuario es admin o owner
        if (isGroup && activosData.modoAdmins[chatId]) {
            const chatMetadata = await sock.groupMetadata(chatId).catch(() => null);
            if (chatMetadata) {
                const participant = chatMetadata.participants.find(p => p.id.includes(sender));
                const isAdmin = participant ? (participant.admin === "admin" || participant.admin === "superadmin") : false;
                if (!isAdmin && !isOwner(sender) && !fromMe) return;
            }
        }

        // ✅ Detectar si es un comando
        if (messageText.startsWith(global.prefix)) {
            const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
            const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");

            // ⚙️ Comando para activar/desactivar Gemini en este chat
            if (command === "geminis") {
                if (!["on", "off"].includes(args[0])) {
                    await sock.sendMessage(chatId, { 
                        text: `⚠️ *Uso incorrecto.*\n\n📌 Usa:\n   🔹 \`${global.prefix}geminis on\` para activarlo.\n   🔹 \`${global.prefix}geminis off\` para desactivarlo.` 
                    }, { quoted: msg });
                    return;
                }

                if (args[0] === 'on') {
                    activosData.geminiActivos[chatId] = true;
                    guardarActivos(activosData);
                    await sock.sendMessage(chatId, { 
                        text: "✅ *Gemini ha sido activado en este chat.*\n\n🤖 Ahora responderá automáticamente a todos los mensajes."
                    }, { quoted: msg });
                } else if (args[0] === 'off') {
                    delete activosData.geminiActivos[chatId];
                    guardarActivos(activosData);
                    await sock.sendMessage(chatId, { 
                        text: "🛑 *Gemini ha sido desactivado en este chat.*\n\n🤖 Ya no responderá automáticamente."
                    }, { quoted: msg });
                }
                return;
            }

            // 🔄 Enviar el comando a `main.js`
            handleCommand(sock, msg, command, args, sender);
        }

        // **🔹 Interceptar mensajes y responder con Gemini si está activado en este chat 🔹**
        if (activosData.geminiActivos[chatId]) {
            if (!messageText) return; // Ignorar si no es texto

            // 🔄 Reacción mientras procesa la respuesta
            await sock.sendMessage(chatId, { react: { text: "🤖", key: msg.key } });

            try {
                const respuesta = await fetch(`https://api.dorratz.com/ai/gemini?prompt=${encodeURIComponent(messageText)}`);
                const data = await respuesta.json();

                if (data && data.response) {
                    await sock.sendMessage(chatId, { text: `🤖 *Gemini:* ${data.response}` }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: "❌ *No pude generar una respuesta en este momento.*" }, { quoted: msg });
                }
            } catch (error) {
                console.error("❌ Error al conectar con Gemini:", error);
                await sock.sendMessage(chatId, { text: "❌ *Error: No se pudo obtener una respuesta de Gemini.*" }, { quoted: msg });
            }
        }
    } catch (error) {
        console.error("❌ Error en el evento messages.upsert:", error);
    }
});


    //coneccion        
            sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "connecting") {
        console.log(chalk.blue("🔄 Conectando a WhatsApp..."));
    } else if (connection === "open") {
        console.log(chalk.green("✅ ¡Conexión establecida con éxito!"));

        // 📌 Verificar si el bot se reinició con .rest y enviar mensaje
        const restarterFile = "./lastRestarter.json";
        if (fs.existsSync(restarterFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(restarterFile, "utf-8"));
                if (data.chatId) {
                    await sock.sendMessage(data.chatId, { text: "✅ *El bot está en línea nuevamente tras el reinicio.* 🚀" });
                    console.log(chalk.green("📢 Notificación enviada al chat del reinicio."));
                    fs.unlinkSync(restarterFile); // 🔄 Eliminar el archivo después de enviar el mensaje
                }
            } catch (error) {
                console.error("❌ Error al procesar lastRestarter.json:", error);
            }
        }
    } else if (connection === "close") {
        console.log(chalk.red("❌ Conexión cerrada. Intentando reconectar en 5 segundos..."));
        setTimeout(startBot, 5000);
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
