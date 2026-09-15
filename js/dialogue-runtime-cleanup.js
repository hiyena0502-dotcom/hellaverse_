(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_RUNTIME_CLEANUP_V2__)return;
window.__HELLAVERSE_DIALOGUE_RUNTIME_CLEANUP_V2__=1;

const K='hellaverse_dialogue_state_v1';
const RKEY='hellaverse_dialogue_runtime_file_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const up=v=>String(v||'').trim().toUpperCase();
let queued=false,pendingMode='';

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
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
function sceneButtonsFor(box,mode){
 const state=read(),byId=new Map((state.dialogues||[]).map(sc=>[String(sc.id),sc]));
 return $$('[data-scene]',box).filter(b=>{
  const sc=byId.get(String(b.dataset.scene||''));
  return sc&&fileOf(sc,state)===mode;
 });
}
function showQuestionPicker(box){
 const all=$$('[data-scene]',box),questions=sceneButtonsFor(box,'QUESTION');
 if(!all.length)return false;
 for(const b of all)b.hidden=!questions.includes(b);
 box.dataset.hvQuestionPicker='1';
 box.removeAttribute('data-hv-episode-auto');
 pendingMode='';
 sessionStorage.removeItem(RKEY);
 if(!questions.length){
  box.innerHTML='<p class="speaker">QUESTION</p><p class="dialogue-current">지금 물어볼 수 있는 질문이 없습니다.</p><button class="dialogue-return" data-end>RETURN</button>';
 }
 return true;
}
function chooseCandidate(box,mode){
 const state=read(),cid=String(state.active||''),byId=new Map((state.dialogues||[]).map(sc=>[String(sc.id),sc]));
 let buttons=$$('[data-scene]',box).filter(b=>!b.disabled&&!b.classList.contains('locked'));
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
 const sceneButtons=$$('[data-scene]',box);if(!sceneButtons.length)return;
 const mode=pendingMode||up(sessionStorage.getItem(RKEY)||'');
 if(!['CONVERSATION','QUESTION','ACTION'].includes(mode))return;

 // QUESTION is intentionally manual: show the available questions and let the player choose.
 if(mode==='QUESTION'){
  showQuestionPicker(box);
  return;
 }

 if(box.dataset.hvEpisodeAuto==='1')return;
 const target=chooseCandidate(box,mode);
 box.dataset.hvEpisodeAuto='1';
 if(target){
  pendingMode='';
  sessionStorage.removeItem(RKEY);
  requestAnimationFrame(()=>{if(target.isConnected)target.click()});
 }else{
  box.innerHTML=`<p class="speaker">${mode}</p><p class="dialogue-current">지금 시작할 수 있는 에피소드가 없습니다.</p><button class="dialogue-return" data-end>RETURN</button>`;
  pendingMode='';
  sessionStorage.removeItem(RKEY);
 }
}
function run(){unwrapMore();autoStart()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const btn=t.closest('[data-dialogue-file-runtime],[data-action]');
 if(btn){
  const mode=modeFromButton(btn);
  if(['CONVERSATION','QUESTION','ACTION'].includes(mode)){
   pendingMode=mode;
   sessionStorage.setItem(RKEY,mode);
  }
 }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();
