(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_REPAIR_ROLLBACK_V1__)return;
window.__HELLAVERSE_DIALOGUE_REPAIR_ROLLBACK_V1__=1;
const KEY='hellaverse_dialogue_state_v1',PARTS=11,BASE='js/default-content/default-content-v2.part';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function write(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
function b64(v){const bin=atob(String(v||'').replace(/\s+/g,'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
async function inflate(bytes){const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));return new Response(stream).text()}
async function loadCanonical(){const parts=await Promise.all(Array.from({length:PARTS},(_,i)=>fetch(`${BASE}${i+1}.txt?v=3`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.text()})));return JSON.parse(await inflate(b64(parts.join(''))))}
(async()=>{
  const state=read(),targets=(state.dialogues||[]).filter(s=>s&&s._repairLuciferEarly02V1).map(s=>String(s.id||'')).filter(Boolean);
  if(!targets.length)return;
  try{
    const canonical=await loadCanonical(),byId=new Map((canonical.dialogues||[]).map(s=>[String(s?.id||''),s]));let changed=false;
    state.dialogues=(state.dialogues||[]).map(local=>{
      if(!targets.includes(String(local?.id||'')))return local;
      const original=byId.get(String(local.id));if(!original)return local;
      changed=true;const used=local.used;
      const restored=JSON.parse(JSON.stringify(original));if(used!==undefined)restored.used=used;
      return restored;
    });
    if(changed&&write(state))window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'dialogue-repair-rollback'}}));
  }catch(error){console.warn('Temporary dialogue repair rollback skipped safely.',error)}
})();
})();
