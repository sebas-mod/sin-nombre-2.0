const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const fs = require("fs");
  const path = require("path");
  const pino = require("pino");
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
  } = require("@whiskeysockets/baileys");

  global.subBots = global.subBots || {}; // Almacena conexiones activas

  const subbotFolder = "./subbots";
  if (!fs.existsSync(subbotFolder)) {
    await conn.sendMessage(chatId, { text: "⚠️ No hay carpeta de subbots.", quoted: msg });
    return;
  }

  const subDirs = fs.readdirSync(subbotFolder).filter(d =>
    fs.existsSync(`${subbotFolder}/${d}/creds.json`)
  );

  let reconectados = 0;

  for (const dir of subDirs) {
    if (global.subBots[dir]) {
      console.log(`⏩ Subbot ${dir} ya estaba conectado.`);
      continue;
    }

    const sessionPath = path.join(subbotFolder, dir);
    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();
      const subSock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        browser: ["Azura Subbot", "Firefox", "2.0"]
      });

      subSock.ev.on("creds.update", saveCreds);

      subSock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") {
          console.log(`✅ Subbot ${dir} reconectado correctamente.`);
        }
      });

      global.subBots[dir] = subSock;
      reconectados++;

    } catch (err) {
      console.error(`❌ Error al reconectar subbot ${dir}:`, err);
    }
  }

  await conn.sendMessage(chatId, {
    text: `🔄 *${reconectados} subbot(s) reconectado(s) correctamente.*`,
    quoted: msg
  });
};

handler.command = ['cargasubot'];
module.exports = handler;
