const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

const handler = async (msg, { conn }) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const sender = msg.key.participant || msg.key.remoteJid;

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "🔎", key: msg.key }
  });

  if (!quoted || (!quoted.imageMessage && !quoted.stickerMessage)) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Debes responder a una imagen o sticker para analizar si es NSFW (xxx).*"
    }, { quoted: msg });
  }

  const type = quoted.imageMessage ? "image" : "sticker";
  const media = quoted.imageMessage || quoted.stickerMessage;

  try {
    const stream = await downloadContentFromMessage(media, type);
    const tmpFile = `./tmp_${Date.now()}.png`;
    const write = fs.createWriteStream(tmpFile);

    for await (const chunk of stream) write.write(chunk);
    write.end();

    await new Promise((res) => write.on("finish", res));

    // Obtener function ID de Nyckel
    const getFunctionId = async () => {
      const res = await axios.get("https://www.nyckel.com/pretrained-classifiers/nsfw-identifier");
      const $ = cheerio.load(res.data);
      const script = $('script[src*="embed-image.js"]').attr("src");
      return script?.match(/[?&]id=([^&]+)/)?.[1];
    };

    const fid = await getFunctionId();
    if (!fid) throw new Error("No se pudo obtener el ID de función de Nyckel.");

    // Subir imagen
    const form = new FormData();
    form.append("file", fs.createReadStream(tmpFile), "image.png");

    const response = await axios.post(
      `https://www.nyckel.com/v1/functions/${fid}/invoke`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          "user-agent": "Azura Ultra Bot",
          "x-requested-with": "XMLHttpRequest"
        }
      }
    );

    const { labelName, confidence } = response.data;
    const porcentaje = (confidence * 100).toFixed(2);
    const esNSFW = labelName.toLowerCase().includes("nsfw");
    const mensaje = esNSFW
      ? "🔞 *Esta imagen fue detectada como NSFW.*"
      : "✅ *La imagen no fue detectada como contenido NSFW.*";

    await conn.sendMessage(msg.key.remoteJid, {
      text: `*Resultado:*\n📊 Confianza: *${porcentaje}%*\n${mensaje}`,
      quoted: msg
    });

    fs.unlinkSync(tmpFile);
  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al analizar la imagen. Intenta con otra.",
    }, { quoted: msg });
  }
};

handler.command = ["xxx"];
module.exports = handler;
