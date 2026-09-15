(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_FILE_MIGRATION_V1__)return;window.__HELLAVERSE_DIALOGUE_FILE_MIGRATION_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_dialogue_file_migration_v1';let v=0;try{v=Number(localStorage.getItem(VK)||0)}catch{}if(v>=1)return;
let s={};try{s=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return}s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};let changed=false;
for(const sc of s.dialogues){if(!sc?.id||s.dialogueFileMap[sc.id])continue;const k=String(sc.kind||'TALK').toUpperCase();let file='CONVERSATION';if(k==='ASK')file='QUESTION';else if(['ENTRY','EXIT','IDLE','HOME'].includes(k))file=k;else if(k==='TALK'){const choices=(sc.nodes||[]).flatMap(n=>Array.isArray(n?.choices)?n.choices:[]);if(choices.length&&choices.filter(c=>c?.type==='action').length>choices.length/2)file='ACTION'}s.dialogueFileMap[sc.id]=file;changed=true}
if(changed)localStorage.setItem(K,JSON.stringify(s));localStorage.setItem(VK,'1');
})();