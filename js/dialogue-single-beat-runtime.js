(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V3__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V3__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;

const isPlayer=el=>el instanceof Element&&(el.matches('.dialogue-line.you')||String($('strong',el)?.textContent||'').trim().toUpperCase()==='YOU');
const isBeat=el=>el instanceof Element&&(el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
const hide=el=>{if(el){el.hidden=true;el.style.display='none'}};
const show=el=>{if(el){el.hidden=false;el.style.removeProperty('display')}};

function choiceList(host){return $('.choice-list',host)}
function hasChoices(host){const list=choiceList(host);return !!(list&&$$('button:not(:disabled)',list).length)}
function coreNext(host){return $$('[data-vn-next],[data-vn-finish],.dialogue-next',host).filter(b=>!b.matches('[data-single-beat-next]'))}
function endingControls(host){return $$('[data-end],.dialogue-return,.conversation-status,.affection-flash.inline-feedback',host)}
function hideAfterBeat(host){const list=choiceList(host);if(list)hide(list);coreNext(host).forEach(hide);endingControls(host).forEach(hide)}
function revealAfterBeat(host){const list=choiceList(host);if(hasChoices(host)){
  if(list)show(list);
  coreNext(host).forEach(hide);
  endingControls(host).forEach(el=>{if(el.matches('[data-end],.dialogue-return'))hide(el);else show(el)});
  return;
 }
 if(list)show(list);
 coreNext(host).forEach(show);
 endingControls(host).forEach(show);
}
function ensureLocalNext(host){
 let b=$('[data-single-beat-next]',host);if(b)return b;
 b=document.createElement('button');b.type='button';b.className='dialogue-next single-beat-next';b.dataset.singleBeatNext='1';b.innerHTML='NEXT <span>›</span>';
 host.appendChild(b);return b;
}
function signature(beats){return beats.map(el=>`${el.tagName}:${el.className}:${el.textContent}`).join('|')}
function paginate(host,text){
 if(!host||!text)return;
 const all=Array.from(text.children).filter(isBeat);
 for(const row of all)if(isPlayer(row))hide(row);
 const beats=all.filter(row=>!isPlayer(row));
 const sig=signature(beats);
 if(host.dataset.singleBeatSig!==sig){host.dataset.singleBeatSig=sig;host.dataset.singleBeatIndex='0'}
 if(!beats.length){revealAfterBeat(host);return}
 let index=Math.max(0,Math.min(Number(host.dataset.singleBeatIndex||0),beats.length-1));
 host.dataset.singleBeatIndex=String(index);
 beats.forEach((row,i)=>i===index?show(row):hide(row));
 const local=ensureLocalNext(host);
 if(index<beats.length-1){
   hideAfterBeat(host);show(local);
 }else{
   hide(local);revealAfterBeat(host);
 }
 // A choice screen is an action screen, not a reading screen: never show NEXT beside choices.
 if(hasChoices(host)){hide(local);coreNext(host).forEach(hide)}
}
function enhanceNew(page){const text=$('.dialogue-page-text',page);if(text)paginate(page,text)}
function enhanceLegacy(box){
 const lines=$('.dialogue-lines',box);if(!lines)return;
 paginate(box,lines);
}
function stripPlayerEcho(){
 for(const you of $$('.dialogue-line.you'))hide(you);
 // Some old renders use speaker text without the .you class.
 for(const line of $$('article.dialogue-line'))if(String($('strong',line)?.textContent||'').trim().toUpperCase()==='YOU')hide(line);
}
function run(){
 stripPlayerEcho();
 for(const page of $$('.dialogue-page[data-vn-page]'))enhanceNew(page);
 for(const box of $$('.dialogue-box'))if(!$('.dialogue-page[data-vn-page]',box))enhanceLegacy(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;run()}))}

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const b=t.closest('[data-single-beat-next]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const host=b.closest('.dialogue-page[data-vn-page],.dialogue-box');if(!host)return;
 host.dataset.singleBeatIndex=String(Number(host.dataset.singleBeatIndex||0)+1);
 const text=$('.dialogue-page-text',host)||$('.dialogue-lines',host);paginate(host,text);
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();