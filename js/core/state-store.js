(()=>{
'use strict';
if(window.HVState)return;

const KEY='hellaverse_dialogue_state_v1';
const listeners=new Set();

function safeParse(raw,fallback={}){
  try{return raw?JSON.parse(raw):fallback}catch{return fallback}
}
function read(){return safeParse(localStorage.getItem(KEY),{})||{}}
function emit(source='unknown',state=null){
  const detail={source,state:state||read(),time:Date.now()};
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail}));
  for(const fn of [...listeners]){try{fn(detail.state,detail)}catch(err){console.error('[HVState listener]',err)}}
}
function write(next,{source='unknown',emitEvent=true}={}){
  const state=next&&typeof next==='object'?next:{};
  localStorage.setItem(KEY,JSON.stringify(state));
  if(emitEvent)emit(source,state);
  return state;
}
function update(mutator,options={}){
  const current=read();
  let next=current;
  try{const out=mutator(current);if(out&&typeof out==='object')next=out}catch(err){console.error('[HVState update]',err);throw err}
  return write(next,options);
}
function onChange(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn)}
function ensureArray(state,key){if(!Array.isArray(state[key]))state[key]=[];return state[key]}
function ensureObject(state,key){if(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key]))state[key]={};return state[key]}
function byId(list,id){return(Array.isArray(list)?list:[]).find(x=>String(x?.id||'')===String(id||''))||null}

window.addEventListener('storage',e=>{if(e.key===KEY)emit('storage',safeParse(e.newValue,{}))});
window.HVState={KEY,read,write,update,emit,onChange,safeParse,ensureArray,ensureObject,byId};
})();
