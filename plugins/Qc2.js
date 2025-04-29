const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");

// si quieres usar una fuente distinta, descárgala y regístrala aquí
// registerFont('./fonts/Roboto-Bold.ttf', { family: 'Roboto' });

async function obtenerNombre(jid, conn, chatId, push = "") {
  // (re-usa tu antigua lógica resumida)
  try {
    const name = await conn.getName(jid);
    if (name && name.trim() && !/^\d+$/.test(name)) return name;
  } catch {}
  const c = conn.contacts?.[jid];
  if (c?.notify) return c.notify;
  if (push) return push;
  return jid.split("@")[0];
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line.trim());
      line = w + " ";
    } else line = test;
  }
  lines.push(line.trim());
  return lines;
}

const handler = async (msg, { conn, args }) => {
  const chat = msg.key.remoteJid;
  const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctxInfo?.quotedMessage;

  let useRed = false;
  if (args[0]?.toLowerCase() === "rojo") {
    useRed = true;
    args.shift();
  }

  let texto = args.join(" ").trim();
  if (!texto && quoted) {
    texto = quoted.conversation ||
            quoted.extendedTextMessage?.text || "";
  }
  if (!texto)
    return conn.sendMessage(chat,
      { text: "✳️ Escribe algo o cita un mensaje." },
      { quoted: msg });

  const targetJid = quoted && ctxInfo?.participant
      ? ctxInfo.participant
      : msg.key.participant || msg.key.remoteJid;

  const nombre = await obtenerNombre(targetJid, conn, chat, msg.pushName);

  // avatar ─────────────────────────────────────
  let avatarURL = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
  try { avatarURL = await conn.profilePictureUrl(targetJid, "image"); } catch {}
  const avatarImg = await loadImage(avatarURL);

  // canvas dinámico (ancho fijo, alto según texto)
  const width = 800;
  const baseHeight = 260;          // avatar + nombre margen
  const lineHeight = 50;
  const canvasTmp = createCanvas(width, 10);
  const tmpCtx = canvasTmp.getContext("2d");
  tmpCtx.font = "28px Arial";
  const lines = wrapText(tmpCtx, texto, width - 100);
  const height = baseHeight + lines.length * lineHeight + 60;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // fondo degradado
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (useRed) {
    grad.addColorStop(0, "#ff512f");
    grad.addColorStop(1, "#dd2476");
  } else {
    grad.addColorStop(0, "#4e54c8");
    grad.addColorStop(1, "#8f94fb");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // avatar circular grande (200 px)
  const avatarSize = 200;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarSize/2 + 40, avatarSize/2 + 40, avatarSize/2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, 40, 40, avatarSize, avatarSize);
  ctx.restore();

  // nombre
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial";
  ctx.fillText(nombre, avatarSize + 80, 120);

  // texto
  ctx.font = "28px Arial";
  let y = 200;
  for (const line of lines) {
    ctx.fillText(line, 60, y);
    y += lineHeight;
  }

  const buffer = canvas.toBuffer("image/png");

  await conn.sendMessage(chat,
    { image: buffer, caption: "🖼️ Generado por qc2" },
    { quoted: msg });
  await conn.sendMessage(chat, { react: { text: "✅", key: msg.key } });
};

handler.command = ["qc2"];
module.exports = handler;
