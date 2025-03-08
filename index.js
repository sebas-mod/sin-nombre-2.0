(async () => {
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage } = require("@whiskeysockets/baileys");
    const chalk = require("chalk");
    const figlet = require("figlet");
    const fs = require("fs");
    const readline = require("readline");
    const pino = require("pino");
    const { isOwner, getPrefix, allowedPrefixes } = require("./config");
    const { handleCommand } = require("./main"); 
    // Carga de credenciales y estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState("./sessions");
//lista
function isAllowedUser(sender) {
  const listaFile = "./lista.json";
  if (!fs.existsSync(listaFile)) return false;
  const lista = JSON.parse(fs.readFileSync(listaFile, "utf-8"));
  // Extrae solo los dígitos del número para comparar
  const num = sender.replace(/\D/g, "");
  return lista.includes(num);
}
//antidelete
const pathAntidelete = './antidelete.json';

// Si el archivo no existe, lo creamos con un objeto vacío
if (!fs.existsSync(pathAntidelete)) {
  fs.writeFileSync(pathAntidelete, JSON.stringify({}, null, 2));
  console.log('antidelete.json creado correctamente.');
} else {
  console.log('antidelete.json ya existe.');
}    
    
    //privado y admins

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

// Listener para detectar cambios en los participantes de un grupo (bienvenida y despedida)
sock.ev.on("group-participants.update", async (update) => {
  try {
    // Solo operar en grupos
    if (!update.id.endsWith("@g.us")) return;

    const fs = require("fs");
    const activosPath = "./activos.json";
    let activos = {};
    if (fs.existsSync(activosPath)) {
      activos = JSON.parse(fs.readFileSync(activosPath, "utf-8"));
    }

    // ***************** LÓGICA ANTIARABE *****************
    // Si la función antiarabe está activada en este grupo...
    if (activos.antiarabe && activos.antiarabe[update.id]) {
      // Lista de prefijos prohibidos (sin el signo +)
      const disallowedPrefixes = ["20", "212", "213", "216", "218", "222", "249", "252", "253", "269", "962", "963", "964", "965", "966", "967", "968", "970", "971", "973", "974"];
      if (update.action === "add") {
        // Obtener metadata del grupo para verificar administradores
        let groupMetadata = {};
        try {
          groupMetadata = await sock.groupMetadata(update.id);
        } catch (err) {
          console.error("Error obteniendo metadata del grupo:", err);
        }
        for (const participant of update.participants) {
          // Extraer el número (la parte antes de "@")
          const phoneNumber = participant.split("@")[0];
          // Comprobar si el número comienza con alguno de los prefijos prohibidos
          const isDisallowed = disallowedPrefixes.some(prefix => phoneNumber.startsWith(prefix));
          if (isDisallowed) {
            // Verificar si el usuario es admin o propietario
            let bypass = false;
            const participantInfo = groupMetadata.participants.find(p => p.id === participant);
            if (participantInfo && (participantInfo.admin === "admin" || participantInfo.admin === "superadmin")) {
              bypass = true;
            }
            if (!bypass && !isOwner(participant)) {
              // Enviar aviso mencionando al usuario
              await sock.sendMessage(update.id, {
                text: `⚠️ @${phoneNumber} tiene un número prohibido y será expulsado.`,
                mentions: [participant]
              });
              // Intentar expulsar al usuario
              try {
                await sock.groupParticipantsUpdate(update.id, [participant], "remove");
              } catch (expulsionError) {
                console.error("Error al expulsar al usuario:", expulsionError);
              }
            }
          }
        }
      }
    }
    // **************** FIN LÓGICA ANTIARABE ****************

    // **************** LÓGICA BIENVENIDA/DESPEDIDA ****************
    // Si la función welcome no está activada en este grupo, salimos
    if (!activos.welcome || !activos.welcome[update.id]) return;

    // Textos integrados para bienvenida y despedida
    const welcomeTexts = [
      "¡Bienvenido(a)! Azura Ultra 2.0 Bot te recibe con los brazos abiertos 🤗✨. ¡Disfruta y comparte!",
      "¡Hola! Azura Ultra 2.0 Bot te abraza con alegría 🎉🤖. ¡Prepárate para grandes aventuras!",
      "¡Saludos! Azura Ultra 2.0 Bot te da la bienvenida para que descubras ideas brillantes 🚀🌟.",
      "¡Bienvenido(a) al grupo! Azura Ultra 2.0 Bot te invita a explorar un mundo de posibilidades 🤩💡.",
      "¡Qué alegría verte! Azura Ultra 2.0 Bot te recibe y te hace sentir en casa 🏠💖.",
      "¡Hola! Gracias por unirte; Azura Ultra 2.0 Bot te saluda con entusiasmo 🎊😊.",
      "¡Bienvenido(a)! Cada nuevo miembro es una chispa de inspiración en Azura Ultra 2.0 Bot 🔥✨.",
      "¡Saludos cordiales! Azura Ultra 2.0 Bot te envía un abrazo virtual 🤗💙.",
      "¡Bienvenido(a)! Únete a la experiencia Azura Ultra 2.0 Bot y comparte grandes ideas 🎉🌈.",
      "¡Hola! Azura Ultra 2.0 Bot te da la bienvenida para vivir experiencias inolvidables 🚀✨!"
    ];
    const farewellTexts = [
      "¡Adiós! Azura Ultra 2.0 Bot te despide con gratitud y te desea éxitos en tus nuevos caminos 👋💫.",
      "Hasta pronto, desde Azura Ultra 2.0 Bot te deseamos lo mejor y esperamos verte de nuevo 🌟🙏.",
      "¡Chao! Azura Ultra 2.0 Bot se despide, pero siempre tendrás un lugar si decides regresar 🤗💔.",
      "Nos despedimos con cariño; gracias por compartir momentos en Azura Ultra 2.0 Bot 🏠❤️.",
      "¡Adiós, amigo(a)! Azura Ultra 2.0 Bot te manda un abrazo y te desea mucha suerte 🤝🌟.",
      "Hasta luego, y gracias por haber sido parte de nuestra comunidad 🚀💙.",
      "Chao, que tus futuros proyectos sean tan brillantes como tú 🌟✨. Azura Ultra 2.0 Bot te recuerda siempre.",
      "¡Nos vemos! Azura Ultra 2.0 Bot te dice adiós con un corazón lleno de gratitud 🤗❤️.",
      "¡Adiós! Que tu camino esté lleno de éxitos, te lo desea Azura Ultra 2.0 Bot 🚀🌟.",
      "Hasta pronto, y gracias por haber compartido momentos inolvidables con Azura Ultra 2.0 Bot 👋💖."
    ];

    // Procesar según la acción: "add" (entrada) o "remove" (salida)
    if (update.action === "add") {
      for (const participant of update.participants) {
        const mention = `@${participant.split("@")[0]}`;
        const mensajeTexto = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
        const option = Math.random();
        if (option < 0.33) {
          // Opción 1: Con foto del usuario (si se puede obtener, sino URL por defecto)
          let profilePicUrl;
          try {
            profilePicUrl = await sock.profilePictureUrl(participant, "image");
          } catch (err) {
            profilePicUrl = "https://cdn.dorratz.com/files/1741323171822.jpg";
          }
          await sock.sendMessage(update.id, {
            image: { url: profilePicUrl },
            caption: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        } else if (option < 0.66) {
          // Opción 2: Con la descripción del grupo (si está disponible)
          let groupDesc = "";
          try {
            const metadata = await sock.groupMetadata(update.id);
            groupDesc = metadata.desc ? `\n\n📜 *Descripción del grupo:*\n${metadata.desc}` : "";
          } catch (err) {
            groupDesc = "";
          }
          await sock.sendMessage(update.id, {
            text: `👋 ${mention}\n\n${mensajeTexto}${groupDesc}`,
            mentions: [participant]
          });
        } else {
          // Opción 3: Solo texto
          await sock.sendMessage(update.id, {
            text: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        }
      }
    } else if (update.action === "remove") {
      for (const participant of update.participants) {
        const mention = `@${participant.split("@")[0]}`;
        const mensajeTexto = farewellTexts[Math.floor(Math.random() * farewellTexts.length)];
        const option = Math.random();
        if (option < 0.5) {
          let profilePicUrl;
          try {
            profilePicUrl = await sock.profilePictureUrl(participant, "image");
          } catch (err) {
            profilePicUrl = "https://cdn.dorratz.com/files/1741323171822.jpg";
          }
          await sock.sendMessage(update.id, {
            image: { url: profilePicUrl },
            caption: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        } else {
          await sock.sendMessage(update.id, {
            text: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        }
      }
    }
    // **************** FIN LÓGICA BIENVENIDA/DESPEDIDA ****************

  } catch (error) {
    console.error("Error en el evento group-participants.update:", error);
  }
});
           
            // 🟢 Consola de mensajes entrantes con diseño
sock.ev.on("messages.upsert", async (messageUpsert) => {
  try {
    const msg = messageUpsert.messages[0];
    if (!msg) return;
    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith("@g.us");
    const sender = msg.key.participant
      ? msg.key.participant.replace(/[^0-9]/g, "")
      : msg.key.remoteJid.replace(/[^0-9]/g, "");
    const botNumber = sock.user.id.split(":")[0];
    const fromMe = msg.key.fromMe || sender === botNumber;
    let messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    let messageType = Object.keys(msg.message || {})[0];

    // Cargar la configuración de activos para antidelete
    const fs = require("fs");
    const pathActivos = "./activos.json";
    let activos = {};
    if (fs.existsSync(pathActivos)) {
      activos = JSON.parse(fs.readFileSync(pathActivos, "utf-8"));
    }

    // Ruta para el almacenamiento de mensajes antidelete
    const antideletePath = "./antidelete.json";
    let antideleteData = {};
    if (fs.existsSync(antideletePath)) {
      antideleteData = JSON.parse(fs.readFileSync(antideletePath, "utf-8"));
    }

    // Si es un evento de borrado (mensaje eliminado)
    if (msg.message?.protocolMessage?.type === 0) {
      if (isGroup && activos.antidelete && activos.antidelete[chatId]) {
        if (antideleteData[chatId] && antideleteData[chatId][msg.key.id]) {
          const storedMsg = antideleteData[chatId][msg.key.id];
          // Si el mensaje guardado tiene contenido multimedia
          if (storedMsg.media) {
            let mediaPayload = {};
            switch (storedMsg.messageType) {
              case "imageMessage":
                mediaPayload = { image: { url: storedMsg.media }, caption: storedMsg.text || "" };
                break;
              case "videoMessage":
                mediaPayload = { video: { url: storedMsg.media }, caption: storedMsg.text || "" };
                break;
              case "audioMessage":
                mediaPayload = { audio: { url: storedMsg.media } };
                break;
              case "documentMessage":
                mediaPayload = { document: { url: storedMsg.media }, caption: storedMsg.text || "" };
                break;
              case "stickerMessage":
                mediaPayload = { sticker: { url: storedMsg.media } };
                break;
              default:
                mediaPayload = { text: storedMsg.text || "" };
            }
            // Agregar indicativo de mensaje eliminado
            if (mediaPayload.caption !== undefined) {
              mediaPayload.caption = `⚠️ *Mensaje eliminado* por @${sender}\n\n` + mediaPayload.caption;
            } else if (mediaPayload.text !== undefined) {
              mediaPayload.text = `⚠️ *Mensaje eliminado* por @${sender}\n\n` + mediaPayload.text;
            }
            await sock.sendMessage(chatId, mediaPayload, { mentions: [msg.key.participant || msg.key.remoteJid] });
          } else {
            // Si es solo texto
            const reforwardText = `⚠️ *Mensaje eliminado* por @${sender}\n\n${storedMsg.text || ""}`;
            await sock.sendMessage(chatId, { text: reforwardText, mentions: [msg.key.participant || msg.key.remoteJid] });
          }
          // Eliminar el mensaje guardado para evitar reenviarlo varias veces
          delete antideleteData[chatId][msg.key.id];
          fs.writeFileSync(antideletePath, JSON.stringify(antideleteData, null, 2));
        }
      }
      return;
    } else {
      // Si es un mensaje nuevo y estamos en un grupo con antidelete activo
      if (isGroup && activos.antidelete && activos.antidelete[chatId]) {
        if (!antideleteData[chatId]) {
          antideleteData[chatId] = {};
        }
        // Si es un mensaje multimedia, se descarga y guarda en base64
        if (["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"].includes(messageType)) {
          try {
            const mediaData = await sock.downloadMediaMessage(msg);
            antideleteData[chatId][msg.key.id] = {
              text: messageText,
              media: mediaData, // Se asume que mediaData es una cadena base64 o URL
              messageType: messageType
            };
          } catch (mediaError) {
            console.error("Error descargando el medio:", mediaError);
            antideleteData[chatId][msg.key.id] = {
              text: messageText,
              messageType: messageType
            };
          }
        } else {
          // Para mensajes de texto u otros sin multimedia
          antideleteData[chatId][msg.key.id] = {
            text: messageText,
            messageType: messageType
          };
        }
        fs.writeFileSync(antideletePath, JSON.stringify(antideleteData, null, 2));
      }
    }

    // Mostrar en consola el mensaje recibido
    console.log(`\n📩 Nuevo mensaje recibido`);
    console.log(`📨 De: ${fromMe ? "[Tú]" : "[Usuario]"} ${sender}`);
    console.log(`💬 Tipo: ${messageType}`);
    console.log(`💬 Mensaje: ${messageText || "📂 (Mensaje multimedia)"}`);
    console.log("──────────────────────────");

    // Aquí sigue tu lógica de ANTILINK y manejo de comandos...
    if (!isGroup) {
      if (!fromMe && !isOwner(sender) && !isAllowedUser(sender)) return;
    } else {
      if (modos.modoPrivado && !fromMe && !isOwner(sender) && !isAllowedUser(sender)) return;
    }
    if (isGroup && modos.modoAdmins[chatId]) {
      const chatMetadata = await sock.groupMetadata(chatId).catch(() => null);
      if (chatMetadata) {
        const participant = chatMetadata.participants.find(p => p.id.includes(sender));
        const isAdmin = participant ? (participant.admin === "admin" || participant.admin === "superadmin") : false;
        if (!isAdmin && !isOwner(sender) && !fromMe) return;
      }
    }
    if (messageText.startsWith(global.prefix)) {
      const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
      const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");
      if (command === "modoprivado" && (isOwner(sender) || fromMe)) {
        if (!["on", "off"].includes(args[0])) {
          await sock.sendMessage(chatId, { text: "⚠️ Usa `.modoprivado on` o `.modoprivado off`" });
          return;
        }
        modos.modoPrivado = args[0] === "on";
        guardarModos(modos);
        await sock.sendMessage(chatId, { text: `🔒 *Modo privado ${args[0] === "on" ? "activado" : "desactivado"}*` });
        return;
      }
      if (command === "modoadmins" && isGroup) {
        const chatMetadata = await sock.groupMetadata(chatId).catch(() => null);
        if (!chatMetadata) return;
        const participant = chatMetadata.participants.find(p => p.id.includes(sender));
        const isAdmin = participant ? (participant.admin === "admin" || participant.admin === "superadmin") : false;
        if (!isAdmin && !isOwner(sender) && !fromMe) {
          await sock.sendMessage(chatId, { text: "⚠️ *Solo los administradores pueden usar este comando.*" });
          return;
        }
        if (!["on", "off"].includes(args[0])) {
          await sock.sendMessage(chatId, { text: "⚠️ Usa `.modoadmins on` o `.modoadmins off` en un grupo." });
          return;
        }
        if (args[0] === "on") {
          modos.modoAdmins[chatId] = true;
        } else {
          delete modos.modoAdmins[chatId];
        }
        guardarModos(modos);
        await sock.sendMessage(chatId, { text: `👑 *Modo admins ${args[0] === "on" ? "activado" : "desactivado"} en este grupo*` });
        return;
      }
      handleCommand(sock, msg, command, args, sender);
    }
  } catch (error) {
    console.error("❌ Error en el evento messages.upsert:", error);
  }
});
    

            
            
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
