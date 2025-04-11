const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');
const axios = require('axios');

async function remini(imageData, operation = "enhance") {
    const availableOperations = ["enhance", "recolor", "dehaze"];
    if (!availableOperations.includes(operation)) operation = "enhance";
    
    const formData = new FormData();
    formData.append('image', imageData, { 
        filename: 'enhance_image.jpg',
        contentType: 'image/jpeg'
    });
    formData.append('model_version', '1');

    try {
        const response = await axios.post(`https://inferenceengine.vyro.ai/${operation}.vyro`, formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'okhttp/4.9.3',
                'Accept-Encoding': 'gzip'
            },
            responseType: 'arraybuffer'
        });

        return response.data;
    } catch (error) {
        console.error('Error en remini:', error);
        throw new Error('Error al procesar la imagen');
    }
}

const handler = async (msg, { conn }) => {
    try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return await conn.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a una imagen con el comando* `.hd` *para mejorarla.*" 
            }, { quoted: msg });
        }

        const mime = quoted.imageMessage?.mimetype || "";
        
        if (!mime) {
            return await conn.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *El mensaje citado no contiene una imagen.*" 
            }, { quoted: msg });
        }

        if (!/image\/(jpe?g|png)/.test(mime)) {
            return await conn.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Solo se admiten imágenes en formato JPG o PNG.*" 
            }, { quoted: msg });
        }

        await conn.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛠️", key: msg.key } 
        });

        const imgStream = await downloadContentFromMessage(quoted.imageMessage, "image");
        let buffer = Buffer.alloc(0);
        
        for await (const chunk of imgStream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
            throw new Error("No se pudo descargar la imagen");
        }

        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const enhancedImage = await remini(buffer, "enhance");

        await conn.sendMessage(msg.key.remoteJid, {
            image: enhancedImage,
            caption: "✨ *Imagen mejorada con HD*\n\n© Azura Ultra 2.0 Bot"
        }, { quoted: msg });

        await conn.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("Error en comando hd:", error);
        await conn.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al mejorar la imagen. Inténtalo de nuevo.*" 
        }, { quoted: msg });
        
        await conn.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
};

handler.command = ['hd', 'remini', 'enhance'];
handler.tags = ['tools'];
handler.help = [
    'hd <responder a imagen> - Mejora la calidad de la imagen',
    'remini <responder a imagen> - Mejora la calidad (alternativo)'
];

module.exports = handler;
