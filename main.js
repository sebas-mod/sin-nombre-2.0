const fs = require("fs");
const chalk = require("chalk");
const { isOwner, setPrefix, allowedPrefixes } = require("./config");
const axios = require("axios");
const fetch = require("node-fetch");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const os = require("os");
const { execSync } = require("child_process");
const path = require("path");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, toAudio } = require('./libs/fuctions');
// Ruta del archivo donde se guardan los paquetes de stickers
// 📂 Definir la ruta de almacenamiento de stickers
const stickersDir = "./stickers";
const stickersFile = "./stickers.json";

// 📂 Crear la carpeta `stickers/` si no existe
if (!fs.existsSync(stickersDir)) {
    fs.mkdirSync(stickersDir, { recursive: true });
}

// 📂 Crear el archivo `stickers.json` si no existe
if (!fs.existsSync(stickersFile)) {
    fs.writeFileSync(stickersFile, JSON.stringify({}, null, 2));
}
//juego rpg abajo

// Ruta del archivo RPG
const rpgFile = "./rpg.json";

// Si el archivo no existe, crearlo con la estructura básica
if (!fs.existsSync(rpgFile)) {
    const rpgDataInicial = {
        usuarios: {},
        tiendaMascotas: [],
        tiendaPersonajes: [],
        mercadoPersonajes: [] // Nueva tienda para que los usuarios puedan vender personajes
    };
    fs.writeFileSync(rpgFile, JSON.stringify(rpgDataInicial, null, 2));
}
// Cargar datos del RPG
let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

// Función para guardar cambios en `rpg.json`
function saveRpgData() {
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
}


// 🛠️ Ruta del archivo de configuración
const configFilePath = "./config.json";

// Función para leer el prefijo guardado
function loadPrefix() {
    if (fs.existsSync(configFilePath)) {
        let configData = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
        global.prefix = configData.prefix || ".";
    } else {
        global.prefix = ".";
    }
}

// Cargar el prefijo al iniciar el bot
loadPrefix();
console.log(`📌 Prefijo actual: ${global.prefix}`);
//orivado
// Almacenar los usuarios en línea por cada grupo (hacerlo accesible globalmente)

// Definir la carpeta temporal dentro del bot

// Si el modo privado está activado, bloquear comandos para quienes no sean dueños o el mismo bot

//modoprivado ariba
const guarFilePath = "./guar.json";
if (!fs.existsSync(guarFilePath)) {
    fs.writeFileSync(guarFilePath, JSON.stringify({}, null, 2));
}

// Función para guardar multimedia en guar.json
function saveMultimedia(key, data) {
    let guarData = JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
    guarData[key] = data;
    fs.writeFileSync(guarFilePath, JSON.stringify(guarData, null, 2));
}

// Función para obtener la lista de multimedia guardado
function getMultimediaList() {
    return JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
}

// Exportamos las funciones para usarlas en los comandos
module.exports = {
    saveMultimedia,
    getMultimediaList
};
// Verificar si un prefijo es válido
function isValidPrefix(prefix) {
    return typeof prefix === "string" && (prefix.length === 1 || (prefix.length > 1 && [...prefix].length === 1));
}

async function isAdmin(sock, chatId, sender) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);
        return admins.includes(sender.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
    } catch (error) {
        console.error("⚠️ Error verificando administrador:", error);
        return false;
    }
}

// Guardar nuevo prefijo en el archivo de configuración
function savePrefix(newPrefix) {
    global.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify({ prefix: newPrefix }, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
}

// Función para verificar si una URL es válida
function isUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

async function handleCommand(sock, msg, command, args, sender) {
sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
  let buff = Buffer.isBuffer(path) 
    ? path 
    : /^data:.*?\/.*?;base64,/i.test(path) 
    ? Buffer.from(path.split`,`[1], 'base64') 
    : /^https?:\/\//.test(path) 
    ? await (await getBuffer(path)) 
    : fs.existsSync(path) 
    ? fs.readFileSync(path) 
    : Buffer.alloc(0);

  let buffer;
  if (options && (options.packname || options.author)) {
    buffer = await writeExifImg(buff, options);
  } else {
    buffer = await imageToWebp(buff);
  }

  await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { 
    quoted: quoted ? quoted : m, 
    ephemeralExpiration: 24 * 60 * 100, 
    disappearingMessagesInChat: 24 * 60 * 100
  });
  
  return buffer;
};
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");

    switch (lowerCommand) {
//agrega nuevos comando abajo
case 'rpg': { 
    try { 
        if (args.length < 2) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}rpg Russell 26\`` 
            }, { quoted: msg });
            return; 
        }

        let nombreUsuario = args[0]; 
        let edadUsuario = parseInt(args[1]); 
        let userId = msg.key.participant || msg.key.remoteJid; 

        if (isNaN(edadUsuario) || edadUsuario <= 0) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *La edad debe ser un número válido mayor que 0.*" 
            }, { quoted: msg });
            return; 
        }

        const rpgFile = "./rpg.json"; 
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { usuarios: {} }; 

        if (rpgData.usuarios[userId]) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Ya estás registrado en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}menurpg\` para ver tus opciones.` 
            }, { quoted: msg });
            return; 
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } }); 
        let registroMensaje = await sock.sendMessage(msg.key.remoteJid, { text: `📝 *Registrando en el Gremio Azura Ultra...*` }, { quoted: msg }); 

        await new Promise(resolve => setTimeout(resolve, 1500)); 
        await sock.sendMessage(msg.key.remoteJid, { edit: registroMensaje.key, text: `📜 *Nombre:* ${nombreUsuario}\n🎂 *Edad:* ${edadUsuario}\n\n⏳ *Procesando...*` }); 
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        await sock.sendMessage(msg.key.remoteJid, { edit: registroMensaje.key, text: `🔍 *Buscando rango y habilidades...*` }); 
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const habilidadesDisponibles = ["⚔️ Espadachín", "🛡️ Defensor", "🔥 Mago", "🏹 Arquero", "🌀 Sanador", "⚡ Ninja", "💀 Asesino"]; 
        const rangosDisponibles = ["🌟 Novato", "⚔️ Guerrero", "🔥 Maestro", "👑 Élite", "🌀 Legendario"]; 

        let habilidad1 = habilidadesDisponibles[Math.floor(Math.random() * habilidadesDisponibles.length)]; 
        let habilidad2 = habilidadesDisponibles[Math.floor(Math.random() * habilidadesDisponibles.length)]; 
        let rango = "🌟 Novato"; 

        let mascotasTienda = rpgData.tiendaMascotas || []; 
        let mascotaAleatoria = mascotasTienda.length > 0 ? mascotasTienda[Math.floor(Math.random() * mascotasTienda.length)] : null; 
        let nuevaMascota = null; 

        if (mascotaAleatoria) { 
            nuevaMascota = { 
                nombre: mascotaAleatoria.nombre, 
                imagen: mascotaAleatoria.imagen, 
                rango: mascotaAleatoria.rango, // ✅ Ahora guarda correctamente el rango de la mascota
                nivel: 1, 
                vida: 100, 
                experiencia: 0, 
                habilidades: { 
                    [Object.keys(mascotaAleatoria.habilidades)[0]]: { nivel: 1 }, 
                    [Object.keys(mascotaAleatoria.habilidades)[1]]: { nivel: 1 } 
                } 
            }; 
        }

        let nuevoUsuario = { 
            id: userId, 
            nombre: nombreUsuario, 
            edad: edadUsuario, 
            nivel: 1, 
            experiencia: 0, 
            rango: rango, 
            vida: 100, 
            habilidades: {  
                [habilidad1]: { nivel: 1 }, 
                [habilidad2]: { nivel: 1 } 
            }, 
            diamantes: 0, 
            diamantesGuardados: 0, 
            mascotas: nuevaMascota ? [nuevaMascota] : [] 
        };

        rpgData.usuarios[userId] = nuevoUsuario; 
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2)); 

        let habilidadesMascota = ""; 
        if (nuevaMascota) { 
            habilidadesMascota = `🔹 *Habilidades:*  
   🌀 ${Object.keys(nuevaMascota.habilidades)[0]} (Nivel 1)  
   🔥 ${Object.keys(nuevaMascota.habilidades)[1]} (Nivel 1)`; 
        }

        let mensajeFinal = `🎉 *¡Registro Completado!* 🎉
        
🌟 *Jugador:* ${nombreUsuario}  
🎂 *Edad:* ${edadUsuario} años  
⚔️ *Rango Inicial:* ${rango}  
🎚️ *Nivel:* 1  
❤️ *Vida:* 100 HP  
✨ *Experiencia:* 0 / 1000 XP  
🛠️ *Habilidades:*  
   ✨ ${habilidad1} (Nivel 1)  
   ✨ ${habilidad2} (Nivel 1)  

🐾 *Mascota Inicial:* ${nuevaMascota ? `🦴 ${nuevaMascota.nombre}` : "❌ Ninguna (No hay en la tienda)"}  
   📊 *Rango:* ${nuevaMascota ? nuevaMascota.rango : "❌"}  
   🎚️ *Nivel:* ${nuevaMascota ? nuevaMascota.nivel : "❌"}  
   ❤️ *Vida:* ${nuevaMascota ? nuevaMascota.vida : "❌"}  
   ✨ *Experiencia:* 0 / 500 XP  
   ${habilidadesMascota}  

💎 *Diamantes:* 0  
🏦 *Diamantes en Gremio:* 0  

📜 *Comandos Básicos:*  
🔹 Usa *${global.prefix}vermascotas* para ver tu mascota actual y las que compres.  
🔹 Usa *${global.prefix}tiendamascotas* para ver mascotas disponibles.  
🔹 Usa *${global.prefix}tiendaper* para ver personajes de anime disponibles.  
🔹 Usa estos comandos para subir de nivel y ganar diamantes:  
   *${global.prefix}minar*, *${global.prefix}picar*, *${global.prefix}crime*, *${global.prefix}work*,  
   *${global.prefix}claim*, *${global.prefix}cofre*, *${global.prefix}minar2*, *${global.prefix}robar*  

🚀 ¡Prepárate para la aventura en *Azura Ultra*! 🏆`;

        await sock.sendMessage(msg.key.remoteJid, { edit: registroMensaje.key, text: "✅ *¡Registro completado!* Generando tu tarjeta de jugador..." }); 
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        await sock.sendMessage(msg.key.remoteJid, {  
            video: { url: "https://cdn.dorratz.com/files/1740560637895.mp4" },  
            gifPlayback: true,  
            caption: mensajeFinal  
        }, { quoted: msg }); 

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎮", key: msg.key } }); 

    } catch (error) { 
        console.error("❌ Error en el comando .rpg:", error); 
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al registrarte en el gremio. Inténtalo de nuevo.*" }, { quoted: msg }); 
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } }); 
    } 
    break; 
}
        
case 'vermascotas': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🐾", key: msg.key } // Emoji de mascotas 🐾
        });

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];

        // Verificar si el usuario tiene mascotas
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota comprada.*\n\n🔹 Usa \`${global.prefix}tiendamascotas\` para ver las mascotas disponibles en la tienda.` 
            }, { quoted: msg });
            return;
        }

        // Construir mensaje con todas las mascotas del usuario 🐾
        let mensaje = `🐾 *Lista de Mascotas - Azura Ultra* 🐾\n\n`;
        mensaje += `📜 *Aquí puedes ver todas las mascotas que has comprado y sus estadísticas.*\n`;
        mensaje += `🔹 Usa \`${global.prefix}mascota <número>\` para cambiar tu mascota principal.\n\n`;

        usuario.mascotas.forEach((mascota, index) => {
            let habilidadesMascota = Object.entries(mascota.habilidades)
                .map(([habilidad, data]) => `      🔹 ${habilidad} (Nivel ${data.nivel || 1})`)
                .join("\n");

            mensaje += `═════════════════════\n`;
            mensaje += `🔹 *${index + 1}. ${mascota.nombre}*\n`;
            mensaje += `   📊 *Rango:* ${mascota.rango || "Sin Rango"}\n`;
            mensaje += `   🎚️ *Nivel:* ${mascota.nivel || 1}\n`;
            mensaje += `   ❤️ *Vida:* ${mascota.vida || 100} HP\n`;
            mensaje += `   ✨ *Experiencia:* ${mascota.experiencia || 0} / ${mascota.xpMax || 500} XP\n`;
            mensaje += `   🌟 *Habilidades:*\n${habilidadesMascota}\n`;
            mensaje += `═════════════════════\n\n`;
        });

        // Explicación Final 📜
        mensaje += `📜 **Explicación Final:**\n`;
        mensaje += `🔹 Usa *${global.prefix}mascota <número>* para cambiar tu mascota principal.\n`;
        mensaje += `🔹 Usa *${global.prefix}nivelmascota* para ver la estadística de tu mascota actual.\n`;
        mensaje += `🔹 Usa estos comandos para subir de nivel a tus mascotas: \n`;
        mensaje += `   🛠️ *${global.prefix}daragua*, *${global.prefix}darcomida*, *${global.prefix}darcariño*, *${global.prefix}pasear*, *${global.prefix}cazar*, *${global.prefix}entrenar*, *${global.prefix}presumir*, *${global.prefix}supermascota*\n\n`;
        mensaje += `🚀 **¡Sigue entrenando a tus mascotas en el Gremio Azura Ultra!** 🏆`;

        // Enviar mensaje con el **video como GIF** 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740655817564.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .vermascotas:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al obtener tu lista de mascotas. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}

        
case 'verper': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🎭", key: msg.key } // Emoji de personaje 🎭
        });

        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { usuarios: {} };
        let userId = msg.key.participant || msg.key.remoteJid;

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No estás registrado en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];

        // Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes en tu colección.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar alguno.` 
            }, { quoted: msg });
            return;
        }

        // Mensaje principal con explicación 📜
        let mensaje = `🎭 *Personajes Comprados - Azura Ultra* 🎭\n\n`;
        mensaje += `🔹 Aquí puedes ver la lista de personajes que has adquirido.\n`;
        mensaje += `🔹 Usa los siguientes comandos para subir de nivel a tus personajes:\n`;
        mensaje += `   🏆 \`${global.prefix}luchar\`, \`${global.prefix}poder\`, \`${global.prefix}volar\`, \n`;
        mensaje += `   🔥 \`${global.prefix}otromundo\`, \`${global.prefix}otrouniverso\`, \`${global.prefix}mododios\`,\n`;
        mensaje += `   😈 \`${global.prefix}mododiablo\`, \`${global.prefix}enemigos\`, \`${global.prefix}podermaximo\`\n\n`;
        mensaje += `🔄 *¿Quieres cambiar tu personaje principal?*\n`;
        mensaje += `   📌 Usa \`${global.prefix}per <número_personaje>\` para cambiarlo.\n\n`;

        // Recorrer todos los personajes del usuario
        usuario.personajes.forEach((personaje, index) => {
            mensaje += `*═════════════════════*\n`; // Línea de separación
            mensaje += `🔹 *${index + 1}. ${personaje.nombre}*\n`;
            mensaje += `   🏅 *Rango:* ${personaje.rango}\n`;
            mensaje += `   🎚️ *Nivel:* ${personaje.nivel}\n`;
            mensaje += `   ❤️ *Vida:* ${personaje.vida} HP\n`;
            mensaje += `   ✨ *Experiencia:* ${personaje.experiencia} / ${personaje.xpMax} XP\n`;
            mensaje += `   🌟 *Habilidades:*\n`;

            // Listar correctamente las habilidades
            Object.entries(personaje.habilidades).forEach(([habilidad, nivel]) => {
                mensaje += `      🔹 ${habilidad} (Nivel ${nivel})\n`;
            });

            mensaje += `   💎 *Valor:* ${personaje.precio} diamantes\n\n`;
        });

        // Enviar el mensaje con el **video como GIF** 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740651987117.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje
        }, { quoted: msg });

        // ✅ Enviar reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .verper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al obtener la lista de personajes. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
        
case 'comprar': {
    try {
        // Verificar si el usuario ingresó un personaje o número
        if (args.length < 1) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo:\n📌 \`${global.prefix}comprar Satoru_Gojo\`\n📌 \`${global.prefix}comprar 1\`` 
            }, { quoted: msg });
            return;
        }

        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { usuarios: {}, tiendaPersonajes: [], mercadoPersonajes: [] };
        let userId = msg.key.participant || msg.key.remoteJid;

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No estás registrado en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];
        let personajeSeleccionado = null;

        // Buscar por número en la lista
        if (!isNaN(args[0])) {
            let index = parseInt(args[0]) - 1;
            if (index >= 0 && index < rpgData.tiendaPersonajes.length) {
                personajeSeleccionado = rpgData.tiendaPersonajes[index];
            }
        } else {
            // Buscar por nombre (ignorando mayúsculas y emojis)
            let nombreBuscado = args.join("_").toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");
            personajeSeleccionado = rpgData.tiendaPersonajes.find(p => 
                p.nombre.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "") === nombreBuscado
            );
        }

        // Si el personaje no existe, mostrar mensaje
        if (!personajeSeleccionado) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No se encontró ese personaje en la tienda.*\n📜 Usa \`${global.prefix}tiendaper\` para ver los personajes disponibles.` 
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario tiene suficiente diamantes
        if (usuario.diamantes < personajeSeleccionado.precio) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes.*\n💎 *Precio:* ${personajeSeleccionado.precio} diamantes\n💰 *Tu saldo:* ${usuario.diamantes} diamantes.` 
            }, { quoted: msg });
            return;
        }

        // Restar los diamantes al usuario
        usuario.diamantes -= personajeSeleccionado.precio;

        // Agregar el personaje a la cartera del usuario
        if (!usuario.personajes) usuario.personajes = [];
        usuario.personajes.push({
            nombre: personajeSeleccionado.nombre,
            rango: personajeSeleccionado.rango,
            nivel: personajeSeleccionado.nivel,
            experiencia: personajeSeleccionado.experiencia,
            xpMax: personajeSeleccionado.xpMax,
            vida: personajeSeleccionado.vida,
            habilidades: personajeSeleccionado.habilidades, // Ahora guarda bien las habilidades
            precio: personajeSeleccionado.precio, // Guardamos el precio
            imagen: personajeSeleccionado.imagen
        });

        // Eliminar el personaje de la tienda
        rpgData.tiendaPersonajes = rpgData.tiendaPersonajes.filter(p => p.nombre !== personajeSeleccionado.nombre);

        // Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Mensaje de confirmación de compra con imagen
        let mensajeCompra = `🎭 *¡Has comprado un nuevo personaje!* 🎭\n\n`;
        mensajeCompra += `🔹 *Nombre:* ${personajeSeleccionado.nombre}\n`;
        mensajeCompra += `   🎚️ *Nivel:* ${personajeSeleccionado.nivel}\n`;
        mensajeCompra += `   ❤️ *Vida:* ${personajeSeleccionado.vida} HP\n`;
        mensajeCompra += `   ✨ *Experiencia:* ${personajeSeleccionado.experiencia} / ${personajeSeleccionado.xpMax} XP\n`;
        mensajeCompra += `   🌟 *Habilidades:*\n`;

        // Mostrar habilidades correctamente
        Object.entries(personajeSeleccionado.habilidades).forEach(([habilidad, nivel]) => {
            mensajeCompra += `      🔹 ${habilidad} (Nivel ${nivel})\n`;
        });

        mensajeCompra += `\n💎 *Costo:* ${personajeSeleccionado.precio} diamantes\n`;
        mensajeCompra += `📜 Usa \`${global.prefix}nivelper\` para ver sus estadísticas.\n`;
        mensajeCompra += `📜 Usa \`${global.prefix}verper\` para ver todos tus personajes comprados.`;

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: personajeSeleccionado.imagen }, 
            caption: mensajeCompra
        }, { quoted: msg });

        // ✅ Enviar reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .comprar:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al procesar la compra. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
        
        
case 'dar': {
    try {
        // 🔒 Verificar si el usuario que ejecuta el comando es el Owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede dar diamantes a otros jugadores.*" 
            }, { quoted: msg });
            return;
        }

        // 📌 Verificar si se ingresó un número de usuario o se citó un mensaje
        let targetUser;
        if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetUser = msg.message.extendedTextMessage.contextInfo.participant; // Usuario citado
        } else if (mentionedJid.length > 0) {
            targetUser = mentionedJid[0]; // Usuario mencionado
        } else {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}dar @usuario 5000\` o citando su mensaje.` 
            }, { quoted: msg });
            return;
        }

        // 📌 Verificar si se ingresó la cantidad de diamantes
        if (args.length < 1 || isNaN(args[0]) || parseInt(args[0]) <= 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes ingresar una cantidad válida de diamantes a dar.*\nEjemplo: `dar @usuario 5000`" 
            }, { quoted: msg });
            return;
        }

        const cantidad = parseInt(args[0]); // Cantidad de diamantes a dar
        const rpgFile = "./rpg.json";

        // 🔄 Enviar reacción de carga mientras se procesa
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💎", key: msg.key } // Emoji de diamantes 💎
        });

        // 📂 Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *No hay datos de RPG guardados.*" 
            }, { quoted: msg });
            return;
        }

        // 📂 Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // 📌 Verificar si el usuario está registrado en el RPG
        if (!rpgData.usuarios[targetUser]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *El usuario no tiene una cuenta en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarlo.` 
            }, { quoted: msg });
            return;
        }

        // 💎 Añadir diamantes al usuario objetivo
        rpgData.usuarios[targetUser].diamantes += cantidad;

        // 💾 Guardar cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📩 Confirmar transferencia
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `💎 *Se han enviado ${cantidad} diamantes a @${targetUser.replace("@s.whatsapp.net", "")}.*\n✨ Usa \`${global.prefix}bal\` para ver tu saldo.`,
            mentions: [targetUser] // Mencionar al usuario que recibió los diamantes
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .dar:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al dar diamantes. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        
case 'deleteuser': {
    try {
        // 🔒 Verificar si el usuario que ejecuta el comando es Owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede eliminar la cuenta de otros jugadores.*" 
            }, { quoted: msg });
            return;
        }

        // 📌 Verificar si se ingresó un número válido
        if (args.length < 1 || isNaN(args[0])) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n\n📌 *Ejemplo de uso:* \n🔹 \`${global.prefix}deleteuser 50212345678\` (Número sin @ ni espacios)\n\n🔹 *Este comando eliminará la cuenta del usuario y devolverá sus personajes a la tienda.*` 
            }, { quoted: msg });
            return;
        }

        const userId = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net"; // Formato correcto del ID de usuario
        const rpgFile = "./rpg.json";

        // 🔄 Enviar reacción de carga mientras se procesa
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🗑️", key: msg.key } // Emoji de eliminación 🗑️
        });

        // 📂 Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *No hay datos de RPG guardados.*" 
            }, { quoted: msg });
            return;
        }

        // 📂 Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // 📌 Verificar si el usuario está registrado en el RPG
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *El usuario @${args[0]} no tiene una cuenta registrada en el gremio Azura Ultra.*`,
                mentions: [userId]
            }, { quoted: msg });
            return;
        }

        // 🏷️ Recuperar personajes del usuario y devolverlos a la tienda
        let usuario = rpgData.usuarios[userId];
        if (usuario.personajes && usuario.personajes.length > 0) {
            rpgData.tiendaPersonajes.push(...usuario.personajes);
        }

        // ❌ Eliminar el usuario del JSON
        delete rpgData.usuarios[userId];

        // 💾 Guardar cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📩 Confirmar eliminación
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `🗑️ *La cuenta de @${args[0]} ha sido eliminada exitosamente del gremio Azura Ultra.*\n\n🔹 *Sus personajes han sido devueltos a la tienda.*`,
            mentions: [userId] // Mencionar al usuario eliminado
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .deleteuser:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al eliminar la cuenta del usuario. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        
case 'deleterpg': {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        const rpgFile = "./rpg.json";

        // 🔄 Reacción inicial
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "⏳", key: msg.key } // Emoji de espera ⏳
        });

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *No hay datos de RPG guardados.*" 
            }, { quoted: msg });
            return;
        }

        // Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes un registro en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        // Confirmación de eliminación
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *¿Estás seguro de que quieres eliminar tu cuenta del gremio Azura Ultra?* Esto borrará todos tus datos, incluyendo personajes y mascotas.\n\n⏳ *Tienes 1 minuto para confirmar.*\n\n✅ Si estás seguro, usa \`${global.prefix}ok\` para confirmar.\n❌ Si no quieres eliminar, simplemente ignora este mensaje.` 
        }, { quoted: msg });

        // Guardar en memoria temporal la solicitud de eliminación
        global.pendingDeletions = global.pendingDeletions || {};
        global.pendingDeletions[userId] = setTimeout(() => {
            delete global.pendingDeletions[userId]; // Expira la solicitud después de 1 minuto
        }, 60000);

    } catch (error) {
        console.error("❌ Error en el comando .deleterpg:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al intentar eliminar tu registro. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}

// ✅ **Comando de Confirmación .ok**
case 'ok': {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        const rpgFile = "./rpg.json";

        // Verificar si hay una solicitud de eliminación pendiente
        if (!global.pendingDeletions || !global.pendingDeletions[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No tienes una solicitud de eliminación pendiente.* Usa `"+global.prefix+"deleterpg` para iniciar la eliminación de tu cuenta." 
            }, { quoted: msg });
            return;
        }

        clearTimeout(global.pendingDeletions[userId]); // Cancelar temporizador
        delete global.pendingDeletions[userId]; // Remover de la lista de eliminaciones

        // Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No tienes un registro en el gremio Azura Ultra.*" 
            }, { quoted: msg });
            return;
        }

        // Recuperar personajes del usuario y devolverlos a la tienda
        let usuario = rpgData.usuarios[userId];
        if (usuario.personajes && usuario.personajes.length > 0) {
            rpgData.tiendaPersonajes.push(...usuario.personajes);
        }

        // Eliminar el usuario
        delete rpgData.usuarios[userId];

        // Guardar los cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Confirmar eliminación
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🗑️ *Tu cuenta ha sido eliminada del gremio Azura Ultra.*\n\n🔹 Puedes volver a registrarte en cualquier momento usando `"+global.prefix+"rpg <nombre> <edad>`." 
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .ok:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al confirmar la eliminación. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        
case 'nivelper': {
    try {
        // 🔄 Reacción al procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "📜", key: msg.key } });

        const rpgFile = "./rpg.json";

        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes registrados.*\n📌 Usa \`${global.prefix}comprar <nombre>\` para obtener uno.` 
            }, { quoted: msg });
            return;
        }

        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        if (!rpgData.usuarios[msg.key.participant]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes cuenta en Azura Ultra.*\n📌 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[msg.key.participant];

        if (!usuario.personajes || usuario.personajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes.*\n📌 Usa \`${global.prefix}tiendaper\` para comprar.` 
            }, { quoted: msg });
            return;
        }

        let personajeActual = usuario.personajes[0];

        // Construcción del mensaje claro con ambas habilidades
        let mensaje = `🎭 *Estadísticas de tu Personaje Principal* 🎭\n\n`;
        mensaje += `🔹 *Nombre:* ${personajeActual.nombre}\n`;
        mensaje += `🎚️ *Nivel:* ${personajeActual.nivel}\n`;
        mensaje += `❤️ *Vida:* ${personajeActual.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${personajeActual.experiencia || 0} / 1000 XP\n`;
        mensaje += `🌟 *Habilidades:*\n`;

        // Mostrar claramente ambas habilidades con sus niveles
        Object.entries(personajeActual.habilidades).forEach(([habilidad, datos]) => {
            mensaje += `   🔸 ${habilidad} (Nivel ${datos.nivel})\n`;
        });

        mensaje += `\n📜 Usa \`${global.prefix}verper\` para ver todos tus personajes.\n`;

        // Enviar imagen y mensaje
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: personajeActual.imagen }, 
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en .nivelper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al obtener estadísticas. Intenta otra vez.*" 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
    }
    break;
}
     
case 'bal':
case 'saldo': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💰", key: msg.key } // Emoji de dinero 💰
        });

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];

        // Construir mensaje de saldo 📜
        let mensaje = `
*╔═══❖•ೋ° °ೋ•❖═══╗*
🎒 *Bienvenido a tu Cartera* 🎒
*╚═══❖•ೋ° °ೋ•❖═══╝*

💰 *SALDO DE:* @${userId.replace("@s.whatsapp.net", "")}

⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱
💎 *Diamantes disponibles:* ${usuario.diamantes}
🏦 *Diamantes guardados en el gremio:* ${usuario.diamantesGuardados}
⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱

📜 *¿Cómo guardar tus diamantes en el gremio?*  
🔹 Usa \`${global.prefix}dep <cantidad>\` o \`${global.prefix}depositar <cantidad>\` para almacenar diamantes en el gremio.  
🔹 Los diamantes guardados están protegidos y no pueden ser robados.  
🚀 ¡Administra bien tu economía y conviértete en el más rico del gremio! 🏆
`;

        // Enviar mensaje con el **video como GIF** 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740652887134.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje,
            mentions: [userId] // Menciona al usuario
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .bal:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al obtener tu saldo. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}        

        
case 'dame': {
    try {
        // Verificar si el usuario es el owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Este comando solo puede ser usado por el owner del bot.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar que se haya ingresado la cantidad
        if (args.length === 0 || isNaN(args[0]) || parseInt(args[0]) <= 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}dame 5000\`` 
            }, { quoted: msg });
            return;
        }

        let cantidad = parseInt(args[0]);

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No hay datos de jugadores registrados.*" 
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el owner está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        // Dar los diamantes al owner
        rpgData.usuarios[userId].diamantes += cantidad;

        // Guardar cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Mensaje de confirmación 💎
        let mensaje = `🎉 *¡Diamantes añadidos con éxito!* 🎉\n\n`;
        mensaje += `💰 *Has recibido:* ${cantidad} diamantes\n`;
        mensaje += `💎 *Total actual:* ${rpgData.usuarios[userId].diamantes} diamantes\n\n`;
        mensaje += `📜 Usa \`${global.prefix}bal\` para ver tu saldo.`;

        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💎", key: msg.key } // Emoji de diamante 💎
        });

    } catch (error) {
        console.error("❌ Error en el comando .dame:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Ocurrió un error al intentar añadir diamantes. Inténtalo de nuevo.*` 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        

        

case 'nivelmascota': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📊", key: msg.key } // Emoji de estadísticas 📊
        });

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una mascota registrada.*\n\n🔹 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte y obtener una mascota inicial.` 
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[msg.key.participant]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[msg.key.participant];

        // Verificar si el usuario tiene mascotas
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una mascota actualmente.*\n\n🔹 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
            return;
        }

        // Obtener la mascota actual (la primera en la lista)
        let mascotaActual = usuario.mascotas[0];

        // Construcción del mensaje de estadísticas 📜
        let mensaje = `📊 *Estadísticas de tu Mascota Principal* 📊\n\n`;
        mensaje += `🐾 *Nombre:* ${mascotaActual.nombre}\n`;
        mensaje += `🎚️ *Nivel:* ${mascotaActual.nivel} 🆙\n`;
        mensaje += `❤️ *Vida:* ${mascotaActual.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${mascotaActual.experiencia || 0} / 500 XP\n`;
        mensaje += `📊 *Rango:* ${mascotaActual.rango || "Principiante"}\n`;
        mensaje += `🌟 *Habilidades:*\n`;
        Object.entries(mascotaActual.habilidades).forEach(([habilidad, datos]) => {
            mensaje += `   🔹 ${habilidad} (Nivel ${datos.nivel || 1})\n`;
        });

        // 📢 **Mensaje motivacional para seguir entrenando** 
        mensaje += `\n🚀 *Sigue subiendo de nivel a tu mascota con estos comandos:* 🔽\n`;
        mensaje += `   🥤 \`${global.prefix}daragua\` | 🍖 \`${global.prefix}darcomida\` | ❤️ \`${global.prefix}darcariño\`\n`;
        mensaje += `   🚶 \`${global.prefix}pasear\` | 🎯 \`${global.prefix}cazar\` | 🏋️ \`${global.prefix}entrenar\`\n`;
        mensaje += `   🌟 \`${global.prefix}presumir\` | 🦸 \`${global.prefix}supermascota\`\n\n`;
        mensaje += `🔥 ¡Entrena a tu mascota y conviértela en la más fuerte del gremio! 💪🐾\n`;

        // Enviar mensaje con la imagen de la mascota 📷
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: mascotaActual.imagen }, 
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .nivelmascota:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Ocurrió un error al obtener la información de tu mascota. Inténtalo de nuevo.*` 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        
case 'tiendamascotas': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🐾", key: msg.key } // Emoji de mascota 🐾
        });

        // Leer el archivo RPG JSON
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaMascotas: [] };

        // Verificar si hay mascotas en la tienda
        if (!rpgData.tiendaMascotas || rpgData.tiendaMascotas.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Actualmente no hay mascotas en la tienda.*\n🔹 Usa `.addmascota` para agregar nuevas mascotas." 
            }, { quoted: msg });
            return;
        }

        // Explicación sobre la compra de mascotas 📜
        let mensaje = `🏪 *Tienda de Mascotas - Azura Ultra* 🏪\n\n`;
        mensaje += `🐶 *Aquí puedes comprar mascotas para mejorar tu equipo.*\n`;
        mensaje += `🛍️ *Para comprar una mascota, usa:* \n`;
        mensaje += `   📌 \`${global.prefix}compra <nombre_mascota>\`\n`;
        mensaje += `   📌 \`${global.prefix}compra <número_mascota>\`\n\n`;
        mensaje += `📜 Usa \`${global.prefix}menurpg\` para más información.\n\n`;

        // Mostrar todas las mascotas disponibles 🐾
        rpgData.tiendaMascotas.forEach((mascota, index) => {
            let habilidadesMascota = Object.entries(mascota.habilidades)
                .map(([habilidad, nivel]) => `      🔹 ${habilidad} (Nivel ${nivel})`)
                .join("\n");

            mensaje += `╔══════════════════╗\n`;
            mensaje += `🔹 *${index + 1}. ${mascota.nombre}*\n`;
            mensaje += `   📊 *Rango:* ${mascota.rango}\n`;
            mensaje += `   🎚️ *Nivel Inicial:* ${mascota.nivel || 1}\n`; 
            mensaje += `   ❤️ *Vida:* ${mascota.vida || 100} HP\n`;
            mensaje += `   ✨ *Experiencia:* ${mascota.experiencia || 0} / ${mascota.xpMax} XP\n`;
            mensaje += `   🌟 *Habilidades:*\n${habilidadesMascota}\n`;
            mensaje += `   💎 *Precio:* ${mascota.precio} diamantes\n`;
            mensaje += `╚══════════════════╝\n\n`;
        });

        // Explicación Final 📜
        mensaje += `📜 **Explicación Final:**\n`;
        mensaje += `🔹 Usa *${global.prefix}compra <nombre_mascota>* para comprar la mascota que quieras.\n`;
        mensaje += `🔹 También puedes usar *${global.prefix}compra <número_mascota>* si prefieres usar el número de la lista.\n`;
        mensaje += `🔹 Usa *${global.prefix}vermascotas* para ver todas las mascotas que has comprado.\n`;
        mensaje += `🔹 Usa *${global.prefix}mascota <número>* para cambiar tu mascota principal.\n\n`;
        mensaje += `🚀 **¡Colecciona y entrena las mejores mascotas en el Gremio Azura Ultra!** 🏆`;

        // Enviar mensaje con el **video como GIF** 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740573307122.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .tiendamascotas:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al cargar la tienda de mascotas. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        
case 'tiendaper': {
    try {
        // 🔄 Enviar reacción de carga mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛍️", key: msg.key } // Emoji de tienda 🛍️
        });

        // Leer el archivo RPG JSON
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaPersonajes: [] };

        // Verificar si hay personajes en la tienda
        if (!rpgData.tiendaPersonajes || rpgData.tiendaPersonajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Actualmente no hay personajes en la tienda.*\n🔹 Usa `.addper` para agregar nuevos personajes." 
            }, { quoted: msg });
            return;
        }

        // Explicación de compra al inicio 📜
        let mensaje = `🏪 *Tienda de Personajes - Azura Ultra* 🏪\n\n`;
        mensaje += `🎭 *Compra personajes de anime y mejora sus habilidades.*\n`;
        mensaje += `🛒 *Para comprar un personaje usa:* \n`;
        mensaje += `   📌 \`${global.prefix}compra <nombre_personaje>\`\n`;
        mensaje += `   📌 \`${global.prefix}compra <número_personaje>\`\n`;
        mensaje += `📜 Usa \`${global.prefix}menurpg\` para más información.\n\n`;

        // Crear la lista de personajes disponibles 📜
        rpgData.tiendaPersonajes.forEach((personaje, index) => {
            let habilidadesPersonaje = Object.entries(personaje.habilidades)
                .map(([habilidad, datos]) => `      🔹 ${habilidad} (Nivel ${datos.nivel || 1})`)
                .join("\n");

            mensaje += `*╔══════════════════╗*\n`;
            mensaje += `🔹 *${index + 1}. ${personaje.nombre}*\n`;
            mensaje += `   🎚️ *Nivel Inicial:* ${personaje.nivel || 1}\n`;
            mensaje += `   ❤️ *Vida:* ${personaje.vida || 100} HP\n`;
            mensaje += `   ✨ *Experiencia:* ${personaje.experiencia || 0} / 1000 XP\n`;
            mensaje += `   🌟 *Habilidades:*\n${habilidadesPersonaje}\n`;
            mensaje += `   💎 *Precio:* ${personaje.precio} diamantes\n`;
            mensaje += `*╚══════════════════╝*\n\n`;
        });

        // Enviar mensaje con el video como GIF 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740568203122.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .tiendaper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al cargar la tienda de personajes. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}

        
case 'topuser': {
    try {
        const rpgFile = "./rpg.json";

        // 🔄 Enviar una única reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📊", key: msg.key } // Emoji de estadística 📊
        });

        // Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El gremio aún no tiene miembros registrados.* Usa `.rpg <nombre> <edad>` para unirte." 
            }, { quoted: msg });
            return;
        }

        // Cargar datos del gremio
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        if (!rpgData.usuarios || Object.keys(rpgData.usuarios).length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "📜 *No hay miembros registrados en el Gremio Azura Ultra.*" 
            }, { quoted: msg });
            return;
        }

        let usuarios = Object.entries(rpgData.usuarios);

        // Ordenar por nivel de mayor a menor
        usuarios.sort((a, b) => b[1].nivel - a[1].nivel);

        let ranking = `🏆 *Ranking de Jugadores del Gremio Azura Ultra* 🏆\n\n`;
        let mentions = [];

        usuarios.forEach(([userId, usuario], index) => {
            let posicion = index + 1;
            let medalla = posicion === 1 ? "🥇" : posicion === 2 ? "🥈" : posicion === 3 ? "🥉" : "🔹";
            ranking += `${medalla} *${posicion}.* @${userId.replace("@s.whatsapp.net", "")}  
   🏅 *Rango:* ${usuario.rango}  
   🎚️ *Nivel:* ${usuario.nivel}\n\n`;
            mentions.push(userId);
        });

        ranking += `\n🔥 ¡Sigue entrenando para subir en el ranking!`;

        // Enviar el mensaje con menciones 📩
        await sock.sendMessage(msg.key.remoteJid, { 
            text: ranking,
            mentions: mentions // Mencionar a todos los jugadores
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .topuser:", error);

        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener el ranking de jugadores. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case 'gremio': {
    try {
        const rpgFile = "./rpg.json";
        
        // 🔄 Enviar una única reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🏰", key: msg.key } // Emoji de castillo 🏰
        });

        // Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El gremio aún no tiene miembros.* Usa `.rpg <nombre> <edad>` para registrarte." 
            }, { quoted: msg });
            return;
        }

        // Cargar datos del gremio
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        if (!rpgData.usuarios || Object.keys(rpgData.usuarios).length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "📜 *No hay miembros registrados en el Gremio Azura Ultra.*\nUsa `.rpg <nombre> <edad>` para unirte." 
            }, { quoted: msg });
            return;
        }

        let miembros = Object.values(rpgData.usuarios);
        let listaMiembros = `🏰 *Gremio Azura Ultra - Miembros Registrados* 🏰\n\n`;

        // Ordenar por nivel (de mayor a menor)
        miembros.sort((a, b) => b.nivel - a.nivel);

        // Construir la lista con los datos de cada usuario
        miembros.forEach((usuario, index) => {
            listaMiembros += `🔹 *${index + 1}.* ${usuario.nombre}  
   🏅 *Rango:* ${usuario.rango}  
   🎚️ *Nivel:* ${usuario.nivel}  
   🎂 *Edad:* ${usuario.edad} años\n\n`;
        });

        listaMiembros += `🏆 *Total de miembros:* ${miembros.length}`;

        // Enviar el video como GIF con el listado 📜
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740565316697.mp4" }, 
            gifPlayback: true, 
            caption: listaMiembros
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .gremio:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener la lista del gremio. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        

        
case 'addper': {
    try {
        // 🔄 Reacción antes de agregar el personaje
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🎭", key: msg.key } // Emoji de personaje 🎭
        });

        // Verificar permisos (Solo Owner)
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede agregar personajes a la tienda.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si se enviaron todos los parámetros
        if (args.length < 5) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n\n📌 Ejemplo: \`${global.prefix}addper Goku Kamehameha UltraInstinto https://cdn.example.com/goku.jpg 5000\`` 
            }, { quoted: msg });
            return;
        }

        // Extraer los datos ingresados
        let nombre = args[0]; // Nombre del personaje
        let habilidad1 = args[1]; // Primera habilidad
        let habilidad2 = args[2]; // Segunda habilidad
        let urlImagen = args[3]; // URL de la imagen o GIF
        let precio = parseInt(args[4]); // Precio en 💎 Diamantes

        // Validar que el precio sea un número
        if (isNaN(precio) || precio < 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El precio debe ser un número válido mayor o igual a 0.*" 
            }, { quoted: msg });
            return;
        }

        // Definir los rangos de los personajes
        const rangosPersonajes = [
            "🌟 Principiante", "⚔️ Guerrero", "🔥 Maestro", "👑 Élite", "🌀 Legendario", "💀 Dios de la Batalla"
        ];
        
        let rangoInicial = rangosPersonajes[0]; // Todos los personajes empiezan con rango Principiante

        // Leer o crear el archivo rpg.json
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaPersonajes: [] };

        // Verificar si el personaje ya está en la tienda
        let personajeExistente = rpgData.tiendaPersonajes.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
        if (personajeExistente) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Ese personaje ya está en la tienda.* Usa otro nombre." 
            }, { quoted: msg });
            return;
        }

        // Crear el objeto del nuevo personaje con nivel, vida y experiencia
        let nuevoPersonaje = {
            nombre: nombre,
            rango: rangoInicial,
            nivel: 1, // Nivel inicial
            experiencia: 0, // Exp inicial
            xpMax: 1000, // Exp máxima inicial
            vida: 100, // Vida inicial
            habilidades: { 
                [habilidad1]: 1,
                [habilidad2]: 1
            },
            imagen: urlImagen,
            precio: precio
        };

        // Agregar el personaje a la tienda
        rpgData.tiendaPersonajes.push(nuevoPersonaje);
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Enviar confirmación con la imagen
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: urlImagen },
            caption: `✅ *Nuevo Personaje Agregado a la Tienda* ✅\n\n` +
                     `🎭 *Nombre:* ${nombre}\n` +
                     `📊 *Rango:* ${rangoInicial}\n` +
                     `🆙 *Nivel:* 1\n` +
                     `❤️ *Vida:* 100 HP\n` +
                     `✨ *Experiencia:* 0 / 1000 XP\n` +
                     `🌟 *Habilidades:*\n` +
                     `   🔹 ${habilidad1} (Nivel 1)\n` +
                     `   🔹 ${habilidad2} (Nivel 1)\n` +
                     `💎 *Precio:* ${precio} diamantes\n\n` +
                     `📌 ¡Disponible en la tienda de personajes ahora!`
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .addper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al agregar el personaje. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
            

        
case 'addmascota': { 
    try {
        // 🔄 Reacción antes de agregar la mascota
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🐾", key: msg.key } // Emoji de patas 🐾
        });

        // Verificar permisos (Solo Owner y Admins del grupo)
        if (!isOwner(sender) && !isAdmin(msg.key.remoteJid, sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los administradores del bot pueden agregar mascotas a la tienda.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si se enviaron todos los parámetros
        if (args.length < 5) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n\n📌 Ejemplo: \`${global.prefix}addmascota 🐕Perro rápido protector https://cdn.example.com/perro.jpg 3000\`` 
            }, { quoted: msg });
            return;
        }

        // Extraer los datos ingresados
        let nombre = args[0]; // Emoji + Nombre
        let habilidad1 = args[1]; // Primera habilidad
        let habilidad2 = args[2]; // Segunda habilidad
        let urlImagen = args[3]; // URL de la imagen o GIF
        let precio = parseInt(args[4]); // Precio en 💎 Diamantes

        // Validar que el precio sea un número
        if (isNaN(precio) || precio < 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El precio debe ser un número válido mayor o igual a 0.*" 
            }, { quoted: msg });
            return;
        }

        // Definir los rangos de las mascotas
        const rangosMascotas = [
            "🐣 Principiante", "🐾 Novato", "🦴 Aprendiz", "🐕 Iniciado", "🦊 Experimentado",
            "🐅 Avanzado", "🐉 Veterano", "🦅 Élite", "🦄 Legendario", "🔥 Divino"
        ];
        
        let rangoInicial = rangosMascotas[0]; // Todas las mascotas empiezan con rango Principiante

        // Leer o crear el archivo rpg.json
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaMascotas: [] };

        // Verificar si la mascota ya está en la tienda
        let mascotaExistente = rpgData.tiendaMascotas.find(m => m.nombre === nombre);
        if (mascotaExistente) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Esa mascota ya está en la tienda.* Usa otro nombre." 
            }, { quoted: msg });
            return;
        }

        // Crear el objeto de la nueva mascota
        let nuevaMascota = {
            nombre: nombre,
            rango: rangoInicial,
            nivel: 1, // Nivel inicial
            experiencia: 0, // Exp inicial
            xpMax: 500, // Exp máxima inicial
            habilidades: { 
                [habilidad1]: 1,
                [habilidad2]: 1
            },
            vida: 100, // Vida inicial
            imagen: urlImagen,
            precio: precio
        };

        // Agregar la mascota a la tienda
        rpgData.tiendaMascotas.push(nuevaMascota);
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Enviar confirmación con la imagen
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: urlImagen },
            caption: `✅ *Nueva Mascota Agregada a la Tienda* ✅\n\n` +
                     `🦴 *Nombre:* ${nombre}\n` +
                     `📊 *Rango:* ${rangoInicial}\n` +
                     `🆙 *Nivel:* 1\n` +
                     `❤️ *Vida:* 100\n` +
                     `✨ *Experiencia:* 0 / 500 XP\n` +
                     `🌟 *Habilidades:*\n` +
                     `   🔹 ${habilidad1} (Nivel 1)\n` +
                     `   🔹 ${habilidad2} (Nivel 1)\n` +
                     `💎 *Precio:* ${precio} diamantes\n\n` +
                     `🔹 ¡Disponible en la tienda ahora!`
        }, { quoted: msg });

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .addmascota:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al agregar la mascota. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}

        
case 'toimg': {
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const { writeFileSync } = fs;
    const { exec } = require('child_process');

    if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: "⚠️ *Debes responder a un sticker para convertirlo en imagen.*" 
        }, { quoted: msg });
    }

    // Enviar reacción de proceso ⏳
    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    let quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
    let stickerStream = await downloadContentFromMessage(quoted, "sticker");

    let buffer = Buffer.alloc(0);
    for await (const chunk of stickerStream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    if (buffer.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al procesar el sticker.*" 
        }, { quoted: msg });
    }

    const stickerPath = path.join(__dirname, 'tmp', `${Date.now()}.webp`);
    const imagePath = stickerPath.replace('.webp', '.jpg');

    writeFileSync(stickerPath, buffer); // Guardar el sticker temporalmente

    // Convertir de WebP a JPG con ffmpeg
    exec(`ffmpeg -i "${stickerPath}" "${imagePath}"`, async (error) => {
        if (error) {
            console.error("❌ Error al convertir sticker a imagen:", error);
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No se pudo convertir el sticker en imagen.*" 
            }, { quoted: msg });
        }

        // Enviar la imagen resultante
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: imagePath },
            caption: "🖼️ *Aquí está tu imagen convertida del sticker.*"
        }, { quoted: msg });

        // Eliminar archivos temporales después de enviarlos
        fs.unlinkSync(stickerPath);
        fs.unlinkSync(imagePath);

        // Enviar reacción de éxito ✅
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });
    });

    break;
}

            
case 'ytmp3': {
    const fs = require('fs');
    const path = require('path');
    const fetch = require('node-fetch');
    const ytdl = require('./libs/ytdl');
    const yts = require('yt-search');

    if (!args.length || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(args[0])) {
        return sock.sendMessage(msg.key.remoteJid, { text: '⚠️ *Error:* Ingresa un enlace válido de YouTube. 📹' });
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '⏳', key: msg.key }
    });

    await sock.sendMessage(msg.key.remoteJid, { text: '🚀 *Procesando tu solicitud...*' });

    const videoUrl = args[0];

    try {
        // Obtener información del video
        const videoId = videoUrl.split('v=')[1] || videoUrl.split('/').pop();
        const searchResult = await yts({ videoId });

        if (!searchResult || !searchResult.title || !searchResult.thumbnail) {
            throw new Error('No se pudo obtener la información del video.');
        }

        const videoInfo = {
            title: searchResult.title,
            thumbnail: await (await fetch(searchResult.thumbnail)).buffer()
        };

        // Obtener enlace de descarga
        const ytdlResult = await ytdl(videoUrl);
        if (ytdlResult.status !== 'success' || !ytdlResult.dl) {
            throw new Error('⚠️ *Todas las APIs fallaron.* No se pudo obtener el enlace de descarga.');
        }

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filePath = path.join(tmpDir, `${Date.now()}.mp3`);

        // Descargar el archivo MP3
        const response = await fetch(ytdlResult.dl);
        if (!response.ok) throw new Error(`Fallo la descarga: ${response.statusText}`);

        const buffer = await response.buffer();
        fs.writeFileSync(filePath, buffer);

        // Validar que el archivo sea un MP3 válido
        const fileSize = fs.statSync(filePath).size;
        if (fileSize < 10000) { // Si pesa menos de 10KB, probablemente esté corrupto
            fs.unlinkSync(filePath);
            throw new Error('El archivo descargado es inválido.');
        }

        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mpeg',
            fileName: `${videoInfo.title}.mp3`
        }, { quoted: msg });

        fs.unlinkSync(filePath);
        
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .ytmp3:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al descargar el audio. Inténtalo de nuevo más tarde.*" });
    }
    break;
}        
        
case 'speedtest':
case 'speed': {
    const cp = require('child_process');
    const { promisify } = require('util');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    
    const exec = promisify(cp.exec).bind(cp);

    // Enviar una reacción antes de procesar el comando ⏳
    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    await sock.sendMessage(msg.key.remoteJid, {
        text: '🚀 Prueba de velocidad en curso... ⏳',
        mentions: [msg.key.participant || msg.key.remoteJid],
    }, { quoted: msg });

    let o;
    try {
        o = await exec('python3 speed.py --secure --share');
    } catch (e) {
        o = e;
    } finally {
        const { stdout, stderr } = o;
        
        if (stdout.trim()) {
            let result = stdout.trim();
            let imageUrlMatch = result.match(/(https?:\/\/[^\s]+)/); // Buscar la URL de la imagen de Speedtest
            
            if (imageUrlMatch) {
                let imageUrl = imageUrlMatch[0];

                try {
                    // Descargar la imagen de Speedtest
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(response.data);
                    const imagePath = path.join(__dirname, 'tmp', 'speedtest.png');

                    fs.writeFileSync(imagePath, imageBuffer); // Guardar la imagen temporalmente

                    // Enviar imagen con los resultados
                    await sock.sendMessage(msg.key.remoteJid, { 
                        image: { url: imagePath },
                        caption: `📊 *Resultados de Speedtest:*\n\n${result.replace(imageUrl, '').trim()}`
                    }, { quoted: msg });

                    fs.unlinkSync(imagePath); // Eliminar la imagen después de enviarla
                } catch (error) {
                    console.error('Error al descargar la imagen:', error);
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: `⚠️ No se pudo descargar la imagen de Speedtest, pero aquí están los resultados:\n\n${result}`
                    }, { quoted: msg });
                }
            } else {
                // Si no hay URL de imagen, solo enviar el texto del resultado
                await sock.sendMessage(msg.key.remoteJid, { text: result }, { quoted: msg });
            }
        }
        
        if (stderr.trim()) {
            await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error en Speedtest:\n\n${stderr}` }, { quoted: msg });
            console.log(stderr);
        }

        // Enviar una reacción de confirmación ✅ después de completar la prueba
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });
    }
    break;
}

            
case 'link': {
    const fs = require('fs');
    const axios = require('axios');
    const FormData = require('form-data');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

    try {
        let quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage || msg.quoted?.message;

        if (!quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "⚠️ *Aviso:* Responde a cualquier archivo multimedia (imagen, video, audio, documento, sticker) para generar un enlace URL. 🔗" },
                { quoted: msg }
            );
        }

        // 📌 Detectar el tipo de multimedia (imagen, video, audio, documento, sticker)
        let mediaMessage;
        let mediaType;
        
        if (quotedMessage.imageMessage) {
            mediaMessage = quotedMessage.imageMessage;
            mediaType = "image";
        } else if (quotedMessage.videoMessage) {
            mediaMessage = quotedMessage.videoMessage;
            mediaType = "video";
        } else if (quotedMessage.audioMessage) {
            mediaMessage = quotedMessage.audioMessage;
            mediaType = "audio";
        } else if (quotedMessage.documentMessage) {
            mediaMessage = quotedMessage.documentMessage;
            mediaType = "document";
        } else if (quotedMessage.stickerMessage) {
            mediaMessage = quotedMessage.stickerMessage;
            mediaType = "sticker";
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* No se detectó un archivo multimedia válido. 📂" },
                { quoted: msg }
            );
        }

        // 🔄 Reacción mientras procesa
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } });

        const mimetype = mediaMessage.mimetype || `${mediaType}/unknown`;
        const mediaStream = await downloadContentFromMessage(mediaMessage, mediaType);
        let mediaBuffer = Buffer.alloc(0);

        for await (const chunk of mediaStream) {
            mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        }

        // 📤 Subir el archivo
        const formData = new FormData();
        formData.append('file', mediaBuffer, {
            filename: `file.${mimetype.split('/')[1] || 'bin'}`,
            contentType: mimetype
        });

        const response = await axios.post('https://cdn.dorratz.com/upload34', formData, {
            headers: {
                ...formData.getHeaders(),
                'x-api-key': 'dv-aws78',
                'Content-Length': formData.getLengthSync()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const shareLink = response.data.link;

        // ✅ Confirmación con enlace
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `✅ *Enlace generado con éxito:* 🔗\n\n📤 *Archivo:* ${mediaType.toUpperCase()}\n🌐 *URL:* ${shareLink}`
            },
            { quoted: msg }
        );

        // ✔️ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .tourl:", error);

        if (error.response?.status === 413) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* El archivo es demasiado grande. 🚫" },
                { quoted: msg }
            );
        }
        if (error.response?.status === 401) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Clave de acceso no válida. 🔑" },
                { quoted: msg }
            );
        }

        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No se pudo generar el enlace URL. Inténtalo de nuevo más tarde. 🚫" },
            { quoted: msg }
        );
    }
    break;
}

            
case "listpacks":
    try {
        // Leer el archivo donde se guardan los paquetes de stickers
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));
        let packNames = Object.keys(stickerData);

        if (packNames.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No hay paquetes de stickers creados aún.*\n🛠️ Usa `.newpack <nombre>` para crear uno." 
            }, { quoted: msg });
            return;
        }

        // Crear una lista con los paquetes y la cantidad de stickers 📦
        let packList = `📦 *Paquetes de Stickers Disponibles:*\n\n`;
        packNames.forEach((pack, index) => {
            let stickerCount = stickerData[pack].length; // Cantidad de stickers en el paquete
            packList += `🔹 *${index + 1}.* ${pack}  📌 (${stickerCount} stickers)\n`;
        });

        packList += `\n📌 Usa *${global.prefix}sendpack <nombre>* para enviar un paquete.\n💡 Usa *${global.prefix}addsticker <nombre>* para agregar más stickers.`;

        // Reaccionar antes de enviar la lista 📜
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📜", key: msg.key } 
        });

        // Enviar la lista de paquetes al usuario 📩
        await sock.sendMessage(msg.key.remoteJid, { text: packList }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .listpacks:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener la lista de paquetes. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;

case "s":
    try {
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a una imagen o video con el comando `.s` para crear un sticker.*" 
            }, { quoted: msg });
            return;
        }

        let mediaType = quoted.imageMessage ? "image" : quoted.videoMessage ? "video" : null;
        if (!mediaType) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Solo puedes convertir imágenes o videos en stickers.*" 
            }, { quoted: msg });
            return;
        }

        // Obtener el nombre del usuario
        let senderName = msg.pushName || "Usuario Desconocido";

        // Obtener la fecha exacta de creación 📅
        let now = new Date();
        let fechaCreacion = `📅 Fecha de Creación de Stickerz: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} 🕒 ${now.getHours()}:${now.getMinutes()}`;

        // Mensaje de reacción mientras se crea el sticker ⚙️
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛠️", key: msg.key } 
        });

        let mediaStream = await downloadContentFromMessage(quoted[`${mediaType}Message`], mediaType);
        let buffer = Buffer.alloc(0);
        for await (const chunk of mediaStream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
            throw new Error("❌ Error: No se pudo descargar el archivo.");
        }

        // 🌟 Formato llamativo para la metadata del sticker 🌟
        let metadata = {
            packname: `✨ Lo Mandó Hacer: ${senderName} ✨`,
            author: `🤖 Bot Creador: Azura Ultra 2.0\n🛠️ Desarrollado por: 𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz💻\n${fechaCreacion}`
        };

        let stickerBuffer;
        if (mediaType === "image") {
            stickerBuffer = await writeExifImg(buffer, metadata);
        } else {
            stickerBuffer = await writeExifVid(buffer, metadata);
        }

        await sock.sendMessage(msg.key.remoteJid, { 
            sticker: { url: stickerBuffer } 
        }, { quoted: msg });

        // Confirmación final con reacción ✅
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .ss:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al procesar el sticker. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
            
        
case "sendpack":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar el nombre del paquete.*\nEjemplo: `.sendpack Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Cargar los paquetes de stickers desde el JSON
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        // Verificar si el paquete existe
        if (!stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete no existe.* Usa `.listpacks` para ver los disponibles." 
            }, { quoted: msg });
            return;
        }

        let stickerPaths = stickerData[packName];

        if (stickerPaths.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Este paquete no tiene stickers guardados.* Usa `.addsticker <paquete>` para añadir." 
            }, { quoted: msg });
            return;
        }

        // Enviar cada sticker desde la carpeta 'stickers/'
        for (let stickerFileName of stickerPaths) {
            let stickerPath = path.join(stickersDir, stickerFileName); // Asegurar la ruta correcta

            // Verificar si el archivo del sticker existe en la carpeta
            if (fs.existsSync(stickerPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    sticker: { url: stickerPath } 
                }, { quoted: msg });
            } else {
                console.warn(`⚠️ Sticker no encontrado: ${stickerPath}`);
            }
        }

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Paquete de stickers '${packName}' enviado.*` 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .sendpack:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al enviar el paquete de stickers.*" 
        }, { quoted: msg });
    }
    break;
            
case "exportpack":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar el nombre del paquete.*\nEjemplo: `.exportpack Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Cargar los paquetes de stickers desde el JSON
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        // Verificar si el paquete existe
        if (!stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete no existe.* Usa `.listpacks` para ver los disponibles." 
            }, { quoted: msg });
            return;
        }

        let stickerPaths = stickerData[packName];

        if (stickerPaths.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Este paquete no tiene stickers guardados.* Usa `.addsticker <paquete>` para añadir." 
            }, { quoted: msg });
            return;
        }

        // Crear un archivo ZIP con los stickers del paquete
        const zip = new AdmZip();
        let tempZipPath = path.join(stickersDir, `${packName}.zip`);

        for (let stickerFileName of stickerPaths) {
            let stickerPath = path.join(stickersDir, stickerFileName);

            if (fs.existsSync(stickerPath)) {
                zip.addLocalFile(stickerPath);
            } else {
                console.warn(`⚠️ Sticker no encontrado: ${stickerPath}`);
            }
        }

        zip.writeZip(tempZipPath);

        // Enviar el paquete ZIP
        await sock.sendMessage(msg.key.remoteJid, { 
            document: { url: tempZipPath },
            mimetype: "application/zip",
            fileName: `${packName}.zip`,
            caption: `✅ *Paquete de stickers '${packName}' exportado con éxito.*\n💾 Descárgalo y agrégalo a tu WhatsApp.`
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .exportpack:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al exportar el paquete de stickers.*" 
        }, { quoted: msg });
    }
    break;

        
case "addsticker":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar el nombre del paquete al que quieres agregar el sticker.*\nEjemplo: `.addsticker Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Verificar si el paquete existe
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        if (!stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete no existe. Crea uno primero con `.newpack <nombre>`*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario respondió a un sticker
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a un sticker con `.addsticker <nombre>` para agregarlo al paquete.*" 
            }, { quoted: msg });
            return;
        }

        // Descargar el sticker
        let stream = await downloadContentFromMessage(quoted.stickerMessage, "sticker");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        let fileName = `${Date.now()}.webp`;
        let filePath = path.join(stickersDir, fileName); // Asegurar la ruta correcta

        // Guardar el sticker en la carpeta
        fs.writeFileSync(filePath, buffer);

        // Agregar el sticker al paquete en el JSON (solo el nombre del archivo, no la ruta completa)
        stickerData[packName].push(fileName);
        fs.writeFileSync(stickersFile, JSON.stringify(stickerData, null, 2));

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Sticker agregado al paquete '${packName}'*` 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .addsticker:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al agregar el sticker al paquete.*" 
        }, { quoted: msg });
    }
    break;
        
case "newpack":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar un nombre para el paquete.*\nEjemplo: `.newpack Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Verificar si el archivo stickers.json existe, si no, crearlo
        if (!fs.existsSync(stickersFile)) {
            fs.writeFileSync(stickersFile, JSON.stringify({}, null, 2));
        }

        // Leer el archivo JSON
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        // Verificar si el paquete ya existe
        if (stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete ya existe. Usa otro nombre.*" 
            }, { quoted: msg });
            return;
        }

        // Crear el paquete de stickers
        stickerData[packName] = [];

        // Guardar la estructura en el JSON
        fs.writeFileSync(stickersFile, JSON.stringify(stickerData, null, 2));

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Paquete de stickers '${packName}' creado exitosamente.*` 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .newpack:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al crear el paquete de stickers.*" 
        }, { quoted: msg });
    }
    break;
        
case "rest":
    try {
        const senderNumber = (msg.key.participant || sender).replace("@s.whatsapp.net", "");
        const botNumber = sock.user.id.split(":")[0]; // Obtener el número del bot correctamente
        const isBotMessage = msg.key.fromMe; // True si el mensaje es del bot

        if (!isOwner(senderNumber) && !isBotMessage) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden reiniciar el servidor.*"
            }, { quoted: msg });
            return;
        }

        // 🟢 Enviar reacción antes de reiniciar
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔄", key: msg.key } // Emoji de reinicio
        });

        // Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            text: "🔄 *Reiniciando el servidor...* \nEspera unos segundos..."
        }, { quoted: msg });

        // Definir la ruta del archivo donde se guardará el último chat que ejecutó .rest
        const lastRestarterFile = "./lastRestarter.json";

        // Verificar si el archivo existe, si no, crearlo
        if (!fs.existsSync(lastRestarterFile)) {
            fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: "" }, null, 2));
        }

        // Guardar el chat donde se usó el comando para avisar cuando el bot esté en línea
        fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: msg.key.remoteJid }, null, 2));

        // Esperar unos segundos antes de reiniciar
        setTimeout(() => {
            process.exit(1); // Reiniciar el bot (depende de tu gestor de procesos)
        }, 3000);

    } catch (error) {
        console.error("❌ Error en el comando rest:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al intentar reiniciar el servidor.*"
        }, { quoted: msg });
    }
    break;
        
case "setprefix":
    try {
        // Obtener el número del bot
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        // Verificar si el remitente es un dueño autorizado o el mismo bot
        const isBotMessage = msg.key.fromMe || sender === botNumber;

        if (!isOwner(sender) && !isBotMessage) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden cambiar el prefijo.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario proporcionó un nuevo prefijo
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar un nuevo prefijo.*\nEjemplo: `.setprefix !`" 
            }, { quoted: msg });
            return;
        }

        const newPrefix = args[0];

        // Verificar si el nuevo prefijo está permitido
        if (!allowedPrefixes.includes(newPrefix)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Prefijo inválido.* Usa un solo carácter o emoji permitido." 
            }, { quoted: msg });
            return;
        }

        // Guardar el nuevo prefijo en `config.json`
        fs.writeFileSync(configFilePath, JSON.stringify({ prefix: newPrefix }, null, 2));

        // Actualizar `global.prefix`
        global.prefix = newPrefix;

        // Confirmación del cambio
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Prefijo cambiado a:* *${newPrefix}*` 
        }, { quoted: msg });

        console.log(`🔄 Prefijo cambiado a: ${newPrefix}`);

    } catch (error) {
        console.error("❌ Error en el comando .setprefix:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al cambiar el prefijo.*" 
        }, { quoted: msg });
    }
    break;
        
        
            

        
        
case "rest":
    try {
        // Obtener el número del remitente
        const senderNumber = (msg.key.participant || sender).replace("@s.whatsapp.net", "");

        // Obtener el número del bot
        const botNumber = sock.user.id.split(":")[0]; // Obtener el número del bot correctamente

        // Verificar si el mensaje fue enviado por el bot o por un dueño autorizado
        const isBotMessage = msg.key.fromMe; // True si el mensaje es del bot
        if (!isOwner(senderNumber) && !isBotMessage) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden reiniciar el servidor.*"
            }, { quoted: msg });
            return;
        }

        // 🟢 Enviar reacción antes de reiniciar
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔄", key: msg.key } // Emoji de reinicio
        });

        // Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            text: "🔄 *Reiniciando el servidor...* \nEspera unos segundos..."
        }, { quoted: msg });

        // Esperar unos segundos antes de reiniciar
        setTimeout(() => {
            process.exit(1); // Reiniciar el bot (depende de tu gestor de procesos)
        }, 3000);

    } catch (error) {
        console.error("❌ Error en el comando rest:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al intentar reiniciar el servidor.*"
        }, { quoted: msg });
    }
    break;

        
        
case "info":
    try {
        // Reacción antes de enviar la información
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "ℹ️", key: msg.key } 
        });

        // Construcción del mensaje con información del bot
        const infoMessage = `╭─ *🤖 AZURA ULTRA 2.0 BOT* ─╮
│ 🔹 *Prefijo actual:* ${global.prefix}
│ 👑 *Dueño:* Russell xz
│ 🛠️ *Bot desarrollado desde cero* con la ayuda de ChatGPT.
│ 🚀 *Creado por:* Russell
│  
├─〔 📥 *Descargas Redes* 〕─
│ 📌 *IG, TikTok y FB*  
│    - 👤 *Colaboró:* DIEGO-OFC  
│  
│ 📌 *Descargas youtube*
│     (.play, .play2, .ytmp3, .ytmp4)  
│    - 👤 *Colaboró:* Eliasar54  
│  
├─〔 📜 *Menús y Comandos* 〕─
│ 📌 Usa *${global.prefix}menu* para ver los comandos principales.  
│ 📌 Usa *${global.prefix}allmenu* para ver todos los comandos disponibles.  
│ 📌 Usa *${global.prefix}menu2* para ver los comandos de multimedia y guardado.  
╰──────────────────╯`;

        // Enviar el mensaje con GIF animado
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740372626884.mp4" }, 
            gifPlayback: true, // Esto hace que se reproduzca como GIF
            caption: infoMessage
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando info:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar la información. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
        
        
case "menu": {
    try {
        // Reacción antes de enviar el menú
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "📜", key: msg.key } 
        });

        // Definir la URL del archivo GIF/Video
        const mediaUrl = "https://cdn.dorratz.com/files/1740370321585.mp4"; 
        const filePath = path.join(__dirname, "menu_video.mp4");

        // Descargar el archivo si no existe localmente
        if (!fs.existsSync(filePath)) {
            const response = await axios({
                method: "GET",
                url: mediaUrl,
                responseType: "stream"
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });
        }

        // Construcción del menú con formato mejorado y prefijo dinámico
        const menuMessage = `┏━━━━━━━━━━━━━━━┓
┃  🤖 *AZURA ULTRA 2.0 BOT*  
┃  🚀 *Tu Asistente Inteligente*  
┗━━━━━━━━━━━━━━━┛

📌 *Usa los siguientes comandos para ver más menús:*  
${global.prefix}allmenu  
${global.prefix}info  
${global.prefix}menu2  

🌟 *Prefijo actual:* ${global.prefix}  
💡 *Usa ${global.prefix} antes de cada comando.*

📥 *Comandos de Descarga* 📥  
━━━━━━━━━━━━━━━━━━  
${global.prefix}play → Descargar música.  
${global.prefix}play2 → Descargar videos.  
${global.prefix}ytmp3 → Descargar a MP3.  
${global.prefix}ytmp4 → Descargar a MP4.  
${global.prefix}tiktok → Descargar video.  
${global.prefix}fb → Descargar video.  
${global.prefix}ig → Descargar video.  

👥 *Comandos de Grupo* 👥  
━━━━━━━━━━━━━━━━━━  
${global.prefix}cerrargrupo → Cierra el grupo.  
${global.prefix}abrirgrupo → Abre el grupo.  
${global.prefix}kick → Expulsar del grupo.  

🔍 *Otros Comandos* 🔍  
━━━━━━━━━━━━━━━━━━  
${global.prefix}ver → Ver mensajes de "ver una vez".  
${global.prefix}perfil → Descargar la foto de perfil de alguien.  
${global.prefix}get → Descargar estados de WhatsApp.  
${global.prefix}ping → Ver el estado del bot y el servidor.  
${global.prefix}creador → Ver el contacto del creador.  
${global.prefix}info → Ver detalles del bot.  

📂 *Comandos de Multimedia* 📂  
━━━━━━━━━━━━━━━━━━  
${global.prefix}guar → Guardar archivos con una clave.  
${global.prefix}g → Recuperar archivos guardados.  
${global.prefix}kill → Eliminar un archivo guardado.  
${global.prefix}clavelista → Ver todas las claves guardadas.  

💡 *Azura Ultra 2.0 está en constante desarrollo. Se agregarán más funciones pronto.*  
⚙️ *Desarrollado por Russell xz* 🚀`;

        // Enviar el archivo local como video/GIF con el menú
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: filePath }, 
            gifPlayback: true,
            caption: menuMessage 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error al enviar el menú:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar el menú. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case "menu2": {
    try {
        // Reacción antes de enviar el menú
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "📂", key: msg.key } 
        });

        // Verificar si el archivo guar.json existe
        if (!fs.existsSync("./guar.json")) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
                { quoted: msg }
            );
        }

        // Leer archivo guar.json
        let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));
        
        let listaMensaje = `┏━━━━━━━━━━━━━━━┓
┃  📂 *MENÚ DE MULTIMEDIA*  
┃  🔑 *Palabras Clave Guardadas*  
┗━━━━━━━━━━━━━━━┛

📌 *¿Cómo recuperar un archivo guardado?*  
Usa el comando:  
➡️ _${global.prefix}g palabra_clave_  

📂 *Lista de palabras clave guardadas:*  
━━━━━━━━━━━━━━━━━━━\n`;

        let claves = Object.keys(guarData);
        
        if (claves.length === 0) {
            listaMensaje += "🚫 *No hay palabras clave guardadas.*\n";
        } else {
            claves.forEach((clave, index) => {
                listaMensaje += `*${index + 1}.* ${clave}\n`;
            });
        }

        listaMensaje += `\n━━━━━━━━━━━━━━━━━━━  
📥 *Otros Comandos de Multimedia*  

${global.prefix}guar → Guarda archivos con una clave.  
${global.prefix}g → Recupera archivos guardados.  
${global.prefix}kill → Elimina un archivo guardado.  

💡 *Azura Ultra 2.0 sigue mejorando. Pronto más funciones.*  
⚙️ *Desarrollado por Russell xz* 🚀`;

        // Enviar el menú con video como GIF
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740372045635.mp4" }, 
            gifPlayback: true, // Esto hace que se reproduzca como GIF
            caption: listaMensaje 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error al enviar el menú2:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar el menú2. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}    

case "ping":
    try {
        const now = new Date();
        const options = { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric", 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit", 
            timeZoneName: "short" 
        };
        const formattedDate = now.toLocaleDateString("es-ES", options);

        // Obtener el tiempo activo en días, horas, minutos y segundos
        const uptime = os.uptime();
        const uptimeDays = Math.floor(uptime / 86400);
        const uptimeHours = Math.floor((uptime % 86400) / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);
        const uptimeSeconds = Math.floor(uptime % 60);
        const uptimeFormatted = `${uptimeDays} días, ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

        // Información del sistema
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const freeMemGB = (freeMem / 1024 / 1024 / 1024).toFixed(2);
        const totalMemGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);
        const usedMemGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);

        const cpuModel = os.cpus()[0].model;
        const numCores = os.cpus().length;
        const loadAvg = os.loadavg()[0].toFixed(2);
        const diskUsage = execSync("df -h / | awk 'NR==2 {print $3 \" / \" $2}'").toString().trim();

        // Reaccionar al mensaje con un emoji
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: "🏓",
                key: msg.key
            }
        });

        // Enviar mensaje con imagen y detalles del servidor
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: "https://cdn.dorratz.com/files/1740372224017.jpg" }, 
            caption: `🏓 *Pong! El bot está activo.*\n\n` +
                     `📅 *Fecha y hora actual:* ${formattedDate}\n\n` +
                     `🕒 *Tiempo Activo:* ${uptimeFormatted}\n\n` +
                     `💻 *Información del Servidor:*\n` +
                     `🔹 *CPU:* ${cpuModel}\n` +
                     `🔹 *Núcleos:* ${numCores}\n` +
                     `🔹 *Carga del sistema:* ${loadAvg}\n\n` +
                     `🖥️ *Memoria RAM:*\n` +
                     `🔹 *Usada:* ${usedMemGB}GB\n` +
                     `🔹 *Libre:* ${freeMemGB}GB\n` +
                     `🔹 *Total:* ${totalMemGB}GB\n\n` +
                     `💾 *Disco:* ${diskUsage}\n\n` +
                     `🌐 *Alojado en:* *Sky Ultra Plus* 🚀\n` +
                     `📌 *Proveedor de Hosting de Confianza*`,
            quoted: msg // Responder citando al mensaje original
        });

    } catch (error) {
        console.error("❌ Error en el comando ping:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Error al obtener información del servidor.*",
            quoted: msg // Responder citando al mensaje original
        });
    }
    break;



            
case "get": {
    try {
        if (!msg.message.extendedTextMessage || 
            !msg.message.extendedTextMessage.contextInfo || 
            !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Debes responder a un estado de WhatsApp para descargarlo. 📝" },
                { quoted: msg }
            );
        }

        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        let mediaType, mediaMessage;

        if (quotedMsg.imageMessage) {
            mediaType = "image";
            mediaMessage = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage) {
            mediaType = "video";
            mediaMessage = quotedMsg.videoMessage;
        } else if (quotedMsg.audioMessage) {
            mediaType = "audio";
            mediaMessage = quotedMsg.audioMessage;
        } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
            mediaType = "text";
            mediaMessage = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Solo puedes descargar *imágenes, videos, audios y textos* de estados de WhatsApp." },
                { quoted: msg }
            );
        }

        // Enviar reacción mientras procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key } 
        });

        if (mediaType === "text") {
            // Convertir el texto en una imagen
            const { createCanvas, loadImage } = require("canvas");
            const canvas = createCanvas(500, 250);
            const ctx = canvas.getContext("2d");

            // Fondo blanco
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Configurar texto
            ctx.fillStyle = "#000000";
            ctx.font = "20px Arial";
            ctx.fillText(mediaMessage, 20, 100, 460); // Ajustar el texto dentro del cuadro

            // Guardar la imagen en buffer
            const buffer = canvas.toBuffer("image/png");

            // Enviar la imagen del estado de texto
            await sock.sendMessage(msg.key.remoteJid, { 
                image: buffer, 
                caption: "📝 *Estado de texto convertido en imagen*" 
            }, { quoted: msg });

        } else {
            // Descargar el multimedia
            const mediaStream = await new Promise(async (resolve, reject) => {
                try {
                    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                    let buffer = Buffer.alloc(0);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    resolve(buffer);
                } catch (err) {
                    reject(null);
                }
            });

            if (!mediaStream || mediaStream.length === 0) {
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo descargar el estado. Intenta de nuevo." }, { quoted: msg });
                return;
            }

            // Enviar el archivo descargado al chat
            let messageOptions = {
                mimetype: mediaMessage.mimetype,
            };

            if (mediaType === "image") {
                messageOptions.image = mediaStream;
            } else if (mediaType === "video") {
                messageOptions.video = mediaStream;
            } else if (mediaType === "audio") {
                messageOptions.audio = mediaStream;
                messageOptions.mimetype = "audio/mpeg"; // Especificar que es un audio
            }

            await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });
        }

        // Confirmar que el estado ha sido enviado con éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando get:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo recuperar el estado. Inténtalo de nuevo." }, { quoted: msg });
    }
    break;
}
        
    
case "ver": {
    try {
        if (!msg.message.extendedTextMessage || 
            !msg.message.extendedTextMessage.contextInfo || 
            !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Debes responder a un mensaje de *ver una sola vez* (imagen, video o audio) para poder verlo nuevamente." },
                { quoted: msg }
            );
        }

        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        let mediaType, mediaMessage;

        if (quotedMsg.imageMessage?.viewOnce) {
            mediaType = "image";
            mediaMessage = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage?.viewOnce) {
            mediaType = "video";
            mediaMessage = quotedMsg.videoMessage;
        } else if (quotedMsg.audioMessage?.viewOnce) {
            mediaType = "audio";
            mediaMessage = quotedMsg.audioMessage;
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Solo puedes usar este comando en mensajes de *ver una sola vez*." },
                { quoted: msg }
            );
        }

        // Enviar reacción mientras procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key } 
        });

        // Descargar el multimedia de forma segura
        const mediaStream = await new Promise(async (resolve, reject) => {
            try {
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                let buffer = Buffer.alloc(0);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                resolve(buffer);
            } catch (err) {
                reject(null);
            }
        });

        if (!mediaStream || mediaStream.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo descargar el archivo. Intenta de nuevo." }, { quoted: msg });
            return;
        }

        // Enviar el archivo descargado al grupo o chat
        let messageOptions = {
            mimetype: mediaMessage.mimetype,
        };

        if (mediaType === "image") {
            messageOptions.image = mediaStream;
        } else if (mediaType === "video") {
            messageOptions.video = mediaStream;
        } else if (mediaType === "audio") {
            messageOptions.audio = mediaStream;
        }

        await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

        // Confirmar que el archivo ha sido enviado con éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando ver:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo recuperar el mensaje de *ver una sola vez*. Inténtalo de nuevo." }, { quoted: msg });
    }
    break;
}
        
case "perfil": {
    try {
        let userJid = null;

        // Si no hay argumentos, menciones ni respuesta, mostrar la guía de uso
        if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length &&
            !msg.message.extendedTextMessage?.contextInfo?.participant &&
            args.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: `🔍 *¿Cómo usar el comando .perfil?*\n\n` +
                      `📌 *Ejemplos de uso:*\n\n` +
                      `🔹 *Para obtener la foto de perfil de alguien:* \n` +
                      `   - *Responde a su mensaje con:* _.perfil_\n\n` +
                      `🔹 *Para obtener la foto de perfil de un número:* \n` +
                      `   - _.perfil +1 555-123-4567_\n\n` +
                      `🔹 *Para obtener la foto de perfil de un usuario mencionado:* \n` +
                      `   - _.perfil @usuario_\n\n` +
                      `⚠️ *Nota:* Algunos usuarios pueden tener su foto de perfil privada y el bot no podrá acceder a ella.`
            }, { quoted: msg });
        }

        // Verifica si se mencionó un usuario
        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Verifica si se respondió a un mensaje
        else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
            userJid = msg.message.extendedTextMessage.contextInfo.participant;
        } 
        // Verifica si se ingresó un número
        else if (args.length > 0) {
            let number = args.join("").replace(/[^0-9]/g, ""); // Limpia el número de caracteres no numéricos
            userJid = number + "@s.whatsapp.net";
        }

        // Si no se encontró un usuario válido, termina la ejecución
        if (!userJid) return;

        // Intentar obtener la imagen de perfil
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(userJid, "image"); // "image" para foto de perfil normal
        } catch {
            ppUrl = "https://i.imgur.com/3J8M0wG.png"; // Imagen de perfil por defecto si el usuario no tiene foto
        }

        // Enviar la imagen de perfil solo si se encontró un usuario válido
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: ppUrl },
            caption: `🖼️ *Foto de perfil de:* @${userJid.split("@")[0]}`,
            mentions: [userJid]
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando perfil:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo obtener la foto de perfil." }, { quoted: msg });
    }
    break;
}
        
case 'creador': {
    const ownerNumber = "15167096032@s.whatsapp.net"; // Número del dueño en formato WhatsApp
    const ownerName = "Russell xz 🤖"; // Nombre del dueño
    const messageText = "📞 *Contacto del Creador:*\n\nSi tienes dudas, preguntas o sugerencias sobre el bot, puedes contactar a mi creador.\n\n📌 *Nombre:* Russell\n📌 *Número:* +1 (516) 709-6032\n💬 *Mensaje directo:* Pulsa sobre el contacto y chatea con él.";

    // Enviar mensaje con el contacto del dueño
    await sock.sendMessage(msg.key.remoteJid, {
        contacts: {
            displayName: ownerName,
            contacts: [{
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;waid=${ownerNumber.split('@')[0]}:+${ownerNumber.split('@')[0]}\nEND:VCARD`
            }]
        }
    });

    // Enviar mensaje adicional con información
    await sock.sendMessage(msg.key.remoteJid, { text: messageText }, { quoted: msg });

    break;
}
    
            
case 'verco': {
    const fs = require("fs");

    // Leer el archivo main.js
    const mainFilePath = "./main.js";
    if (!fs.existsSync(mainFilePath)) {
        return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se encontró el archivo de comandos." }, { quoted: msg });
    }

    // Leer contenido del archivo
    const mainFileContent = fs.readFileSync(mainFilePath, "utf-8");

    // Extraer los nombres de los comandos dentro de `case 'comando':`
    const commandRegex = /case\s+['"]([^'"]+)['"]:/g;
    let commands = [];
    let match;
    while ((match = commandRegex.exec(mainFileContent)) !== null) {
        commands.push(match[1]);
    }

    // Filtrar y ordenar los comandos
    commands = [...new Set(commands)].sort();

    // Construir mensaje con formato de lista
    let commandList = "📜 *Lista de Comandos Disponibles:*\n\n";
    commands.forEach(cmd => {
        commandList += `🔹 *${global.prefix}${cmd}*\n`;
    });

    // Enviar el mensaje con el menú de comandos
    await sock.sendMessage(
        msg.key.remoteJid,
        { text: commandList, footer: "📌 Usa los comandos con el prefijo actual.", quoted: msg },
    );

    break;
}
            
case 'play': { 
    const yts = require('yt-search'); 

    if (!text || text.trim() === '') {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso correcto del comando:*\n\n📌 Ejemplo: *${global.prefix}play boza yaya*\n🔍 _Proporciona el nombre o término de búsqueda del Audio._` 
        });
    } 

    const query = args.join(' ') || text; 
    let video = {}; 

    try { 
        const yt_play = await yts(query); 
        if (!yt_play || yt_play.all.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* No se encontraron resultados para tu búsqueda.' });
        } 

        const firstResult = yt_play.all[0]; 
        video = { 
            url: firstResult.url, 
            title: firstResult.title, 
            thumbnail: firstResult.thumbnail || 'default-thumbnail.jpg', 
            timestamp: firstResult.duration.seconds, 
            views: firstResult.views, 
            author: firstResult.author.name, 
        }; 
    } catch { 
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* Ocurrió un problema al buscar el video.' });
    } 

    function secondString(seconds) { 
        const h = Math.floor(seconds / 3600); 
        const m = Math.floor((seconds % 3600) / 60); 
        const s = seconds % 60; 
        return [h, m, s]
            .map(v => v < 10 ? `0${v}` : v)
            .filter((v, i) => v !== '00' || i > 0)
            .join(':'); 
    } 

    // Reacción antes de enviar el mensaje
    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🎼", key: msg.key } 
    });

    await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: video.thumbnail }, 
        caption: `🎵 *Título:* ${video.title}\n⏱️ *Duración:* ${secondString(video.timestamp || 0)}\n👁️ *Vistas:* ${video.views || 0}\n👤 *Autor:* ${video.author || 'Desconocido'}\n🔗 *Link:* ${video.url}\n\n📌 *Para descargar el audio usa el comando:* \n➡️ *${global.prefix}play* _nombre del video_\n➡️ *Para descargar el video usa:* \n*${global.prefix}play2* _nombre del video_`, 
        footer: "𝙲𝙾𝚁𝚃𝙰𝙽𝙰 𝟸.𝟶", 
    }, { quoted: msg });

    // Ejecutar el comando .ytmp3 directamente
    handleCommand(sock, msg, "ytmp3", [video.url]);

    break; 
}

case 'play2': { 
    const yts = require('yt-search'); 

    if (!text || text.trim() === '') {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso correcto del comando:*\n\n📌 Ejemplo: *${global.prefix}play2 boza yaya*\n🎬 _Proporciona el nombre o término de búsqueda del video._` 
        });
    } 

    const query = args.join(' ') || text; 
    let video = {}; 

    try { 
        const yt_play = await yts(query); 
        if (!yt_play || yt_play.all.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* No se encontraron resultados para tu búsqueda.' });
        } 

        const firstResult = yt_play.all[0]; 
        video = { 
            url: firstResult.url, 
            title: firstResult.title, 
            thumbnail: firstResult.thumbnail || 'default-thumbnail.jpg', 
            timestamp: firstResult.duration.seconds, 
            views: firstResult.views, 
            author: firstResult.author.name, 
        }; 
    } catch { 
        return sock.sendMessage(msg.key.remoteJid, { text: '❌ *Error:* Ocurrió un problema al buscar el video.' });
    } 

    function secondString(seconds) { 
        const h = Math.floor(seconds / 3600); 
        const m = Math.floor((seconds % 3600) / 60); 
        const s = seconds % 60; 
        return [h, m, s]
            .map(v => v < 10 ? `0${v}` : v)
            .filter((v, i) => v !== '00' || i > 0)
            .join(':'); 
    } 

    // Reacción antes de enviar el mensaje
    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🎬", key: msg.key } 
    });

    await sock.sendMessage(msg.key.remoteJid, { 
        image: { url: video.thumbnail }, 
        caption: `🎬 *Título:* ${video.title}\n⏱️ *Duración:* ${secondString(video.timestamp || 0)}\n👁️ *Vistas:* ${video.views || 0}\n👤 *Autor:* ${video.author || 'Desconocido'}\n🔗 *Link:* ${video.url}\n\n📌 *Para descargar el video usa el comando:* \n➡️ *${global.prefix}play2* _nombre del video_\n➡️ *Para descargar solo el audio usa:* \n*${global.prefix}play* _nombre del video_`, 
        footer: "𝙲𝙾𝚁𝚃𝙰𝙽𝙰 𝟸.𝟶", 
    }, { quoted: msg });

    // Ejecutar el comando .ytmp4 directamente
    handleCommand(sock, msg, "ytmp4", [video.url]);

    break; 
}
            
case 'kill': {
    const searchKey = args.join(' ').trim().toLowerCase(); // Convertir clave a minúsculas
    if (!searchKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Error:* Debes proporcionar una palabra clave para eliminar el multimedia. 🗑️" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Verificar si la palabra clave existe
    if (!guarData[searchKey]) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ *Error:* No se encontró multimedia guardado con la clave: *"${searchKey}"*.` },
            { quoted: msg }
        );
    }

    const storedMedia = guarData[searchKey];
    const savedBy = storedMedia.savedBy;
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Verificar si el usuario es Owner
    const isUserOwner = global.owner.some(owner => owner[0] === senderId.replace("@s.whatsapp.net", ""));
    const isSavedByOwner = global.owner.some(owner => owner[0] === savedBy.replace("@s.whatsapp.net", ""));

    // Verificar si el usuario es admin
    const isAdminUser = await isAdmin(sock, msg.key.remoteJid, senderId);

    // Reglas de eliminación:
    if (isUserOwner) {
        // El owner puede eliminar cualquier multimedia
        delete guarData[searchKey];
    } else if (isAdminUser) {
        // Los admins pueden eliminar cualquier multimedia excepto los del owner
        if (isSavedByOwner) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "🚫 *Acceso denegado:* No puedes eliminar multimedia guardado por el Owner." },
                { quoted: msg }
            );
        }
        delete guarData[searchKey];
    } else {
        // Un usuario solo puede eliminar su propio multimedia
        if (savedBy !== senderId) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "⛔ *Acceso denegado:* Solo puedes eliminar los multimedia que tú guardaste." },
                { quoted: msg }
            );
        }
        delete guarData[searchKey];
    }

    // Guardar los cambios en guar.json
    fs.writeFileSync("./guar.json", JSON.stringify(guarData, null, 2));

    return sock.sendMessage(
        msg.key.remoteJid,
        { text: `✅ *Multimedia eliminado con éxito:* "${searchKey}" ha sido eliminado. 🗑️` },
        { quoted: msg }
    );
}
break;
        
case 'clavelista': {
    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));
    
    if (Object.keys(guarData).length === 0) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "📂 *Lista vacía:* No hay palabras clave registradas." },
            { quoted: msg }
        );
    }

    // Construir el mensaje con la lista de palabras clave y quién las guardó
    let listaMensaje = "📜 *Lista de palabras clave guardadas para sacar el multimedia:*\n\n";
    let mentions = [];

    for (let clave in guarData) {
        let user = guarData[clave].savedBy || "Desconocido"; // Evitar undefined
        if (user.includes("@s.whatsapp.net")) {
            user = user.replace("@s.whatsapp.net", ""); // Obtener solo el número
            mentions.push(`${user}@s.whatsapp.net`);
        }

        listaMensaje += `🔹 *${clave}* → Guardado por: @${user}\n`;
    }

    // Agregar explicación de cómo recuperar multimedia
    listaMensaje += `\n💡 *Para recuperar un archivo, usa el siguiente comando:*\n`;
    listaMensaje += `📥 *${global.prefix}g <palabra clave>*\n`;
    listaMensaje += `🛠️ Usa *${global.prefix}kill <palabra>* para eliminar Multimedia guardados✨️.\n`;

    // Enviar la lista de palabras clave mencionando a los usuarios
    return sock.sendMessage(
        msg.key.remoteJid,
        {
            text: listaMensaje,
            mentions: mentions // Mencionar a los que guardaron multimedia
        },
        { quoted: msg }
    );
}
break;
        
        
case 'g': {
    const removeEmojis = (text) => text.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ""); // Remover emojis
    const normalizeText = (text) => removeEmojis(text).toLowerCase().trim(); // Normalizar texto

    const searchKey = normalizeText(args.join(' ')); // Convertir clave a minúsculas y sin emojis
    if (!searchKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Error:* Debes proporcionar una palabra clave para recuperar el multimedia. 🔍" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Buscar la clave ignorando mayúsculas, minúsculas y emojis
    const keys = Object.keys(guarData);
    const foundKey = keys.find(key => normalizeText(key) === searchKey);

    if (!foundKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ *Error:* No se encontró multimedia guardado con la clave: *"${searchKey}"*.` },
            { quoted: msg }
        );
    }

    const storedMedia = guarData[foundKey];

    // Convertir la base64 nuevamente a Buffer
    const mediaBuffer = Buffer.from(storedMedia.buffer, "base64");

    // Verificar el tipo de archivo y enviarlo correctamente
    let messageOptions = {
        mimetype: storedMedia.mimetype,
    };

    if (storedMedia.mimetype.startsWith("image") && storedMedia.extension !== "webp") {
        messageOptions.image = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("video")) {
        messageOptions.video = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("audio")) {
        messageOptions.audio = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("application")) {
        messageOptions.document = mediaBuffer;
        messageOptions.fileName = `Archivo.${storedMedia.extension}`;
    } else if (storedMedia.mimetype === "image/webp" || storedMedia.extension === "webp") {
        // Si es un sticker (webp), se envía como sticker
        messageOptions.sticker = mediaBuffer;
    } else {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No se pudo enviar el archivo. Tipo de archivo desconocido." },
            { quoted: msg }
        );
    }

    // Enviar el multimedia almacenado
    await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

    break;
}
        
case 'guar': {
    if (!msg.message.extendedTextMessage || 
        !msg.message.extendedTextMessage.contextInfo || 
        !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* Debes responder a un multimedia (imagen, video, audio, sticker, etc.) con una palabra clave para guardarlo. 📂" },
            { quoted: msg }
        );
    }

    const saveKey = args.join(' ').trim().toLowerCase(); // Clave en minúsculas
    if (!saveKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Aviso:* Escribe una palabra clave para guardar este multimedia. 📝" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe, si no, crearlo
    if (!fs.existsSync("./guar.json")) {
        fs.writeFileSync("./guar.json", JSON.stringify({}, null, 2));
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Verificar si la palabra clave ya existe
    if (guarData[saveKey]) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `⚠️ *Aviso:* La palabra clave *"${saveKey}"* ya está en uso. Usa otra diferente. ❌` },
            { quoted: msg }
        );
    }

    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    let mediaType, mediaMessage, fileExtension;

    if (quotedMsg.imageMessage) {
        mediaType = "image";
        mediaMessage = quotedMsg.imageMessage;
        fileExtension = "jpg";
    } else if (quotedMsg.videoMessage) {
        mediaType = "video";
        mediaMessage = quotedMsg.videoMessage;
        fileExtension = "mp4";
    } else if (quotedMsg.audioMessage) {
        mediaType = "audio";
        mediaMessage = quotedMsg.audioMessage;
        fileExtension = "mp3";
    } else if (quotedMsg.stickerMessage) {
        mediaType = "sticker";
        mediaMessage = quotedMsg.stickerMessage;
        fileExtension = "webp"; // Stickers son .webp
    } else if (quotedMsg.documentMessage) {
        mediaType = "document";
        mediaMessage = quotedMsg.documentMessage;
        fileExtension = mediaMessage.mimetype.split("/")[1] || "bin"; // Obtener la extensión real
    } else {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* Solo puedes guardar imágenes, videos, audios, stickers y documentos. 📂" },
            { quoted: msg }
        );
    }

    // Descargar el multimedia
    const mediaStream = await downloadContentFromMessage(mediaMessage, mediaType);
    let mediaBuffer = Buffer.alloc(0);
    for await (const chunk of mediaStream) {
        mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
    }

    // Guardar multimedia con la palabra clave y la información del usuario que lo guardó
    guarData[saveKey] = {
        buffer: mediaBuffer.toString("base64"), // Convertir a base64
        mimetype: mediaMessage.mimetype,
        extension: fileExtension,
        savedBy: msg.key.participant || msg.key.remoteJid, // Número del usuario que guardó el archivo
    };

    // Escribir en guar.json
    fs.writeFileSync("./guar.json", JSON.stringify(guarData, null, 2));

    return sock.sendMessage(
        msg.key.remoteJid,
        { text: `✅ *Listo:* El multimedia se ha guardado con la palabra clave: *"${saveKey}"*. 🎉` },
        { quoted: msg }
    );
}
break;
        

        
        
case 'play3': {
    const { Client } = require('youtubei');
    const { ytmp3 } = require("@hiudyy/ytdl");
    const yt = new Client();

    if (!text || text.trim() === '') return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre o término de búsqueda del video." });

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });

        const search = await yt.search(text, { type: "video" });
        if (!search || !search.items || search.items.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { quoted: msg });
        }

        const result = search.items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${result.id}`;

        const str = `Youtube Play\n✧ *Título:* ${result.title}\n✧ *Fecha:* ${result.uploadDate}\n✧ *Descripción:* ${result.description}\n✧ *URL:* ${videoUrl}\n✧➢ Para video, usa:\n.play4 ${videoUrl}\n\nEnviando audio....`;

        await sock.sendMessage(msg.key.remoteJid, { image: { url: result.thumbnails[0].url }, caption: str }, { quoted: msg });

        const audiodl = await ytmp3(videoUrl, {
            quality: 'highest',
        });

        await sock.sendMessage(msg.key.remoteJid, {
            audio: audiodl,
            mimetype: "audio/mpeg",
            caption: `Aquí está tu audio: ${result.title}`,
        }, { quoted: msg });

    } catch (error) {
        console.error("Error durante la búsqueda en YouTube:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al procesar tu solicitud." }, { quoted: msg });
    }
    break;
}          case 'play4': {
    const fetch = require("node-fetch");
    const { ytmp4 } = require("@hiudyy/ytdl");

    if (!text || !text.includes('youtube.com') && !text.includes('youtu.be')) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de YouTube." });
    }

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });

        const video = await ytmp4(args[0]);

        await sock.sendMessage(msg.key.remoteJid, {
            video: { url: video },
            caption: "✅ Aquí está tu video.",
        }, { quoted: msg });

    } catch (error) {
        console.error("Error al descargar el video:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al descargar el video." }, { quoted: msg });
    }
    break;
}
            
                       
            
            case 'ytmp4': {
    const fetch = require('node-fetch');

    if (!text) return sock.sendMessage(msg.key.remoteJid, { text: 'Proporciona un enlace de YouTube válido.' });
    const url = args[0];

    if (!url.includes('youtu')) return sock.sendMessage(msg.key.remoteJid, { text: 'Proporciona un enlace válido de YouTube.' });

    await sock.sendMessage(msg.key.remoteJid, { text: '🔄 Obteniendo información del video...' });

    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: '⏱️',
                key: msg.key,
            },
        });
        
        const infoResponse = await fetch(`https://ytdownloader.nvlgroup.my.id/info?url=${url}`);
        const info = await infoResponse.json();

        if (!info.resolutions || info.resolutions.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ No se encontraron resoluciones disponibles.' });
        }

        const randomResolution = info.resolutions[Math.floor(Math.random() * info.resolutions.length)];
        const selectedHeight = randomResolution.height;

        await sock.sendMessage(msg.key.remoteJid, { text: `🔄 Descargando el video en ${selectedHeight}p, espera...` });

        const videoUrl = `https://ytdownloader.nvlgroup.my.id/download?url=${url}&resolution=${selectedHeight}`;

        await sock.sendMessage(msg.key.remoteJid, {
            video: { url: videoUrl },
            caption: `✅ Aquí está tu video en ${selectedHeight}p.`,
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}\n\nNo se pudo obtener información del video.` });
    }
    break;
}
       

            

        case "cerrargrupo":
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
            break;

        case "abrirgrupo":
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
            break;

        case "kick":
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

                if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                    userToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
                }

                if (!userToKick && msg.message.extendedTextMessage?.contextInfo?.participant) {
                    userToKick = msg.message.extendedTextMessage.contextInfo.participant;
                }

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
            break;

        case "tiktok":
        case "tt":
            if (!text) return sock.sendMessage(msg.key.remoteJid, { text: `Ejemplo de uso:\n${global.prefix + command} https://vm.tiktok.com/ZMjdrFCtg/` });
            if (!isUrl(args[0]) || !args[0].includes('tiktok')) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Enlace de TikTok inválido." }, { quoted: msg });

            try {
                sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '⏱️',
          key: msg.key,
        },
      });
                const response = await axios.get(`https://api.dorratz.com/v2/tiktok-dl?url=${args[0]}`);
                const videoData = response.data.data.media;
                const videoUrl = videoData.org;
                const videoDetails = `*Título*: ${response.data.data.title}\n` +
                                    `*Autor*: ${response.data.data.author.nickname}\n` +
                                    `*Duración*: ${response.data.data.duration}s\n` +
                                    `*Likes*: ${response.data.data.like}\n` +
                                    `*Comentarios*: ${response.data.data.comment}`;

                await sock.sendMessage(msg.key.remoteJid, { video: { url: videoUrl }, caption: videoDetails }, { quoted: msg });
               
            } catch (error) {
                console.error(error);
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al procesar el enlace de TikTok." });
            }
            break;

        case "instagram":
        case "ig":
            if (!text) return sock.sendMessage(msg.key.remoteJid, { text: `Ejemplo de uso:\n${global.prefix + command} https://www.instagram.com/p/CCoI4DQBGVQ/` }, { quoted: msg });

            try {
                sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '⏱️',
          key: msg.key,
        },
      });
                const apiUrl = `https://api.dorratz.com/igdl?url=${text}`;
                const response = await axios.get(apiUrl);
                const { data } = response.data;
                const caption = `> 🌙 Solicitud procesada por api.dorratz.com`;

                for (let item of data) {
                    await sock.sendMessage(msg.key.remoteJid, { video: { url: item.url }, caption: caption }, { quoted: msg });
                }
            } catch (error) {
                console.error(error);
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al procesar el enlace de Instagram." }, { quoted: msg });
            }
            break;

        

        case "facebook":
        case "fb":
            if (!text) return sock.sendMessage(msg.key.remoteJid, { text: `Ejemplo de uso:\n${global.prefix + command} https://fb.watch/ncowLHMp-x/` }, { quoted: msg });

            if (!text.match(/www.facebook.com|fb.watch/g)) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Enlace de Facebook inválido.\nEjemplo de uso:\n${global.prefix + command} https://fb.watch/ncowLHMp-x/`
                });
            }

            try {
                sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '⏱️',
          key: msg.key,
        },
      });
                const response = await axios.get(`https://api.dorratz.com/fbvideo?url=${encodeURIComponent(text)}`);
                const results = response.data;

                if (!results || results.length === 0) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ No se pudo obtener el video." });
                }

                const message = `Resoluciones disponibles:
${results.map((res, index) => `- ${res.resolution}`).join('\n')}

🔥 Enviado en 720p

> 🍧 Solicitud procesada por api.dorratz.com`.trim();

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: results[0].url },
                    caption: message
                }, { quoted: msg });

            } catch (error) {
                console.error(error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: "❌ Ocurrió un error al procesar el enlace de Facebook."
                });
            }
            break;

        default:
            break;
    }
}

module.exports = { handleCommand };
