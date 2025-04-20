const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const cheerio = require("cheerio");
const { Blob, FormData } = require("formdata-node");

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
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // Clase local para analizar NSFW con Nyckel
    class NyckelChecker {
      constructor() {
        this.creator = "Deus";
        this.base = "https://www.nyckel.com";
        this.invokeEndpoint = "/v1/functions";
        this.identifierPath = "/pretrained-classifiers/nsfw-identifier";
        this.headers = {
          authority: "www.nyckel.com",
          origin: "https://www.nyckel.com",
          referer: "https://www.nyckel.com/pretrained-classifiers/nsfw-identifier/",
          "user-agent": "Postify/1.0.0",
          "x-requested-with": "XMLHttpRequest"
        };
      }

      async getFunctionId() {
        const res = await axios.get(this.base + this.identifierPath, { headers: this.headers });
        const $ = cheerio.load(res.data);
        const script = $('script[src*="embed-image.js"]').attr("src");
        const fid = script?.match(/[?&]id=([^&]+)/)?.[1];
        if (!fid) throw new Error("Function ID not found.");
        return fid;
      }

      async response(buffer) {
        const functionId = await this.getFunctionId();
        const blob = new Blob([buffer], { type: "image/png" });
        const form = new FormData();
        form.append("file", blob, "image.png");

        const boundary = form._boundary;
        const invokeUrl = `${this.base}${this.invokeEndpoint}/${functionId}/invoke`;

        const res = await axios.post(invokeUrl, form, {
          headers: {
            ...this.headers,
            "Content-Type": `multipart/form-data; boundary=${boundary}`
          }
        });

        const { labelName, confidence } = res.data;
        const result = {
          NSFW: labelName.toLowerCase().includes("nsfw"),
          percentage: (confidence * 100).toFixed(2) + "%",
          safe: !labelName.toLowerCase().includes("nsfw"),
          response: labelName.toLowerCase().includes("nsfw")
            ? "Esta imagen fue detectada como NSFW (contenido explícito)."
            : "Esta imagen no fue detectada como NSFW."
        };
        return result;
      }
    }

    const checker = new NyckelChecker();
    const resultado = await checker.response(buffer);

    await conn.sendMessage(msg.key.remoteJid, {
      text: `🔎 *Resultado de análisis NSFW:*\n\n📊 Porcentaje: *${resultado.percentage}*\n🔞 Detectado como NSFW: *${resultado.NSFW ? "Sí" : "No"}*\n📋 Mensaje: ${resultado.response}`,
      quoted: msg
    });
  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al analizar la imagen. Intenta nuevamente.",
    }, { quoted: msg });
  }
};

handler.command = ["xxx"];
module.exports = handler;
