const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const senderNum = sender.replace(/[^0-9]/g, "");
  const isOwner = global.owner.some(([id]) => id === senderNum);
  const isFromMe = msg.key.fromMe;

  if (!chatId.endsWith("@g.us")) {
    return conn.sendMessage(chatId, { text: "❌ Este comando solo puede usarse en grupos." }, { quoted: msg });
  }

  const meta = await conn.groupMetadata(chatId);
  const isAdmin = meta.participants.find(p => p.id === sender)?.admin;

  if (!isAdmin && !isOwner && !isFromMe) {
    return conn.sendMessage(chatId, {
      text: "❌ Solo *admins* o *el dueño del bot* pueden usar este comando."
    }, { quoted: msg });
  }

  const horaTexto = args.join(" ").trim();
  if (!horaTexto) {
    return conn.sendMessage(chatId, {
      text: "✳️ Usa el comando así:\n*.6vs6 [hora]*\nEjemplo: *.6vs6 9:00pm*"
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, { react: { text: '🎮', key: msg.key } });

  const zonas = [
    { pais: "🇲🇽 MÉXICO", offset: 0 },
    { pais: "🇨🇴 COLOMBIA", offset: 0 },
    { pais: "🇵🇪 PERÚ", offset: 0 },
    { pais: "🇵🇦 PANAMÁ", offset: 0 },
    { pais: "🇸🇻 EL SALVADOR", offset: 0 },
    { pais: "🇨🇱 CHILE", offset: 2 },
    { pais: "🇦🇷 ARGENTINA", offset: 2 },
    { pais: "🇪🇸 ESPAÑA", offset: 7 },
  ];

  const horaMsg = zonas.map(z => `${z.pais} : ${horaTexto}`).join("\n");

  const participantes = meta.participants.filter(p => p.id !== conn.user.id);
  if (participantes.length < 18) {
    return conn.sendMessage(chatId, {
      text: "⚠️ Se necesitan al menos *18 usuarios* para hacer 3 escuadras con suplentes."
    }, { quoted: msg });
  }

  const shuffled = participantes.sort(() => Math.random() - 0.5);
  const esc1 = shuffled.slice(0, 4);
  const esc2 = shuffled.slice(4, 8);
  const esc3 = shuffled.slice(8, 12);
  const sup1 = shuffled.slice(12, 14);
  const sup2 = shuffled.slice(14, 16);
  const sup3 = shuffled.slice(16, 18);

  const render = (arr) => arr.map((u, i) => `${i === 0 ? "👑" : "🥷🏻"} ┇ @${u.id.split("@")[0]}`).join("\n");

  const pasos = [
    "🎮 Preparando escuadras...",
    "🎯 Seleccionando jugadores...",
    "📊 Organizándolos...",
    "✅ ¡Equipos listos!"
  ];

  const tempMsg = await conn.sendMessage(chatId, {
    text: pasos[0]
  }, { quoted: msg });

  for (let i = 1; i < pasos.length; i++) {
    await new Promise(r => setTimeout(r, 1500));
    await conn.sendMessage(chatId, {
      edit: tempMsg.key,
      text: pasos[i]
    });
  }

  const textoFinal = `*6 𝐕𝐒 6 - FREE FIRE*\n\n⏱ 𝐇𝐎𝐑𝐀𝐑𝐈𝐎\n${horaMsg}\n\n➥ 𝐌𝐎𝐃𝐀𝐋𝐈𝐃𝐀𝐃: 🔫 Clásico\n➥ 𝐉𝐔𝐆𝐀𝐃𝐎𝐑𝐄𝐒:\n\n𝗘𝗦𝗖𝗨𝗔𝗗𝗥𝗔 1\n${render(esc1)}\n\nㅤʚ 𝐒𝐔𝐏𝐋𝐄𝐍𝐓𝐄𝐒:\n${render(sup1)}\n\n𝗘𝗦𝗖𝗨𝗔𝗗𝗥𝗔 2\n${render(esc2)}\n\nㅤʚ 𝐒𝐔𝐏𝐋𝐄𝐍𝐓𝐄𝐒:\n${render(sup2)}\n\n𝗘𝗦𝗖𝗨𝗔𝗗𝗥𝗔 3\n${render(esc3)}\n\nㅤʚ 𝐒𝐔𝐏𝐋𝐄𝐍𝐓𝐄𝐒:\n${render(sup3)}`;

  const mentions = [...esc1, ...esc2, ...esc3, ...sup1, ...sup2, ...sup3].map(p => p.id);

  await conn.sendMessage(chatId, {
    edit: tempMsg.key,
    text: textoFinal,
    mentions
  });
};

handler.command = ['6vs6'];
module.exports = handler;
