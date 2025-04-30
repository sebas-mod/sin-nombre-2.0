const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const fondoURL = "https://cdn.russellxz.click/3f64bf97.jpeg";
const sinFotoURL = "https://cdn.russellxz.click/c354a72a.jpeg";
const logoURL = "https://cdn.russellxz.click/a46036ec.png";
const registroPath = "./reg.json";

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderNum = senderId.replace(/[^0-9]/g, "");
  const senderName = msg.pushName || "Usuario";

  const fecha = new Date();
  const emitida = `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear()}`;
  const vence = `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear() + 10}`;

  if (!fs.existsSync(registroPath)) fs.writeFileSync(registroPath, JSON.stringify({}));
  const regData = JSON.parse(fs.readFileSync(registroPath, "utf-8"));

  if (regData[senderNum]) {
    return conn.sendMessage(chatId, {
      text: `⚠️ Ya estás registrado.\n\nUsa el comando *vercedula* si deseas volver a verla.`,
    }, { quoted: msg });
  }

  if (args.length < 4) {
    return conn.sendMessage(chatId, {
      text: `✳️ Uso correcto del comando:\n\n*reg nombre edad sexo fecha*\n\nEjemplo:\n*reg Russell 26 hombre 19/06/1998*`,
    }, { quoted: msg });
  }

  const [nombre, edad, sexo, nacimiento] = args;

  await conn.sendMessage(chatId, { react: { text: "🪪", key: msg.key } });

  let avatar = sinFotoURL;
  try {
    avatar = await conn.profilePictureUrl(senderId, "image");
  } catch {}

  let grupoNombre = "";
  try {
    const metadata = await conn.groupMetadata(chatId);
    grupoNombre = metadata.subject || chatId;
  } catch {
    grupoNombre = chatId;
  }

  const canvas = createCanvas(1080, 720);
  const ctx = canvas.getContext("2d");

  const fondo = await loadImage(fondoURL);
  ctx.drawImage(fondo, 0, 0, 1080, 720);

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(30, 40, 1020, 640);
  ctx.fillStyle = "#ffffff";

  ctx.font = "bold 42px Sans-serif";
  ctx.fillText("CIUDADANO DE AZURA ULTRA & CORTANA", 60, 100);

  ctx.font = "italic 30px Sans-serif";
  ctx.fillText(`Registrado en: ${grupoNombre}`, 60, 150);

  const foto = await loadImage(avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(170, 300, 130, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(foto, 40, 170, 260, 260);
  ctx.restore();

  ctx.font = "bold 34px Sans-serif";
  ctx.fillText(`👤 Nombre: ${nombre}`, 320, 260);
  ctx.fillText(`🎂 Edad: ${edad}`, 320, 310);
  ctx.fillText(`⚧ Sexo: ${sexo}`, 320, 360);
  ctx.fillText(`📅 Nacimiento: ${nacimiento}`, 320, 410);
  ctx.fillText(`📞 Número: ${senderNum}`, 320, 460);
  ctx.fillText(`🕐 Emitida: ${emitida}`, 320, 510);
  ctx.fillText(`⌛ Vence: ${vence}`, 320, 560);
  ctx.fillText(`🪖 Rango: Recluta`, 320, 610);

  const logo = await loadImage(logoURL);
  ctx.drawImage(logo, 930, 590, 100, 100);

  const tmpFile = `./tmp/cedula-${senderNum}.jpg`;
  const out = fs.createWriteStream(tmpFile);
  const stream = canvas.createJPEGStream();
  stream.pipe(out);

  out.on("finish", async () => {
    await conn.sendMessage(chatId, {
      image: { url: tmpFile },
      caption: `🪪 Registro exitoso, *${nombre}*. ¡Bienvenido ciudadano de Azura Ultra & Cortana!`,
    }, { quoted: msg });

    regData[senderNum] = {
      nombre,
      edad,
      sexo,
      nacimiento,
      numero: senderNum,
      grupo: chatId,
      grupo_nombre: grupoNombre,
      emitida,
      vence,
      rango: "Recluta"
    };

    fs.writeFileSync(registroPath, JSON.stringify(regData, null, 2));
    fs.unlinkSync(tmpFile);
  });
};

handler.command = ["reg"];
module.exports = handler;
