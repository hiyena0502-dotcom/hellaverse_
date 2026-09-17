(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_RUNTIME_TEMP_CLEANUP_V1__)return;
window.__HELLAVERSE_DIALOGUE_RUNTIME_TEMP_CLEANUP_V1__=1;

const K='hellaverse_dialogue_state_v1';
const PREFIXES=['hv-runtime-v2-','hv-runtime-interaction-'];
let cleaning=false;

function isTemp(id){id=String(id||'');return PREFIXES.some(prefix=>id.startsWith(prefix))}
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function publish(s){
  const value=JSON.stringify(s);localStorage.setItem(K,value);
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value,storageArea:localStorage,url:location.href}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'dialogue-runtime-temp-cleanup',clearDirty:false}}));
}
function clean(){
  if(cleaning)return;cleaning=true;
  try{
    const s=read(),before=Array.isArray(s.dialogues)?s.dialogues.length:0;
    s.dialogues=Array.isArray(s.dialogues)?s.dialogues.filter(sc=>!isTemp(sc?.id)):[];
    let changed=s.dialogues.length!==before;
    if(s.dialogueFileMap&&typeof s.dialogueFileMap==='object'){
      for(const id of Object.keys(s.dialogueFileMap))if(isTemp(id)){delete s.dialogueFileMap[id];changed=true}
    }
    if(changed)publish(s);
  }finally{cleaning=false}
}

// Remove stale temp scenes from earlier sessions immediately.
clean();

// Before a new ASK/ACTION runtime clone is created, retire the previous one.
// This runs before dialogue-interaction-engine-v2 because bootstrap loads it first.
window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('[data-hv-ask-scene],[data-hv-action-choice]'))clean();
},true);
})();
