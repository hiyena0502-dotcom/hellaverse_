(()=>{
if(window.__HELLAVERSE_DIALOGUE_MOOD_V1__)return;
window.__HELLAVERSE_DIALOGUE_MOOD_V1__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const LABELS={
  NORMAL:['NORMAL','평온'],
  GOOD:['GOOD','기분 좋음'],
  TIRED:['TIRED','지침'],
  ANNOYED:['ANNOYED','언짢음'],
  SAD:['SAD','가라앉음'],
  EXCITED:['EXCITED','들뜸']
};
const lastMood=new Map();
let queued=false;

function readState(){
  try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}
  catch{return{}}
}
function esc(v=''){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function moodFor(state,cid){
  const raw=String(state?.moods?.[cid]||state?.mood?.[cid]||'NORMAL').trim().toUpperCase();
  return LABELS[raw]?raw:'NORMAL';
}
function characterFor(state,cid){
  return (state.characters||[]).find(c=>c.id===cid)||null;
}
function currentCharacterId(state,box){
  const room=box?.closest?.('.character-room');
  const active=String(state.active||'').trim();
  if(active)return active;
  const name=String(room?.querySelector('.room-caption h1,.speaker')?.textContent||'').trim().toLowerCase();
  const found=(state.characters||[]).find(c=>String(c.name||'').trim().toLowerCase()===name);
  return found?.id||'';
}
function markup(cid,mood,state){
  const [en,ko]=LABELS[mood]||LABELS.NORMAL;
  const c=characterFor(state,cid);
  const who=c?.name?`${c.name} · `:'';
  return `<span class="mood-dot" aria-hidden="true"></span><span class="mood-label">${esc(who)}MOOD</span><strong class="mood-value">${esc(en)}</strong><span class="mood-ko">${esc(ko)}</span>`;
}
function syncBox(box,state){
  if(!(box instanceof Element))return;
  const cid=currentCharacterId(state,box);
  if(!cid)return;
  const mood=moodFor(state,cid);
  let badge=box.querySelector(':scope > .dialogue-mood-indicator');
  if(!badge){
    badge=document.createElement('div');
    badge.className='dialogue-mood-indicator';
    badge.setAttribute('role','status');
    badge.setAttribute('aria-live','polite');
    box.prepend(badge);
  }
  const prev=lastMood.get(cid);
  const changed=!!prev&&prev!==mood;
  if(badge.dataset.mood!==mood){
    badge.dataset.mood=mood;
    badge.innerHTML=markup(cid,mood,state);
  }
  if(changed){
    badge.classList.remove('is-changing');
    void badge.offsetWidth;
    badge.classList.add('is-changing');
    setTimeout(()=>badge.classList.remove('is-changing'),520);
  }
  lastMood.set(cid,mood);
}
function sync(){
  queued=false;
  const state=readState();
  document.querySelectorAll('.character-room .dialogue-box').forEach(box=>syncBox(box,state));
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(sync);
}
function observe(){
  const app=document.getElementById('app');
  if(!app||app.dataset.dialogueMoodObserved==='1')return;
  app.dataset.dialogueMoodObserved='1';
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});
}

document.addEventListener('click',e=>{
  if(e.target instanceof Element&&e.target.closest('[data-choice],[data-gc],[data-scene],[data-action]')){
    setTimeout(schedule,0);
    setTimeout(schedule,40);
  }
},true);
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('storage',e=>{if(!e.key||e.key===STATE_KEY)schedule()});
document.addEventListener('DOMContentLoaded',()=>{observe();schedule()});
window.addEventListener('load',()=>{observe();schedule()});
setTimeout(()=>{observe();schedule()},120);
})();
