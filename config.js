const chalk = require("chalk");

//---------[ PROPIETARIO/OWNER ]---------
global.owner = [
    ["15167096032", "Owner", true],
    ["50766066665", "Owner", true],
    ["50765000000", "Owner", true],
    ["50766066666", "Owner", true]
];

//---------[ PREFIJO DEL BOT ]---------
global.prefix = "."; // Prefijo predeterminado

// Lista de prefijos permitidos
global.allowedPrefixes = [
    ".", "!", "#", "?", "-", "+", "*", "~", "$", "&", "%", "=", "🔥", "💀", "✅", "🥰",
    "💎", "🐱", "🐶", "🌟", "🎃", "🍕", "🍔", "🍑", "🛠️", "📌", "⚡", "🚀", "👀", "💡", "💣", "💯"
];

// Función para verificar si un usuario es Owner
global.isOwner = (user) => {
    user = user.replace(/[^0-9]/g, ""); // Limpiar número
    return global.owner.some(owner => owner[0] === user);
};

// Función para cambiar el prefijo (con validación)
global.setPrefix = (newPrefix) => {
    if (global.allowedPrefixes.includes(newPrefix)) {
        global.prefix = newPrefix;
        console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
    } else {
        console.log(chalk.red(`❌ Prefijo no permitido. Usa uno de estos: ${chalk.blue.bold(global.allowedPrefixes.join(" "))}`));
    }
};

// Exportar configuraciones
module.exports = { isOwner: global.isOwner, setPrefix: global.setPrefix, allowedPrefixes: global.allowedPrefixes };
