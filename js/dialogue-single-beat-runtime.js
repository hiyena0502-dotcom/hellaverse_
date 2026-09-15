(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V2__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V2__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;

function isMessage(el){
 return el instanceof Element && (el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
}
function messageRows(text){return Array.from(text?.children||[]).filter(isMessage)}
function hide(el){if(el)el.hidden=true}
function show(el){if(el)el.hidden=false}

function controlsFor(page){
 return Array.from(page.children).filter(el=>{
  if(!(el instanceof Element))return false;
  return el.matches('.choice-list,.dialogue-next,.dialogue-return,.conversation-status,.affection-flash.inline-feedback');
 });
}
function restoreControls(page){for(const el of controlsFor(page))if(!el.matches('[data-single-beat-next]'))show(el)}
function hideControls(page){for(const el of controlsFor(page))if(!el.matches('[data-single-beat-next]'))hide(el)}

function currentBeats(page){
 const text=$('.dialogue-page-text',page);if(!text)return[];
 for(const you of $$('.dialogue-line.you',text))hide(you);
 return messageRows(text).filter(el=>!el.matches('.dialogue-line.you'));
}
function setBeat(page,index){
 const beats=currentBeats(page);if(!beats.length){restoreControls(page);return}
 const safe=Math.max(0,Math.min(index,beats.length-1));
 beats.forEach((el,i)=>{el.dataset.singleBeatCurrent=i===safe?'1':'0';el.hidden=i!==safe});
 page.dataset.singleBeatIndex=String(safe);
 const next=$('[data-single-beat-next]',page);
 if(safe<beats.length-1){
  hideControls(page);
  if(next)show(next);
 }else{
  if(next)hide(next);
  restoreControls(page);
 }
}

function ensureButton(page){
 let btn=$('[data-single-beat-next]',page);if(btn)return btn;
 btn=document.createElement('button');
 btn.type='button';
 btn.className='dialogue-next single-beat-next';
 btn.dataset.singleBeatNext='1';
 btn.innerHTML='NEXT <span>›</span>';
 page.appendChild(btn);
 return btn;
}
function install(page){
 const beats=currentBeats(page);
 if(beats.length<=1)return; // marker splitting may happen a moment later; do not mark complete yet.
 ensureButton(page);
 if(page.dataset.singleBeat!=='ready'){
  page.dataset.singleBeat='ready';
  setBeat(page,0);
  return;
 }
 const index=Number(page.dataset.singleBeatIndex||0);
 setBeat(page,index);
}

function enhanceLegacyBox(box){
 const lines=$('.dialogue-lines',box);if(!lines)return;
 for(const you of $$('.dialogue-line.you',lines))hide(you);
}
function run(){
 for(const page of $$('.dialogue-page[data-vn-page]'))install(page);
 for(const box of $$('.dialogue-box'))enhanceLegacyBox(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;run()}))}

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const btn=t.closest('[data-single-beat-next]');if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();
 const page=btn.closest('.dialogue-page');if(!page)return;
 setBeat(page,Number(page.dataset.singleBeatIndex||0)+1);
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();
