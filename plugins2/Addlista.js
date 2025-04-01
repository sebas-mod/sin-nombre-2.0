const fs = require("fs");

const handler = async (msg, { conn, text }) => {
  const fromMe = msg.key.fromMe;

  if (!fromMe) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "⛔ Solo el *subbot dueño* puede usar este comando."
    }, { quoted: msg });
  }

  let target;
  if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    target = msg.message.extendedTextMessage.contextInfo.participant;
  } else if (text && text.trim() !== "") {
    target = text;
  }

  if (!target) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Cita el mensaje del usuario o escribe su número."
    }, { quoted: msg });
  }

  target = target.replace(/\D/g, "");
  const archivo = "./listasubots.json";
  let lista = [];

  if (fs.existsSync(archivo)) {
    lista = JSON.parse(fs.readFileSync(archivo, "utf-8"));
    if (!Array.isArray(lista)) lista = [];
  }

  if (lista.includes(target)) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "ℹ️ Ese usuario ya está en la lista."
    }, { quoted: msg });
  }

  lista.push(target);
  fs.writeFileSync(archivo, JSON.stringify(lista, null, 2));

  await conn.sendMessage(msg.key.remoteJid, {
    text: `✅ Usuario *${target}* agregado a la lista.`
  }, { quoted: msg });
};

handler.command = ['addlista'];
module.exports = handler;
