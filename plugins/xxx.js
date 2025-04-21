const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const Checker = require("../libs/nsfw"); // Ruta de tu función
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const handler = async (msg, { conn }) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const chatId = msg.key.remoteJid;

  await conn.sendMessage(chatId, {
    react: { text: "🔍", key: msg.key }
  });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(chatId, {
      text: "❌ *Responde a una imagen o sticker para analizar contenido NSFW.*"
    }, { quoted: msg });
  }

  const mediaType = quoted.imageMessage ? "image" : "sticker";
  const media = quoted[`${mediaType}Message`];
  const stream = await downloadContentFromMessage(media, mediaType);
  let buffer = Buffer.alloc(0);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

  const tmp = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

  const inputPath = path.join(tmp, `nsfw_${Date.now()}.webp`);
  const outputPath = inputPath.replace(".webp", ".png");
  fs.writeFileSync(inputPath, buffer);

  try {
    await promisify(exec)(`ffmpeg -i "${inputPath}" "${outputPath}"`);
    const finalBuffer = fs.readFileSync(outputPath);

    const check = new Checker();
    const result = await check.response(finalBuffer);

    if (!result?.status) throw new Error(result?.msg || "No se pudo analizar.");

    const { NSFW, percentage, response } = result.result;
    const estado = NSFW ? "🔞 *NSFW detectado*" : "✅ *Contenido seguro*";

    await conn.sendMessage(chatId, {
      text: `${estado}\n📊 *Confianza:* ${percentage}\n\n${response}`,
      quoted: msg
    });
  } catch (err) {
    console.error("❌ Error en comando xxx:", err);
    await conn.sendMessage(chatId, {
      text: "❌ *Ocurrió un error al analizar el archivo.*",
      quoted: msg
    });
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};

handler.command = ["xxx"];
handler.tags = ["tools"];
handler.help = ["xxx <responde a imagen o sticker>"];

module.exports = handler;
