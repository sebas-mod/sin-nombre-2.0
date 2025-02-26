const axios = require("axios");

async function ytdl(url) {
    const apis = [
        `https://api.dorratz.com/v2/yt-mp3?url=${url}`, 
        `https://yt-downloader.sumanjay.workers.dev/audio?url=${url}`
    ];

    for (let api of apis) {
        try {
            console.log(`🔍 Probando API: ${api}`);
            let response = await axios.get(api);
            
            // Verificar si la API devolvió correctamente la URL de descarga
            if (response.data && response.data.link) {
                return { status: "success", creador: "eliasaryt", dl: response.data.link };
            }
        } catch (e) {
            console.error(`❌ Error en API: ${api} → ${e.message}`);
        }
    }

    return { status: "error", creador: "russell", dl: null };
}

module.exports = ytdl;
