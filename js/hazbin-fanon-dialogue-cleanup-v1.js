(()=>{
'use strict';
if(window.__HELLAVERSE_HAZBIN_FANON50_CLEANUP_V1__)return;
window.__HELLAVERSE_HAZBIN_FANON50_CLEANUP_V1__=1;
const K='hellaverse_dialogue_state_v1';
try{
 const s=JSON.parse(localStorage.getItem(K)||'{}')||{};
 s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
 const before=s.dialogues.length;
 s.dialogues=s.dialogues.filter(sc=>!(sc&&(
   sc._hvHazbinFanon50===true ||
   String(sc.contentPack||'').startsWith('hazbin-fanon-50-') ||
   String(sc.id||'').startsWith('hazbin-fanon50-')
 )));
 if(s.dialogueFileMap&&typeof s.dialogueFileMap==='object'){
   for(const id of Object.keys(s.dialogueFileMap))if(String(id).startsWith('hazbin-fanon50-'))delete s.dialogueFileMap[id];
 }
 if(s.dialogueMeta&&typeof s.dialogueMeta==='object'&&!Array.isArray(s.dialogueMeta)){
   for(const id of Object.keys(s.dialogueMeta))if(String(id).startsWith('hazbin-fanon50-'))delete s.dialogueMeta[id];
 }
 if(s.dialogues.length!==before){
   localStorage.setItem(K,JSON.stringify(s));
   window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'hazbin-fanon50-cleanup-v1',clearDirty:false}}));
 }
}catch(e){console.warn('Hazbin fanon 50 cleanup skipped safely.',e)}
})();