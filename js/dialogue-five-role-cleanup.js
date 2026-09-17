(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_FIVE_ROLE_CLEANUP_V1__)return;
window.__HELLAVERSE_DIALOGUE_FIVE_ROLE_CLEANUP_V1__=1;
const K='hellaverse_dialogue_state_v1';
const BAD=new Set(['IDLE','HOME']);
const up=v=>String(v||'').trim().toUpperCase();
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s){try{localStorage.setItem(K,JSON.stringify(s))}catch(e){console.warn('Dialogue role cleanup save failed',e)}}
function cleanupState(){
 const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
 const removed=new Set();
 s.dialogues=s.dialogues.filter(sc=>{
   const mapped=up(s.dialogueFileMap?.[sc?.id]),role=up(sc?.sceneRole),kind=up(sc?.kind);
   const bad=BAD.has(mapped)||BAD.has(role)||BAD.has(kind);if(bad&&sc?.id)removed.add(String(sc.id));return !bad;
 });
 for(const key of ['dialogueFileMap','dialogueMeta']){
   const map=s[key];if(!map||typeof map!=='object'||Array.isArray(map))continue;
   for(const id of removed)delete map[id];
   for(const [id,value] of Object.entries(map)){
     const role=up(typeof value==='string'?value:value?.sceneRole);if(BAD.has(role)){delete map[id];removed.add(id)}
   }
 }
 if(Array.isArray(s.conversationHistory))s.conversationHistory=s.conversationHistory.filter(x=>!removed.has(String(x?.sceneId||'')));
 write(s);
 try{const selected=sessionStorage.getItem('hellaverse_dialogue_editor_file_v1');if(BAD.has(up(selected)))sessionStorage.setItem('hellaverse_dialogue_editor_file_v1','CONVERSATION')}catch{}
}
function cleanupUi(){
 document.querySelectorAll('[data-dfe-file="IDLE"],[data-dfe-file="HOME"]').forEach(el=>el.remove());
 document.querySelectorAll('option').forEach(option=>{const v=up(option.value||option.textContent);if(BAD.has(v)&&option.closest('#sKind'))option.remove()});
}
cleanupState();cleanupUi();
new MutationObserver(cleanupUi).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',cleanupUi);
})();
