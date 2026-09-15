(()=>{
if(window.__HELLAVERSE_REMOVE_MANUAL_MEMORY_EDITOR_V1__)return;
window.__HELLAVERSE_REMOVE_MANUAL_MEMORY_EDITOR_V1__=1;

const K='hellaverse_dialogue_state_v1';
let queued=false,redirecting=false;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(state){
  localStorage.setItem(K,JSON.stringify(state));
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:localStorage.getItem(K)}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'memory-editor-removal',clearDirty:true}}));
}
function ensureStyle(){
  if($('#hvRemoveMemoryEditorStyle'))return;
  const style=document.createElement('style');
  style.id='hvRemoveMemoryEditorStyle';
  style.textContent='.editor-tabs [data-sec="memory"]{display:none!important}';
  document.head.appendChild(style);
}
function redirectFromMemorySection(){
  if(redirecting)return;
  const state=read();
  if(state.page!=='editor'||state.section!=='memory')return;
  redirecting=true;
  state.section='dialogue';
  if(state.draft&&typeof state.draft==='object')delete state.draft.memory;
  write(state);
  setTimeout(()=>{redirecting=false;schedule()},0);
}
function removeManualMemoryUI(){
  ensureStyle();
  $$('.editor-tabs [data-sec="memory"]').forEach(el=>el.remove());

  const editor=$('.editor-main');
  if(!editor)return;
  const memoryInput=$('#mTitle',editor);
  const card=memoryInput?.closest('.editor-card');
  if(card){
    redirectFromMemorySection();
    return;
  }
  $$('[data-save-mem],[data-new="memory"]',editor).forEach(el=>el.remove());
}
function enhance(){redirectFromMemorySection();removeManualMemoryUI()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
  const target=e.target instanceof Element?e.target:null;
  const memoryTab=target?.closest('[data-sec="memory"]');
  if(!memoryTab)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const state=read();state.page='editor';state.section='dialogue';
  if(state.draft&&typeof state.draft==='object')delete state.draft.memory;
  write(state);
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
