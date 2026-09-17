(()=>{
'use strict';
if(window.__HELLAVERSE_COLLECTION_RUNTIME_REPAIR_V4__)return;
window.__HELLAVERSE_COLLECTION_RUNTIME_REPAIR_V4__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const COLLECTION_UI_KEY='hellaverse_collection_view_v2';
const REVEAL_KEY='hellaverse_hotel_collection_groups_revealed_v1';
const PACK_VERSION_KEY='hellaverse_hotel_collection_pack_version';
const PACK_SCRIPT='js/hotel-collection-pack.js?v=2';
const HOTEL_CIDS=['charlie-morningstar','vaggie','alastor','angel-dust','husk','niffty','sir-pentious','cherri-bomb'];
const HOTEL_PREFIXES=HOTEL_CIDS.map(id=>`${id}-collection-`);
const $=(s,r=document)=>r.querySelector(s);

function read(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}}
function revealGroups(){
  let done='';try{done=localStorage.getItem(REVEAL_KEY)||''}catch{}
  if(done==='1')return;
  let ui={};try{ui=JSON.parse(localStorage.getItem(COLLECTION_UI_KEY)||'{}')||{}}catch{ui={}}
  ui.openGroups=ui.openGroups&&typeof ui.openGroups==='object'?ui.openGroups:{};
  HOTEL_CIDS.forEach(id=>ui.openGroups[id]=true);
  try{localStorage.setItem(COLLECTION_UI_KEY,JSON.stringify(ui));localStorage.setItem(REVEAL_KEY,'1')}catch{}
}
function nudge(){
  revealGroups();
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'collection-runtime-repair-v4'}}));
  window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source:'collection-runtime-repair-v4'}}));
  const host=$('.site-shell.page-collection .page.active');if(host)delete host.dataset.hvgSig;
}
function countPackItems(state=read()){
  const items=Array.isArray(state.collectionItems)?state.collectionItems:[];
  return items.filter(i=>HOTEL_PREFIXES.some(p=>String(i?.id||'').startsWith(p))).length;
}
function ensurePackLate(){
  if(countPackItems()>=80){nudge();return}
  try{localStorage.removeItem(PACK_VERSION_KEY)}catch{}
  document.querySelectorAll('script[data-hotel-pack-late]').forEach(x=>x.remove());
  const script=document.createElement('script');
  script.src=PACK_SCRIPT;script.async=false;script.dataset.hotelPackLate='1';
  script.onload=()=>{nudge();setTimeout(nudge,80);setTimeout(nudge,350)};
  script.onerror=()=>console.error('[Hellaverse] hotel collection pack reload failed');
  document.head.appendChild(script);
}
function boot(){ensurePackLate();setTimeout(ensurePackLate,500)}
if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();
