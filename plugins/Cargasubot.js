const fs = require("fs");
const path = require("path");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

const handler = async (msg, { conn }) => {
  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key }
  });

  try {
    const subbotFolder = "./subbots";
    if (!fs.existsSync(subbotFolder)) return await conn.sendMessage(msg.key.remoteJid, {
      text: "⚠️ No hay carpeta de subbots.", quoted: msg
    });

    const subDirs = fs.readdirSync(subbotFolder).filter(d => fs.existsSync(`${subbotFolder}/${d}/creds.json`));

    if (subDirs.length === 0) return await conn.sendMessage(msg.key.remoteJid, {
      text: "⚠️ No hay subbots conectados.", quoted: msg
    });

    let cargados = 0;
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
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
          },
          browser: ["Azura Subbot", "Firefox", "2.0"]
        });

        subSock.ev.on("creds.update", saveCreds);

        subSock.ev.on("connection.update", (update) => {
          const { connection } = update;
          if (connection === "open") {
            console.log(`✅ Subbot ${dir} reconectado.`);
          } else if (connection === "close") {
            console.log(`❌ Subbot ${dir} se desconectó.`);
            const fullPath = path.join(subbotFolder, dir);
            if (fs.existsSync(fullPath)) fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`🧹 Sesión eliminada de ${dir}`);
          }
        });

        cargados++;
      } catch (err) {
        console.error(`❌ Error al reconectar subbot ${dir}:`, err);
      }
    }

    await conn.sendMessage(msg.key.remoteJid, {
      text: `✅ *${cargados} subbot(s) reconectado(s) correctamente.*`,
      quoted: msg
    });
  } catch (error) {
    console.error("❌ Error al ejecutar cargasubot:", error);
    await conn.sendMessage(msg.key.remoteJid, {
      text: `❌ *Error:* ${error.message}`,
      quoted: msg
    });
  }
};

handler.command = ['cargasubot'];
module.exports = handler;
