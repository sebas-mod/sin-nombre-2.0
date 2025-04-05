const fs = require("fs");
const path = require("path");
const activosPath = path.join(__dirname, "..", "activos.json");

module.exports = async (m, { conn, args, isGroup, isOwner }) => {
  if (!isGroup) return m.reply("❌ Este comando solo funciona en grupos.");

  // Obtener metadata del grupo
  const metadata = await conn.groupMetadata(m.chat).catch(() => null);
  if (!metadata) return m.reply("❌ No se pudo obtener la información del grupo.");

  const senderId = m.sender; // El que ejecutó el comando
  const participante = metadata.participants.find(p => p.id === senderId);
  const esAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";

  if (!esAdmin && !isOwner) return m.reply("❌ Solo administradores reales o el owner pueden usar este comando.");
  if (!["on", "off"].includes(args[0])) return m.reply("⚠️ Usa: .modoadmins on/off");

  // Leer y actualizar el JSON
  const activos = fs.existsSync(activosPath) ? JSON.parse(fs.readFileSync(activosPath)) : {};
  activos.modoAdmins = activos.modoAdmins || {};
  if (args[0] === "on") {
    activos.modoAdmins[m.chat] = true;
  } else {
    delete activos.modoAdmins[m.chat];
  }

  fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));
  m.reply(`👑 Modo admins ${args[0] === "on" ? "activado" : "desactivado"} en este grupo.`);
};

module.exports.command = ["modoadmins"];
