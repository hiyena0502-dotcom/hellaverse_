(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V15__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V15__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,logMoveQueued=false,bridge=false;

const isBeat=el=>el instanceof Element&&(el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
const isPlayer=el=>el instanceof Element&&(el.matches('.dialogue-line.you')||String($('strong',el)?.textContent||'').trim().toUpperCase()==='YOU');
const hide=el=>{if(el){el.hidden=true;el.style.display='none'}};
const show=el=>{if(el){el.hidden=false;el.style.removeProperty('display')}};

function choiceList(host){return $('.choice-list',host)}
function choiceButtons(host){const list=choiceList(host);return list?$$('[data-choice],[data-gc]',list):[]}
function hasChoiceOptions(host){return choiceButtons(host).length>0}
function vnControls(host){return $$('[data-vn-next],[data-vn-finish]',host).filter(b=>!b.matches('[data-single-beat-next]'))}
function rawFinish(host){return $('[data-finish]',host)}
function rawEnd(host){return $('[data-end]',host)}
function hideCoreProgress(host){
  vnControls(host).forEach(hide);
  hide(rawFinish(host));
  hide(rawEnd(host));
}
function hideChoices(host){hide(choiceList(host))}
function showChoices(host){
  const list=choiceList(host);if(list)show(list);
  for(const b of choiceButtons(host))show(b);
  hideCoreProgress(host);
}
function ensureLocalNext(host){
  let b=$('[data-single-beat-next]',host);
  if(!b){b=document.createElement('button');b.type='button';b.className='dialogue-next single-beat-next';b.dataset.singleBeatNext='1';host.appendChild(b)}
  return b;
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
  if($('[data-vn-next]',host))return{mode:'vn-next',label:'NEXT'};
  if($('[data-vn-finish]',host))return{mode:'vn-finish',label:'NEXT'};
  if(rawFinish(host))return{mode:'finish',label:'NEXT'};
  if(rawEnd(host))return{mode:'end',label:'RETURN'};
  return null;
}
function clickHidden(target){
  if(!target||bridge)return false;
  const oldHidden=target.hidden,oldDisplay=target.style.display;
  bridge=true;target.hidden=false;target.style.removeProperty('display');
  try{target.click()}finally{target.hidden=oldHidden;target.style.display=oldDisplay;bridge=false}
  return true;
}
function revealAfterLastBeat(host,local){
  const phase=host.dataset.singleBeatPhase||'beat';
  if(hasChoiceOptions(host)){
    if(phase==='choices'){hide(local);showChoices(host)}
    else{hideChoices(host);hideCoreProgress(host);setLocalMode(local,'choices','NEXT');show(local)}
    return;
  }
  hideChoices(host);
  const action=finalCoreAction(host);
  if(action){hideCoreProgress(host);setLocalMode(local,action.mode,action.label);show(local);return}
  hide(local);
}
function removePlayerEchoes(text){
  for(const row of Array.from(text?.children||[]).filter(isPlayer))row.remove();
}
function autoAdvanceEmptyChoice(host,text){
  if(host.dataset.hvChoiceCommitted!=='1'||host.dataset.singleBeatAutoAdvanced==='1')return false;
  const next=$('[data-vn-next]',host);
  if(!next)return false;
  host.dataset.singleBeatAutoAdvanced='1';
  requestAnimationFrame(()=>{
    if(!host.isConnected)return;
    clickHidden(next);
    setTimeout(schedule,0);
  });
  return true;
}
function paginate(host,text){
  if(!host||!text)return;
  removePlayerEchoes(text);
  const beats=Array.from(text.children).filter(isBeat);
  const sig=signature(beats,host);
  if(host.dataset.singleBeatSig!==sig){
    host.dataset.singleBeatSig=sig;
    host.dataset.singleBeatIndex='0';
    host.dataset.singleBeatPhase='beat';
  }
  if(!beats.length){
    const local=$('[data-single-beat-next]',host);if(local)hide(local);
    if(autoAdvanceEmptyChoice(host,text))return;
    if(hasChoiceOptions(host))showChoices(host);
    return;
  }
  host.dataset.hvChoiceCommitted='0';
  host.dataset.singleBeatAutoAdvanced='0';
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
function clearChosenScreen(target){
  const chosen=target?.closest?.('.character-room .dialogue-box [data-choice],.character-room .dialogue-box [data-gc]');
  if(!chosen)return false;
  const host=chosen.closest('.dialogue-page[data-vn-page],.dialogue-box');if(!host)return false;
  const text=$('.dialogue-page-text',host)||$('.dialogue-lines',host);
  if(text)Array.from(text.children).filter(isBeat).forEach(hide);
  hideChoices(host);
  hide($('[data-single-beat-next]',host));
  hideCoreProgress(host);
  host.dataset.singleBeatSig='';
  host.dataset.singleBeatIndex='0';
  host.dataset.singleBeatPhase='beat';
  host.dataset.singleBeatAutoAdvanced='0';
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
  externalLogRoot().replaceChildren(source);return true;
}
function scheduleExternalizeLog(){
  if(logMoveQueued)return;logMoveQueued=true;
  queueMicrotask(()=>{logMoveQueued=false;externalizeLog()});
  requestAnimationFrame(externalizeLog);setTimeout(externalizeLog,40);
}
function removeExternalLog(){const root=$('#hvDialogueLogRoot');if(root)root.remove()}
function run(){
  if(!$('.character-room'))removeExternalLog();else externalizeLog();
  for(const page of $$('.character-room .dialogue-page[data-vn-page]'))enhanceNew(page);
  for(const box of $$('.character-room .dialogue-box'))if(!$('.dialogue-page[data-vn-page]',box))enhanceLegacy(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;run()}))}

window.addEventListener('click',e=>{
  if(bridge)return;
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  clearChosenScreen(t);
  if(t.closest('[data-vn-log]')){scheduleExternalizeLog();return}
  if(t.closest('[data-vn-log-close]')){setTimeout(removeExternalLog,0);return}
},true);

document.addEventListener('click',e=>{
  if(bridge)return;
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const b=t.closest('[data-single-beat-next]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  const host=b.closest('.dialogue-page[data-vn-page],.dialogue-box');if(!host)return;
  const mode=b.dataset.singleBeatMode||'beat';
  if(mode==='beat'){
    host.dataset.singleBeatIndex=String(Number(host.dataset.singleBeatIndex||0)+1);
    host.dataset.singleBeatPhase='beat';
    paginate(host,$('.dialogue-page-text',host)||$('.dialogue-lines',host));return;
  }
  if(mode==='choices'){
    host.dataset.singleBeatPhase='choices';
    paginate(host,$('.dialogue-page-text',host)||$('.dialogue-lines',host));return;
  }
  if(mode==='vn-next'){clickHidden($('[data-vn-next]',host));setTimeout(schedule,0);return}
  if(mode==='vn-finish'){clickHidden($('[data-vn-finish]',host));setTimeout(schedule,0);return}
  if(mode==='finish'){clickHidden(rawFinish(host));setTimeout(schedule,0);return}
  if(mode==='end'){clickHidden(rawEnd(host));setTimeout(schedule,0)}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();
