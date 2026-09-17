(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_UTILITY_CONTROLS_V1__)return;
window.__HELLAVERSE_DIALOGUE_UTILITY_CONTROLS_V1__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;

const controls=[
  {label:'ASK',attr:'data-vn-ask'},
  {label:'ACTION',attr:'data-hv-action'},
  {label:'INVENTORY',attr:'data-inventory-open'},
  {label:'LEAVE ROOM',attr:'data-vn-leave'}
];

function makeButton({label,attr}){
  const button=document.createElement('button');
  button.type='button';
  button.setAttribute(attr,'');
  button.textContent=label;
  return button;
}

function isPlayableDialogue(box){
  if(!box||!box.closest('.character-room'))return false;
  if(document.body.classList.contains('hv-room-exiting')||box.classList.contains('hv-exit-dialogue'))return false;
  return !!$('[data-vn-page]',box);
}

function ensureUtility(box){
  if(!isPlayableDialogue(box))return;
  let utility=$('.dialogue-utility',box);
  if(!utility){
    utility=document.createElement('div');
    utility.className='dialogue-utility';
    box.prepend(utility);
  }
  utility.classList.add('hv-dialogue-utility-controls');
  utility.style.display='flex';
  utility.style.gap='14px';
  utility.style.alignItems='center';
  utility.style.justifyContent='flex-end';
  utility.style.flexWrap='wrap';

  // Keep LOG if dialogue-ui supplied it, but make the four room controls deterministic.
  const log=$('[data-vn-log]',utility);
  const existing=new Map();
  for(const spec of controls){
    const button=$(`[${spec.attr}]`,utility);
    if(button){
      button.hidden=false;
      button.style.removeProperty('display');
      button.textContent=spec.label;
      existing.set(spec.attr,button);
    }
  }

  // Remove obsolete GIFT utility control; inventory replaced that flow.
  $$('[data-vn-gift]',utility).forEach(button=>button.remove());

  const ordered=[];
  if(log){
    log.hidden=false;
    log.style.removeProperty('display');
    ordered.push(log);
  }
  for(const spec of controls){
    ordered.push(existing.get(spec.attr)||makeButton(spec));
  }
  utility.replaceChildren(...ordered);
}

function cleanExitUtility(box){
  if(!box)return;
  if(!document.body.classList.contains('hv-room-exiting')&&!box.classList.contains('hv-exit-dialogue'))return;
  const utility=$('.dialogue-utility',box);
  if(!utility)return;
  // During the farewell scene no new interaction should interrupt the exit.
  $$('[data-vn-ask],[data-hv-action],[data-inventory-open],[data-vn-leave]',utility).forEach(button=>{
    button.hidden=true;
    button.style.display='none';
  });
}

function run(){
  for(const box of $$('.character-room .dialogue-box')){
    if(isPlayableDialogue(box))ensureUtility(box);
    else cleanExitUtility(box);
  }
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;run()});
}

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:runtime-ready',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
