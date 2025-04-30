const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const fondoURL = "https://cdn.russellxz.click/3f64bf97.jpeg";
const defaultAvatar = "https://cdn.russellxz.click/c354a72a.jpeg";
const logoURL = "https://cdn.russellxz.click/a46036ec.png";
const dbPath = "./reg.json";

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const senderNum = sender.replace(/[^0-9]/g, "");
  const name = msg.pushName || "Desconocido";

  // Verificar si ya está registrado
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  const db = JSON.parse(fs.readFileSync(dbPath));
  if (db[senderNum]) {
    return conn.sendMessage(chatId, {
      text: "✅ Ya estás registrado en Azura Ultra & Cortana. No es necesario volver a registrarte.",
    }, { quoted: msg });
  }

  // Validar formato: reg nombre edad sexo fechaNacimiento
  if (args.length < 4) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa el comando así:\n\n*reg nombre edad sexo fecha*\n\n📌 Ejemplo:\n*reg russell 26 hombre 19/06/1998*`,
    }, { quoted: msg });
  }

  const [nombre, edad, sexo, fechaNac] = args;
  const fechaHoy = new Date();
  const emitida = fechaHoy.toLocaleDateString("es-ES");
  const vence = new Date();
  vence.setFullYear(vence.getFullYear() + 10);
  const fechaVence = vence.toLocaleDateString("es-ES");

  const metadata = await conn.groupMetadata(chatId).catch(() => null);
  const groupName = metadata?.subject || "Grupo Desconocido";

  await conn.sendMessage(chatId, { react: { text: "🪪", key: msg.key } });

  // Cargar imágenes
  const [fondo, avatarRaw, logo] = await Promise.all([
    loadImage(fondoURL),
    loadImage(await conn.profilePictureUrl(sender, "image").catch(() => defaultAvatar)),
    loadImage(logoURL)
  ]);

  const canvas = createCanvas(1080, 720);
  const ctx = canvas.getContext("2d");

  // Fondo desenfocado
  ctx.drawImage(fondo, 0, 0, 1080, 720);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, 1080, 720);

  // Caja blanca con bordes
  ctx.fillStyle = "white";
  ctx.roundRect(60, 100, 960, 520, 30).fill();

  // Cabecera azul
  ctx.fillStyle = "#0a4682";
  ctx.roundRect(60, 70, 960, 50, { tl: 15, tr: 15, br: 0, bl: 0 }).fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 30px Sans";
  ctx.fillText("CIUDADANO DE AZURA ULTRA & CORTANA", 80, 105);

  // Avatar cuadrado
  ctx.save();
  ctx.beginPath();
  ctx.rect(90, 150, 200, 200);
  ctx.clip();
  ctx.drawImage(avatarRaw, 90, 150, 200, 200);
  ctx.restore();

  // Datos
  ctx.fillStyle = "#111";
  ctx.font = "bold 30px Sans";
  let y = 160;
  const data = [
    [`👤 Nombre:`, nombre],
    [`🎂 Edad:`, edad],
    [`⚧️ Sexo:`, sexo],
    [`📆 Nacimiento:`, fechaNac],
    [`📱 Número:`, senderNum],
    [`🗓️ Emitida:`, emitida],
    [`⏳ Vence:`, fechaVence],
    [`🎖️ Rango:`, "Recluta"]
  ];
  data.forEach(([label, value], i) => {
    ctx.fillText(`${label} ${value}`, 320, y + i * 45);
  });

  // Logo en esquina
  ctx.drawImage(logo, 960, 560, 80, 80);

  // Guardar imagen temporal
  const tmpFile = path.join("./tmp", `reg-${Date.now()}.jpg`);
  fs.writeFileSync(tmpFile, canvas.toBuffer("image/jpeg"));

  // Enviar imagen
  await conn.sendMessage(chatId, {
    image: { url: tmpFile },
    caption: `🪪 Registro completado para *${nombre}*`
  }, { quoted: msg });

  // Guardar en la base
  db[senderNum] = {
    nombre, edad, sexo, nacimiento: fechaNac,
    emitida, vence: fechaVence,
    grupo: chatId,
    rango: "Recluta"
  };
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

  // Borrar temporal
  fs.unlinkSync(tmpFile);
};

handler.command = ["reg"];
module.exports = handler;
