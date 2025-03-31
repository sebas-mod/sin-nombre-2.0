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

  // Función para cargar plugins exclusivos para subbots
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

  const subPlugins = loadSubPlugins();

  async function handleSubCommand(sock, msg, command, args) {
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

  // Objeto para almacenar las instancias y su estado de conexión
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

      // Inicialmente, se marca el subbot como desconectado
      subbotInstances[dir] = {
        subSock,
        sessionPath,
        isConnected: false,
      };

      subSock.ev.on("creds.update", saveCreds);

      subSock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") {
          console.log(`✅ Subbot ${dir} conectado correctamente.`);
          subbotInstances[dir].isConnected = true;
        } else if (connection === "close") {
          console.log(`❌ Subbot ${dir} se desconectó.`);
          subbotInstances[dir].isConnected = false;
        }
      });

      // EVENTO DE MENSAJES DE LOS SUBBOTS
      subSock.ev.on("messages.upsert", async (msg) => {
        try {
          const m = msg.messages[0];
          if (!m || !m.message) return;
          const messageText =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            "";
          const subbotPrefixes = [".", "#"];
          const usedPrefix = subbotPrefixes.find((p) => messageText.startsWith(p));
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

  // Verificar cada 1 minuto si los subbots siguen conectados y, si no, eliminar su carpeta
  setInterval(() => {
    for (const dir in subbotInstances) {
      const instance = subbotInstances[dir];
      if (!instance.isConnected) {
        console.log(`🗑️ Subbot ${dir} no está conectado. Eliminando carpeta de sesión...`);
        fs.rm(instance.sessionPath, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error(`❌ Error al eliminar la carpeta de sesión ${dir}:`, err);
          } else {
            console.log(`🗑️ Carpeta de sesión del subbot ${dir} eliminada.`);
            // Remover la instancia del objeto para dejar de chequearla
            delete subbotInstances[dir];
          }
        });
      }
    }
  }, 60000);
}

// Ejecutar después de iniciar el bot
module.exports = { cargarSubbots };
