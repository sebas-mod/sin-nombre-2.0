const chalk = require("chalk");
const fs = require("fs");
const path = "./config.json"; // Archivo de configuración

// Cargar datos de configuración
let configData = {};
if (fs.existsSync(path)) {
    configData = JSON.parse(fs.readFileSync(path, "utf-8"));
}

// Lista de Owners
global.owner = [
    ["15167096032", "Owner", true],
    ["50766066665"],
    ["595975740803"],
    ["595986172767"],
    ["5492266466080"],
    ["50768888888"],
    ["5492266613038"],
    ["584123552078"],
    ["573242402359"],
    ["5217294888993"],
    ["5214437863111"],
    ["51906662557"],
    ["595992302861"],
    ["5217441298510"],
    ["5491155983299"],
    ["5493795319022"],
    ["5217821153974"],
    ["584163393168"],
    ["573147616444"],
    ["5216865268215"],
    ["50765500000"],
    ["573012482694"],
    ["50582340051"]
];

// Lista de prefijos permitidos
global.allowedPrefixes = [
    ".", "!", "#", "?", "-", "+", "*", "~", "$", "&", "%", "=", "🔥", "💀", "✅", "🥰",
    "💎", "🐱", "🐶", "🌟", "🎃", "🍕", "🍔", "🍑", "🛠️", "📌", "⚡", "🚀", "👀", "💡", "💣", "💯", "😎", "☠️", "👾"
];

// Función para verificar si un usuario es Owner
global.isOwner = (user) => {
    user = user.replace(/[^0-9]/g, ""); // Limpiar número
    return global.owner.some(owner => owner[0] === user);
};

// Función para obtener el prefijo correcto
global.getPrefix = (chatId) => {
    if (chatId.endsWith("@g.us")) {
        return configData.groupPrefixes?.[chatId] || configData.globalPrefix || "."; // Prefijo del grupo o global
    }
    return configData.globalPrefix || "."; // Prefijo global en privado
};

// Exportar configuraciones
module.exports = { isOwner: global.isOwner, getPrefix: global.getPrefix, allowedPrefixes: global.allowedPrefixes };

console.log(chalk.green(`✅ Configuración cargada correctamente. Prefijo global: ${chalk.yellow.bold(configData.globalPrefix || ".")}`));
