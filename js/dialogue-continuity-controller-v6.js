(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_CONTINUITY_V8__)return;
window.__HELLAVERSE_DIALOGUE_CONTINUITY_V8__=1;

const K='hellaverse_dialogue_state_v1',META='hellaverse_dialogue_render_meta_v1';
const $=(s,r=document)=>r.querySelector(s);
const up=v=>String(v||'').trim().toUpperCase();
const list=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
let bridge=false,starting=false;

function read(key=K,f={}){try{return JSON.parse(localStorage.getItem(key)||'')||f}catch{return f}}
function state(){return read(K,{})}
function meta(){return read(META,{})}
function role(sc,s,m){
  const explicit=up(s.dialogueFileMap?.[sc?.id]);if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const r=up(m?.[sc?.id]?.sceneRole||sc?.sceneRole||'');if(r)return r==='QUESTION'?'ASK':r;
  const k=up(sc?.kind||'TALK');return k==='TALK'?'CONVERSATION':k;
}
function sceneMeta(sc,m){return m?.[sc?.id]||{}}
function stage(s,cid){
  const h=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0))),a=s.affection?.[cid]||{};
  if(Array.isArray(a.stageTable)){const row=a.stageTable.find(x=>h>=Number(x?.min)&&h<=Number(x?.max));if(row?.name)return String(row.name)}
  const names=['STRANGER','DISTANT','ACQUAINTANCE','FAMILIAR','COMFORTABLE','FRIENDLY','CLOSE','TRUSTED','BONDED','DEVOTED','SPECIAL'];
  return names[Math.min(10,Math.floor(h/10))]||'STRANGER';
}
function memoryTags(s,cid){
  return new Set((s.memories||[]).filter(x=>x?.characterId===cid&&!x.hidden).flatMap(x=>list(x.tags)));
}
function eligible(sc,s,m,cid){
  if(!sc||sc.characterId!==cid||role(sc,s,m)!=='CONVERSATION')return false;
  const h=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0)));
  const min=Number(sc.requiredAffection||0),max=Number(sc.maxAffection==null?100:sc.maxAffection);
  if(h<min||h>max)return false;
  const reqStage=String(sceneMeta(sc,m).requiredStage||sc.requiredStageOverride||sc.requiredStage||'').trim();
  if(reqStage&&up(reqStage)!==up(stage(s,cid)))return false;
  const mood=up(s.moods?.[cid]||'NORMAL'),reqMood=up(sc.requiredMood||'ANY');
  if(reqMood&&reqMood!=='ANY'&&reqMood!==mood)return false;
  const flags=s.flags||{};
  if(list(sc.requiredFlags).some(f=>!flags[f]))return false;
  if(list(sc.blockedFlags).some(f=>!!flags[f]))return false;
  const tags=memoryTags(s,cid);
  if(list(sc.requiredMemoryTags).some(t=>!tags.has(t)))return false;
  if(list(sc.blockedMemoryTags).some(t=>tags.has(t)))return false;
  const owned=new Set([...(s.ownedItems||[]),...(s.owned||[])]);
  if(list(sc.requiredItemIds).some(i=>!owned.has(i)))return false;
  if(sc.repeatable===false&&sc.used)return false;
  return true;
}
function historyIds(s,cid){
  return (s.conversationHistory||[]).filter(x=>x?.characterId===cid).map(x=>String(x.sceneId||'')).filter(Boolean);
}
function pickConversation(){
  const s=state(),m=meta(),cid=String(s.active||'');
  if(!cid)return null;
  let rows=(s.dialogues||[]).filter(sc=>eligible(sc,s,m,cid));
  if(!rows.length)return null;

  const history=historyIds(s,cid),seen=new Set(history),recent=new Set(history.slice(0,8));
  const unseen=rows.filter(sc=>!seen.has(String(sc.id||''))&&!sc.used);
  if(unseen.length)rows=unseen;
  else{
    const notRecent=rows.filter(sc=>!recent.has(String(sc.id||'')));
    if(notRecent.length)rows=notRecent;
  }

  let total=0;
  const weighted=rows.map(sc=>{
    let w=Math.max(.1,Number(sc.probability==null?100:sc.probability)/100)*Math.max(.25,1+Number(sc.priority||0));
    if(!seen.has(String(sc.id||'')))w*=3;
    total+=w;
    return{sc,w};
  });
  let n=Math.random()*Math.max(total,.001);
  for(const row of weighted){n-=row.w;if(n<=0)return row.sc}
  return weighted.at(-1)?.sc||rows[0]||null;
}
function syntheticScene(sc){
  if(!sc||starting)return false;
  const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
  b.type='button';b.hidden=true;b.dataset.scene=String(sc.id);b.dataset.hvConversationBridge='8';host.appendChild(b);
  starting=true;bridge=true;
  try{b.click()}finally{bridge=false;if(b.isConnected)b.remove();setTimeout(()=>{starting=false},120)}
  return true;
}
function startConversation(){
  if(starting)return false;
  const sc=pickConversation();
  return sc?syntheticScene(sc):false;
}
function cleanupLegacyChain(){
  try{document.body.classList.remove('hv-conversation-chain','hv-dialogue-chain-transition')}catch{}
}

cleanupLegacyChain();
window.addEventListener('click',e=>{
  if(bridge)return;
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-vn-leave],[data-runtime-leave],[data-page="characters"],.room-back,[data-room]'))cleanupLegacyChain();
},true);

window.__HV_START_CONVERSATION__=()=>startConversation();
window.__HV_STOP_CONVERSATION_CHAIN__=()=>cleanupLegacyChain();
window.__HV_CONVERSATION_CHAIN_ACTIVE__=()=>false;

document.addEventListener('DOMContentLoaded',cleanupLegacyChain);
window.addEventListener('load',cleanupLegacyChain);
})();
