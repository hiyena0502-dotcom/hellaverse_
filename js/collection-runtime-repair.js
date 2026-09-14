(()=>{
if(window.__HELLAVERSE_COLLECTION_RUNTIME_REPAIR_V3__)return;
window.__HELLAVERSE_COLLECTION_RUNTIME_REPAIR_V3__=1;
const STATE_KEY='hellaverse_dialogue_state_v1';
const COLLECTION_UI_KEY='hellaverse_collection_view_v2';
const REVEAL_KEY='hellaverse_hotel_collection_groups_revealed_v1';
const PACK_VERSION_KEY='hellaverse_hotel_collection_pack_version';
const PACK_SCRIPT='js/hotel-collection-pack.js?v=2';
const HOTEL_CIDS=['charlie-morningstar','vaggie','alastor','angel-dust','husk','niffty','sir-pentious','cherri-bomb'];
const HOTEL_PREFIXES=HOTEL_CIDS.map(id=>`${id}-collection-`);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
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
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'collection-runtime-repair-v3'}}));
  window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source:'collection-runtime-repair-v3'}}));
  const host=$('.site-shell.page-collection .page.active');if(host)delete host.dataset.hvgSig;
  const app=$('#app');if(app){const mark=document.createElement('span');mark.hidden=true;mark.dataset.collectionRepair='1';app.appendChild(mark);mark.remove()}
}
function countPackItems(state=read()){
  const items=Array.isArray(state.collectionItems)?state.collectionItems:[];
  return items.filter(i=>HOTEL_PREFIXES.some(p=>String(i?.id||'').startsWith(p))).length;
}
function ensurePackLate(){
  if(countPackItems()>=80){nudge();return}
  try{localStorage.removeItem(PACK_VERSION_KEY)}catch{}
  document.querySelectorAll('script[data-hotel-pack-late]').forEach(x=>x.remove());
  const s=document.createElement('script');s.src=PACK_SCRIPT;s.async=false;s.dataset.hotelPackLate='1';
  s.onload=()=>{nudge();setTimeout(nudge,80);setTimeout(nudge,350)};
  s.onerror=()=>console.error('[Hellaverse] hotel collection pack reload failed');
  document.head.appendChild(s)
}
function collectionGiftCount(state=read()){
  const items=Array.isArray(state.collectionItems)?state.collectionItems:[];
  const owned=new Set((state.ownedItems||state.owned||[]).map(String));
  const cfg=state.collectionTransferConfig||{},counts=state.gachaAddon?.counts||{},ex=state.collectionExchange||{},granted=ex.grantedCounts||{},sent=ex.sentCounts||{};
  let n=0;
  for(const i of items){
    const id=String(i?.id||'');if(!id||!owned.has(id)||cfg[id]?.transferable===false)continue;
    let total=Math.max(0,Number(counts[id]||0))+Math.max(0,Number(granted[id]||0));
    if(total===0)total=1;
    if(total-Math.max(0,Number(sent[id]||0))>0)n++;
  }
  return n;
}
function patchGiftMenu(){
  const state=read(),cid=String(state.active||''),n=collectionGiftCount(state);
  $$('.character-room .dialogue-box').forEach(box=>{
    const text=String(box.textContent||'');
    const giftMode=/SELECT A GIFT|There is nothing to give yet|선물/i.test(text)||!!box.querySelector('[data-gift]');
    if(!giftMode||!cid)return;
    let b=box.querySelector('[data-ce-gift-launch]');
    if(!b){
      b=document.createElement('button');b.type='button';b.className='choice-option ce-gift-launch';b.dataset.ceGiftLaunch=cid;
      const list=box.querySelector('.choice-list');if(list)list.appendChild(b);else{const ret=box.querySelector('[data-end]');ret?ret.insertAdjacentElement('beforebegin',b):box.appendChild(b)}
    }
    b.innerHTML=`<b>◇</b><span>COLLECTION ITEM</span><small>${n} AVAILABLE</small>`;
    b.disabled=false;
  })
}
let q=false;function schedule(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;patchGiftMenu()})}
function boot(){ensurePackLate();patchGiftMenu();const app=$('#app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});setTimeout(()=>{ensurePackLate();patchGiftMenu()},500)}
if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
window.addEventListener('hellaverse:state-updated',schedule);
})();