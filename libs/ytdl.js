const axios = require("axios");

async function ytdl(url) {
    const apis = [
        `https://ytdownloader.nvlgroup.my.id/audio?url=${url}&bitrate=128`,
        `https://api.dorratz.com/v2/yt-mp3?url=${url}`
    ];

    for (let api of apis) {
        try {
            let response = await axios.get(api);
            
            // Verificar si la respuesta contiene un enlace válido
            if (response.data && response.data.link) {
                return {
                    status: "success",
                    creador: "eliasaryt",
                    dl: response.data.link // Enlace directo al MP3
                };
            }
        } catch (e) {
            console.error(`❌ Error en API: ${api}`, e.message);
        }
    }

    return { status: "error", creador: "eliasaryt", dl: null };
}

module.exports = ytdl;
