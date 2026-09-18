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
function looksNarration(v){
  const t=String(v||'').replace(/\s+/g,' ').trim();if(!t)return false;
  if(/^[“"「『]/.test(t))return false;
  if(/^(?:그는|그가|그녀는|그녀가|당신은|당신이|상대는|상대가)\s/.test(t))return true;
  if(/^(?:방 안|침대 위|책상|벽에|문 쪽|작업대|복도|피아노|창가|테이블|바닥|서랍|액자|의자|왕좌|엘리베이터|호텔)\S*\s/.test(t)&&/다\.$/.test(t))return true;
  const subject=t.match(/^([가-힣A-Za-z·.' -]{2,24})(은|는|이|가)\s/);
  const actionCue=/(?:손|시선|고개|몸|표정|눈|미소|웃|바라|돌리|꺼내|넣|잡|들고|놓|앉|일어나|움직|멈추|중얼|피하|만지|정리|읽|살피|끄덕|젓|기울|둘러|펼치|접|기대|찡그|서랍|작업대|문 쪽|벽|테이블|의자|피아노)/;
  if(subject&&!/^(?:나|내|너|네|우리|그것|이것|저것|사람들?)$/.test(subject[1].trim())&&actionCue.test(t)&&/다\.$/.test(t))return true;
  return false;
}
function pushBeat(out,kind,text){
  text=String(text||'').trim();if(!text)return;
  let k=kind;if(k==='CHARACTER'&&looksNarration(text))k='NARRATION';
  out.push({kind:k,text});
}

function markerKind(v,fallback='CHARACTER'){
  const k=up(v);return k==='NARRATION'?'NARRATION':k==='PLAYER'?'PLAYER':fallback;
}
function mixedBeats(raw,fallback='CHARACTER'){
  const text=String(raw||'').trim();if(!text)return[];
  const quote=/[“"]([^”"]+)[”"]/g;let last=0,m,out=[];
  while((m=quote.exec(text))){
    const before=text.slice(last,m.index).trim();if(before)pushBeat(out,'NARRATION',before);
    const said=String(m[1]||'').trim();if(said)pushBeat(out,'CHARACTER',said);
    last=quote.lastIndex;
  }
  const after=text.slice(last).trim();if(after)pushBeat(out,out.length?'NARRATION':(looksNarration(after)?'NARRATION':markerKind(fallback,fallback)),after);
  if(out.length)return out;const single=[];pushBeat(single,looksNarration(text)?'NARRATION':markerKind(fallback,fallback),text);return single;
}
function parseMarked(raw,fallback='CHARACTER'){
  raw=String(raw||'').trim();if(!raw)return[];
  if(!hasMarkers(raw))return mixedBeats(raw,fallback);
  const token=/\[\[(CHARACTER|NARRATION|PLAYER)\]\]/ig,out=[];let kind=markerKind(fallback,fallback),last=0,m;
  while((m=token.exec(raw))){
    const before=raw.slice(last,m.index).trim();if(before)pushBeat(out,kind,before);
    kind=up(m[1]);last=token.lastIndex;
  }
  const tail=raw.slice(last).trim();if(tail)pushBeat(out,kind,tail);
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
  if(looksNarration(raw))return'NARRATION';
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