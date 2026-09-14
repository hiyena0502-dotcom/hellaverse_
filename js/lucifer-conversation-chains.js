(()=>{
if(window.__HELLAVERSE_LUCIFER_TOPIC_CHAINS_V1__)return;
window.__HELLAVERSE_LUCIFER_TOPIC_CHAINS_V1__=1;
const K='hellaverse_dialogue_state_v1';
const VK='hellaverse_lucifer_topic_chains_v1';
const CID='lucifer-morningstar';
let done=0;try{done=Number(localStorage.getItem(VK)||0)||0}catch{}if(done>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}};
const list=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const topicOrder=['charlie','duck','work','music','heaven','family','hotel','royalty','alastor','fatherhood','craft','food','apple','wings','fashion','stars','rest','memory','past'];
const generic=new Set(['monologue','embarrassed','daily','joke','player','relationship','comfort','trust','personal','room','entry','exit','support']);
function primary(scene){
  const ts=list(scene.topics).map(x=>x.toLowerCase());
  for(const key of topicOrder)if(ts.includes(key))return key;
  return ts.find(x=>!generic.has(x))||'';
}
const state=read();state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
const pool=state.dialogues.filter(s=>s&&s.characterId===CID&&s._luciferRoomExpansion&&(String(s.sceneRole||'').toUpperCase()==='CONVERSATION'||String(s.kind||'').toUpperCase()==='TALK'));
const groups={};
for(const scene of pool){const key=primary(scene);if(!key)continue;(groups[key]||(groups[key]=[])).push(scene)}
for(const [topic,scenes] of Object.entries(groups)){
  if(scenes.length<3)continue;
  for(let start=0;start<scenes.length;start+=4){
    const chunk=scenes.slice(start,start+4);if(chunk.length<3)continue;
    const arc=`lucifer-room-topic-${topic}-${Math.floor(start/4)+1}`;
    chunk.forEach((scene,i)=>{
      const rotated=chunk.slice(i+1).concat(chunk.slice(0,i));
      scene.arcId=arc;
      scene.arcOrder=i+1;
      scene.followUpSceneIds=rotated.map(x=>x.id);
      scene.followUpTopics=[topic];
      scene.topicChain=topic;
      scene.topicChainLength=chunk.length;
    });
  }
}
if(write(state)){
  try{localStorage.setItem(VK,'1')}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-topic-chains'}}));
}
})();

(()=>{
if(window.__HELLAVERSE_LUCIFER_MEMORY_EVENT_LOADER_V1__)return;
window.__HELLAVERSE_LUCIFER_MEMORY_EVENT_LOADER_V1__=1;
const load=src=>new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
load('js/lucifer-memory-event-weave.js?v=1')
 .then(()=>load('js/lucifer-memory-event-bridge.js?v=1'))
 .then(()=>window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'thought-archive',clearDirty:false}})));
})();