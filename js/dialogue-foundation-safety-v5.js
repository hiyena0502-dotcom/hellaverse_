(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_FOUNDATION_V5__)return;
window.__HELLAVERSE_DIALOGUE_FOUNDATION_V5__=1;
let queued=false,lastAction='',lastAt=0;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function runtimeUX(){
  const stage=$('.dialogue-stage');
  if(!stage)return;
  const lines=$('.dialogue-lines',stage);
  if(lines){
    lines.setAttribute('aria-live','polite');
    lines.setAttribute('aria-relevant','additions text');
    requestAnimationFrame(()=>{lines.scrollTop=document.documentElement.classList.contains('hv-single-beat-runtime')?0:lines.scrollHeight});
  }
  for(const button of $$('.choice-option',stage)){
    button.type='button';
    const span=$('span',button);
    if(span&&!span.textContent.trim())span.textContent='CONTINUE';
    if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',span?.textContent.trim()||'Continue dialogue');
  }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;runtimeUX()})}

document.addEventListener('click',e=>{
  // Internal runtime bridges deliberately click hidden core buttons. Blocking those
  // as "double clicks" can strand the state machine between scenes.
  if(!e.isTrusted)return;
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const action=t.closest('[data-choice],[data-scene],[data-gift],[data-gc],[data-finish],[data-end]');
  if(!action)return;
  const key=[action.dataset.choice,action.dataset.scene,action.dataset.gift,action.dataset.gc,action.hasAttribute('data-finish')?'finish':'',action.hasAttribute('data-end')?'end':''].join('|');
  const now=performance.now();
  if(key===lastAction&&now-lastAt<220){e.preventDefault();e.stopImmediatePropagation();return}
  lastAction=key;lastAt=now;
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
