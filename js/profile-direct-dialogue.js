(()=>{
'use strict';
if(window.__HELLAVERSE_PROFILE_DIRECT_DIALOGUE_V1__)return;
window.__HELLAVERSE_PROFILE_DIRECT_DIALOGUE_V1__=1;

const $=(s,r=document)=>r.querySelector(s);
let pending=false,cid='',fallbackTimer=null,queued=false,bridge=false;

function labelProfileButtons(){
  for(const button of document.querySelectorAll('.character-file [data-room]'))button.textContent='대화하기';
}
function clearPending(){
  pending=false;cid='';clearTimeout(fallbackTimer);document.body.classList.remove('hv-direct-dialogue-entry');
}
function fallbackStart(){
  if(!pending)return;
  if($('.character-room .dialogue-box')){clearPending();return}
  const talk=$('.character-room [data-action="TALK"]');
  if(talk){bridge=true;try{talk.click()}finally{bridge=false}}
  fallbackTimer=setTimeout(()=>{if($('.character-room .dialogue-box'))clearPending()},220);
}
function run(){
  labelProfileButtons();
  if(!pending)return;
  if($('.character-room .dialogue-box')){clearPending();return}
  if($('.character-room .room-stage')){
    clearTimeout(fallbackTimer);
    fallbackTimer=setTimeout(fallbackStart,180);
  }
  if(!$('.character-room')&&document.body.classList.contains('hv-direct-dialogue-entry')){
    // Navigation changed before the room mounted; avoid leaving the page visually suppressed.
    fallbackTimer=setTimeout(()=>{if(!$('.character-room'))clearPending()},500);
  }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

window.addEventListener('click',event=>{
  if(bridge)return;
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const enter=target.closest('.character-file [data-room],.home-lobby [data-room]');
  if(enter){
    pending=true;cid=String(enter.dataset.room||'');
    document.body.classList.add('hv-direct-dialogue-entry');
    setTimeout(schedule,0);setTimeout(schedule,80);setTimeout(schedule,220);
    return;
  }
  if(target.closest('[data-page="characters"],[data-back]'))clearPending();
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:runtime-ready',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
