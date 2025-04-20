const axios = require("axios");
const cheerio = require("cheerio");
const { Blob, FormData } = require("formdata-node");

const handler = async (msg, { sock }) => {
  await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔍", key: msg.key } });

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const type = quoted?.imageMessage ? "image" : quoted?.stickerMessage ? "sticker" : null;
  const media = quoted?.imageMessage || quoted?.stickerMessage;

  if (!media || !type) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ *Responde a una imagen o sticker para analizar si contiene contenido NSFW.*"
    }, { quoted: msg });
  }

  try {
    const stream = await require("@whiskeysockets/baileys").downloadContentFromMessage(media, type);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // Analizador embebido (de tu amigo)
    const checker = new (class {
      constructor() {
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
        const id = await this.getFunctionId();
        const blob = new Blob([buffer], { type: "image/png" });
        const form = new FormData();
        form.append("file", blob, "image.png");

        const res = await axios.post(`${this.base}${this.invokeEndpoint}/${id}/invoke`, form, {
          headers: {
            ...this.headers,
            "Content-Type": `multipart/form-data; boundary=${form._boundary}`
          }
        });

        const { labelName, confidence } = res.data;
        return {
          nsfw: labelName.toLowerCase().includes("nsfw"),
          percentage: (confidence * 100).toFixed(2),
          label: labelName
        };
      }
    })();

    const result = await checker.response(buffer);

    const text = result.nsfw
      ? `🔞 *NSFW detectado*\nPorcentaje: *${result.percentage}%*\nEtiqueta: *${result.label}*`
      : `✅ *La imagen parece segura*\nPorcentaje NSFW: *${result.percentage}%*\nEtiqueta: *${result.label}*`;

    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: result.nsfw ? "🚫" : "✅", key: msg.key } });

  } catch (err) {
    console.error("❌ Error en comando xxx:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ *Error al analizar la imagen.* Intenta de nuevo."
    }, { quoted: msg });
  }
};

handler.command = ["xxx"];
module.exports = handler;
