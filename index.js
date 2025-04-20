(async () => {
let canalId = ["120363266665814365@newsletter"];  
let canalNombre = ["AZURA ULTRA CHANNEL 👾"]
  function setupConnection(conn) {
  conn.sendMessage2 = async (chat, content, m, options = {}) => {
    const firstChannel = { 
      id: canalId[0], 
      nombre: canalNombre[0] 
    };
    if (content.sticker) {
      return conn.sendMessage(chat, { 
        sticker: content.sticker 
      }, { 
        quoted: m,
        ...options 
      });
    }
    const messageOptions = {
      ...content,
      mentions: content.mentions || options.mentions || [],
      contextInfo: {
        ...(content.contextInfo || {}),
        forwardedNewsletterMessageInfo: {
          newsletterJid: firstChannel.id,
          serverMessageId: '',
          newsletterName: firstChannel.nombre
        },
        forwardingScore: 9999999,
        isForwarded: true,
        mentionedJid: content.mentions || options.mentions || []
      }
    };

    return conn.sendMessage(chat, messageOptions, {
      quoted: m,
      ephemeralExpiration: 86400000,
      disappearingMessagesInChat: 86400000,
      ...options
    });
  };
}

    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
    const chalk = require("chalk");
    const yargs = require('yargs/yargs')
    const { tmpdir } = require('os')
    const { join } = require('path')
    const figlet = require("figlet");
    const fs = require("fs");
    const { readdirSync, statSync, unlinkSync } = require('fs')
    const readline = require("readline");
    const pino = require("pino");
    const { isOwner, getPrefix, allowedPrefixes } = require("./config");
    const { handleCommand } = require("./main"); 
    // Carga de credenciales y estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState("./sessions");
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  //lista
function isAllowedUser(sender) {
  const listaFile = "./lista.json";
  if (!fs.existsSync(listaFile)) return false;
  const lista = JSON.parse(fs.readFileSync(listaFile, "utf-8"));
  // Extrae solo los dígitos del número para comparar
  const num = sender.replace(/\D/g, "");
  return lista.includes(num);
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
setupConnection(sock)
            // Si la sesión no existe y se usa el código de 8 dígitos
            if (!fs.existsSync("./sessions/creds.json") && method === "2") {
                let phoneNumber = await question("😎Fino vamos aya😎: ");
                phoneNumber = phoneNumber.replace(/\D/g, "");
                setTimeout(async () => {
                    let code = await sock.requestPairingCode(phoneNumber);
                    console.log(chalk.magenta("🔑 Código de vinculación: ") + chalk.yellow(code.match(/.{1,4}/g).join("-")));
                }, 2000);
            }

//_________________

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

//tmp
if (!opts['test']) {
  setInterval(async () => {
  //  if (global.db.data) await global.db.write().catch(console.error)
    if (opts['autocleartmp']) try {
      clearTmp()

    } catch (e) { console.error(e) }
  }, 60 * 1000)
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

/* Clear */
async function clearTmp() {
  const tmp = [tmpdir(), join(__dirname, './tmp')]
  const filename = []
  tmp.forEach(dirname => readdirSync(dirname).forEach(file => filename.push(join(dirname, file))))

  //---
  return filename.map(file => {
    const stats = statSync(file)
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 1)) return unlinkSync(file) // 1 minuto
    return false
  })
}

setInterval(async () => {
  await clearTmp()
  console.log(chalk.cyanBright(`╭━─━─━─≪🔆≫─━─━─━╮\n│SE LIMPIO LA CARPETA TMP CORRECTAMENTE\n╰━─━─━─≪🔆≫─━─━─━╯`))
}, 1000 * 60 * 60); // ← 1 hora en milisegundos

//sessions/jadibts


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
if (!activos.welcome || !activos.welcome[update.id]) return;

const welcomePath = "./welcome.json";
let customWelcomes = {};
if (fs.existsSync(welcomePath)) {
  customWelcomes = JSON.parse(fs.readFileSync(welcomePath, "utf-8"));
}
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
    const customMessage = customWelcomes[update.id];

    // Obtener foto de perfil (o grupo si falla)
    let profilePicUrl;
    try {
      profilePicUrl = await sock.profilePictureUrl(participant, "image");
    } catch (err) {
      try {
        profilePicUrl = await sock.profilePictureUrl(update.id, "image");
      } catch {
        profilePicUrl = "https://cdn.dorratz.com/files/1741323171822.jpg";
      }
    }

    if (customMessage) {
      // Enviar mensaje personalizado
      await sock.sendMessage(update.id, {
        image: { url: profilePicUrl },
        caption: `👋 ${mention}\n\n${customMessage}`,
        mentions: [participant]
      });
    } else {
      // Elegir mensaje aleatorio
      const mensajeTexto = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
      const option = Math.random();

      if (option < 0.33) {
        await sock.sendMessage(update.id, {
          image: { url: profilePicUrl },
          caption: `👋 ${mention}\n\n${mensajeTexto}`,
          mentions: [participant]
        });
      } else if (option < 0.66) {
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
        await sock.sendMessage(update.id, {
          text: `👋 ${mention}\n\n${mensajeTexto}`,
          mentions: [participant]
        });
      }
    }
  }
} else if (update.action === "remove") {
  // Tu lógica de despedida sigue igual
  for (const participant of update.participants) {
    const mention = `@${participant.split("@")[0]}`;
    const mensajeTexto = farewellTexts[Math.floor(Math.random() * farewellTexts.length)];
    const option = Math.random();

    let profilePicUrl;
    try {
      profilePicUrl = await sock.profilePictureUrl(participant, "image");
    } catch (err) {
      profilePicUrl = "https://cdn.dorratz.com/files/1741323171822.jpg";
    }

    if (option < 0.5) {
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

    const activos = fs.existsSync("./activos.json") ? JSON.parse(fs.readFileSync("./activos.json")) : {};
    const lista = fs.existsSync("./lista.json") ? JSON.parse(fs.readFileSync("./lista.json")) : [];
    const isAllowedUser = (num) => lista.includes(num);

    console.log(chalk.yellow(`\n📩 Nuevo mensaje recibido`));
    console.log(chalk.green(`📨 De: ${fromMe ? "[Tú]" : "[Usuario]"} ${chalk.bold(sender)}`));
    console.log(chalk.cyan(`💬 Tipo: ${messageType}`));
    console.log(chalk.cyan(`💬 Mensaje: ${chalk.bold(messageText || "📂 (Mensaje multimedia)")}`));
    console.log(chalk.gray("──────────────────────────"));

// === LÓGICA DE RESPUESTA AUTOMÁTICA CON PALABRA CLAVE ===
try {
  const guarPath = path.resolve('./guar.json');
  if (fs.existsSync(guarPath)) {
    const guarData = JSON.parse(fs.readFileSync(guarPath, 'utf-8'));

    // Normalizar mensaje: sin espacios, tildes, mayúsculas ni símbolos
    const cleanText = messageText
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w]/g, '');

    for (const key of Object.keys(guarData)) {
      const cleanKey = key
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w]/g, '');

      if (cleanText === cleanKey) {
        const item = guarData[key];
        const buffer = Buffer.from(item.buffer, 'base64');

        let payload = {};

        switch (item.extension) {
          case 'jpg':
          case 'jpeg':
          case 'png':
            payload.image = buffer;
            break;
          case 'mp4':
            payload.video = buffer;
            break;
          case 'mp3':
          case 'ogg':
          case 'opus':
            payload.audio = buffer;
            payload.mimetype = item.mimetype || 'audio/mpeg';
            payload.ptt = false; // ← Cambia a true si quieres que lo envíe como nota de voz
            break;
          case 'webp':
            payload.sticker = buffer;
            break;
          default:
            payload.document = buffer;
            payload.mimetype = item.mimetype || "application/octet-stream";
            payload.fileName = `archivo.${item.extension}`;
            break;
        }

        await sock.sendMessage(chatId, payload, { quoted: msg });
        return; // ← evitar que siga procesando si ya se encontró una coincidencia
      }
    }
  }
} catch (e) {
  console.error("❌ Error al revisar guar.json:", e);
}
// === FIN LÓGICA DE RESPUESTA AUTOMÁTICA CON PALABRA CLAVE ===

    
// === INICIO LÓGICA ANTIPORNO BOT PRINCIPAL ===
try {
  const activos = fs.existsSync("./activos.json") ? JSON.parse(fs.readFileSync("./activos.json", "utf-8")) : {};
  const antipornoActivo = activos.antiporno?.[chatId];

  if (isGroup && antipornoActivo && !fromMe) {
    const message = msg.message;
    const type = Object.keys(message)[0];
    const media = (
      message.imageMessage ||
      message.stickerMessage ||
      null
    );

    if (media) {
      const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
      const axios = require("axios");
      const FormData = require("form-data");

      const stream = await downloadContentFromMessage(media, type === "stickerMessage" ? "sticker" : "image");
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const form = new FormData();
      form.append("file", buffer, {
        filename: "nsfw-check.jpg",
        contentType: media.mimetype || "image/jpeg",
      });

      const upload = await axios.post("https://cdn.russellxz.click/upload.php", form, {
        headers: form.getHeaders(),
      });

      const urlSubida = upload.data?.url;
      if (!urlSubida) return;

      const evalRes = await axios.get(`https://test-detecter-ns.onrender.com/eval?imagen=${encodeURIComponent(urlSubida)}`);
      const result = evalRes.data?.result;

      if (result?.esNSFW === true && result?.confianza >= 0.8) {
        const senderClean = sender.replace(/[^0-9]/g, "");
        const isOwner = global.owner.some(([id]) => id === senderClean);

        const metadata = await sock.groupMetadata(chatId);
        const participante = metadata.participants.find(p => p.id.includes(sender));
        const isAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";

        if (!isOwner && !isAdmin) {
          // Eliminar contenido
          await sock.sendMessage(chatId, { delete: msg.key });

          // Cargar archivo de advertencias
          const warnPath = "./warns.json";
          if (!fs.existsSync(warnPath)) {
            fs.writeFileSync(warnPath, JSON.stringify({}));
          }
          const warns = JSON.parse(fs.readFileSync(warnPath, "utf-8"));
          warns[senderClean] = (warns[senderClean] || 0) + 1;

          if (warns[senderClean] >= 4) {
            delete warns[senderClean];
            fs.writeFileSync(warnPath, JSON.stringify(warns, null, 2));

            await sock.sendMessage(chatId, {
              text: `🔞 @${sender} ha sido eliminado por enviar contenido explícito *4 veces consecutivas*.`,
              mentions: [msg.key.participant || msg.key.remoteJid]
            });

            await sock.groupParticipantsUpdate(chatId, [msg.key.participant || msg.key.remoteJid], "remove");
          } else {
            fs.writeFileSync(warnPath, JSON.stringify(warns, null, 2));
            await sock.sendMessage(chatId, {
              text: `⚠️ @${sender}, este contenido fue detectado como NSFW. Advertencia ${warns[senderClean]}/4.`,
              mentions: [msg.key.participant || msg.key.remoteJid]
            });
          }
        }
      }
    }
  }
} catch (e) {
  console.error("❌ Error en lógica antiporno:", e);
}
// === FIN LÓGICA ANTIPORNO BOT PRINCIPAL ===
// === INICIO GUARDADO ANTIDELETE ===
try {
  const activos = fs.existsSync('./activos.json') ? JSON.parse(fs.readFileSync('./activos.json', 'utf-8')) : {};
  const isGroup = chatId.endsWith('@g.us');
  const isAntideletePriv = activos.antideletepri === true;
  const isAntideleteGroup = activos.antidelete?.[chatId] === true;
  const filePath = isGroup ? './antidelete.json' : './antideletepri.json';

  if ((isGroup && isAntideleteGroup) || (!isGroup && isAntideletePriv)) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));

    const type = Object.keys(msg.message || {})[0];
    const content = msg.message[type];
    const idMsg = msg.key.id;
    const senderId = msg.key.participant || msg.key.remoteJid;

    const guardado = {
      chatId,
      sender: senderId,
      type,
      timestamp: Date.now()
    };

    const saveBase64 = async (mediaType, data) => {
      const stream = await downloadContentFromMessage(data, mediaType);
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      guardado.media = buffer.toString("base64");
      guardado.mimetype = data.mimetype;
    };

    if (msg.message?.viewOnceMessageV2) {
      const innerMsg = msg.message.viewOnceMessageV2.message;
      const viewType = Object.keys(innerMsg)[0];
      const viewContent = innerMsg[viewType];
      await saveBase64(viewType.replace("Message", ""), viewContent);
      guardado.type = viewType;
    } else if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(type)) {
      const mediaType = type.replace('Message', '');
      await saveBase64(mediaType, content);
    } else if (type === 'conversation' || type === 'extendedTextMessage') {
      guardado.text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data[idMsg] = guardado;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
} catch (e) {
  console.error("❌ Error al guardar mensaje antidelete:", e);
}
// === FIN GUARDADO ANTIDELETE ===
// === INICIO DETECCIÓN DE MENSAJE ELIMINADO ===
if (msg.message?.protocolMessage?.type === 0) {
  try {
    const deletedId = msg.message.protocolMessage.key.id;
    const whoDeleted = msg.message.protocolMessage.key.participant || msg.key.participant;
    const isGroup = chatId.endsWith('@g.us');

    const activos = fs.existsSync('./activos.json') ? JSON.parse(fs.readFileSync('./activos.json', 'utf-8')) : {};
    const isAntideleteGroup = activos.antidelete?.[chatId] === true;
    const isAntideletePriv = activos.antideletepri === true;
    const filePath = isGroup ? './antidelete.json' : './antideletepri.json';

    if (!(isGroup ? isAntideleteGroup : isAntideletePriv)) return;
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath));
    const deletedData = data[deletedId];
    if (!deletedData || deletedData.sender !== whoDeleted) return;

    const senderNumber = whoDeleted.split("@")[0];

    if (isGroup) {
      const meta = await sock.groupMetadata(chatId);
      const isAdmin = meta.participants.find(p => p.id === whoDeleted)?.admin;
      if (isAdmin) return;
    }

    if (deletedData.media) {
      const mimetype = deletedData.mimetype || 'application/octet-stream';
      const buffer = Buffer.from(deletedData.media, "base64");
      const type = deletedData.type.replace("Message", "");
      const sendOpts = { quoted: msg };

      sendOpts[type] = buffer;
      sendOpts.mimetype = mimetype;

      if (type === "sticker") {
        const sent = await sock.sendMessage(chatId, sendOpts);
        await sock.sendMessage(chatId, {
          text: `📌 El sticker fue eliminado por @${senderNumber}`,
          mentions: [whoDeleted],
          quoted: sent
        });
      } else {
        sendOpts.caption = `📦 Mensaje eliminado por @${senderNumber}`;
        sendOpts.mentions = [whoDeleted];
        await sock.sendMessage(chatId, sendOpts, { quoted: msg });
      }
    } else if (deletedData.text) {
      await sock.sendMessage(chatId, {
        text: `📝 *Mensaje eliminado:* ${deletedData.text}\n👤 *Usuario:* @${senderNumber}`,
        mentions: [whoDeleted]
      }, { quoted: msg });
    }
  } catch (err) {
    console.error("❌ Error en lógica antidelete:", err);
  }
}
// === FIN DETECCIÓN DE MENSAJE ELIMINADO ===
setInterval(() => {
  const cleanFiles = ['./antidelete.json', './antideletepri.json'];
  for (const file of cleanFiles) {
    if (fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify({}, null, 2));
      console.log(`🧹 Archivo ${file} limpiado automáticamente.`);
    }
  }
}, 1000 * 60 * 45); // Cada 45 minutos
    
    
    //restringir comandos
    try {
  const rePath = path.resolve("./re.json");
  const cachePath = path.resolve("./restriccion_cache.json");

  if (!fs.existsSync(cachePath)) fs.writeFileSync(cachePath, JSON.stringify({}, null, 2));

  const reData = fs.existsSync(rePath) ? JSON.parse(fs.readFileSync(rePath)) : {};
  const cacheData = JSON.parse(fs.readFileSync(cachePath));

  const commandOnly = messageText.slice(global.prefix.length).trim().split(" ")[0].toLowerCase();
  const comandosRestringidos = reData[chatId] || [];

  const senderClean = sender.replace(/[^0-9]/g, "");
  const isOwner = global.owner.some(([id]) => id === senderClean);
  const isFromMe = msg.key.fromMe;

  const key = `${chatId}:${senderClean}:${commandOnly}`;

  // Si el comando ya no está restringido, eliminarlo del contador
  if (!comandosRestringidos.includes(commandOnly) && cacheData[key]) {
    delete cacheData[key];
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    return;
  }

  if (comandosRestringidos.includes(commandOnly) && !isOwner && !isFromMe) {
    cacheData[key] = (cacheData[key] || 0) + 1;

    const replyOptions = {
      quoted: msg,
      mentions: [sender + "@s.whatsapp.net"]
    };

    if (cacheData[key] < 5) {
      await sock.sendMessage(chatId, {
        text: `🚫 *Este comando está restringido en este grupo.*\n⚠️ Solo el owner o el bot pueden usarlo.`,
      }, replyOptions);
    } else if (cacheData[key] === 5) {
      await sock.sendMessage(chatId, {
        text: `❌ *Has intentado usar este comando demasiadas veces.*\n🤖 Ahora el bot te ignorará respecto a *${commandOnly}*.`,
      }, replyOptions);
    }

    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    return;
  }

} catch (e) {
  console.error("❌ Error procesando comando restringido:", e);
}
// === FIN LÓGICA DE COMANDOS RESTRINGIDOS ===    
    
// 🔗 Antilink en grupos
      if (isGroup && activos.antilink?.[chatId]) {
        if (messageText.includes("https://chat.whatsapp.com/")) {
          let canBypass = fromMe || isOwner(sender);
          try {
            const metadata = await sock.groupMetadata(chatId);
            const participant = metadata.participants.find(p => p.id.replace(/[^0-9]/g, "") === sender);
            const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
            if (isAdmin) canBypass = true;
          } catch (e) {
            console.error("Error leyendo metadata (antilink):", e);
            canBypass = true; // Evita expulsar por error si no se puede obtener metadata
          }

          if (!canBypass) {
            await sock.sendMessage(chatId, { delete: msg.key });
            await sock.sendMessage(chatId, {
              text: `⚠️ @${sender} ha enviado un enlace no permitido y ha sido expulsado.`,
              mentions: [msg.key.participant || msg.key.remoteJid]
            });
            try {
              await sock.groupParticipantsUpdate(chatId, [msg.key.participant || msg.key.remoteJid], "remove");
            } catch (e) {
              console.error("Error al expulsar:", e);
            }
            return;
          }
        }
      } 
      
  // 🔐 Modo Privado activado
    if (activos.modoPrivado) {
      if (isGroup) {
        if (!fromMe && !isOwner(sender)) return;
      } else {
        if (!fromMe && !isOwner(sender) && !isAllowedUser(sender)) return;
      }
    } else {
      // 🎯 Modo Admins por grupo
      if (isGroup && activos.modoAdmins?.[chatId]) {
        try {
          const metadata = await sock.groupMetadata(chatId);
          const participant = metadata.participants.find(p => p.id.includes(sender));
          const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
          if (!isAdmin && !isOwner(sender) && !fromMe) return;
        } catch (e) {
          console.error("Error leyendo metadata:", e);
          return;
        }
      }

      

      // 🔒 En privado si no es de la lista, no responde
      if (!isGroup && !fromMe && !isOwner(sender) && !isAllowedUser(sender)) return;
    }

    // ✅ Procesar comando
    if (messageText.startsWith(global.prefix)) {
      const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
      const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");
      handleCommand(sock, msg, command, args, sender);
    }

  } catch (error) {
    console.error("❌ Error en messages.upsert:", error);
  }
});
            
            
            sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "connecting") {
        console.log(chalk.blue("🔄 Conectando a WhatsApp..."));
    } else if (connection === "open") {
        console.log(chalk.green("✅ ¡Conexión establecida con éxito!"));
//await joinChannels(sock)

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

const path = require("path");
            
async function cargarSubbots() {
  const subbotFolder = "./subbots";
  const path = require("path");
  const fs = require("fs");
  const pino = require("pino");
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
  } = require("@whiskeysockets/baileys");

  function loadSubPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, "plugins2");
    if (!fs.existsSync(pluginDir)) return plugins;
    const files = fs.readdirSync(pluginDir).filter((f) => f.endsWith(".js"));
    for (const file of files) {
      const plugin = require(path.join(pluginDir, file));
      if (plugin && plugin.command) plugins.push(plugin);
    }
    return plugins;
  }

  async function handleSubCommand(sock, msg, command, args) {
    const subPlugins = loadSubPlugins(); // Cargar siempre fresco
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");
    const plugin = subPlugins.find((p) => p.command.includes(lowerCommand));
    if (plugin) {
      return plugin(msg, {
        conn: sock,
        text,
        args,
        command: lowerCommand,
        usedPrefix: ".",
      });
    }
  }

  if (!fs.existsSync(subbotFolder)) {
    return console.log("⚠️ No hay carpeta de subbots.");
  }

  const subDirs = fs
    .readdirSync(subbotFolder)
    .filter((d) => fs.existsSync(`${subbotFolder}/${d}/creds.json`));
  console.log(`🤖 Cargando ${subDirs.length} subbot(s) conectados...`);

  const subbotInstances = {};

  for (const dir of subDirs) {
    const sessionPath = path.join(subbotFolder, dir);
    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();
      const subSock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Azura Subbot", "Firefox", "2.0"],
      });
setupConnection(subSock);
      subbotInstances[dir] = {
        subSock,
        sessionPath,
        isConnected: false,
      };

      subSock.ev.on("creds.update", saveCreds);

      subSock.ev.on("connection.update", async (update) => {
        const { connection } = update;
        if (connection === "open") {
          console.log(`✅ Subbot ${dir} conectado correctamente.`);          
          subbotInstances[dir].isConnected = true;
       //   await joinChannels2(subSock)
        } else if (connection === "close") {
          console.log(`❌ Subbot ${dir} se desconectó.`);
          subbotInstances[dir].isConnected = false;
        }
      });

subSock.ev.on("group-participants.update", async (update) => {
  try {
    if (!subbotInstances[dir].isConnected) return;
    if (!update.id.endsWith("@g.us")) return;

    const chatId = update.id;
    const subbotID = subSock.user.id;
    const filePath = path.resolve("./activossubbots.json");

    let activos = {};
    if (fs.existsSync(filePath)) {
      activos = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    // Si el subbot no tiene lista de welcome, o ese grupo no está activado
    if (!activos.welcome || !activos.welcome[subbotID] || !activos.welcome[subbotID][chatId]) return;

    const welcomeTexts = [
      "🎉 ¡Bienvenido(a)! Gracias por unirte al grupo.",
      "👋 ¡Hola! Qué bueno tenerte con nosotros.",
      "🌟 ¡Saludos! Esperamos que la pases genial aquí.",
      "🚀 ¡Bienvenido(a)! Disfruta y participa activamente.",
      "✨ ¡Qué alegría verte por aquí! Pásala bien."
    ];

    const farewellTexts = [
      "👋 ¡Adiós! Esperamos verte pronto de nuevo.",
      "😢 Se ha ido un miembro del grupo, ¡suerte!",
      "📤 Gracias por estar con nosotros, hasta luego.",
      "🔚 Un miembro se ha retirado. ¡Buena suerte!",
      "💨 ¡Chao! Esperamos que hayas disfrutado del grupo."
    ];

    if (update.action === "add") {
      for (const participant of update.participants) {
        const mention = `@${participant.split("@")[0]}`;
        const mensaje = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
        const tipo = Math.random();

        if (tipo < 0.33) {
          let profilePic;
          try {
            profilePic = await subSock.profilePictureUrl(participant, "image");
          } catch {
            profilePic = "https://cdn.dorratz.com/files/1741323171822.jpg";
          }

          await subSock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: `👋 ${mention}\n\n${mensaje}`,
            mentions: [participant]
          });
        } else if (tipo < 0.66) {
          let groupDesc = "";
          try {
            const meta = await subSock.groupMetadata(chatId);
            groupDesc = meta.desc ? `\n\n📜 *Descripción del grupo:*\n${meta.desc}` : "";
          } catch {}

          await subSock.sendMessage(chatId, {
            text: `👋 ${mention}\n\n${mensaje}${groupDesc}`,
            mentions: [participant]
          });
        } else {
          await subSock.sendMessage(chatId, {
            text: `👋 ${mention}\n\n${mensaje}`,
            mentions: [participant]
          });
        }
      }
    }

    if (update.action === "remove") {
      for (const participant of update.participants) {
        const mention = `@${participant.split("@")[0]}`;
        const mensaje = farewellTexts[Math.floor(Math.random() * farewellTexts.length)];
        const tipo = Math.random();

        if (tipo < 0.5) {
          let profilePic;
          try {
            profilePic = await subSock.profilePictureUrl(participant, "image");
          } catch {
            profilePic = "https://cdn.dorratz.com/files/1741323171822.jpg";
          }

          await subSock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: `👋 ${mention}\n\n${mensaje}`,
            mentions: [participant]
          });
        } else {
          await subSock.sendMessage(chatId, {
            text: `👋 ${mention}\n\n${mensaje}`,
            mentions: [participant]
          });
        }
      }
    }

  } catch (err) {
    console.error("❌ Error en bienvenida/despedida del subbot:", err);
  }
});
      
subSock.ev.on("messages.upsert", async (msg) => {
        try {
          if (!subbotInstances[dir].isConnected) return;

          const m = msg.messages[0];
          if (!m || !m.message) return;

          const from = m.key.remoteJid;
          const isGroup = from.endsWith("@g.us");
          const isFromSelf = m.key.fromMe;
          const senderJid = m.key.participant || from;
          const senderNum = senderJid.split("@")[0];

          const rawID = subSock.user?.id || "";
          const subbotID = rawID.split(":")[0] + "@s.whatsapp.net";

          // Leer listas y prefijos DINÁMICAMENTE en cada mensaje
          const listaPath = path.join(__dirname, "listasubots.json");
          const grupoPath = path.join(__dirname, "grupo.json");
          const prefixPath = path.join(__dirname, "prefixes.json");

          let dataPriv = {};
          let dataGrupos = {};
          let dataPrefijos = {};

          if (fs.existsSync(listaPath)) {
            dataPriv = JSON.parse(fs.readFileSync(listaPath, "utf-8"));
          }

          if (fs.existsSync(grupoPath)) {
            dataGrupos = JSON.parse(fs.readFileSync(grupoPath, "utf-8"));
          }

          if (fs.existsSync(prefixPath)) {
            dataPrefijos = JSON.parse(fs.readFileSync(prefixPath, "utf-8"));
          }

          const listaPermitidos = Array.isArray(dataPriv[subbotID]) ? dataPriv[subbotID] : [];
          const gruposPermitidos = Array.isArray(dataGrupos[subbotID]) ? dataGrupos[subbotID] : [];

          if (!isGroup && !isFromSelf && !listaPermitidos.includes(senderNum)) return;
          if (isGroup && !isFromSelf && !gruposPermitidos.includes(from)) return;

          const messageText =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            "";

// === LÓGICA ANTILINK AUTOMÁTICO SOLO WHATSAPP POR SUBBOT ===
if (isGroup && !isFromSelf) {
  const activossubPath = path.resolve("./activossubbots.json");
  let dataActivados = {};

  if (fs.existsSync(activossubPath)) {
    dataActivados = JSON.parse(fs.readFileSync(activossubPath, "utf-8"));
  }

  const subbotID = subSock.user?.id || "";
  const antilinkActivo = dataActivados.antilink?.[subbotID]?.[from];
  const contieneLinkWhatsApp = /https:\/\/chat\.whatsapp\.com\//i.test(messageText);

  if (antilinkActivo && contieneLinkWhatsApp) {
    try {
      const metadata = await subSock.groupMetadata(from);
      const participant = metadata.participants.find(p => p.id === senderJid);
      const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
      const isOwner = global.owner.some(o => o[0] === senderNum);

      if (!isAdmin && !isOwner) {
        await subSock.sendMessage(from, { delete: m.key });

        await subSock.sendMessage(from, {
          text: `⚠️ @${senderNum} envió un enlace de grupo de WhatsApp y fue eliminado.`,
          mentions: [senderJid]
        });

        await subSock.groupParticipantsUpdate(from, [senderJid], "remove");
      }
    } catch (err) {
      console.error("❌ Error procesando antilink:", err);
    }
  }
}
// === FIN LÓGICA ANTILINK ===
// === INICIO LÓGICA MODOADMINS SUBBOT ===
if (isGroup && !isFromSelf) {
  try {
    const activossubPath = path.resolve("./activossubbots.json");
    if (!fs.existsSync(activossubPath)) return;

    const dataActivados = JSON.parse(fs.readFileSync(activossubPath, "utf-8"));
    
    // Obtener subbotID en el formato correcto
    const subbotID = subSock.user?.id || ""; // ejemplo: 15167096032:20@s.whatsapp.net
    const modoAdminsActivo = dataActivados.modoadmins?.[subbotID]?.[from];

    if (modoAdminsActivo) {
      const metadata = await subSock.groupMetadata(from);
      const participante = metadata.participants.find(p => p.id === senderJid);
      const isAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";

      const botNum = subSock.user?.id.split(":")[0].replace(/[^0-9]/g, "");
      const isBot = botNum === senderNum;

      const isOwner = global.owner.some(([id]) => id === senderNum);

      if (!isAdmin && !isOwner && !isBot) {
        console.log(`⛔ ${senderNum} ignorado por MODOADMINS en ${from}`);
        return;
      }
    }
  } catch (err) {
    console.error("❌ Error en verificación de modo admins:", err);
    return;
  }
}
// === FIN LÓGICA MODOADMINS SUBBOT ===
          
          const customPrefix = dataPrefijos[subbotID];
          const allowedPrefixes = customPrefix ? [customPrefix] : [".", "#"];
          const usedPrefix = allowedPrefixes.find((p) => messageText.startsWith(p));
          if (!usedPrefix) return;

          const body = messageText.slice(usedPrefix.length).trim();
          const command = body.split(" ")[0].toLowerCase();
          const args = body.split(" ").slice(1);

          await handleSubCommand(subSock, m, command, args);

        } catch (err) {
          console.error("❌ Error procesando mensaje del subbot:", err);
        }
      });
      

    } catch (err) {
      console.error(`❌ Error al cargar subbot ${dir}:`, err);
    }
  }
}

/*async function joinChannels(sock) {
for (const channelId of Object.values(global.ch)) {
await sock.newsletterFollow(channelId).catch(() => {})
}}

async function joinChannels2(subSock) {
for (const channelId of Object.values(global.ch)) {
await subSock.newsletterFollow(channelId).catch(() => {})
}}*/

// Ejecutar después de iniciar el bot principal
setTimeout(cargarSubbots, 7000);
module.exports = { cargarSubbots };
            
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
