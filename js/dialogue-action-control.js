(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_ACTION_CONTROL_V2__)return;
window.__HELLAVERSE_DIALOGUE_ACTION_CONTROL_V2__=1;

const K='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const up=v=>String(v||'').trim().toUpperCase();
let queued=false,actionPending=false,conversationPending=false,bridge=false;

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function choices(sc){return(sc?.nodes||[]).flatMap(n=>Array.isArray(n?.choices)?n.choices:[])}
function fileOf(sc,state){
  const explicit=up(state?.dialogueFileMap?.[sc?.id]);
  if(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME'].includes(explicit))return explicit;
  const role=up(sc?.sceneRole||'');
  if(role==='ASK')return'QUESTION';
  if(['CONVERSATION','QUESTION','ACTION','ENTRY','EXIT','IDLE','HOME'].includes(role))return role;
  const kind=up(sc?.kind||'TALK');
  if(kind==='ASK')return'QUESTION';
  if(['ENTRY','EXIT','IDLE','HOME'].includes(kind))return kind;
  if(kind==='TALK'){
    const all=choices(sc);
    return all.length&&all.filter(c=>c?.type==='action').length>all.length/2?'ACTION':'CONVERSATION';
  }
  return'CONVERSATION';
}

function clickBridge(attrs){
  const host=$('.character-room')||$('#app')||document.body;
  const button=document.createElement('button');button.type='button';button.hidden=true;
  Object.entries(attrs).forEach(([key,value])=>value===''?button.setAttribute(key,''):button.setAttribute(key,String(value)));
  button.dataset.hvActionBridge='1';host.appendChild(button);bridge=true;
  try{button.click()}finally{bridge=false;button.remove()}
}

function ensureActionButton(){
  const box=$('.character-room .dialogue-box');if(!box)return;
  const page=$('[data-vn-page]',box);if(!page)return;
  const utility=$('.dialogue-utility',box);if(!utility||$('[data-hv-action]',utility))return;
  const ask=$('[data-vn-ask]',utility);
  const inventory=$('[data-inventory-open]',utility);
  const leave=$('[data-vn-leave]',utility);
  if(!ask&&!inventory&&!leave)return;
  const button=document.createElement('button');button.type='button';button.dataset.hvAction='1';button.textContent='ACTION';
  if(inventory)utility.insertBefore(button,inventory);
  else if(leave)utility.insertBefore(button,leave);
  else utility.appendChild(button);
}

function availableSceneButtons(box,mode){
  const state=read(),byId=new Map((state.dialogues||[]).map(sc=>[String(sc.id),sc]));
  return $$('[data-scene]',box).filter(button=>{
    if(button.disabled||button.classList.contains('locked')||button.hidden)return false;
    const scene=byId.get(String(button.dataset.scene||''));
    return !!scene&&fileOf(scene,state)===mode;
  }).map(button=>({button,scene:byId.get(String(button.dataset.scene||''))}));
}
function pickConversation(rows,state){
  if(!rows.length)return null;
  const cid=String(state.active||'');
  const recent=new Set(state.visits?.[cid]?.recentSceneIds||[]);
  const unseen=rows.filter(({scene})=>!scene.used&&!recent.has(scene.id));
  const nonRecent=rows.filter(({scene})=>!recent.has(scene.id));
  const pool=unseen.length?unseen:nonRecent.length?nonRecent:rows;
  let total=0;
  const weighted=pool.map(row=>{
    const base=Math.max(.1,Number(row.scene?.probability==null?100:row.scene.probability)/100);
    const priority=Math.max(.25,1+Number(row.scene?.priority||0));
    const weight=base*priority;total+=weight;return{...row,weight};
  });
  let n=Math.random()*Math.max(total,.0001);
  for(const row of weighted){n-=row.weight;if(n<=0)return row.button}
  return weighted.at(-1)?.button||pool[0]?.button||null;
}
function concealConversationPicker(box){
  if(!box)return;
  box.dataset.hvConversationAuto='1';
  box.style.visibility='hidden';
  box.style.pointerEvents='none';
}
function releaseConversationPicker(box){
  if(!box)return;
  box.style.removeProperty('visibility');
  box.style.removeProperty('pointer-events');
  delete box.dataset.hvConversationAuto;
}
function autoStartConversation(){
  if(!conversationPending)return false;
  const box=$('.character-room .dialogue-box');if(!box)return false;
  if($('[data-vn-page]',box)||$('.dialogue-lines',box)){
    conversationPending=false;releaseConversationPicker(box);return false;
  }
  const sceneButtons=$$('[data-scene]',box);if(!sceneButtons.length)return false;
  concealConversationPicker(box);
  const state=read(),target=pickConversation(availableSceneButtons(box,'CONVERSATION'),state);
  if(!target){
    conversationPending=false;
    const back=$('[data-end]',box);
    if(back){bridge=true;try{back.click()}finally{bridge=false}}
    else releaseConversationPicker(box);
    return true;
  }
  conversationPending=false;
  bridge=true;
  try{target.click()}finally{bridge=false}
  setTimeout(schedule,0);
  return true;
}

function openTalkPicker(){
  const room=$('.character-room');if(!room||!actionPending)return;
  const talk=$('[data-action="TALK"]',room);
  if(talk){bridge=true;try{talk.click()}finally{bridge=false}}
  setTimeout(schedule,0);
}
function beginActionPicker(){
  if(actionPending)return;
  conversationPending=false;
  actionPending=true;
  const box=$('.character-room .dialogue-box');
  if(box)clickBridge({'data-end':''});
  setTimeout(openTalkPicker,0);
  setTimeout(openTalkPicker,80);
}
function filterActionPicker(){
  if(!actionPending)return;
  const box=$('.character-room .dialogue-box');if(!box)return;
  const buttons=$$('[data-scene]',box);if(!buttons.length)return;
  const state=read(),byId=new Map((state.dialogues||[]).map(sc=>[String(sc.id),sc]));
  let count=0;
  for(const button of buttons){
    const scene=byId.get(String(button.dataset.scene||''));
    const visible=!!scene&&fileOf(scene,state)==='ACTION';
    button.hidden=!visible;button.style.display=visible?'':'none';if(visible)count++;
  }
  box.dataset.hvActionPicker='1';
  const speaker=$('.speaker',box);if(speaker)speaker.textContent='ACTION';
  let empty=$('[data-hv-action-empty]',box);
  if(!count){
    if(!empty){empty=document.createElement('p');empty.className='empty-state';empty.dataset.hvActionEmpty='1';empty.textContent='현재 사용할 수 있는 Action이 없습니다.';box.appendChild(empty)}
  }else empty?.remove();
}

function run(){
  ensureActionButton();
  if(autoStartConversation())return;
  filterActionPicker();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(bridge||target.closest('[data-hv-action-bridge]'))return;
  if(target.closest('[data-hv-action]')){
    event.preventDefault();event.stopImmediatePropagation();beginActionPicker();return;
  }
  const talk=target.closest('.character-room [data-action="TALK"]');
  if(talk&&!actionPending){
    conversationPending=true;
    setTimeout(schedule,0);
    return;
  }
  const scene=target.closest('[data-scene]');
  if(scene&&actionPending){
    const state=read(),sc=(state.dialogues||[]).find(x=>String(x.id)===String(scene.dataset.scene||''));
    if(sc&&fileOf(sc,state)==='ACTION')actionPending=false;
  }
  if(target.closest('[data-vn-leave],[data-page],[data-room],[data-runtime-return]')){
    actionPending=false;conversationPending=false;
  }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
