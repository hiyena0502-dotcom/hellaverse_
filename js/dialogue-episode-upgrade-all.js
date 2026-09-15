(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_EPISODE_UPGRADE_ALL_V2__)return;
window.__HELLAVERSE_DIALOGUE_EPISODE_UPGRADE_ALL_V2__=1;

const K='hellaverse_dialogue_state_v1';
const COMMON_FIRST='episode-common-after-choice';
const FILES=new Set(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME']);
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const up=v=>String(v||'').trim().toUpperCase();
const split=v=>Array.isArray(v)?v.map(String):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s){try{localStorage.setItem(K,JSON.stringify(s))}catch{}}
function markerKind(v){return up(v)==='NARRATION'?'NARRATION':'CHARACTER'}
function hasMarkers(v){return /\[\[(?:CHARACTER|NARRATION)\]\]/.test(String(v||''))}
function parseMarked(raw,fallback='CHARACTER'){
 raw=String(raw||'').trim();if(!raw)return[];
 if(!hasMarkers(raw))return mixedBeats(raw,fallback);
 const parts=raw.split(/\n(?=\[\[(?:CHARACTER|NARRATION)\]\])/g),out=[];
 for(const part of parts){const m=part.match(/^\[\[(CHARACTER|NARRATION)\]\]\s*([\s\S]*)$/);if(m&&clean(m[2]))out.push({kind:m[1],text:m[2].trim()});else if(clean(part))out.push({kind:markerKind(fallback),text:part.trim()})}
 return out;
}
function mixedBeats(raw,fallback='CHARACTER'){
 const text=String(raw||'').trim();if(!text)return[];
 const quote=/[“"]([^”"]+)[”"]/g;let last=0,m,out=[];
 while((m=quote.exec(text))){
  const before=text.slice(last,m.index).trim();if(before)out.push({kind:'NARRATION',text:before});
  const said=String(m[1]||'').trim();if(said)out.push({kind:'CHARACTER',text:said});
  last=quote.lastIndex;
 }
 const after=text.slice(last).trim();if(after)out.push({kind:out.length?'NARRATION':markerKind(fallback),text:after});
 return out.length?out:[{kind:markerKind(fallback),text}];
}
function encode(beats){
 const out=[];for(const b of beats||[]){const text=String(b?.text||'').trim();if(!text)continue;const kind=markerKind(b?.kind);const prev=out.at(-1);if(prev&&prev.kind===kind&&clean(prev.text)===clean(text))continue;out.push({kind,text})}
 return out.map(b=>`[[${b.kind}]] ${b.text}`).join('\n');
}
function appendEncoded(a,b,aKind='CHARACTER',bKind='CHARACTER'){
 const beats=[...parseMarked(a,aKind),...parseMarked(b,bKind)],out=[];
 for(const beat of beats){if(!beat.text)continue;const prev=out.at(-1);if(prev&&prev.kind===beat.kind&&clean(prev.text)===clean(beat.text))continue;out.push(beat)}
 return encode(out);
}
function choiceContent(ch){return !!(clean(ch?.text)||clean(ch?.playerLine)||clean(ch?.response)||clean(ch?.nextNodeId)||Number(ch?.affectionDelta||0)||clean(ch?.setFlags)||clean(ch?.removeFlags)||clean(ch?.addMemoryTitle)||clean(ch?.addMemorySummary)||clean(ch?.unlockItemId)||clean(ch?.moodChange))}
function refs(scene,id){let n=0;for(const node of scene.nodes||[])for(const ch of node.choices||[])if(String(ch?.nextNodeId||'')===String(id))n++;return n}
function safeId(v){return String(v||'node').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,54)||'node'}
function fileFor(sc){
 const explicit=up(sc?.sceneRole);if(explicit==='ASK')return'QUESTION';if(FILES.has(explicit))return explicit;
 const kind=up(sc?.kind||'TALK');if(kind==='ASK')return'QUESTION';if(['ENTRY','EXIT','IDLE','HOME'].includes(kind))return kind;
 if(kind==='TALK'){
  const ch=(sc.nodes||[]).flatMap(n=>Array.isArray(n?.choices)?n.choices:[]);return ch.length&&ch.filter(c=>c?.type==='action').length>ch.length/2?'ACTION':'CONVERSATION';
 }
 return'CONVERSATION';
}
function nodeKind(node){return up(node?.speaker)==='NARRATION'?'NARRATION':'CHARACTER'}
function openingKind(sc,file){const raw=up(sc?.openingType||sc?.openingSpeaker);if(raw==='NARRATION')return'NARRATION';if(file==='ACTION'&&/^\s*(당신|플레이어|그는|그녀는|방|복도|문|테이블|작업대)/.test(String(sc?.opening||'')))return'NARRATION';if(file==='QUESTION'&&/^\s*당신/.test(String(sc?.opening||'')))return'NARRATION';return'CHARACTER'}
function sameResponses(active){
 if(active.length<2)return'';const r=active.map(ch=>clean(ch?.response));if(!r[0]||!r.every(x=>x===r[0]))return'';return active[0].response;
}
function uniqueNodeId(scene,base){const used=new Set((scene.nodes||[]).map(n=>String(n?.id||'')));let id=base,i=2;while(used.has(id)){id=`${base}-${i++}`}return id}
function mergeSharedResponse(scene,node,nodeIndex){
 const active=(node.choices||[]).filter(choiceContent),response=sameResponses(active);if(!response)return false;
 const nextIds=[...new Set(active.map(ch=>String(ch?.nextNodeId||'')).filter(Boolean))];if(nextIds.length>1)return false;
 const targetId=nextIds[0]||'',target=targetId?(scene.nodes||[]).find(n=>String(n?.id||'')===targetId):null;
 const isFirst=nodeIndex===0||String(node.id||'')===String(scene.openingNodeId||'');
 let commonId=isFirst?COMMON_FIRST:uniqueNodeId(scene,`episode-common-${safeId(node.id)}`),common=(scene.nodes||[]).find(n=>String(n?.id||'')===commonId);
 if(target&&target.id===commonId)common=target;
 if(target&&target.id!==commonId&&refs(scene,target.id)===active.length){
  if(!common){common={...target,id:commonId,choices:Array.isArray(target.choices)?target.choices:[]};scene.nodes.push(common)}
  common.speaker=target.speaker||'character';
  common.text=appendEncoded(response,target.text,'CHARACTER',nodeKind(target));
  common.choices=Array.isArray(target.choices)?target.choices:[];
  scene.nodes=scene.nodes.filter(n=>n===common||String(n?.id||'')!==String(target.id));
 }else if(!target){
  if(!common){common={id:commonId,speaker:'character',text:'',choices:[]};scene.nodes.push(common)}
  common.text=appendEncoded(common.text,response,nodeKind(common),'CHARACTER');
 }else{
  return false;
 }
 for(const ch of active){ch.response='';ch.nextNodeId=commonId;ch.endConversation=false}
 return true;
}
function trivialChoiceToBeat(node){
 const active=(node.choices||[]).filter(choiceContent);if(active.length!==1)return false;const ch=active[0],label=clean(ch.text||ch.playerLine).toLowerCase();
 if(!['계속','계속한다','continue','next','...','…'].includes(label))return false;
 if(clean(ch.nextNodeId)||Number(ch.affectionDelta||0)||clean(ch.setFlags)||clean(ch.removeFlags)||clean(ch.addMemoryTitle)||clean(ch.addMemorySummary)||clean(ch.unlockItemId)||clean(ch.moodChange))return false;
 if(clean(ch.response))node.text=appendEncoded(node.text,ch.response,nodeKind(node),'CHARACTER');
 node.choices=[];return true;
}
function upgradeScene(sc,state){
 if(!sc||!sc.id)return false;let changed=false;sc.nodes=Array.isArray(sc.nodes)?sc.nodes:[];
 const file=state.dialogueFileMap?.[sc.id]&&FILES.has(up(state.dialogueFileMap[sc.id]))?up(state.dialogueFileMap[sc.id]):fileFor(sc);
 state.dialogueFileMap=state.dialogueFileMap&&typeof state.dialogueFileMap==='object'?state.dialogueFileMap:{};
 if(state.dialogueFileMap[sc.id]!==file){state.dialogueFileMap[sc.id]=file;changed=true}
 const first=sc.nodes.find(n=>String(n?.id||'')===String(sc.openingNodeId||''))||sc.nodes[0]||null;
 const oldOpening=String(sc.opening||'');let opening=encode(parseMarked(oldOpening,openingKind(sc,file)));
 if(first&&clean(first.text)){
  opening=appendEncoded(opening,first.text,openingKind(sc,file),nodeKind(first));first.text='';changed=true;
 }
 if(oldOpening!==opening&&opening){sc.opening=opening;changed=true}
 for(let i=0;i<sc.nodes.length;i++){
  const node=sc.nodes[i];node.choices=Array.isArray(node.choices)?node.choices:[];
  if(mergeSharedResponse(sc,node,i))changed=true;
  if(trivialChoiceToBeat(node))changed=true;
 }
 for(const node of sc.nodes){
  if(clean(node.text)){const enc=encode(parseMarked(node.text,nodeKind(node)));if(enc!==node.text){node.text=enc;changed=true}}
  for(const ch of node.choices||[]){
   if(clean(ch.response)){const enc=encode(parseMarked(ch.response,'CHARACTER'));if(enc!==ch.response){ch.response=enc;changed=true}}
  }
 }
 if(clean(sc.exitLine)){const enc=encode(parseMarked(sc.exitLine,'CHARACTER'));if(enc!==sc.exitLine){sc.exitLine=enc;changed=true}}
 if(clean(sc.after)){const enc=encode(parseMarked(sc.after,'NARRATION'));if(enc!==sc.after){sc.after=enc;changed=true}}
 return changed;
}
function upgrade(){
 const s=read();if(!Array.isArray(s.dialogues)||!s.dialogues.length)return;let changed=false,count=0,chars=new Set();
 s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
 for(const sc of s.dialogues){if(upgradeScene(sc,s)){changed=true;count++}if(sc?.characterId)chars.add(sc.characterId)}
 if(!s.dialogueEpisodeSystem||s.dialogueEpisodeSystem.version!==2){s.dialogueEpisodeSystem={version:2,mode:'BEATS_FIRST',files:['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME']};changed=true}
 if(changed)write(s);
 try{localStorage.setItem('hellaverse_dialogue_episode_upgrade_summary_v2',JSON.stringify({scenes:s.dialogues.length,characters:chars.size,changed:count}))}catch{}
}

upgrade();
let timer=0;window.addEventListener('hellaverse:state-updated',()=>{clearTimeout(timer);timer=setTimeout(upgrade,30)});
window.addEventListener('storage',e=>{if(e.key===K){clearTimeout(timer);timer=setTimeout(upgrade,30)}});
})();
