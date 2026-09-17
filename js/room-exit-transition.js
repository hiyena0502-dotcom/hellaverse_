(()=>{
'use strict';
if(window.__HELLAVERSE_ROOM_EXIT_TRANSITION_V2__)return;
window.__HELLAVERSE_ROOM_EXIT_TRANSITION_V2__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const META_KEY='hellaverse_dialogue_render_meta_v1';
const $=(s,r=document)=>r.querySelector(s);
const upper=v=>String(v||'').trim().toUpperCase();
const list=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
let pending=false,exitStarted=false,sawExitBox=false,bridge=false,forceTimer=null,fallbackTimer=null,autoTimer=null,autoTarget=null;

function read(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function state(){return read(STATE_KEY,{})}
function meta(){return read(META_KEY,{})}
function role(scene,s,m){const mm=m?.[scene?.id]||{},explicit=upper(s?.dialogueFileMap?.[scene?.id]);if(explicit)return explicit==='QUESTION'?'ASK':explicit;const r=upper(mm.sceneRole||scene?.sceneRole||'');if(r)return r;const k=upper(scene?.kind||'');return k==='TALK'?'CONVERSATION':k}
function memoryTags(s,cid){return new Set((s.memories||[]).filter(x=>x?.characterId===cid&&!x.hidden).flatMap(x=>list(x.tags)))}
function eligibleExit(scene,s,m,cid){
  if(!scene||scene.characterId!==cid||role(scene,s,m)!=='EXIT')return false;
  const heart=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0)));if(heart<Number(scene.requiredAffection||0))return false;if(scene.maxAffection!=null&&heart>Number(scene.maxAffection))return false;
  const mood=upper(s.moods?.[cid]||'NORMAL'),reqMood=upper(scene.requiredMood||'ANY');if(reqMood&&reqMood!=='ANY'&&reqMood!==mood)return false;
  const flags=s.flags||{};if(list(scene.requiredFlags).some(f=>!flags[f]))return false;if(list(scene.blockedFlags).some(f=>!!flags[f]))return false;
  const tags=memoryTags(s,cid);if(list(scene.requiredMemoryTags).some(t=>!tags.has(t)))return false;if(list(scene.blockedMemoryTags).some(t=>tags.has(t)))return false;
  const owned=new Set([...(s.ownedItems||[]),...(s.owned||[])]);if(list(scene.requiredItemIds).some(i=>!owned.has(i)))return false;if(scene.repeatable===false&&scene.used)return false;return true;
}
function pickExit(){const s=state(),m=meta(),cid=String(s.active||'');if(!cid)return null;const rows=(s.dialogues||[]).filter(sc=>eligibleExit(sc,s,m,cid));if(!rows.length)return null;const best=Math.max(...rows.map(sc=>Number(sc.priority||0))),pool=rows.filter(sc=>Number(sc.priority||0)>=best-1);return pool[Math.floor(Math.random()*pool.length)]||rows[0]}
function clearAuto(){clearTimeout(autoTimer);autoTimer=null;autoTarget=null}
function beginPending(){
  if(pending)return;pending=true;exitStarted=false;sawExitBox=false;document.body.classList.add('hv-room-exiting');window.__HV_STOP_CONVERSATION_CHAIN__?.();clearTimeout(forceTimer);clearTimeout(fallbackTimer);clearAuto();
  forceTimer=setTimeout(forceExitIfNeeded,180);fallbackTimer=setTimeout(()=>{if(pending&&!exitStarted)navigateCharacters()},1100);
}
function syntheticLeave(){const host=$('.character-room')||$('#app');if(!host)return;const b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.vnLeave='';b.dataset.hvExitBridge='1';host.appendChild(b);bridge=true;try{b.click()}finally{bridge=false;b.remove()}}
function syntheticExit(scene){if(!scene||exitStarted)return false;const host=$('.character-room')||$('#app');if(!host)return false;const b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.scene=String(scene.id);b.dataset.hvExitBridge='1';host.appendChild(b);exitStarted=true;sawExitBox=false;bridge=true;try{b.click()}finally{bridge=false;b.remove()}setTimeout(schedule,0);return true}
function forceExitIfNeeded(){if(!pending||exitStarted)return;const scene=pickExit();if(scene){syntheticExit(scene);return}navigateCharacters()}
function isCharactersTrigger(target){if(!$('.character-room'))return false;if(target.closest('[data-page="characters"],.room-back,[data-runtime-return]'))return true;const el=target.closest('button,a');if(!el||el.closest('[data-drawer],.drawer-button'))return false;const text=String(el.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();return text==='CHARACTERS'||text==='‹ CHARACTERS'||text==='← CHARACTERS'}
function roleForSceneId(id){const s=state(),m=meta(),scene=(s.dialogues||[]).find(x=>String(x.id)===String(id));return scene?role(scene,s,m):''}
function scheduleAutoFinish(target){
  if(!target||autoTarget===target)return;clearAuto();autoTarget=target;
  autoTimer=setTimeout(()=>{
    const current=autoTarget;autoTimer=null;autoTarget=null;
    if(!pending||!exitStarted||!current?.isConnected)return;
    current.click();
  },720);
}
function normalizeExitUi(){
  if(!pending||!exitStarted)return;
  const box=$('.character-room .dialogue-box');
  if(box){
    sawExitBox=true;box.classList.add('hv-exit-dialogue');
    box.querySelectorAll('[data-vn-leave],[data-runtime-leave],[data-vn-ask],[data-hv-action],[data-inventory-open]').forEach(b=>{b.hidden=true;b.style.display='none'});
    const rawEnd=$('[data-end]',box),local=$('[data-single-beat-next]',box);
    if(rawEnd){rawEnd.hidden=true;rawEnd.style.display='none'}
    if(local&&local.dataset.singleBeatMode==='end'){
      local.hidden=true;local.style.display='none';scheduleAutoFinish(local);
    }else if(local){
      clearAuto();
    }else if(rawEnd&&!$('[data-vn-next],[data-vn-finish],[data-finish],[data-choice],[data-gc]',box)){
      scheduleAutoFinish(rawEnd);
    }
  }else if(sawExitBox){
    clearAuto();setTimeout(()=>{if(pending&&!$('.character-room .dialogue-box'))navigateCharacters()},50);
  }
}
function navigateCharacters(){
  if(!pending)return;clearTimeout(forceTimer);clearTimeout(fallbackTimer);clearAuto();
  const host=$('#app')||document.body,b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.page='characters';b.dataset.hvExitNavigate='1';host.appendChild(b);bridge=true;try{b.click()}finally{bridge=false;b.remove()}
  pending=false;exitStarted=false;sawExitBox=false;document.body.classList.remove('hv-room-exiting');
}
function schedule(){requestAnimationFrame(normalizeExitUi)}

window.addEventListener('click',event=>{
  if(bridge)return;const target=event.target instanceof Element?event.target:null;if(!target)return;
  const sceneButton=target.closest('[data-scene]');if(pending&&sceneButton&&roleForSceneId(sceneButton.dataset.scene||'')==='EXIT'){exitStarted=true;sawExitBox=false;setTimeout(schedule,0)}
  if(target.closest('.character-room [data-vn-leave],.character-room [data-runtime-leave]')){beginPending();return}
  if(isCharactersTrigger(target)){event.preventDefault();event.stopImmediatePropagation();beginPending();setTimeout(syntheticLeave,0);return}
  const end=target.closest('.character-room .dialogue-box [data-end]');if(pending&&exitStarted&&end){setTimeout(()=>{if(pending)navigateCharacters()},90)}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('hellaverse:state-updated',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();
