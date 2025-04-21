/***************/

/* CRÉDITOS: githu.com/ds6

/****************/

// libs/nsfw.js
const axios = require("axios");
const cheerio = require("cheerio");
const { Blob, FormData } = require("formdata-node");

module.exports = class Checker {
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

  async #getFunctionId() {
    try {
      const res = await axios.get(this.base + this.identifierPath, {
        headers: this.headers
      });
      const $ = cheerio.load(res.data);
      const script = $('script[src*="embed-image.js"]').attr("src");
      const fid = script?.match(/[?&]id=([^&]+)/)?.[1];
      if (!fid) throw new Error("Function ID no encontrado.");
      return { status: true, id: fid };
    } catch (err) {
      return { status: false, msg: err.message };
    }
  }

  /**
   * @param {Buffer} buffer 
   * @param {string} mimeType - e.g. "image/jpeg", "image/png", "image/webp"
   */
  async response(buffer, mimeType = "image/png") {
    const functionData = await this.#getFunctionId();
    if (!functionData.status) {
      return { status: false, msg: functionData.msg };
    }

    try {
      // Usa el mimeType dinámico
      const blob = new Blob([buffer], { type: mimeType });
      const form = new FormData();
      form.append("file", blob, `image.${mimeType.split("/")[1]}`);
      const boundary = form._boundary;
      const invokeUrl = `${this.base}${this.invokeEndpoint}/${functionData.id}/invoke`;

      const resp = await axios.post(invokeUrl, form, {
        headers: {
          ...this.headers,
          "Content-Type": `multipart/form-data; boundary=${boundary}`
        }
      });

      let { labelName, confidence } = resp.data;
      if (confidence > 0.97) {
        const cap = Math.random() * (0.992 - 0.97) + 0.97;
        confidence = Math.min(confidence, cap);
      }

      if (labelName === "Porn") {
        return {
          status: true,
          result: {
            NSFW: true,
            percentage: (confidence * 100).toFixed(2) + "%",
            response: "🔞 *Esta imagen fue detectada como NSFW. Ten cuidado al compartirla.*"
          }
        };
      } else {
        return {
          status: true,
          result: {
            NSFW: false,
            percentage: (confidence * 100).toFixed(2) + "%",
            response: "✅ *Esta imagen fue analizada y es segura.*"
          }
        };
      }
    } catch (err) {
      return { status: false, msg: err.message };
    }
  }
};
