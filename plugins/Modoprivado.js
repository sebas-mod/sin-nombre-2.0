const fs = require("fs");
const path = require("path");
const activosPath = path.join(__dirname, "..", "activos.json");

module.exports = async (m, { conn, args, isOwner }) => {
  if (!isOwner) return m.reply("❌ Solo el dueño del bot puede usar este comando.");
  if (!["on", "off"].includes(args[0])) return m.reply("⚠️ Usa: .modoprivado on/off");

  const activos = fs.existsSync(activosPath) ? JSON.parse(fs.readFileSync(activosPath)) : {};
  activos.modoPrivado = args[0] === "on";
  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));
  m.reply(`🔒 Modo privado ${args[0] === "on" ? "activado" : "desactivado"} correctamente.`);
};

module.exports.command = ["modoprivado"];
