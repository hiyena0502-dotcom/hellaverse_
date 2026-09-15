(()=>{
'use strict';
if(window.__HELLAVERSE_ITEM_EVENT_BRIDGE_V1__)return;
window.__HELLAVERSE_ITEM_EVENT_BRIDGE_V1__=1;
const K='hellaverse_dialogue_state_v1';
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function rules(s){const out=[];const root=s.inventoryV1?.giftRules&&typeof s.inventoryV1.giftRules==='object'?s.inventoryV1.giftRules:{};for(const [itemId,chars] of Object.entries(root))for(const [characterId,rule] of Object.entries(chars&&typeof chars==='object'?chars:{}))if(rule&&typeof rule==='object')out.push({itemId,characterId,rule});return out}
function usesEvent(s,id){return rules(s).filter(({rule})=>String(rule.afterEvent||'')===id||split(rule.setFlags).includes(id)||split(rule.removeFlags).includes(id))}
function toast(msg){let root=document.querySelector('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}root.innerHTML=`<div class="toast">${String(msg).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</div>`;setTimeout(()=>{if(root)root.innerHTML=''},2200)}
function eventExists(s,id){return [s.events,s.eventCatalog].some(list=>Array.isArray(list)&&list.some(e=>String(e?.id||'')===String(id)))}
function replaceList(v,oldId,newId){const arr=split(v);return arr.map(x=>x===oldId?newId:x).join(', ')}
function renameReferences(oldId,newId){
  const s=read();if(!eventExists(s,newId)||eventExists(s,oldId))return;let changed=false;
  for(const {rule} of rules(s)){
    if(String(rule.afterEvent||'')===oldId){rule.afterEvent=newId;changed=true}
    const set=replaceList(rule.setFlags,oldId,newId);if(set!==String(rule.setFlags||'')){rule.setFlags=set;changed=true}
    const rem=replaceList(rule.removeFlags,oldId,newId);if(rem!==String(rule.removeFlags||'')){rule.removeFlags=rem;changed=true}
  }
  if(!changed)return;const value=JSON.stringify(s);localStorage.setItem(K,value);try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'item-event-bridge',clearDirty:false}}));toast('ITEM REACTION EVENT REFERENCES UPDATED')
}
window.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const del=t.closest('[data-delete-event-definition],[data-remove-orphan-event]');
  if(del){const id=del.dataset.deleteEventDefinition||del.dataset.removeOrphanEvent||'',used=usesEvent(read(),id);if(used.length){e.preventDefault();e.stopImmediatePropagation();toast(`EVENT IS USED BY ${used.length} ITEM REACTION${used.length===1?'':'S'}`);return}}
  if(t.closest('[data-save-event-definition]')){const oldId=String(document.querySelector('#eventOriginalId')?.value||'').trim(),newId=String(document.querySelector('#eventDefId')?.value||'').trim();if(oldId&&newId&&oldId!==newId)setTimeout(()=>renameReferences(oldId,newId),60)}
},true);
})();