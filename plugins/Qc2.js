const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
// registerFont("./fonts/Roboto-Bold.ttf", { family: "Roboto" });

/*──────────────── bandera por prefijo ───────────────*/
const flagMap = [
  ["598","🇺🇾"],["595","🇵🇾"],["593","🇪🇨"],["591","🇧🇴"],
  ["509","🇭🇹"],["507","🇵🇦"],["506","🇨🇷"],["505","🇳🇮"],
  ["504","🇭🇳"],["503","🇸🇻"],["502","🇬🇹"],["501","🇧🇿"],
  ["57","🇨🇴"],["56","🇨🇱"],["55","🇧🇷"],["54","🇦🇷"],
  ["52","🇲🇽"],["51","🇵🇪"],["58","🇻🇪"],["34","🇪🇸"],
  ["1","🇺🇸"]
];
const numberFlag = num=>{
  const clean=num.replace(/\D/g,"");
  for(const [p,f] of flagMap) if(clean.startsWith(p)) return `${num} ${f}`;
  return num;
};

/*──────────────── degradados disponibles ────────────*/
const gradients = {
  azul:  ["#4e54c8","#8f94fb"],
  rojo:  ["#ff512f","#dd2476"],
  verde: ["#11998e","#38ef7d"],
  naranja:["#f12711","#f5af19"],
  rosa:  ["#ff9a9e","#fad0c4"],
  gris:  ["#bdc3c7","#2c3e50"]
};

/*──────────────── nombre bonito (idéntico a qc) ─────*/
async function prettyName(jid, conn, chatId, pushQuoted="", fallback=""){
  if(pushQuoted && !/^\d+$/.test(pushQuoted)) return pushQuoted;

  if(chatId.endsWith("@g.us")){
    try{
      const meta=await conn.groupMetadata(chatId);
      const p=meta.participants.find(p=>p.id===jid);
      const n=p?.notify||p?.name;
      if(n&&!/^\d+$/.test(n)) return n;
    }catch{}
  }
  try{
    const g=await conn.getName(jid);
    if(g&&!/^\d+$/.test(g)&&!g.includes("@")) return g;
  }catch{}
  const c=conn.contacts?.[jid];
  if(c?.notify&&!/^\d+$/.test(c.notify)) return c.notify;
  if(c?.name&&!/^\d+$/.test(c.name))     return c.name;
  if(fallback&&!/^\d+$/.test(fallback))  return fallback;
  return numberFlag(jid.split("@")[0]);
}

/*──────────────── texto multilinea ───────────────────*/
function wrap(ctx,text,max){
  const w=text.split(" "), lines=[]; let line="";
  for(const word of w){
    const test=line+word+" ";
    if(ctx.measureText(test).width>max){
      lines.push(line.trim()); line=word+" ";
    }else line=test;
  }
  lines.push(line.trim()); return lines;
}

/*────────────────── handler qc2 ──────────────────────*/
const handler = async (msg,{conn,args})=>{
try{
  const chatId  = msg.key.remoteJid;
  const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quoted  = ctxInfo?.quotedMessage;

  /* elegir degradado */
  const firstArg=(args[0]||"").toLowerCase();
  const gradKey = gradients[firstArg]?args.shift()||firstArg:"azul";
  const [g1,g2] = gradients[gradKey];

  /* texto */
  let text=args.join(" ").trim();
  if(!text && quoted)
    text = quoted.conversation || quoted.extendedTextMessage?.text || "";
  if(!text) return conn.sendMessage(chatId,{text:"✳️ Escribe algo o cita un mensaje."},{quoted:msg});

  /* identificar usuario objetivo */
  const targetJid = quoted && ctxInfo?.participant ?
                    ctxInfo.participant :
                    msg.key.participant || msg.key.remoteJid;
  const pushQuoted = quoted?.pushName || "";
  const namePrintable = await prettyName(targetJid, conn, chatId, pushQuoted, msg.pushName);

  /* avatar */
  let avatar="https://telegra.ph/file/24fa902ead26340f3df2c.png";
  try{ avatar=await conn.profilePictureUrl(targetJid,"image"); }catch{}
  const avatarImg=await loadImage(avatar);

  /* canvas dinámico */
  const width=900;
  const ctxTmp=createCanvas(10,10).getContext("2d");
  ctxTmp.font="32px Arial";
  const lines=wrap(ctxTmp,text,width-140);
  const height=260+lines.length*50;

  const canvas=createCanvas(width,height);
  const ctx=canvas.getContext("2d");

  /* fondo degradado */
  const grad=ctx.createLinearGradient(0,0,width,height);
  grad.addColorStop(0,g1); grad.addColorStop(1,g2);
  ctx.fillStyle=grad; ctx.fillRect(0,0,width,height);

  /* avatar círculo 180px */
  const avSize=180;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avSize/2+40,avSize/2+60,avSize/2,0,Math.PI*2);
  ctx.clip();
  ctx.drawImage(avatarImg,40,60,avSize,avSize);
  ctx.restore();

  /* nombre */
  ctx.fillStyle="#fff";
  ctx.font="bold 42px Arial";
  ctx.fillText(namePrintable,avSize+80,120);

  /* texto */
  ctx.font="32px Arial";
  let y=180;
  for(const line of lines){
    ctx.fillText(line,60,y); y+=50;
  }

  const buffer=canvas.toBuffer("image/png");
  await conn.sendMessage(chatId,{image:buffer,caption:`🖼️ qc2 (${gradKey})`},{quoted:msg});
  await conn.sendMessage(chatId,{react:{text:"✅",key:msg.key}});
}catch(e){
  console.error("qc2 error:",e);
  await conn.sendMessage(msg.key.remoteJid,{text:"❌ Error al generar la imagen."},{quoted:msg});
}};
handler.command=["qc2"];
module.exports=handler;
