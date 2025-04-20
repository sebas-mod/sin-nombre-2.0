const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const cheerio = require("cheerio");
const { Blob, FormData } = require("formdata-node");

class Checker {
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

  #getFunctionId = async () => {
    try {
      const res = await axios.get(this.base + this.identifierPath, { headers: this.headers });
      const $ = cheerio.load(res.data);
      const script = $('script[src*="embed-image.js"]').attr("src");
      const fid = script?.match(/[?&]id=([^&]+)/)?.[1];
      if (!fid) throw new Error("Function ID not found.");
      return { creator: this.creator, status: true, id: fid };
    } catch (err) {
      return { creator: this.creator, status: false, msg: err.message };
    }
  }

  response = async (buffer) => {
    const functionData = await this.#getFunctionId();
    if (!functionData.status) {
      return { creator: this.creator, status: false, msg: functionData.error };
    }
    try {
      const blob = new Blob([buffer], { type: "image/png" });
      const form = new FormData();
      form.append("file", blob, "image.png");
      const boundary = form._boundary;
      const invokeUrl = `${this.base}${this.invokeEndpoint}/${functionData.id}/invoke`;

      const response = await axios.post(invokeUrl, form, {
        headers: {
          ...this.headers,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        }
      });

      let { labelName, confidence } = response.data;
      if (confidence > .97) {
        const cap = Math.random() * (.992 - .97) + .97;
        confidence = Math.min(confidence, cap);
      }

      const percentage = (confidence * 100).toFixed(2) + "%";

      if (labelName === "Porn") {
        return {
          creator: this.creator,
          status: true,
          result: {
            NSFW: true,
            percentage,
            safe: false,
            response: "This image was detected as NSFW. Please be careful when sharing."
          }
        };
      } else {
        return {
          creator: this.creator,
          status: true,
          result: {
            NSFW: false,
            percentage,
            safe: true,
            response: "This image was not detected as NSFW."
          }
        };
      }
    } catch (err) {
      return { creator: this.creator, status: false, msg: err.message };
    }
  }
}

const handler = async (msg, { conn }) => {
  const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const sender = msg.key.participant || msg.key.remoteJid;

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "🔍", key: msg.key }
  });

  if (!quotedMsg || (!quotedMsg.imageMessage && !quotedMsg.stickerMessage)) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Responde a una imagen o sticker para analizar contenido NSFW (xxx).*"
    }, { quoted: msg });
  }

  const media = quotedMsg.imageMessage || quotedMsg.stickerMessage;
  const mediaType = quotedMsg.imageMessage ? "image" : "sticker";

  try {
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    const checker = new Checker();
    const result = await checker.response(buffer);

    if (!result?.status) throw new Error("Error al analizar la imagen");

    const status = result.result?.NSFW ? "🔞 *NSFW detectado*" : "✅ *Imagen segura*";
    const porcentaje = result.result?.percentage || "0%";
    const response = result.result?.response || "";

    await conn.sendMessage(msg.key.remoteJid, {
      text: `${status}\n📊 *Confianza:* ${porcentaje}\n\n${response}`,
      quoted: msg
    });

  } catch (e) {
    console.error("❌ Error en comando xxx:", e);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Error al analizar la imagen. Intenta con otra.",
      quoted: msg
    });
  }
};

handler.command = ["xxx"];
module.exports = handler;
