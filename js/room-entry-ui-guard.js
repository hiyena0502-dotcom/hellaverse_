(()=>{
'use strict';
if(window.__HELLAVERSE_ROOM_ENTRY_UI_GUARD_V1__)return;
window.__HELLAVERSE_ROOM_ENTRY_UI_GUARD_V1__=1;

const $=(s,r=document)=>r.querySelector(s);
let roomEntryUntil=0;
let explicitPicker=false;
let queued=false;
let stableTimer=null;
let bridge=false;

function armRoomEntry(){
  roomEntryUntil=Date.now()+1800;
  explicitPicker=false;
  clearTimeout(stableTimer);
}
function markExplicitPicker(){explicitPicker=true;roomEntryUntil=0;clearTimeout(stableTimer)}
function selectionBox(){
  const box=$('.character-room .dialogue-box');
  if(!box)return null;
  if($('.dialogue-lines',box)||$('[data-vn-page]',box))return null;
  return $('[data-scene],[data-gift]',box)?box:null;
}
function closeUnexpectedPicker(box){
  const back=$('[data-end]',box);
  if(!back||bridge)return false;
  bridge=true;
  try{back.click()}finally{bridge=false}
  return true;
}
function run(){
  if(explicitPicker||Date.now()>roomEntryUntil)return;
  const room=$('.character-room');if(!room)return;
  const box=selectionBox();
  if(box){closeUnexpectedPicker(box);return}
  clearTimeout(stableTimer);
  stableTimer=setTimeout(()=>{
    if($('.character-room')&&!selectionBox())roomEntryUntil=0;
  },320);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

document.addEventListener('click',event=>{
  if(bridge)return;
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('[data-room]')){armRoomEntry();return}
  if(target.closest('[data-action="TALK"],[data-action="ASK"],[data-action="GIFT"],[data-hv-action]')){markExplicitPicker();return}
  if(target.closest('[data-scene],[data-gift]')){roomEntryUntil=0;return}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
})();