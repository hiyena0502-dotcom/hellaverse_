(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V10__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V10__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const RKEY='hellaverse_dialogue_runtime_file_v1';
let queued=false,ambientResumeLocked=false,coreReturnBridge=false,logMoveQueued=false,specialTransition=false;

const isPlayer=el=>el instanceof Element&&(el.matches('.dialogue-line.you')||String($('strong',el)?.textContent||'').trim().toUpperCase()==='YOU');
const isBeat=el=>el instanceof Element&&(el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
const hide=el=>{if(el){el.hidden=true;el.style.display='none'}};
const show=el=>{if(el){el.hidden=false;el.style.removeProperty('display')}};

function choiceList(host){return $('.choice-list',host)}
function actualChoices(host){
 const list=choiceList(host);if(!list)return[];
 return $$('[data-choice],[data-gc]',list).filter(b=>!b.disabled&&!b.classList.contains('locked'));
}
function hasActualChoices(host){return actualChoices(host).length>0}
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

function utilityMarkup(){
 return '<button type="button" data-vn-log>LOG</button>'+
        '<button type="button" data-action="ASK" data-dialogue-file-runtime="QUESTION">ASK</button>'+
        '<button type="button" data-action="TALK" data-dialogue-file-runtime="ACTION">ACTION</button>'+
        '<button type="button" data-inventory-open>INVENTORY</button>'+
        '<button type="button" data-vn-leave>LEAVE ROOM</button>';
}
function ensureUtility(host){
 const box=host?.closest?.('.dialogue-box')||host;
 if(!box?.closest('.character-room'))return;
 let util=$('.dialogue-utility',box);
 if(!util){
  util=document.createElement('div');
  util.className='dialogue-utility hv-stable-dialogue-utility';
  box.insertBefore(util,box.firstChild);
 }
 util.classList.add('hv-stable-dialogue-utility');
 util.style.cssText='display:flex;gap:14px;align-items:center;justify-content:flex-end;flex-wrap:wrap';
 const expected='LOG|ASK|ACTION|INVENTORY|LEAVE ROOM';
 if(util.dataset.stableUtility!==expected){
  util.innerHTML=utilityMarkup();
  util.dataset.stableUtility=expected;
 }
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
 const choiceSig=actualChoices(host).map(b=>b.dataset.choice||b.dataset.gc||b.textContent).join(',');
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
 if(hasActualChoices(host)){
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
 ensureUtility(host);
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
  if(hasActualChoices(host))showChoices(host);
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

function isQuietFallback(box){
 if(!box?.classList?.contains('synthetic-dialogue'))return false;
 return /잠시\s*조용한\s*시간이\s*흐른다/i.test(String(box.textContent||''));
}
function conversationTrigger(){
 const direct=$('[data-dialogue-file-runtime="CONVERSATION"]');
 if(direct&&!direct.closest('.editor-main,.modal-backdrop,#hellaverseGachaRoot'))return direct;
 return $$('button,a').find(el=>{
  if(el.closest('.editor-main,.modal-backdrop,#hellaverseGachaRoot,.dialogue-box'))return false;
  const label=String(el.textContent||'').replace(/^\s*\d+\s*/,'').trim().toUpperCase();
  return label==='CONVERSATION';
 })||null;
}
function resumeFromQuietFallback(){
 const box=$('.character-room .dialogue-box.synthetic-dialogue');
 if(!isQuietFallback(box))return false;
 hide(box);
 if(ambientResumeLocked)return true;
 ambientResumeLocked=true;
 try{sessionStorage.setItem(RKEY,'CONVERSATION')}catch{}
 requestAnimationFrame(()=>{
  const trigger=conversationTrigger();
  if(trigger&&trigger.isConnected){
   trigger.click();
  }else{
   const talk=$$('[data-action="TALK"]').find(el=>!el.closest('.dialogue-box,.editor-main,.modal-backdrop,#hellaverseGachaRoot'));
   if(talk?.isConnected)talk.click();
  }
  setTimeout(()=>{ambientResumeLocked=false;schedule()},120);
 });
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
function coreReturn(){
 const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
 b.type='button';b.hidden=true;b.dataset.end='';b.dataset.hvRuntimeBridge='1';host.appendChild(b);coreReturnBridge=true;
 try{b.click()}finally{coreReturnBridge=false;b.remove()}
 setTimeout(schedule,0);
}
function specialBox(){return $('.character-room .dialogue-box[data-hv-special-menu],.character-room .dialogue-box[data-hv-question-picker="1"]')}
function syntheticCoreAction(mode){
 const normalized=String(mode||'').toUpperCase();
 if(!['QUESTION','ACTION'].includes(normalized))return;
 try{sessionStorage.setItem(RKEY,normalized)}catch{}
 const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
 b.type='button';b.hidden=true;b.dataset.hvRuntimeBridge='1';b.dataset.action=normalized==='QUESTION'?'ASK':'TALK';b.dataset.dialogueFileRuntime=normalized;host.appendChild(b);
 try{b.click()}finally{b.remove()}
 setTimeout(schedule,0);
}
function switchSpecialMode(mode){
 if(specialTransition)return;
 specialTransition=true;
 const open=!!specialBox();
 if(open)coreReturn();
 setTimeout(()=>{
  specialTransition=false;
  syntheticCoreAction(mode);
 },open?80:0);
}
function openInventoryFromSpecial(){
 if(specialTransition)return;
 specialTransition=true;
 coreReturn();
 setTimeout(()=>{
  specialTransition=false;
  const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
  b.type='button';b.hidden=true;b.dataset.hvRuntimeBridge='1';b.dataset.inventoryOpen='';host.appendChild(b);
  try{b.click()}finally{b.remove()}
  setTimeout(schedule,0);
 },80);
}

function run(){
 stripPlayerEcho();
 if(!$('.character-room'))removeExternalLog();else externalizeLog();
 if(resumeFromQuietFallback())return;
 for(const box of $$('.character-room .dialogue-box'))ensureUtility(box);
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
 if(coreReturnBridge)return;
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 if(t.closest('[data-hv-runtime-bridge]'))return;
 clearChosenScreen(t);
 const specialSwitch=t.closest('.hv-stable-dialogue-utility [data-dialogue-file-runtime]');
 if(specialSwitch){
  const mode=String(specialSwitch.dataset.dialogueFileRuntime||'').toUpperCase();
  if(mode==='QUESTION'||mode==='ACTION'){
   e.preventDefault();e.stopImmediatePropagation();switchSpecialMode(mode);return;
  }
 }
 if(t.closest('[data-runtime-return]')){
  e.preventDefault();e.stopImmediatePropagation();
  specialTransition=false;coreReturn();return;
 }
 if(t.closest('.hv-stable-dialogue-utility [data-inventory-open]')&&specialBox()){
  e.preventDefault();e.stopImmediatePropagation();openInventoryFromSpecial();return;
 }
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
