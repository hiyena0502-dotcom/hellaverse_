(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_NORMALIZE_ONCE_V2__)return;
window.__HELLAVERSE_DIALOGUE_NORMALIZE_ONCE_V2__=1;

const K='hellaverse_dialogue_state_v1';
const ROLES=new Set(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT']);
const up=v=>String(v??'').trim().toUpperCase();
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s))}catch(e){console.warn('Dialogue one-shot normalize save failed',e)}};
const hasMarkers=v=>/\[\[(?:CHARACTER|NARRATION|PLAYER)\]\]/i.test(String(v||''));

function markerKind(v,fallback='CHARACTER'){
  const k=up(v);return k==='NARRATION'?'NARRATION':k==='PLAYER'?'PLAYER':fallback;
}
function mixedBeats(raw,fallback='CHARACTER'){
  const text=String(raw||'').trim();if(!text)return[];
  const quote=/[“"]([^”"]+)[”"]/g;let last=0,m,out=[];
  while((m=quote.exec(text))){
    const before=text.slice(last,m.index).trim();if(before)out.push({kind:'NARRATION',text:before});
    const said=String(m[1]||'').trim();if(said)out.push({kind:'CHARACTER',text:said});
    last=quote.lastIndex;
  }
  const after=text.slice(last).trim();if(after)out.push({kind:out.length?'NARRATION':markerKind(fallback,fallback),text:after});
  return out.length?out:[{kind:markerKind(fallback,fallback),text}];
}
function parseMarked(raw,fallback='CHARACTER'){
  raw=String(raw||'').trim();if(!raw)return[];
  if(!hasMarkers(raw))return mixedBeats(raw,fallback);
  const token=/\[\[(CHARACTER|NARRATION|PLAYER)\]\]/ig,out=[];let kind=markerKind(fallback,fallback),last=0,m;
  while((m=token.exec(raw))){
    const before=raw.slice(last,m.index).trim();if(before)out.push({kind,text:before});
    kind=up(m[1]);last=token.lastIndex;
  }
  const tail=raw.slice(last).trim();if(tail)out.push({kind,text:tail});
  return out;
}
function encode(beats){
  const out=[];
  for(const beat of beats||[]){
    const text=String(beat?.text||'').trim();if(!text)continue;
    out.push({kind:markerKind(beat?.kind,'CHARACTER'),text});
  }
  return out.map(b=>`[[${b.kind}]] ${b.text}`).join('\n');
}
function appendEncoded(a,b,aKind='CHARACTER',bKind='CHARACTER'){
  return encode([...parseMarked(a,aKind),...parseMarked(b,bKind)]);
}
function roleOf(sc,map){
  let r=up(map?.[sc?.id]||sc?.sceneRole||'');
  if(r==='ASK')r='QUESTION';if(r==='TALK')r='CONVERSATION';
  if(!r){const k=up(sc?.kind||'TALK');r=k==='ASK'?'QUESTION':k==='TALK'?'CONVERSATION':k}
  return r;
}
function nodeKind(node){return up(node?.speaker)==='NARRATION'?'NARRATION':up(node?.speaker)==='PLAYER'?'PLAYER':'CHARACTER'}
function openingKind(sc,role){
  const explicit=up(sc?.openingType||sc?.openingSpeaker);if(explicit==='NARRATION'||explicit==='PLAYER')return explicit;
  const raw=String(sc?.opening||'');
  if(role==='QUESTION'&&/^\s*당신/.test(raw))return'NARRATION';
  if(role==='ACTION'&&/^\s*(당신|플레이어|그는|그녀는|방|복도|문|테이블|작업대)/.test(raw))return'NARRATION';
  return'CHARACTER';
}

const s=read();
s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
let changed=0;
for(const sc of s.dialogues){
  if(!sc?.id)continue;
  const role=roleOf(sc,s.dialogueFileMap);if(!ROLES.has(role))continue;
  let touched=false;
  const fileRole=role==='QUESTION'?'QUESTION':role;
  if(s.dialogueFileMap[sc.id]!==fileRole){s.dialogueFileMap[sc.id]=fileRole;touched=true}
  const wantedRole=role==='QUESTION'?'ASK':role;
  const wantedKind=role==='QUESTION'?'ASK':role==='ENTRY'||role==='EXIT'?role:'TALK';
  if(up(sc.sceneRole)!==wantedRole){sc.sceneRole=wantedRole;touched=true}
  if(up(sc.kind)!==wantedKind){sc.kind=wantedKind;touched=true}
  sc.nodes=Array.isArray(sc.nodes)?sc.nodes:[];
  const first=sc.nodes.find(n=>String(n?.id||'')===String(sc.openingNodeId||''))||sc.nodes[0]||null;
  const okind=openingKind(sc,role);
  let opening=encode(parseMarked(sc.opening,okind));
  if(first&&String(first.text||'').trim()){
    opening=appendEncoded(opening,first.text,okind,nodeKind(first));
    first.text='';touched=true;
  }
  if(opening&&opening!==sc.opening){sc.opening=opening;touched=true}
  for(const node of sc.nodes){
    node.choices=Array.isArray(node.choices)?node.choices:[];
    if(String(node.text||'').trim()){
      const enc=encode(parseMarked(node.text,nodeKind(node)));if(enc!==node.text){node.text=enc;touched=true}
    }
    for(const ch of node.choices){
      if(String(ch?.response||'').trim()){
        const enc=encode(parseMarked(ch.response,'CHARACTER'));if(enc!==ch.response){ch.response=enc;touched=true}
      }
    }
  }
  if(String(sc.exitLine||'').trim()){
    const enc=encode(parseMarked(sc.exitLine,'CHARACTER'));if(enc!==sc.exitLine){sc.exitLine=enc;touched=true}
  }
  if(String(sc.after||'').trim()){
    const enc=encode(parseMarked(sc.after,'NARRATION'));if(enc!==sc.after){sc.after=enc;touched=true}
  }
  if(touched)changed++;
}
s.dialogueEpisodeSystem={version:6,mode:'ONE_SHOT_BEATS',files:[...ROLES],runtimeMutation:false,textDedupe:false,updatedAt:new Date().toISOString()};
write(s);
try{localStorage.setItem('hellaverse_dialogue_normalize_once_v2',JSON.stringify({changed,scenes:s.dialogues.length,at:new Date().toISOString()}))}catch{}
})();