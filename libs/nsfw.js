/***************/

/* CRÉDITOS: githu.com/ds6

/****************/

const axios = require("axios");
const cheerio = require("cheerio");
const {
    Blob,
    FormData
} = require("formdata-node");

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

    #getFunctionId = async () => {
        try {
            const res = await axios.get(this.base + this.identifierPath, {
                headers: this.headers
            });
            const $ = cheerio.load(res.data);
            const script = $('script[src*="embed-image.js"]').attr("src");
            const fid = script?.match(/[?&]id=([^&]+)/)?.[1];
            if (!fid) throw new Error("Function ID not found.");
            return {
                creator: this.creator,
                status: true,
                id: fid
            };
        } catch (err) {
            return {
                creator: this.creator,
                status: false,
                msg: err.message
            };
        }
    }

    response = async (buffer) => {
        const functionData = await this.#getFunctionId();
        if (!functionData.status) {
            return {
                creator: this.creator,
                status: false,
                msg: functionData.error
            };
        }
        try {
            const blob = new Blob([buffer], {
                type: "image/png"
            });
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
            let {
                labelName,
                labelId,
                confidence
            } = response.data;
            if (confidence > .97) {
                const cap = Math.random() * (.992 - .97) + .97;
                confidence = Math.min(confidence, cap);
            }
            if (labelName === "Porn") {
                return {
                    creator: this.creator,
                    status: true,
                    result: {
                        NSFW: true,
                        percentage: (confidence * 100).toFixed(2) + "%",
                        safe: false,
                        response: "This image was detected as NSFW. Please be careful when sharing."
                    }
                };
            } else if (labelName === "Not Porn") {
                return {
                    creator: this.creator,
                    status: true,
                    result: {
                        NSFW: false,
                        percentage: (confidence * 100).toFixed(2) + "%",
                        safe: true,
                        response: "This image was not detected as NSFW."
                    }
                };
            }
        } catch (err) {
            return {
                creator: this.creator,
                status: false,
                msg: err.message
            };
        }
    }
}
