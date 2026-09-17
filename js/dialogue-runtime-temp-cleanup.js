(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_RUNTIME_TEMP_CLEANUP_V2__)return;
window.__HELLAVERSE_DIALOGUE_RUNTIME_TEMP_CLEANUP_V2__=1;

const K='hellaverse_dialogue_state_v1';
const PREFIXES=['hv-runtime-v2-','hv-runtime-interaction-'];
let cleaning=false;

function isTemp(id){id=String(id||'');return PREFIXES.some(prefix=>id.startsWith(prefix))}
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function writeQuiet(s){try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}}
function clean(){
  if(cleaning)return false;cleaning=true;
  try{
    const s=read(),before=Array.isArray(s.dialogues)?s.dialogues.length:0;
    s.dialogues=Array.isArray(s.dialogues)?s.dialogues.filter(sc=>!isTemp(sc?.id)):[];
    let changed=s.dialogues.length!==before;
    if(s.dialogueFileMap&&typeof s.dialogueFileMap==='object'){
      for(const id of Object.keys(s.dialogueFileMap))if(isTemp(id)){delete s.dialogueFileMap[id];changed=true}
    }
    if(changed)writeQuiet(s);
    return changed;
  }finally{cleaning=false}
}

// Bootstrap loads this before hv-stable, so stale runtime clones are gone before
// the single state machine reads localStorage.
clean();

// On a new ASK/ACTION selection, quietly retire the old temp clone. The interaction
// engine immediately registers the new clone and emits the one state refresh needed.
window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('[data-hv-ask-scene],[data-hv-action-choice]'))clean();
},true);

window.__HV_CLEAN_DIALOGUE_RUNTIME_TEMPS__=clean;
})();
