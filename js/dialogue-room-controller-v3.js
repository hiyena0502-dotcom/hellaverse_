(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_ROOM_CONTROLLER_V8__)return;
window.__HELLAVERSE_DIALOGUE_ROOM_CONTROLLER_V8__=1;

const K='hellaverse_dialogue_state_v1',META='hellaverse_dialogue_render_meta_v1';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const up=v=>String(v||'').trim().toUpperCase();
let queued=false,bridge=false,direct=null,bootResumePending=false,bootResumeAttempted=false;

function read(key=K,f={}){try{return JSON.parse(localStorage.getItem(key)||'')||f}catch{return f}}
function state(){return read(K,{})}
function meta(){return read(META,{})}
function role(sc,s,m){
  const explicit=up(s.dialogueFileMap?.[sc?.id]);if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const r=up(m?.[sc?.id]?.sceneRole||sc?.sceneRole||'');if(r)return r==='QUESTION'?'ASK':r;
  const k=up(sc?.kind||'TALK');return k==='ASK'?'ASK':k==='TALK'?'CONVERSATION':k;
}
function synthetic(attrs){
  const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.hvRoomBridge='5';
  for(const [name,value] of Object.entries(attrs))b.setAttribute(name,String(value??''));host.appendChild(b);bridge=true;try{b.click()}finally{bridge=false;if(b.isConnected)b.remove()}
}
function toast(text){let root=$('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}root.innerHTML=`<div class="toast">${esc(text)}</div>`;setTimeout(()=>{if(root)root.innerHTML=''},1700)}

function conceptualQuestions(){
  const s=state(),m=meta(),cid=String(s.active||''),heart=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0)));
  const rows=(s.dialogues||[]).filter(sc=>sc?.characterId===cid&&role(sc,s,m)==='ASK');
  const groups=new Map();for(const sc of rows){const key=String(sc.title||'질문').trim();if(!groups.has(key))groups.set(key,[]);groups.get(key).push(sc)}
  const distance=sc=>{const min=Number(sc.requiredAffection||0),max=Number(sc.maxAffection==null?100:sc.maxAffection);return heart<min?min-heart:heart>max?heart-max:0};
  return [...groups.entries()].map(([title,list])=>{
    const selected=list.slice().sort((a,b)=>distance(a)-distance(b)||Number(b.requiredAffection||0)-Number(a.requiredAffection||0))[0];
    const recommended=Math.min(...list.map(x=>Number(x.requiredAffection||0)));
    return{title,scene:selected,recommended:Number.isFinite(recommended)?recommended:0};
  }).sort((a,b)=>a.recommended-b.recommended||a.title.localeCompare(b.title,'ko'));
}
function askHtml(){const rows=conceptualQuestions();return `<section class="hv-ask-panel" data-hv-ask-panel><header><div><small>ASK</small><h2>무엇을 물어볼까?</h2><p>모든 질문을 볼 수 있고 선택할 수 있습니다. Heart는 권장치일 뿐 잠금이 아닙니다.</p></div><button type="button" data-hv-ask-close aria-label="닫기">×</button></header><div class="hv-ask-list">${rows.length?rows.map((r,i)=>`<button type="button" data-hv-ask-scene="${esc(r.scene.id)}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${esc(r.title)}</strong><small>${r.recommended>0?`권장 ♥ ${r.recommended} · 선택 가능`:'언제든 질문 가능'}</small></span></button>`).join(''):'<p class="empty-state">등록된 질문이 없습니다.</p>'}</div></section>`}
function closeAsk(){$$('[data-hv-ask-panel]').forEach(x=>x.remove());$$('.dialogue-box.hv-ask-open').forEach(x=>x.classList.remove('hv-ask-open'))}
function openAsk(){const box=$('.character-room .dialogue-box');if(!box){toast('대화가 시작된 뒤 질문할 수 있어요.');return}closeAsk();$$('[data-hv-action-panel]').forEach(x=>x.remove());box.classList.add('hv-ask-open');box.insertAdjacentHTML('beforeend',askHtml())}

function makeBar(){const bar=document.createElement('div');bar.className='hv-room-action-bar';bar.dataset.hvRoomActionBar='8';bar.innerHTML='<button type="button" data-hv-room-command="ASK">ASK</button><button type="button" data-hv-room-command="ACTION">ACTION</button><button type="button" data-hv-room-command="INVENTORY">INVENTORY</button><button type="button" data-hv-room-command="LEAVE">LEAVE ROOM</button>';return bar}
function cleanLegacy(box){for(const utility of $$('.dialogue-utility',box))$$('[data-vn-ask],[data-hv-action],[data-inventory-open],[data-vn-leave],[data-runtime-leave],[data-vn-gift]',utility).forEach(b=>b.remove())}
function ensureBar(){
  const room=$('.character-room'),box=$('.character-room .dialogue-box'),stage=box?.closest('.dialogue-stage');
  if(!room||document.body.classList.contains('hv-room-exiting')){document.querySelectorAll('[data-hv-room-action-bar]').forEach(x=>x.remove());return}
  if(box)cleanLegacy(box);
  const host=stage||room;
  let bar=$('[data-hv-room-action-bar]',room);
  if(!bar){bar=makeBar();box&&stage?stage.insertBefore(bar,box):host.appendChild(bar)}
  else if(bar.parentElement!==host){box&&stage?stage.insertBefore(bar,box):host.appendChild(bar)}
  bar.classList.toggle('is-idle',!box);
  if(stage&&box){const h=Math.max(0,Math.ceil(box.getBoundingClientRect().height));stage.style.setProperty('--hv-dialogue-box-height',`${h}px`)}
}
function labelNavigation(){for(const b of $$('.character-file [data-room]'))b.textContent='ENTER ROOM';for(const b of $$('.home-lobby [data-room]'))b.textContent='PROFILE'}

function beginDirect(cid){direct={cid:String(cid||''),started:false,attempts:0,deadline:performance.now()+3000};document.body.classList.add('hv-direct-dialogue-entry')}
function clearDirect(){direct=null;document.body.classList.remove('hv-direct-dialogue-entry')}
function directStart(){
  if(!direct)return;
  if($('.character-room .dialogue-box')){clearDirect();return}
  if(performance.now()>direct.deadline){clearDirect();toast('대화를 시작하지 못했습니다. ENTER ROOM을 다시 눌러주세요.');return}
  if(!$('.character-room')){setTimeout(schedule,70);return}
  if(!direct.started){
    const fn=window.__HV_START_CONVERSATION__;
    if(typeof fn==='function'){
      direct.attempts++;
      const ok=!!fn({fresh:direct.attempts===1});
      if(ok)direct.started=true;
    }
  }
  setTimeout(schedule,direct.started?90:70);
}
function resumeAfterReload(){
  if(!bootResumePending||bootResumeAttempted||direct)return;
  if(document.body.classList.contains('hv-room-exiting')||document.body.classList.contains('hv-dialogue-chain-transition'))return;
  if($('.character-room .dialogue-box')){bootResumePending=false;return}
  const placeholder=$('.character-room [data-hv-room-direct-placeholder]');
  if(!placeholder)return;
  const s=state();if(String(s.page||'')!=='life'){bootResumePending=false;return}
  const fn=window.__HV_START_CONVERSATION__;if(typeof fn!=='function')return;
  bootResumeAttempted=true;
  const ok=!!fn({fresh:true});
  bootResumePending=false;
  if(!ok)toast('현재 시작할 수 있는 대화가 없습니다.');
}
function run(){labelNavigation();ensureBar();directStart();resumeAfterReload()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

window.addEventListener('click',e=>{
  if(bridge)return;const t=e.target instanceof Element?e.target:null;if(!t)return;
  const home=t.closest('.home-lobby [data-room]');if(home){e.preventDefault();e.stopImmediatePropagation();synthetic({'data-profile':home.dataset.room||''});return}
  const profile=t.closest('.character-file [data-room]');if(profile){e.preventDefault();e.stopImmediatePropagation();const cid=String(profile.dataset.room||'');beginDirect(cid);synthetic({'data-room':cid});queueMicrotask(schedule);setTimeout(schedule,30);setTimeout(schedule,100);return}
  const command=t.closest('[data-hv-room-command]')?.dataset.hvRoomCommand;
  if(command==='ASK'){e.preventDefault();e.stopImmediatePropagation();if(!$('.character-room .dialogue-box'))synthetic({'data-action':'ASK'});queueMicrotask(openAsk);setTimeout(openAsk,20);return}
  if(command==='INVENTORY'){e.preventDefault();e.stopImmediatePropagation();closeAsk();if(!window.__HELLAVERSE_ITEM_SYSTEM_V2__){toast('INVENTORY를 불러오는 중입니다. 잠시 후 다시 눌러주세요.');return}synthetic({'data-inventory-open':''});return}
  if(command==='LEAVE'){e.preventDefault();e.stopImmediatePropagation();closeAsk();synthetic({'data-vn-leave':''});return}
  if(t.closest('[data-hv-ask-close]')){e.preventDefault();e.stopImmediatePropagation();closeAsk();return}
  if(t.closest('[data-page="characters"],[data-back],[data-vn-leave],[data-runtime-leave]')){closeAsk();clearDirect()}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('hellaverse:state-updated',schedule);window.addEventListener('hellaverse:runtime-ready',schedule);
bootResumePending=String(state().page||'')==='life';
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();