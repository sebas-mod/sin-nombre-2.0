const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  const codigo = args[0]?.replace("+", "").trim();

  if (!isGroup) {
    return conn.sendMessage(chatId, {
      text: "❌ Este comando solo funciona en grupos."
    }, { quoted: msg });
  }

  if (!codigo || isNaN(codigo)) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa el comando así:\n\n*.pais +507*`
    }, { quoted: msg });
  }

  const codigosLatam = {
    "507": "🇵🇦", "504": "🇭🇳", "505": "🇳🇮", "503": "🇸🇻", "502": "🇬🇹",
    "591": "🇧🇴", "592": "🇬🇾", "593": "🇪🇨", "594": "🇬🇫", "595": "🇵🇾",
    "596": "🇬🇫", "597": "🇸🇷", "598": "🇺🇾", "599": "🇨🇼",
    "54": "🇦🇷", "55": "🇧🇷", "56": "🇨🇱", "57": "🇨🇴", "58": "🇻🇪",
    "1": "🇺🇸", "34": "🇪🇸", "52": "🇲🇽", "51": "🇵🇪", "53": "🇨🇺"
  };

  const bandera = codigosLatam[codigo];
  if (!bandera) {
    return conn.sendMessage(chatId, {
      text: `❌ Código de país no válido o no soportado.`
    }, { quoted: msg });
  }

  const meta = await conn.groupMetadata(chatId);
  const participantes = meta.participants;
  const targets = participantes
    .filter(p => p.id.startsWith(codigo) && !p.id.includes("@lid"))
    .map(p => p.id);

  if (targets.length === 0) {
    return conn.sendMessage(chatId, {
      text: `⚠️ No se encontraron usuarios con el código +${codigo}`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, { react: { text: "🌍", key: msg.key } });

  await conn.sendMessage(chatId, {
    text: `🌐 *Llamado especial para usuarios del país +${codigo} ${bandera}*\n\n📢 Han sido convocados:`,
    mentions: targets
  }, { quoted: msg });
};

handler.command = ["pais"];
module.exports = handler;
