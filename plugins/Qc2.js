const axios = require('axios');

/* ─────── mapa prefijo → bandera ─────── */
const flagMap = [
  ['598','🇺🇾'],['595','🇵🇾'],['593','🇪🇨'],['591','🇧🇴'],
  ['509','🇭🇹'],['507','🇵🇦'],['506','🇨🇷'],['505','🇳🇮'],
  ['504','🇭🇳'],['503','🇸🇻'],['502','🇬🇹'],['501','🇧🇿'],
  ['57','🇨🇴'],['56','🇨🇱'],['55','🇧🇷'],['54','🇦🇷'],
  ['52','🇲🇽'],['51','🇵🇪'],['58','🇻🇪'],['34','🇪🇸'],
  ['1','🇺🇸']
];
const withFlag = num=>{
  const n=num.replace(/\D/g,'');
  for(const [p,f] of flagMap) if(n.startsWith(p)) return `${num} ${f}`;
  return num;
};

/* ─────── fondo por color ─────── */
const bgColors = {
  rojo   : '#ff3b30',
  azul   : '#007aff',
  morado : '#8e44ad',
  rosado : '#ff69b4',
  negro  : '#000000',
  verde  : '#34c759'
};

/* ─────── helper nombre bonito (idéntico a qc) ─────── */
async function prettyName(jid, conn, chatId, qPush='', fallback=''){
  if(qPush && !/^\d+$/.test(qPush)) return qPush;

  if(chatId.endsWith('@g.us')){
    try{
      const meta=await conn.groupMetadata(chatId);
      const p=meta.participants.find(p=>p.id===jid);
      const n=p?.notify||p?.name;
      if(n && !/^\d+$/.test(n)) return n;
    }catch{}
  }
  try{
    const g=await conn.getName(jid);
    if(g && !/^\d+$/.test(g) && !g.includes('@')) return g;
  }catch{}
  const c=conn.contacts?.[jid];
  if(c?.notify && !/^\d+$/.test(c.notify)) return c.notify;
  if(c?.name   && !/^\d+$/.test(c.name))   return c.name;
  if(fallback && !/^\d+$/.test(fallback))  return fallback;
  return withFlag(jid.split('@')[0]);
}

/* ─────── handler qc2 ─────── */
const handler = async (msg,{conn,args})=>{
try{
  const chatId  = msg.key.remoteJid;
  const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quoted  = ctxInfo?.quotedMessage;

  /* color opcional */
  const first=(args[0]||'').toLowerCase();
  const bgHex = bgColors[first] || bgColors.negro;
  if(bgColors[first]) args.shift();               // quitar color

  /* texto */
  let txt = args.join(' ').trim();
  if(!txt && quoted)
    txt = quoted.conversation || quoted.extendedTextMessage?.text || '';
  if(!txt)
    return conn.sendMessage(chatId,
      {text:'⚠️ Escribe algo o cita un mensaje.'},{quoted:msg});

  /* objetivo */
  const targetJid = quoted && ctxInfo?.participant
        ? ctxInfo.participant
        : msg.key.participant || msg.key.remoteJid;
  const qPush = quoted?.pushName || '';
  const name  = await prettyName(targetJid,conn,chatId,qPush,msg.pushName);

  /* avatar */
  let avatar='https://telegra.ph/file/24fa902ead26340f3df2c.png';
  try{ avatar=await conn.profilePictureUrl(targetJid,'image'); }catch{}

  await conn.sendMessage(chatId,{react:{text:'🎨',key:msg.key}});

  const quoteData={
    type:'quote',format:'png',backgroundColor:bgHex,
    width:800,height:0,scale:3,  // height 0 = auto
    messages:[{
      entities:[],avatar:true,
      from:{id:1,name,photo:{url:avatar}},
      text:txt,
      replyMessage:{}
    }]
  };

  const {data}=await axios.post(
    'https://bot.lyo.su/quote/generate',
    quoteData,
    {headers:{'Content-Type':'application/json'}}
  );

  const imgBuf=Buffer.from(data.result.image,'base64');

  await conn.sendMessage(chatId,
    {image:imgBuf,caption:`🖼️ qc2 (${first||'negro'})`},
    {quoted:msg});
  await conn.sendMessage(chatId,{react:{text:'✅',key:msg.key}});

}catch(e){
  console.error('qc2 error:',e);
  await conn.sendMessage(msg.key.remoteJid,
    {text:'❌ Error al generar la imagen.'},
    {quoted:msg});
}};
handler.command=['qc2'];
module.exports=handler;
