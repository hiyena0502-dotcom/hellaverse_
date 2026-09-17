(()=>{
'use strict';
if(window.__HELLAVERSE_RUNTIME_INTEGRITY_V1__)return;
window.__HELLAVERSE_RUNTIME_INTEGRITY_V1__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const PROGRESS_KEY='hellaverse_conversation_progress_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const up=v=>String(v||'').trim().toUpperCase();
const list=v=>Array.isArray(v)?[...new Set(v.map(String).map(x=>x.trim()).filter(Boolean))]:[...new Set(String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean))];
let queued=false,syntheticScene=false,bridgeUntil=0,leaveUntil=0;

function read(key=STATE_KEY){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return{}}}
function choices(sc){return(sc?.nodes||[]).flatMap(n=>Array.isArray(n?.choices)?n.choices:[])}
function fileOf(sc,state){
  const explicit=up(state?.dialogueFileMap?.[sc?.id]);
  if(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME'].includes(explicit))return explicit;
  const role=up(sc?.sceneRole||'');
  if(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME'].includes(role))return role;
  if(role==='ASK')return'QUESTION';
  const kind=up(sc?.kind||'TALK');
  if(kind==='ASK')return'QUESTION';
  if(['ENTRY','EXIT','IDLE','HOME'].includes(kind))return kind;
  if(kind==='TALK'){
    const all=choices(sc);
    return all.length&&all.filter(c=>c?.type==='action').length>all.length/2?'ACTION':'CONVERSATION';
  }
  return'CONVERSATION';
}
function affection(state,cid){return Math.max(0,Math.min(100,Number(state.affection?.[cid]?.value??state.affection?.[cid]??0)))}
function mood(state,cid){return up(state.moods?.[cid]||'NORMAL')}
function memoryTags(state,cid){return new Set((state.memories||[]).filter(m=>m?.characterId===cid&&!m.hidden).flatMap(m=>list(m.tags)))}
function eligible(scene,state,cid){
  if(!scene||scene.characterId!==cid||fileOf(scene,state)!=='CONVERSATION')return false;
  const heart=affection(state,cid),min=Number(scene.requiredAffection||0),max=scene.maxAffection==null?100:Number(scene.maxAffection);
  if(heart<min||heart>max)return false;
  const requiredMood=up(scene.requiredMood||'ANY');if(requiredMood&&requiredMood!=='ANY'&&requiredMood!==mood(state,cid))return false;
  const flags=state.flags||{};if(list(scene.requiredFlags).some(f=>!flags[f]))return false;if(list(scene.blockedFlags).some(f=>!!flags[f]))return false;
  const tags=memoryTags(state,cid);if(list(scene.requiredMemoryTags).some(t=>!tags.has(t)))return false;if(list(scene.blockedMemoryTags).some(t=>tags.has(t)))return false;
  const owned=new Set(state.ownedItems||state.owned||[]);if(list(scene.requiredItemIds).some(id=>!owned.has(id)))return false;
  const progress=read(PROGRESS_KEY)?.characters?.[cid]||{},seen=new Set(progress.seenSceneIds||[]);
  if(scene.repeatable===false&&(scene.used||seen.has(scene.id)))return false;
  return true;
}
function nextConversation(state,cid){
  const all=(state.dialogues||[]).filter(scene=>eligible(scene,state,cid));
  if(!all.length)return null;
  const progress=read(PROGRESS_KEY)?.characters?.[cid]||{},seen=new Set(progress.seenSceneIds||[]),recent=new Set([...(progress.recentSceneIds||[]),...(state.visits?.[cid]?.recentSceneIds||[])]);
  const unseen=all.filter(scene=>!seen.has(scene.id)&&!scene.used),nonRecent=all.filter(scene=>!recent.has(scene.id));
  const pool=unseen.length?unseen:nonRecent.length?nonRecent:all;
  return pool[Math.floor(Math.random()*pool.length)]||pool[0]||null;
}
function startScene(scene){
  const host=$('.character-room')||$('#app');if(!host||!scene)return false;
  const button=document.createElement('button');button.type='button';button.hidden=true;button.dataset.scene=scene.id;button.dataset.hvIntegrityScene='1';host.appendChild(button);
  syntheticScene=true;try{button.click()}finally{syntheticScene=false;button.remove()}
  return true;
}
function ensureThoughtNav(){
  if(!window.__HELLAVERSE_THOUGHT_ARCHIVE_V42__)return;
  const nav=$('.main-nav');if(!nav||$('[data-open-thoughts]',nav))return;
  const button=document.createElement('button');button.type='button';button.className='nav-button';button.dataset.openThoughts='';button.textContent='THOUGHTS';
  const anchor=$('[data-hv-missions],[data-page="settings"],[data-hv-settings-rescue]',nav);anchor?nav.insertBefore(button,anchor):nav.appendChild(button);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureThoughtNav()})}

window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const now=Date.now();
  if(target.closest('[data-vn-leave],[data-runtime-leave],[data-page="characters"]')||/LEAVE ROOM/i.test(target.closest('button')?.textContent||''))leaveUntil=now+3200;
  if(target.closest('[data-vn-ask],[data-vn-gift],[data-dialogue-file-runtime],[data-runtime-return],[data-inventory-open]'))bridgeUntil=now+1800;
  const end=target.closest('.character-room .dialogue-box [data-end]');
  if(!end||syntheticScene||now<leaveUntil||now<bridgeUntil)return;
  const state=read();if(state.page!=='life'||!state.active)return;
  const next=nextConversation(state,String(state.active));if(!next)return;
  event.preventDefault();event.stopImmediatePropagation();
  requestAnimationFrame(()=>startScene(next));
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('load',schedule);
document.addEventListener('DOMContentLoaded',schedule);
if(document.readyState!=='loading')schedule();
})();
