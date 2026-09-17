(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V13__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V13__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,logMoveQueued=false;

const isPlayer=el=>el instanceof Element&&(el.matches('.dialogue-line.you')||String($('strong',el)?.textContent||'').trim().toUpperCase()==='YOU');
const isBeat=el=>el instanceof Element&&(el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
const hide=el=>{if(el){el.hidden=true;el.style.display='none'}};
const show=el=>{if(el){el.hidden=false;el.style.removeProperty('display')}};

function choiceList(host){return $('.choice-list',host)}
function choiceButtons(host){
 const list=choiceList(host);if(!list)return[];
 return $$('[data-choice],[data-gc]',list);
}
function actualChoices(host){return choiceButtons(host).filter(b=>!b.disabled&&!b.classList.contains('locked'))}
function hasChoiceOptions(host){return choiceButtons(host).length>0}
function vnControls(host){return $$('[data-vn-next],[data-vn-finish]',host).filter(b=>!b.matches('[data-single-beat-next]'))}
function rawFinish(host){return $('[data-finish]',host)}
function rawEnd(host){return $('[data-end]',host)}
function hideCoreProgress(host){
 vnControls(host).forEach(hide);
 const f=rawFinish(host);if(f)hide(f);
 const e=rawEnd(host);if(e)hide(e);
}
function hideChoices(host){const list=choiceList(host);if(list)hide(list)}
function showChoices(host){
 const list=choiceList(host);if(list)show(list);
 for(const b of $$('button',list||document.createElement('div'))){
  if(b.matches('[data-choice],[data-gc]'))show(b);
  else if(b.matches('[data-finish]'))hide(b);
 }
 hideCoreProgress(host);
}
function ensureLocalNext(host){
 let b=$('[data-single-beat-next]',host);if(b)return b;
 b=document.createElement('button');b.type='button';b.className='dialogue-next single-beat-next';b.dataset.singleBeatNext='1';
 host.appendChild(b);return b;
}
function setLocalMode(button,mode,label='NEXT'){
 button.dataset.singleBeatMode=mode||'beat';
 button.innerHTML=`${label} <span>›</span>`;
}
function signature(beats,host){
 const choiceSig=choiceButtons(host).map(b=>`${b.dataset.choice||b.dataset.gc||b.textContent}:${b.disabled?'locked':'open'}`).join(',');
 return beats.map(el=>`${el.tagName}:${el.className}:${el.textContent}`).join('|')+'::'+choiceSig;
}
function finalCoreAction(host){
 const vnNext=$('[data-vn-next]',host);
 if(vnNext)return{mode:'vn-next',label:'NEXT'};
 const vnFinish=$('[data-vn-finish]',host);
 if(vnFinish)return{mode:'vn-finish',label:'NEXT'};
 if(rawFinish(host))return{mode:'finish',label:'NEXT'};
 if(rawEnd(host))return{mode:'end',label:'NEXT'};
 return null;
}
function revealAfterLastBeat(host,local){
 const phase=host.dataset.singleBeatPhase||'beat';
 if(hasChoiceOptions(host)){
  if(phase==='choices'){
   hide(local);showChoices(host);
  }else{
   hideChoices(host);hideCoreProgress(host);setLocalMode(local,'choices','NEXT');show(local);
  }
  return;
 }
 hideChoices(host);
 const action=finalCoreAction(host);
 if(action){hideCoreProgress(host);setLocalMode(local,action.mode,action.label);show(local);return}
 hide(local);
}
function paginate(host,text){
 if(!host||!text)return;
 const all=Array.from(text.children).filter(isBeat);
 for(const row of all)if(isPlayer(row))row.remove();
 const beats=Array.from(text.children).filter(isBeat).filter(row=>!isPlayer(row));
 const sig=signature(beats,host);
 if(host.dataset.singleBeatSig!==sig){
  host.dataset.singleBeatSig=sig;
  host.dataset.singleBeatIndex='0';
  host.dataset.singleBeatPhase='beat';
 }
 if(!beats.length){
  const local=$('[data-single-beat-next]',host);if(local)hide(local);
  if(hasChoiceOptions(host))showChoices(host);
  return;
 }
 let index=Math.max(0,Math.min(Number(host.dataset.singleBeatIndex||0),beats.length-1));
 host.dataset.singleBeatIndex=String(index);
 beats.forEach((row,i)=>i===index?show(row):hide(row));
 const local=ensureLocalNext(host);
 if(index<beats.length-1){
  hideChoices(host);hideCoreProgress(host);setLocalMode(local,'beat','NEXT');show(local);
 }else revealAfterLastBeat(host,local);
}
function enhanceNew(page){const text=$('.dialogue-page-text',page);if(text)paginate(page,text)}
function enhanceLegacy(box){const lines=$('.dialogue-lines',box);if(lines)paginate(box,lines)}
function stripPlayerEcho(){
 for(const box of $$('.character-room .dialogue-box')){
  for(const you of $$('.dialogue-line.you',box))you.remove();
  for(const line of $$('article.dialogue-line',box)){
   if(String($('strong',line)?.textContent||'').trim().toUpperCase()==='YOU')line.remove();
  }
 }
}
function clearChosenScreen(target){
 const chosen=target?.closest?.('.character-room .dialogue-box [data-choice],.character-room .dialogue-box [data-gc]');
 if(!chosen)return false;
 const host=chosen.closest('.dialogue-page[data-vn-page],.dialogue-box');
 if(!host)return false;
 const list=choiceList(host);if(list)hide(list);
 const local=$('[data-single-beat-next]',host);if(local)hide(local);
 host.dataset.singleBeatPhase='beat';
 host.dataset.hvChoiceCommitted='1';
 return true;
}
function externalLogRoot(){
 let root=$('#hvDialogueLogRoot');
 if(!root){root=document.createElement('div');root.id='hvDialogueLogRoot';document.body.appendChild(root)}
 return root;
}
function externalizeLog(){
 const source=$$('.dialogue-log-backdrop').find(el=>!el.closest('#hvDialogueLogRoot'));
 if(!source)return false;
 const root=externalLogRoot();root.replaceChildren(source);return true;
}
function scheduleExternalizeLog(){
 if(logMoveQueued)return;logMoveQueued=true;
 queueMicrotask(()=>{logMoveQueued=false;externalizeLog()});
 requestAnimationFrame(()=>externalizeLog());
 setTimeout(()=>externalizeLog(),40);
}
function removeExternalLog(){const root=$('#hvDialogueLogRoot');if(root)root.remove()}
function run(){
 stripPlayerEcho();
 if(!$('.character-room'))removeExternalLog();else externalizeLog();
 for(const page of $$('.character-room .dialogue-page[data-vn-page]'))enhanceNew(page);
 for(const box of $$('.character-room .dialogue-box'))if(!$('.dialogue-page[data-vn-page]',box))enhanceLegacy(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;run()}))}
function clickHidden(target){
 if(!target)return false;
 const oldHidden=target.hidden,oldDisplay=target.style.display;
 target.hidden=false;target.style.removeProperty('display');
 try{target.click()}finally{target.hidden=oldHidden;target.style.display=oldDisplay}
 return true;
}

window.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 clearChosenScreen(t);
 if(t.closest('[data-vn-log]')){scheduleExternalizeLog();return}
 if(t.closest('[data-vn-log-close]')){setTimeout(removeExternalLog,0);return}
},true);

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const b=t.closest('[data-single-beat-next]');
 if(b){
  e.preventDefault();e.stopImmediatePropagation();
  const host=b.closest('.dialogue-page[data-vn-page],.dialogue-box');if(!host)return;
  const mode=b.dataset.singleBeatMode||'beat';
  if(mode==='beat'){
   host.dataset.singleBeatIndex=String(Number(host.dataset.singleBeatIndex||0)+1);
   host.dataset.singleBeatPhase='beat';
   const text=$('.dialogue-page-text',host)||$('.dialogue-lines',host);paginate(host,text);return;
  }
  if(mode==='choices'){
   host.dataset.singleBeatPhase='choices';
   const text=$('.dialogue-page-text',host)||$('.dialogue-lines',host);paginate(host,text);return;
  }
  if(mode==='vn-next'){clickHidden($('[data-vn-next]',host));return}
  if(mode==='vn-finish'){clickHidden($('[data-vn-finish]',host));return}
  if(mode==='finish'){clickHidden(rawFinish(host));return}
  if(mode==='end'){clickHidden(rawEnd(host));setTimeout(schedule,0);return}
 }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();
