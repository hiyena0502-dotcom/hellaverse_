(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_CONTINUITY_V3__)return;
window.__HELLAVERSE_DIALOGUE_CONTINUITY_V3__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const META_KEY='hellaverse_dialogue_render_meta_v1';
const PROGRESS_KEY='hellaverse_conversation_progress_v1';
const CHAIN_CLASS='hv-conversation-chain';
const $=(s,r=document)=>r.querySelector(s);
const upper=v=>String(v||'').trim().toUpperCase();
const list=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
let bridge=false,starting=false,continuing=false,lastStarted='';

function read(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function state(){return read(STATE_KEY,{})}
function meta(){return read(META_KEY,{})}
function progress(){return read(PROGRESS_KEY,{version:2,characters:{}})}
function sceneRole(scene,s,m){
  const mm=m?.[scene?.id]||{};
  const explicit=upper(s?.dialogueFileMap?.[scene?.id]);
  if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const role=upper(mm.sceneRole||scene?.sceneRole||'');
  if(role)return role==='QUESTION'?'ASK':role;
  const kind=upper(scene?.kind||'TALK');
  return kind==='TALK'?'CONVERSATION':kind;
}
function stageFor(s,cid){
  const a=s.affection?.[cid]||{},heart=Math.max(0,Math.min(100,Number(a.value||0)));
  if(Array.isArray(a.stageTable)){
    const row=a.stageTable.find(r=>heart>=Number(r.min)&&heart<=Number(r.max));
    if(row?.name)return String(row.name);
  }
  const names=['STRANGER','DISTANT','ACQUAINTANCE','FAMILIAR','COMFORTABLE','FRIENDLY','CLOSE','TRUSTED','BONDED','DEVOTED','SPECIAL'];
  return names[Math.min(10,Math.floor(heart/10))]||'STRANGER';
}
function memoryTags(s,cid){return new Set((Array.isArray(s.memories)?s.memories:[]).filter(x=>x?.characterId===cid&&!x.hidden).flatMap(x=>list(x.tags)))}
function eligible(scene,s,m,cid){
  if(!scene||scene.characterId!==cid||sceneRole(scene,s,m)!=='CONVERSATION')return false;
  const heart=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0)));
  if(heart<Number(scene.requiredAffection||0))return false;
  if(scene.maxAffection!=null&&heart>Number(scene.maxAffection))return false;
  const mm=m?.[scene.id]||{},reqStage=String(mm.requiredStage||scene.requiredStageOverride||scene.requiredStage||'').trim();
  if(reqStage&&upper(reqStage)!==upper(stageFor(s,cid)))return false;
  const mood=upper(s.moods?.[cid]||'NORMAL'),reqMood=upper(scene.requiredMood||'ANY');
  if(reqMood&&reqMood!=='ANY'&&reqMood!==mood)return false;
  const flags=s.flags||{};
  if(list(scene.requiredFlags).some(f=>!flags[f]))return false;
  if(list(scene.blockedFlags).some(f=>!!flags[f]))return false;
  const tags=memoryTags(s,cid);
  if(list(scene.requiredMemoryTags).some(t=>!tags.has(t)))return false;
  if(list(scene.blockedMemoryTags).some(t=>tags.has(t)))return false;
  const owned=new Set([...(Array.isArray(s.ownedItems)?s.ownedItems:[]),...(Array.isArray(s.owned)?s.owned:[])]);
  if(list(scene.requiredItemIds).some(i=>!owned.has(i)))return false;
  if(scene.repeatable===false&&scene.used)return false;
  return true;
}
function pickConversation(){
  const s=state(),m=meta(),cid=String(s.active||'');if(!cid)return null;
  let rows=(Array.isArray(s.dialogues)?s.dialogues:[]).filter(sc=>eligible(sc,s,m,cid));
  if(!rows.length)return null;
  const p=progress().characters?.[cid]||{},recent=new Set(Array.isArray(p.recentSceneIds)?p.recentSceneIds:(s.visits?.[cid]?.recentSceneIds||[])),seen=new Set(Array.isArray(p.seenSceneIds)?p.seenSceneIds:[]);
  const noImmediate=rows.filter(sc=>String(sc.id)!==String(lastStarted));if(noImmediate.length)rows=noImmediate;
  const unseen=rows.filter(sc=>!seen.has(sc.id)&&!sc.used);if(unseen.length)rows=unseen;else{const fresh=rows.filter(sc=>!recent.has(sc.id));if(fresh.length)rows=fresh}
  let total=0;
  const weighted=rows.map(scene=>{let weight=Math.max(.1,Number(scene.probability==null?100:scene.probability)/100)*Math.max(.25,1+Number(scene.priority||0));if(!seen.has(scene.id)&&!scene.used)weight*=6;total+=weight;return{scene,weight}});
  let n=Math.random()*Math.max(total,.0001);for(const row of weighted){n-=row.weight;if(n<=0)return row.scene}return weighted.at(-1)?.scene||rows[0]||null;
}
function roleForSceneId(id){const s=state(),m=meta(),scene=(s.dialogues||[]).find(x=>String(x.id)===String(id));return scene?sceneRole(scene,s,m):''}
function syntheticScene(scene){
  if(!scene||starting)return false;
  const host=$('.character-room')||$('#app')||document.body,button=document.createElement('button');
  button.type='button';button.hidden=true;button.dataset.scene=String(scene.id);button.dataset.hvContinuityBridge='1';host.appendChild(button);
  starting=true;bridge=true;lastStarted=String(scene.id);document.body.classList.add(CHAIN_CLASS);
  try{button.click()}finally{bridge=false;button.remove();setTimeout(()=>{starting=false},180)}
  return true;
}
function startConversation(){const scene=pickConversation();return scene?syntheticScene(scene):false}
function stopChain(){document.body.classList.remove(CHAIN_CLASS);continuing=false;starting=false}
function finishRawAndContinue(button){
  if(continuing)return;continuing=true;
  const box=button.closest('.dialogue-box');if(box)box.dataset.hvContinuing='1';
  setTimeout(()=>{
    if(!button.isConnected){continuing=false;if(!startConversation())stopChain();return}
    bridge=true;try{button.click()}finally{bridge=false}
    const resume=()=>{
      if(!$('.character-room')){stopChain();return}
      if($('.character-room .dialogue-box')){setTimeout(resume,24);return}
      continuing=false;if(!startConversation())stopChain();
    };
    setTimeout(resume,16);
  },0);
}
function normalizeEndButtons(){
  if(!document.body.classList.contains(CHAIN_CLASS))return;
  for(const button of document.querySelectorAll('.character-room .dialogue-box [data-end]')){
    button.dataset.hvContinuityEnd='1';
    if(String(button.textContent||'').trim().toUpperCase()==='RETURN')button.textContent='NEXT';
  }
}
function scheduleNormalize(){requestAnimationFrame(normalizeEndButtons)}

window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('[data-vn-leave],[data-runtime-leave],[data-page="characters"],.room-back,[data-room]'))stopChain();
},true);

document.addEventListener('click',event=>{
  if(bridge)return;
  const target=event.target instanceof Element?event.target:null;if(!target)return;

  const sceneButton=target.closest('[data-scene]');
  if(sceneButton){
    const role=roleForSceneId(sceneButton.dataset.scene||'');
    if(role==='CONVERSATION')document.body.classList.add(CHAIN_CLASS);
    else if(role==='EXIT')stopChain();
  }

  const talk=target.closest('.character-room [data-action="TALK"]');
  if(talk&&!window.__HV_ACTION_PICKER_OPENING__&&!talk.closest('[data-hv-action]')&&upper(talk.dataset.dialogueFileRuntime)!=='ACTION'){
    event.preventDefault();event.stopImmediatePropagation();
    if(starting||continuing)return;
    startConversation();return;
  }

  const rawEnd=target.closest('.character-room .dialogue-box [data-end]');
  if(rawEnd&&document.body.classList.contains(CHAIN_CLASS)){
    event.preventDefault();event.stopImmediatePropagation();finishRawAndContinue(rawEnd);return;
  }
},true);

new MutationObserver(scheduleNormalize).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',scheduleNormalize);
document.addEventListener('DOMContentLoaded',scheduleNormalize);
window.addEventListener('load',scheduleNormalize);
})();
