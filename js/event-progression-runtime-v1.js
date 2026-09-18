(()=>{
'use strict';
if(window.__HELLAVERSE_EVENT_PROGRESSION_RUNTIME_V1__)return;
window.__HELLAVERSE_EVENT_PROGRESSION_RUNTIME_V1__=1;
const K='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
let queued=false,running=false;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);

function processCompletions(){
  if(running)return;
  running=true;
  try{
    const s=read();
    const history=Array.isArray(s.conversationHistory)?s.conversationHistory:[];
    const meta=s.dialogueMeta&&typeof s.dialogueMeta==='object'&&!Array.isArray(s.dialogueMeta)?s.dialogueMeta:{};
    const processed=new Set(Array.isArray(s.eventCompletionHistory)?s.eventCompletionHistory.map(String):[]);
    s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
    let changed=false,processedChanged=false;
    const nextProcessed=[...processed];

    for(const row of history){
      const hid=String(row?.id||'').trim();
      if(!hid||processed.has(hid))continue;
      const sceneId=String(row?.sceneId||'').trim();
      const events=split(meta?.[sceneId]?.completionEvents);
      for(const eventId of events){
        if(!s.flags[eventId]){
          s.flags[eventId]=true;
          changed=true;
        }
      }
      processed.add(hid);nextProcessed.push(hid);processedChanged=true;
    }

    if(processedChanged){
      s.eventCompletionHistory=nextProcessed.slice(-400);
      changed=true;
    }
    if(changed){
      const value=JSON.stringify(s);
      localStorage.setItem(K,value);
      try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value,storageArea:localStorage,url:location.href}))}catch{}
      window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'event-progression-runtime',clearDirty:false}}));
    }
  }catch(error){
    console.warn('Event progression completion scan skipped safely.',error);
  }finally{
    running=false;
  }
}
function schedule(ms=0){
  if(queued)return;
  queued=true;
  setTimeout(()=>{queued=false;processCompletions()},ms);
}

document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;
  if(!t)return;
  if(t.closest('.character-room .dialogue-box [data-choice],.character-room .dialogue-box [data-finish],.character-room .dialogue-box [data-end],.character-room .dialogue-box [data-single-beat-next]')){
    schedule(30);setTimeout(processCompletions,180);
  }
},false);
window.addEventListener('hellaverse:state-updated',e=>{
  if(e.detail?.source==='event-progression-runtime')return;
  schedule(0);
});
window.addEventListener('storage',e=>{if(e.key===K)schedule(0)});
new MutationObserver(ms=>{
  if(ms.some(m=>m.target===$('#app')||$('#app')?.contains(m.target)))schedule(80);
}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
window.addEventListener('load',()=>schedule(0));
})();