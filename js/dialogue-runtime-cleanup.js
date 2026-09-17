(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_RUNTIME_CLEANUP_V8__)return;
window.__HELLAVERSE_DIALOGUE_RUNTIME_CLEANUP_V8__=1;

const K='hellaverse_dialogue_state_v1';
const META_KEY='hellaverse_dialogue_render_meta_v1';
const RKEY='hellaverse_dialogue_runtime_file_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const up=v=>String(v||'').trim().toUpperCase();
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let queued=false,pendingMode='',leaving=false,leaveSceneStarted=false,navigationBridge=false;

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{}}catch{return{}}}
function choices(sc){return (sc?.nodes||[]).flatMap(n=>Array.isArray(n?.choices)?n.choices:[])}
function fileOf(sc,s){
 const explicit=up(s?.dialogueFileMap?.[sc?.id]);
 if(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME'].includes(explicit))return explicit;
 const kind=up(sc?.kind||'TALK');
 if(kind==='ASK')return'QUESTION';
 if(['ENTRY','EXIT','IDLE','HOME'].includes(kind))return kind;
 if(kind==='TALK'){
  const all=choices(sc);return all.length&&all.filter(c=>c?.type==='action').length>all.length/2?'ACTION':'CONVERSATION';
 }
 return'CONVERSATION';
}
function syncDialogueRoles(){
 const state=read(),meta=readMeta();let changed=false;
 for(const sc of state.dialogues||[]){
  if(!sc?.id)continue;
  const file=fileOf(sc,state),wanted=file==='ACTION'?'ACTION':file==='QUESTION'?'ASK':file==='CONVERSATION'?'CONVERSATION':'';
  if(!wanted)continue;
  const row=meta[sc.id]&&typeof meta[sc.id]==='object'?meta[sc.id]:{};
  if(up(row.sceneRole)!==wanted){meta[sc.id]={...row,sceneRole:wanted};changed=true}
 }
 if(changed)try{localStorage.setItem(META_KEY,JSON.stringify(meta))}catch{}
}
function modeFromButton(btn){
 const explicit=up(btn?.dataset?.dialogueFileRuntime);if(explicit)return explicit;
 const label=up(btn?.querySelector('span')?.textContent||btn?.textContent||'');
 if(label.includes('QUESTION')||label==='ASK')return'QUESTION';
 if(label.includes('ACTION'))return'ACTION';
 if(label.includes('CONVERSATION')||label==='TALK')return'CONVERSATION';
 return'';
}
function unwrapMore(){
 for(const d of $$('.room-more')){
  const links=$('.room-links',d);if(links)d.replaceWith(links);else d.remove();
 }
 for(const d of $$('.dialogue-more')){
  const parent=d.parentElement,box=$('.dialogue-more-menu',d);if(parent&&box){for(const b of Array.from(box.children))parent.insertBefore(b,d)}d.remove();
 }
}
function roomUtility(){
 return '<div class="dialogue-utility hv-stable-dialogue-utility" style="display:flex;gap:14px;align-items:center;justify-content:flex-end;flex-wrap:wrap" data-stable-utility="LOG|ASK|ACTION|INVENTORY|LEAVE ROOM"><button type="button" data-vn-log>LOG</button><button type="button" data-action="ASK" data-dialogue-file-runtime="QUESTION">ASK</button><button type="button" data-action="TALK" data-dialogue-file-runtime="ACTION">ACTION</button><button type="button" data-inventory-open>INVENTORY</button><button type="button" data-vn-leave>LEAVE ROOM</button></div>';
}
function ensureRoomUtility(box){
 if(!box)return;
 const current=$('.dialogue-utility',box);
 if(!current){box.insertAdjacentHTML('afterbegin',roomUtility());return}
 const expected='LOG|ASK|ACTION|INVENTORY|LEAVE ROOM';
 if(current.dataset.stableUtility!==expected){const wrap=document.createElement('div');wrap.innerHTML=roomUtility();current.replaceWith(wrap.firstElementChild)}
}
function ensureRuntimeReturn(box){
 if(!box)return null;
 let b=$('[data-runtime-return]',box)||$('.dialogue-return',box);
 if(!b){b=document.createElement('button');b.className='dialogue-return';b.textContent='RETURN';box.appendChild(b)}
 b.type='button';b.dataset.runtimeReturn='1';b.removeAttribute('data-end');b.hidden=false;b.style.removeProperty('display');
 return b;
}
function emptyState(box,mode,message){
 ensureRoomUtility(box);
 const utility=$('.dialogue-utility',box)?.outerHTML||roomUtility();
 box.innerHTML=`${utility}<p class="speaker">${mode}</p><p class="dialogue-current">${message}</p><button type="button" class="dialogue-return" data-runtime-return>RETURN</button>`;
 box.dataset.hvSpecialMenu=mode;
 pendingMode='';sessionStorage.removeItem(RKEY);
}
function sceneButtonsFor(box,mode){
 const state=read(),byId=new Map((state.dialogues||[]).map(sc=>[String(sc.id),sc]));
 return $$('[data-scene]',box).filter(b=>{
  const sc=byId.get(String(b.dataset.scene||''));
  return sc&&fileOf(sc,state)===mode;
 });
}
function showQuestionPicker(box){
 ensureRoomUtility(box);
 const all=$$('[data-scene]',box),questions=sceneButtonsFor(box,'QUESTION');
 if(!all.length){emptyState(box,'QUESTION','지금 물어볼 수 있는 질문이 없습니다.');return true}
 for(const b of all){const visible=questions.includes(b);b.hidden=!visible;if(visible)b.style.removeProperty('display')}
 box.dataset.hvQuestionPicker='1';box.dataset.hvSpecialMenu='QUESTION';
 const speaker=$('.speaker',box),list=$('.choice-list',box);
 if(speaker){speaker.hidden=false;speaker.style.removeProperty('display')}
 if(list){list.hidden=false;list.style.removeProperty('display')}
 ensureRuntimeReturn(box);
 pendingMode='';sessionStorage.removeItem(RKEY);
 if(!questions.length)emptyState(box,'QUESTION','지금 물어볼 수 있는 질문이 없습니다.');
 return true;
}
function chooseCandidate(box,mode){
 const state=read(),cid=String(state.active||''),byId=new Map((state.dialogues||[]).map(sc=>[String(sc.id),sc]));
 let buttons=$$('[data-scene]',box).filter(b=>!b.disabled&&!b.classList.contains('locked')&&!b.hidden);
 buttons=buttons.filter(b=>{const sc=byId.get(String(b.dataset.scene||''));return sc&&fileOf(sc,state)===mode});
 if(!buttons.length)return null;
 const recent=new Set(state.visits?.[cid]?.recentSceneIds||[]);
 const unseen=buttons.filter(b=>{const sc=byId.get(String(b.dataset.scene||''));return sc&&!sc.used&&!recent.has(sc.id)});
 const nonRecent=buttons.filter(b=>!recent.has(String(b.dataset.scene||'')));
 const pool=unseen.length?unseen:nonRecent.length?nonRecent:buttons;
 return pool[Math.floor(Math.random()*pool.length)]||pool[0]||null;
}
function autoStart(){
 const box=$('.character-room .dialogue-box');if(!box)return;
 ensureRoomUtility(box);
 const mode=pendingMode||up(sessionStorage.getItem(RKEY)||'');
 if(!['CONVERSATION','QUESTION','ACTION'].includes(mode))return;
 const sceneButtons=$$('[data-scene]',box);
 if(mode==='QUESTION'){showQuestionPicker(box);return}
 if(!sceneButtons.length){emptyState(box,mode,'지금 시작할 수 있는 에피소드가 없습니다.');return}
 const target=chooseCandidate(box,mode);
 if(target){
  pendingMode='';sessionStorage.removeItem(RKEY);
  requestAnimationFrame(()=>{if(target.isConnected)target.click()});
 }else emptyState(box,mode,'지금 시작할 수 있는 에피소드가 없습니다.');
}

function stripEpisodeMarkers(value){
 return String(value||'').replace(/\[\[(?:CHARACTER|NARRATION)\]\]\s*/g,'').replace(/\s+/g,' ').trim();
}
function pickExitScene(){
 const state=read(),cid=String(state.active||'');
 return (state.dialogues||[]).find(sc=>String(sc?.characterId||'')===cid&&fileOf(sc,state)==='EXIT'&&!(sc.repeatable===false&&sc.used))||null;
}
function fallbackFarewellText(){
 const state=read(),cid=String(state.active||''),character=(state.characters||[]).find(c=>String(c?.id||'')===cid);
 const line=(state.dialogues||[]).filter(sc=>String(sc?.characterId||'')===cid).map(sc=>stripEpisodeMarkers(sc?.exitLine||'')).find(Boolean);
 return line||`당신은 ${character?.name||'상대'}에게 작별 인사를 건네고 방을 나선다.`;
}
function showFarewellFallback(){
 $('#hvLeaveFallback')?.remove();
 const state=read(),cid=String(state.active||''),character=(state.characters||[]).find(c=>String(c?.id||'')===cid);
 const root=document.createElement('div');root.id='hvLeaveFallback';
 root.style.cssText='position:fixed;inset:0;z-index:2400000;display:grid;place-items:end center;padding:28px;background:linear-gradient(180deg,rgba(5,4,5,.1),rgba(5,4,5,.78));pointer-events:auto';
 root.innerHTML=`<section style="width:min(980px,94vw);padding:22px 26px;border:1px solid rgba(201,166,107,.28);background:rgba(12,9,11,.97);box-shadow:0 24px 80px rgba(0,0,0,.5)"><small style="display:block;margin-bottom:8px;color:var(--gold);letter-spacing:.16em">LEAVING · ${esc(character?.name||'CHARACTER')}</small><p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.05rem,2vw,1.35rem);line-height:1.65">${esc(fallbackFarewellText())}</p><button type="button" data-hv-leave-finish style="float:right;border:0;background:transparent;color:var(--gold);letter-spacing:.14em;padding:8px 0">CHARACTERS ›</button></section>`;
 document.body.appendChild(root);
}
function syntheticScene(sceneId){
 const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.scene=sceneId;host.appendChild(b);
 try{b.click()}finally{b.remove()}
}
function navigateCharacters(){
 leaving=false;leaveSceneStarted=false;$('#hvLeaveFallback')?.remove();sessionStorage.removeItem(RKEY);pendingMode='';
 const host=$('#app')||document.body,b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.page='characters';host.appendChild(b);navigationBridge=true;
 try{b.click()}finally{navigationBridge=false;b.remove()}
}
function finishFallbackLeave(){
 const leave=$('[data-vn-leave]');
 if(leave){navigationBridge=true;try{leave.click()}finally{navigationBridge=false}}
 setTimeout(navigateCharacters,180);
}
function beginLeaveFlow(){
 if(leaving)return;
 leaving=true;leaveSceneStarted=false;pendingMode='';sessionStorage.removeItem(RKEY);$('#hvLeaveFallback')?.remove();
 const exit=pickExitScene();
 if(exit){leaveSceneStarted=true;syntheticScene(String(exit.id));setTimeout(schedule,0);return}
 showFarewellFallback();
}
function monitorLeave(box){
 if(!leaving||!leaveSceneStarted)return;
 if(box)return;
 navigateCharacters();
}

function run(){
 unwrapMore();syncDialogueRoles();
 const box=$('.character-room .dialogue-box');
 if(box)ensureRoomUtility(box);
 autoStart();
 monitorLeave(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

window.addEventListener('click',e=>{
 if(navigationBridge)return;
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 if(t.closest('[data-vn-leave]')||t.closest('.room-hud [data-page="characters"]')){
  if(!$('.character-room'))return;
  e.preventDefault();e.stopImmediatePropagation();beginLeaveFlow();return;
 }
 if(t.closest('[data-hv-leave-finish]')){
  e.preventDefault();e.stopImmediatePropagation();finishFallbackLeave();return;
 }
},true);

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const btn=t.closest('[data-dialogue-file-runtime],[data-action]');
 if(btn){
  const mode=modeFromButton(btn);
  if(['CONVERSATION','QUESTION','ACTION'].includes(mode)){
   pendingMode=mode;
   sessionStorage.setItem(RKEY,mode);
   const box=$('.character-room .dialogue-box');
   if(box){box.removeAttribute('data-hv-episode-auto');box.removeAttribute('data-hv-question-picker');box.removeAttribute('data-hv-special-menu')}
  }
 }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();