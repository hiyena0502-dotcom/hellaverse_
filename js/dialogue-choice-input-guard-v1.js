(()=>{
'use strict';
if(window.__HELLAVERSE_CHOICE_INPUT_GUARD_V1__)return;
window.__HELLAVERSE_CHOICE_INPUT_GUARD_V1__=1;

let pointerChoice=null;
let pointerAt=0;
let keyboardChoice=null;
let keyboardAt=0;

const choiceOf=t=>t instanceof Element?t.closest('.character-room .dialogue-box [data-choice],.character-room .dialogue-box [data-gc]'):null;
const enabledChoices=()=>Array.from(document.querySelectorAll('.character-room .dialogue-box .choice-option:not(:disabled)[data-choice],.character-room .dialogue-box .choice-option:not(:disabled)[data-gc]'));

function clearPointer(){
  pointerChoice=null;
  pointerAt=0;
}
function clearKeyboard(){
  keyboardChoice=null;
  keyboardAt=0;
}

window.addEventListener('pointerdown',e=>{
  const ch=choiceOf(e.target);
  if(!e.isTrusted||!ch||ch.disabled){clearPointer();return}
  pointerChoice=ch;
  pointerAt=performance.now();
},true);

window.addEventListener('pointercancel',clearPointer,true);

window.addEventListener('keydown',e=>{
  if(!e.isTrusted)return;
  const tag=e.target&&e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  if(!/^[1-9]$/.test(e.key))return;
  const list=enabledChoices(),target=list[Number(e.key)-1]||null;
  keyboardChoice=target;
  keyboardAt=performance.now();
},true);

window.addEventListener('click',e=>{
  const ch=choiceOf(e.target);
  if(!ch)return;

  const now=performance.now();
  const pointerOK=e.isTrusted&&pointerChoice===ch&&now-pointerAt<1800;
  const numericKeyOK=keyboardChoice===ch&&now-keyboardAt<180;
  const nativeKeyboardOK=e.isTrusted&&e.detail===0&&(document.activeElement===ch||ch.contains(document.activeElement));

  if(!pointerOK&&!numericKeyOK&&!nativeKeyboardOK){
    e.preventDefault();
    e.stopImmediatePropagation();
    console.warn('Blocked non-user dialogue choice activation.',ch.dataset.choice||ch.dataset.gc||'');
    return;
  }

  clearPointer();
  clearKeyboard();
},true);

document.addEventListener('visibilitychange',()=>{if(document.hidden){clearPointer();clearKeyboard()}});
window.addEventListener('blur',()=>{clearPointer();clearKeyboard()});
})();