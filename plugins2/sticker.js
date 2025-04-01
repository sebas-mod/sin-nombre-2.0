const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    
    if (!/image|video/.test(mime)) throw `*[❗] Responda a una imagen o video corto (menos de 10 segundos) con el comando ${usedPrefix + command}*`;
    if (/video/.test(mime) if ((quoted.msg || quoted).seconds > 10) throw '[❗] El video no puede superar los 10 segundos';

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    
    const media = await quoted.download();
    const sticker = await (mime.split('/')[0] === 'image' ? 
      conn.sendImageAsSticker(m.chat, media, m, { 
        packname: 'Azura Ultra 2.0 SubBot', 
        author: 'Russell xz' 
      }) : 
      conn.sendVideoAsSticker(m.chat, media, m, { 
        packname: 'Azura Ultra 2.0 SubBot', 
        author: 'Russell xz' 
      }));
    
    if (!sticker) throw '*[❗] Error al crear el sticker*';
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error(error);
    await conn.sendMessage(m.chat, { 
      text: `*[❗] Error:* ${error.message || 'Ocurrió un error al procesar el sticker'}` 
    }, { quoted: m });
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
  }
};

handler.help = ['s'];
handler.tags = ['sticker'];
handler.command = ['s', 'sticker', 'stick'];
export default handler;
