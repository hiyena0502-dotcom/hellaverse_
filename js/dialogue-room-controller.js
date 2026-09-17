(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_ROOM_CONTROLLER_V1__)return;
window.__HELLAVERSE_DIALOGUE_ROOM_CONTROLLER_V1__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const META_KEY='hellaverse_dialogue_render_meta_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const up=v=>String(v||'').trim().toUpperCase();
const list=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let queued=false,bridge=false,directPending=false,directCid='',directTimer=null,lastCid='',actionSeen=new Set();

function read(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function state(){return read(STATE_KEY,{})}
function meta(){return read(META_KEY,{})}
function role(scene,s,m){
  const mm=m?.[scene?.id]||{},explicit=up(s?.dialogueFileMap?.[scene?.id]);
  if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const r=up(mm.sceneRole||scene?.sceneRole||'');if(r)return r==='QUESTION'?'ASK':r;
  const k=up(scene?.kind||'TALK');return k==='TALK'?'CONVERSATION':k;
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
function memoryTags(s,cid){return new Set((s.memories||[]).filter(x=>x?.characterId===cid&&!x.hidden).flatMap(x=>list(x.tags)))}
function eligibleAction(scene,s,m,cid){
  if(!scene||scene.characterId!==cid||role(scene,s,m)!=='ACTION')return false;
  const heart=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0)));
  if(heart<Number(scene.requiredAffection||0))return false;
  if(scene.maxAffection!=null&&heart>Number(scene.maxAffection))return false;
  const mm=m?.[scene.id]||{},reqStage=String(mm.requiredStage||scene.requiredStageOverride||scene.requiredStage||'').trim();
  if(reqStage&&up(reqStage)!==up(stageFor(s,cid)))return false;
  const mood=up(s.moods?.[cid]||'NORMAL'),reqMood=up(scene.requiredMood||'ANY');
  if(reqMood&&reqMood!=='ANY'&&reqMood!==mood)return false;
  const flags=s.flags||{};
  if(list(scene.requiredFlags).some(f=>!flags[f]))return false;
  if(list(scene.blockedFlags).some(f=>!!flags[f]))return false;
  const tags=memoryTags(s,cid);
  if(list(scene.requiredMemoryTags).some(t=>!tags.has(t)))return false;
  if(list(scene.blockedMemoryTags).some(t=>tags.has(t)))return false;
  const owned=new Set([...(s.ownedItems||[]),...(s.owned||[])]);
  if(list(scene.requiredItemIds).some(i=>!owned.has(i)))return false;
  if(scene.repeatable===false&&scene.used)return false;
  return true;
}
function synthetic(attrs){
  const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
  b.type='button';b.hidden=true;b.dataset.hvRoomBridge='1';
  for(const [name,value] of Object.entries(attrs))b.setAttribute(name,String(value??''));
  host.appendChild(b);bridge=true;try{b.click()}finally{bridge=false;b.remove()}
}
function toast(text){
  let root=$('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}
  root.innerHTML=`<div class="toast">${esc(text)}</div>`;setTimeout(()=>{if(root)root.innerHTML=''},1700);
}
function sceneByRole(wanted){
  const s=state(),m=meta(),cid=String(s.active||'');
  return (s.dialogues||[]).filter(sc=>sc?.characterId===cid&&role(sc,s,m)===wanted);
}
function pickAction(){
  const s=state(),m=meta(),cid=String(s.active||'');if(!cid)return null;
  if(lastCid!==cid){lastCid=cid;actionSeen=new Set()}
  let rows=(s.dialogues||[]).filter(sc=>eligibleAction(sc,s,m,cid));
  if(!rows.length)return null;
  let fresh=rows.filter(sc=>!actionSeen.has(String(sc.id||'')));
  if(!fresh.length){actionSeen=new Set();fresh=rows}
  let total=0;
  const weighted=fresh.map(scene=>{const weight=Math.max(.1,Number(scene.probability==null?100:scene.probability)/100)*Math.max(.25,1+Number(scene.priority||0));total+=weight;return{scene,weight}});
  let n=Math.random()*Math.max(.001,total);
  for(const row of weighted){n-=row.weight;if(n<=0){actionSeen.add(String(row.scene.id));return row.scene}}
  const fallback=weighted.at(-1)?.scene||fresh[0];if(fallback)actionSeen.add(String(fallback.id));return fallback||null;
}
function startScene(scene){if(!scene)return false;closeAsk();synthetic({'data-scene':scene.id});return true}

function questionRows(){
  const s=state(),m=meta(),cid=String(s.active||'');
  return (s.dialogues||[]).filter(sc=>sc?.characterId===cid&&role(sc,s,m)==='ASK').sort((a,b)=>Number(a.requiredAffection||0)-Number(b.requiredAffection||0)||String(a.title||'').localeCompare(String(b.title||''),'ko'));
}
function askPanelHtml(){
  const rows=questionRows();
  return `<section class="hv-ask-panel" data-hv-ask-panel><header><div><small>ASK</small><h2>무엇을 물어볼까?</h2><p>질문은 호감도와 관계없이 모두 볼 수 있고 선택할 수 있습니다.</p></div><button type="button" data-hv-ask-close aria-label="닫기">×</button></header><div class="hv-ask-list">${rows.length?rows.map((sc,i)=>`<button type="button" data-hv-ask-scene="${esc(sc.id)}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${esc(sc.title||'질문')}</strong>${Number(sc.requiredAffection||0)>0?`<small>권장 ♥ ${Number(sc.requiredAffection||0)} · 선택 가능</small>`:'<small>언제든 질문 가능</small>'}</span></button>`).join(''):'<p class="empty-state">등록된 질문이 없습니다.</p>'}</div></section>`;
}
function openAsk(){
  const box=$('.character-room .dialogue-box');if(!box){toast('대화가 시작된 뒤 질문할 수 있어요.');return}
  closeAsk();box.classList.add('hv-ask-open');box.insertAdjacentHTML('beforeend',askPanelHtml());
}
function closeAsk(){for(const panel of $$('[data-hv-ask-panel]'))panel.remove();for(const box of $$('.dialogue-box.hv-ask-open'))box.classList.remove('hv-ask-open')}

function makeBar(){
  const bar=document.createElement('div');bar.className='hv-room-action-bar';bar.dataset.hvRoomActionBar='1';
  bar.innerHTML='<button type="button" data-hv-room-command="ASK">ASK</button><button type="button" data-hv-room-command="ACTION">ACTION</button><button type="button" data-hv-room-command="INVENTORY">INVENTORY</button><button type="button" data-hv-room-command="LEAVE">LEAVE ROOM</button>';
  return bar;
}
function cleanLegacyUtility(box){
  for(const utility of $$('.dialogue-utility',box)){
    $$('[data-vn-ask],[data-hv-action],[data-inventory-open],[data-vn-leave],[data-runtime-leave],[data-vn-gift]',utility).forEach(button=>button.remove());
  }
}
function ensureBar(){
  const box=$('.character-room .dialogue-box');
  if(!box||document.body.classList.contains('hv-room-exiting')){for(const bar of $$('[data-hv-room-action-bar]'))bar.remove();return}
  cleanLegacyUtility(box);
  let bar=$('[data-hv-room-action-bar]',box);
  if(!bar){bar=makeBar();box.prepend(bar)}
}

function startDirectConversation(){
  if(!directPending)return;
  if($('.character-room .dialogue-box')){directPending=false;directCid='';clearTimeout(directTimer);document.body.classList.remove('hv-direct-dialogue-entry');return}
  const room=$('.character-room');if(!room)return;
  const talk=$('[data-action="TALK"]',room);
  if(!talk)return;
  bridge=true;try{talk.click()}finally{bridge=false}
  directTimer=setTimeout(()=>{if($('.character-room .dialogue-box')){directPending=false;directCid='';document.body.classList.remove('hv-direct-dialogue-entry')}},180);
}
function labelNavigation(){
  for(const b of $$('.character-file [data-room]'))b.textContent='대화하기';
  for(const b of $$('.home-lobby [data-room]'))b.textContent='PROFILE';
}
function run(){labelNavigation();ensureBar();if(directPending)startDirectConversation()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

window.addEventListener('click',event=>{
  if(bridge)return;
  const target=event.target instanceof Element?event.target:null;if(!target)return;

  const homeEnter=target.closest('.home-lobby [data-room]');
  if(homeEnter){
    event.preventDefault();event.stopImmediatePropagation();synthetic({'data-profile':homeEnter.dataset.room||''});return;
  }
  const profileEnter=target.closest('.character-file [data-room]');
  if(profileEnter){
    directPending=true;directCid=String(profileEnter.dataset.room||'');document.body.classList.add('hv-direct-dialogue-entry');setTimeout(schedule,0);setTimeout(schedule,80);setTimeout(schedule,180);return;
  }

  const command=target.closest('[data-hv-room-command]')?.dataset.hvRoomCommand;
  if(command){
    event.preventDefault();event.stopImmediatePropagation();
    if(command==='ASK'){openAsk();return}
    if(command==='ACTION'){
      closeAsk();const scene=pickAction();if(!scene){toast('지금 할 수 있는 ACTION이 없습니다.');return}startScene(scene);return;
    }
    if(command==='INVENTORY'){closeAsk();synthetic({'data-inventory-open':''});return}
    if(command==='LEAVE'){closeAsk();synthetic({'data-vn-leave':''});return}
  }
  const askScene=target.closest('[data-hv-ask-scene]');
  if(askScene){
    event.preventDefault();event.stopImmediatePropagation();const id=String(askScene.dataset.hvAskScene||''),scene=questionRows().find(sc=>String(sc.id)===id);if(scene)startScene(scene);return;
  }
  if(target.closest('[data-hv-ask-close]')){event.preventDefault();event.stopImmediatePropagation();closeAsk();return}
  if(target.closest('[data-page="characters"],[data-back],[data-vn-leave],[data-runtime-leave]')){closeAsk();directPending=false;document.body.classList.remove('hv-direct-dialogue-entry')}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:runtime-ready',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
