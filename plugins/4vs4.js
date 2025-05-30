const fs = require("fs");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const senderNum = sender.replace(/[^0-9]/g, "");
  const isOwner = global.owner.some(([id]) => id === senderNum);

  if (!chatId.endsWith("@g.us")) {
    return conn.sendMessage(chatId, { text: "❌ Este comando solo puede usarse en grupos." }, { quoted: msg });
  }

  const meta = await conn.groupMetadata(chatId);
  const isAdmin = meta.participants.find(p => p.id === sender)?.admin;

  if (!isAdmin && !isOwner) {
    return conn.sendMessage(chatId, {
      text: "❌ Solo *admins* o *el dueño del bot* pueden usar este comando."
    }, { quoted: msg });
  }

  const horaTexto = args.join(" ").trim();
  if (!horaTexto) {
    return conn.sendMessage(chatId, {
      text: "✳️ Usa el comando así:\n*.4vs4 [hora]*\nEjemplo: *.4vs4 5:00pm*"
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, { react: { text: '🎮', key: msg.key } });

  const zonas = [
    { pais: "🇲🇽 MÉXICO", offset: 0 },
    { pais: "🇨🇴 COLOMBIA", offset: 1 },
    { pais: "🇵🇪 PERÚ", offset: 1 },
    { pais: "🇵🇦 PANAMÁ", offset: 1 },
    { pais: "🇸🇻 EL SALVADOR", offset: 0 },
    { pais: "🇨🇱 CHILE", offset: 2 },
    { pais: "🇦🇷 ARGENTINA", offset: 2 }
  ];

  const parseHora = (texto) => {
    const match = texto.match(/(\d{1,2}):(\d{2})\s?(am|pm)/i);
    if (!match) return null;
    let [ , hour, minute, meridian ] = match;
    hour = parseInt(hour);
    minute = parseInt(minute);
    if (meridian.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (meridian.toLowerCase() === "am" && hour === 12) hour = 0;
    return { hour, minute };
  };

  const baseHora = parseHora(horaTexto);
  if (!baseHora) {
    return conn.sendMessage(chatId, {
      text: "⛔ Hora inválida. Usa el formato como: 4:30pm"
    }, { quoted: msg });
  }

  const horaMsg = zonas.map(z => {
    const totalMinutes = (baseHora.hour + z.offset) * 60 + baseHora.minute;
    const h = Math.floor((totalMinutes % 1440) / 60);
    const m = totalMinutes % 60;
    const meridian = h >= 12 ? "pm" : "am";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const hhmm = `${displayH}:${m.toString().padStart(2, "0")}${meridian}`;
    return `${z.pais} : ${hhmm}`;
  }).join("\n");

  // === Incluye a TODOS los participantes (usuarios, admins, owner) excepto @lid
  let participantes = meta.participants.filter(p => !p.id.endsWith("@lid"));

  // Verifica si el owner está en la lista y no lo excluye
  if (participantes.length < 12) {
    return conn.sendMessage(chatId, {
      text: "⚠️ Se necesitan al menos *12 usuarios* visibles para crear 2 escuadras y suplentes."
    }, { quoted: msg });
  }

  const shuffled = participantes.sort(() => Math.random() - 0.5);
  const escuadra1 = shuffled.slice(0, 4);
  const escuadra2 = shuffled.slice(4, 8);
  const suplentes = shuffled.slice(8, 12);

  const tempMsg = await conn.sendMessage(chatId, {
    text: "🎮 Preparando escuadras de Free Fire..."
  }, { quoted: msg });

  const pasos = [
    "🧠 Pensando estrategias...",
    "🎲 Mezclando nombres...",
    "📊 Seleccionando jugadores...",
    "✅ ¡Listo! Escuadras generadas:"
  ];

  for (let i = 0; i < pasos.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await conn.sendMessage(chatId, {
      edit: tempMsg.key,
      text: pasos[i]
    });
  }

  const renderJugadores = (arr) =>
    arr.map((u, i) => `${i === 0 ? "👑" : "🥷🏻"} ┇ @${u.id.split("@")[0]}`).join("\n");

  const textoFinal = `*4 𝐕𝐄𝐑𝐒𝐔𝐒 4*\n\n⏱ 𝐇𝐎𝐑𝐀𝐑𝐈𝐎\n${horaMsg}\n\n➥ 𝐌𝐎𝐃𝐀𝐋𝐈𝐃𝐀𝐃: 🔫 Clásico\n➥ 𝐉𝐔𝐆𝐀𝐃𝐎𝐑𝐄𝐒:\n\n      𝗘𝗦𝗖𝗨𝗔𝗗𝗥𝗔 1\n\n${renderJugadores(escuadra1)}\n\n    ㅤʚ 𝐒𝐔𝐏𝐋𝐄𝐍𝐓𝐄𝐒:\n${renderJugadores(suplentes.slice(0, 2))}\n\n     𝗘𝗦𝗖𝗨𝗔𝗗𝗥𝗔 2\n\n${renderJugadores(escuadra2)}\n\n    ㅤʚ 𝐒𝐔𝐏𝐋𝐄𝐍𝐓𝐄𝐒:\n${renderJugadores(suplentes.slice(2))}`;

  const mentions = [...escuadra1, ...escuadra2, ...suplentes].map(p => p.id);

  await conn.sendMessage(chatId, {
    edit: tempMsg.key,
    text: textoFinal,
    mentions
  });
};

handler.command = ['4vs4'];
module.exports = handler;
