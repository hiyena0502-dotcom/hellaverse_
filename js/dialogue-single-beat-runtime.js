(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V4__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V4__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;

const isPlayer=el=>el instanceof Element&&(el.matches('.dialogue-line.you')||String($('strong',el)?.textContent||'').trim().toUpperCase()==='YOU');
const isBeat=el=>el instanceof Element&&(el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
const hide=el=>{if(el){el.hidden=true;el.style.display='none'}};
const show=el=>{if(el){el.hidden=false;el.style.removeProperty('display')}};
const visible=el=>!!(el&&el.isConnected&&!el.hidden&&getComputedStyle(el).display!=='none');

function choiceList(host){return $('.choice-list',host)}
function actualChoices(host){
 const list=choiceList(host);if(!list)return[];
 return $$('[data-choice],[data-gc]',list).filter(b=>!b.disabled&&!b.classList.contains('locked'));
}
function hasActualChoices(host){return actualChoices(host).length>0}
function vnControls(host){return $$('[data-vn-next],[data-vn-finish]',host).filter(b=>!b.matches('[data-single-beat-next]'))}
function rawFinish(host){return $('[data-finish]',host)}
function rawEnd(host){return $('[data-end]',host)}
function hideProgress(host){
 vnControls(host).forEach(hide);
 const f=rawFinish(host);if(f)hide(f);
 const e=rawEnd(host);if(e)hide(e);
}
function showChoices(host){
 const list=choiceList(host);if(list)show(list);
 for(const b of $$('button',list||document.createElement('div'))){
  if(b.matches('[data-choice],[data-gc]'))show(b);
  else if(b.matches('[data-finish]'))hide(b);
 }
 hideProgress(host);
}
function hideChoices(host){const list=choiceList(host);if(list)hide(list)}
function ensureUtility(host){
 const box=host.closest?.('.dialogue-box')||host;
 if(!box?.closest('.character-room')||$('.dialogue-utility',box))return;
 box.insertAdjacentHTML('afterbegin','<div class="dialogue-utility hv-stable-dialogue-utility" style="display:flex;gap:14px;align-items:center;justify-content:flex-end;flex-wrap:wrap"><button type="button" data-vn-log>LOG</button><button type="button" data-vn-ask>ASK</button><button type="button" data-inventory-open>INVENTORY</button><button type="button" data-vn-leave>LEAVE ROOM</button></div>');
}
function ensureLocalNext(host){
 let b=$('[data-single-beat-next]',host);if(b)return b;
 b=document.createElement('button');b.type='button';b.className='dialogue-next single-beat-next';b.dataset.singleBeatNext='1';b.innerHTML='NEXT <span>›</span>';
 host.appendChild(b);return b;
}
function signature(beats){return beats.map(el=>`${el.tagName}:${el.className}:${el.textContent}`).join('|')}
function setLocalMode(button,mode){button.dataset.singleBeatMode=mode||'beat';button.innerHTML='NEXT <span>›</span>'}
function revealFinal(host,local){
 if(hasActualChoices(host)){
  hide(local);showChoices(host);return;
 }
 hideChoices(host);
 const vn=vnControls(host).find(visible)||vnControls(host)[0];
 if(vn){
  hide(local);show(vn);return;
 }
 const finish=rawFinish(host);
 if(finish){
  hide(finish);setLocalMode(local,'finish');show(local);return;
 }
 const end=rawEnd(host);
 if(end){hide(local);show(end);return}
 hide(local);
}
function paginate(host,text){
 if(!host||!text)return;
 ensureUtility(host);
 const all=Array.from(text.children).filter(isBeat);
 for(const row of all)if(isPlayer(row))hide(row);
 const beats=all.filter(row=>!isPlayer(row));
 const sig=signature(beats);
 if(host.dataset.singleBeatSig!==sig){host.dataset.singleBeatSig=sig;host.dataset.singleBeatIndex='0'}
 if(!beats.length){
  const local=$('[data-single-beat-next]',host);if(local)hide(local);
  if(hasActualChoices(host))showChoices(host);
  return;
 }
 let index=Math.max(0,Math.min(Number(host.dataset.singleBeatIndex||0),beats.length-1));
 host.dataset.singleBeatIndex=String(index);
 beats.forEach((row,i)=>i===index?show(row):hide(row));
 const local=ensureLocalNext(host);
 if(index<beats.length-1){
   hideChoices(host);hideProgress(host);setLocalMode(local,'beat');show(local);
 }else revealFinal(host,local);
}
function enhanceNew(page){const text=$('.dialogue-page-text',page);if(text)paginate(page,text)}
function enhanceLegacy(box){const lines=$('.dialogue-lines',box);if(lines)paginate(box,lines)}
function stripPlayerEcho(){
 for(const you of $$('.dialogue-line.you'))hide(you);
 for(const line of $$('article.dialogue-line'))if(String($('strong',line)?.textContent||'').trim().toUpperCase()==='YOU')hide(line);
}
function run(){
 stripPlayerEcho();
 for(const page of $$('.dialogue-page[data-vn-page]'))enhanceNew(page);
 for(const box of $$('.dialogue-box'))if(!$('.dialogue-page[data-vn-page]',box))enhanceLegacy(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;run()}))}
function syntheticEnd(box){
 if(!box?.isConnected)return;
 const b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.end='';box.appendChild(b);b.click();b.remove();
}

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const b=t.closest('[data-single-beat-next]');
 if(b){
  e.preventDefault();e.stopImmediatePropagation();
  const host=b.closest('.dialogue-page[data-vn-page],.dialogue-box');if(!host)return;
  const mode=b.dataset.singleBeatMode||'beat';
  if(mode==='finish'){
   const finish=rawFinish(host);if(finish){show(finish);finish.click();return}
  }
  host.dataset.singleBeatIndex=String(Number(host.dataset.singleBeatIndex||0)+1);
  const text=$('.dialogue-page-text',host)||$('.dialogue-lines',host);paginate(host,text);return;
 }
 const leave=t.closest('[data-vn-leave]');
 if(leave){
  const box=leave.closest('.dialogue-box');
  if(!box)return;
  const marker=box.innerHTML;
  setTimeout(()=>{if(leave.isConnected&&box.isConnected&&box.innerHTML===marker)syntheticEnd(box)},220);
 }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();
