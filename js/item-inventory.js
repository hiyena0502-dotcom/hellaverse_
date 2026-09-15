(()=>{
'use strict';
if(window.__HELLAVERSE_ITEM_INVENTORY_V1__)return;
window.__HELLAVERSE_ITEM_INVENTORY_V1__=1;

const K='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const uid=(p='inventory')=>`${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp=v=>Math.max(0,Math.min(100,Number(v||0)));
const norm=v=>String(v||'').normalize('NFKC').trim().toLowerCase();
let open=false,targetId='',selectedId='',query='',filter='ALL',queued=false,syncing=false;

function readRaw(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function ensure(s){
  s.characters=Array.isArray(s.characters)?s.characters:[];
  s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
  s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);s.items=s.collectionItems;
  s.ownedItems=Array.isArray(s.ownedItems)?[...new Set(s.ownedItems.map(String))]:(Array.isArray(s.owned)?[...new Set(s.owned.map(String))]:[]);s.owned=s.ownedItems;
  s.newCollectionItems=Array.isArray(s.newCollectionItems)?[...new Set(s.newCollectionItems.map(String))]:[];
  s.affection=s.affection&&typeof s.affection==='object'?s.affection:{};
  s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
  s.visits=s.visits&&typeof s.visits==='object'?s.visits:{};
  s.memories=Array.isArray(s.memories)?s.memories:[];
  s.conversationHistory=Array.isArray(s.conversationHistory)?s.conversationHistory:[];
  const raw=s.inventoryV1&&typeof s.inventoryV1==='object'?s.inventoryV1:{};
  s.inventoryV1={version:1,initialized:raw.initialized===true,counts:raw.counts&&typeof raw.counts==='object'?raw.counts:{},gachaSeenCounts:raw.gachaSeenCounts&&typeof raw.gachaSeenCounts==='object'?raw.gachaSeenCounts:{},dialogueAcquired:raw.dialogueAcquired&&typeof raw.dialogueAcquired==='object'?raw.dialogueAcquired:{},giftRules:raw.giftRules&&typeof raw.giftRules==='object'?raw.giftRules:{},history:Array.isArray(raw.history)?raw.history:[]};
  return s;
}
function read(){return ensure(readRaw())}
function write(s,source='item-inventory'){
  s=ensure(s);const value=JSON.stringify(s);localStorage.setItem(K,value);
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
  return s;
}
function item(s,id){return s.collectionItems.find(x=>String(x?.id||'')===String(id||''))||null}
function itemName(i){return i?.name||i?.title||'Untitled Item'}
function char(s,id){return s.characters.find(x=>String(x?.id||'')===String(id||''))||null}
function charName(s,id){return char(s,id)?.name||'CHARACTER'}
function count(s,id){return Math.max(0,Number(s.inventoryV1.counts[String(id)]||0))}
function dialogueLinks(s,itemId){const out=[];for(const sc of s.dialogues)for(const node of sc.nodes||[])for(const ch of node.choices||[])if(String(ch?.unlockItemId||'')===String(itemId))out.push({scene:sc,node,choice:ch});return out}
function sourceType(s,i){const gacha=i?.gachaEnabled!==false,dialogue=dialogueLinks(s,i?.id).length>0;if(gacha&&dialogue)return'BOTH';if(dialogue)return'DIALOGUE';if(gacha)return'GACHA';return'OTHER'}
function sourceLabel(s,i){const t=sourceType(s,i);return t==='BOTH'?'GACHA + DIALOGUE':t==='DIALOGUE'?'DIALOGUE ONLY':t==='GACHA'?'GACHA ONLY':'SPECIAL'}
function initialize(){
  const s=read();if(s.inventoryV1.initialized)return syncGacha();
  const gc=s.gachaAddon?.counts&&typeof s.gachaAddon.counts==='object'?s.gachaAddon.counts:{};
  for(const [id,n] of Object.entries(gc)){const v=Math.max(0,Number(n||0));s.inventoryV1.counts[id]=Math.max(Number(s.inventoryV1.counts[id]||0),v);s.inventoryV1.gachaSeenCounts[id]=v}
  const legacy=s.giftInventory?.ownedCounts&&typeof s.giftInventory.ownedCounts==='object'?s.giftInventory.ownedCounts:{};
  for(const [id,n] of Object.entries(legacy))s.inventoryV1.counts[id]=Math.max(Number(s.inventoryV1.counts[id]||0),Math.max(0,Number(n||0)));
  for(const id of s.ownedItems)if(!(String(id) in s.inventoryV1.counts))s.inventoryV1.counts[String(id)]=1;
  s.inventoryV1.initialized=true;s.inventoryV1.history.unshift({id:uid('inventory-init'),type:'MIGRATED',at:new Date().toISOString()});s.inventoryV1.history=s.inventoryV1.history.slice(0,250);
  write(s,'item-inventory-init');
}
function syncGacha(){
  if(syncing)return;syncing=true;try{
    const s=read(),gc=s.gachaAddon?.counts&&typeof s.gachaAddon.counts==='object'?s.gachaAddon.counts:{};let changed=false,gained=[];
    const ids=new Set([...Object.keys(gc),...Object.keys(s.inventoryV1.gachaSeenCounts)]);
    for(const id of ids){const current=Math.max(0,Number(gc[id]||0)),seen=Math.max(0,Number(s.inventoryV1.gachaSeenCounts[id]||0));if(current<seen){s.inventoryV1.gachaSeenCounts[id]=current;changed=true;continue}const diff=current-seen;if(diff>0){s.inventoryV1.counts[id]=count(s,id)+diff;s.inventoryV1.gachaSeenCounts[id]=current;if(!s.ownedItems.includes(String(id)))s.ownedItems.push(String(id));if(!s.newCollectionItems.includes(String(id)))s.newCollectionItems.push(String(id));s.inventoryV1.history.unshift({id:uid('gacha-item'),type:'GACHA',itemId:String(id),amount:diff,at:new Date().toISOString()});gained.push(id);changed=true}}
    if(changed){s.inventoryV1.history=s.inventoryV1.history.slice(0,250);write(s,'item-inventory-gacha-sync')}
  }finally{syncing=false}
}
function findChoice(s,id){for(const sc of s.dialogues)for(const node of sc.nodes||[]){const ch=(node.choices||[]).find(x=>String(x?.id||'')===String(id||''));if(ch)return{scene:sc,node,choice:ch}}return null}
function acquireDialogue(choiceId){
  const s=read(),row=findChoice(s,choiceId),itemId=String(row?.choice?.unlockItemId||'');if(!itemId)return;const i=item(s,itemId);if(!i)return;
  const key=`${itemId}:${choiceId}`,repeatable=i.inventoryRepeatableAcquisition===true;if(!repeatable&&s.inventoryV1.dialogueAcquired[key]){setTimeout(()=>showAcquire(i,false,count(read(),itemId)),90);return}
  s.inventoryV1.counts[itemId]=count(s,itemId)+1;if(!repeatable)s.inventoryV1.dialogueAcquired[key]=new Date().toISOString();if(!s.ownedItems.includes(itemId))s.ownedItems.push(itemId);if(!s.newCollectionItems.includes(itemId))s.newCollectionItems.push(itemId);
  s.inventoryV1.history.unshift({id:uid('dialogue-item'),type:'DIALOGUE',itemId,characterId:row.scene?.characterId||'',sceneId:row.scene?.id||'',choiceId,amount:1,at:new Date().toISOString()});s.inventoryV1.history=s.inventoryV1.history.slice(0,250);write(s,'item-inventory-dialogue');setTimeout(()=>showAcquire(i,true,count(read(),itemId)),90);
}
function showAcquire(i,isNew,countNow){
  $('#inventoryAcquireNotice')?.remove();const root=document.createElement('div');root.id='inventoryAcquireNotice';root.className='inv-acquire-backdrop';root.innerHTML=`<section class="inv-acquire"><p class="label">${isNew?'ITEM ACQUIRED':'ALREADY COLLECTED'}</p><div class="inv-acquire-symbol">${esc(i.symbol||'◆')}</div><h2>${esc(itemName(i))}</h2><span>${esc(i.rarity||'COMMON')} · INVENTORY ×${countNow}</span><p>${esc(i.desc||i.description||i.memo||'아이템을 획득했습니다.')}</p><div><button class="ghost-button" data-inv-acquire-close>CONTINUE</button><button class="gold-button" data-inventory-open>OPEN INVENTORY</button></div></section>`;document.body.appendChild(root);
}
function legacyGiftRule(s,i,cid){
  const exact=(s.gifts||[]).find(g=>String(g?.characterId||'')===String(cid)&&norm(g?.name)===norm(itemName(i)));if(!exact)return null;
  return {opening:exact.opening||'',response:exact.response||'',affectionDelta:Number(exact.affectionDelta||0),setFlags:exact.setFlags||'',removeFlags:exact.removeFlags||'',moodChange:exact.moodChange||'',memoryTitle:exact.memoryTitle||'',memorySummary:exact.memorySummary||'',memoryTags:exact.memoryTags||''};
}
function giftRule(s,i,cid){
  const custom=s.inventoryV1.giftRules?.[String(i.id)]?.[String(cid)];if(custom)return custom;const legacy=legacyGiftRule(s,i,cid);if(legacy)return legacy;
  const own=String(i.characterId||'')===String(cid),target=charName(s,cid);return {opening:`「${itemName(i)}」을 ${target}에게 건넸다.`,response:own&&String(i.gachaLine||'').trim()?String(i.gachaLine).trim():`${target}가 「${itemName(i)}」을 받아 든다.`,affectionDelta:own?2:1,setFlags:'',removeFlags:'',moodChange:'',memoryTitle:`GIFT: ${itemName(i)}`,memorySummary:`${target}에게 「${itemName(i)}」을 선물했다.`,memoryTags:`gift, ${i.id}`};
}
function setFlags(s,value,on=true){for(const f of split(value)){if(on)s.flags[f]=true;else delete s.flags[f]}}
function give(id){
  let s=read(),i=item(s,id);if(!i||count(s,id)<1)return toast('이 아이템은 현재 보유하고 있지 않습니다.');const cid=targetId||s.active||'',c=char(s,cid);if(!c)return toast('선물을 받을 캐릭터를 찾을 수 없습니다.');const rule=giftRule(s,i,cid),delta=Number(rule.affectionDelta||0),before=clamp(s.affection?.[cid]?.value??s.affection?.[cid]??0),after=clamp(before+delta),now=new Date().toISOString();
  s.inventoryV1.counts[id]=Math.max(0,count(s,id)-1);s.affection[cid]={...(s.affection[cid]&&typeof s.affection[cid]==='object'?s.affection[cid]:{}),value:after};s.visits[cid]={firstMet:'',visitCount:0,lastVisitDate:'',conversationsCount:0,giftsCount:0,recentSceneIds:[],...(s.visits[cid]||{})};s.visits[cid].giftsCount=Number(s.visits[cid].giftsCount||0)+1;setFlags(s,rule.setFlags,true);setFlags(s,rule.removeFlags,false);if(rule.moodChange){s.moods=s.moods&&typeof s.moods==='object'?s.moods:{};s.moods[cid]=rule.moodChange}s.flags[`inventory.gift.${String(id).replace(/[^a-z0-9._-]+/gi,'-')}.${cid}`]=true;
  s.memories.unshift({id:uid('gift-memory'),characterId:cid,type:'event',title:rule.memoryTitle||`GIFT: ${itemName(i)}`,summary:rule.memorySummary||`${c.name}에게 「${itemName(i)}」을 선물했다.`,tags:split(rule.memoryTags||`gift,${id}`),sourceType:'inventoryGift',sourceId:String(id),importance:'normal',createdAt:now,pinned:false,hidden:false});
  const messages=[{speaker:'',text:rule.opening||`「${itemName(i)}」을 건넸다.`,type:'narration'}];if(rule.response)messages.push({speaker:String(c.name).toUpperCase(),text:String(rule.response),type:'speech'});s.conversationHistory.unshift({id:uid('inventory-gift'),characterId:cid,sceneId:`inventory-gift:${id}`,sceneTitle:`Gift: ${itemName(i)}`,startedAt:now,endedAt:now,messages});s.conversationHistory=s.conversationHistory.slice(0,150);
  s.inventoryV1.history.unshift({id:uid('gift-item'),type:'GIFTED',itemId:String(id),targetCharacterId:cid,heartBefore:before,heartAfter:after,delta,at:now});s.inventoryV1.history=s.inventoryV1.history.slice(0,250);write(s,'item-inventory-gift');showGiftResult(i,c,rule,delta,count(read(),id));
}
function showGiftResult(i,c,rule,delta,left){
  $('#inventoryGiftResult')?.remove();const root=document.createElement('div');root.id='inventoryGiftResult';root.className='inv-gift-result-backdrop';root.innerHTML=`<section class="inv-gift-result"><p class="label">GIFT</p><div class="inv-acquire-symbol">${esc(i.symbol||'◆')}</div><h2>${esc(itemName(i))}</h2>${rule.opening?`<p class="inv-narration">${esc(rule.opening)}</p>`:''}${rule.response?`<blockquote><strong>${esc(c.name)}</strong>${esc(rule.response)}</blockquote>`:''}<div class="inv-result-meta"><span>HEART <b>${delta>0?'+':''}${delta}</b></span><span>LEFT <b>×${left}</b></span></div><button class="gold-button" data-inv-gift-continue>CONTINUE CONVERSATION</button></section>`;document.body.appendChild(root);closeInventory();
}
function inventoryItems(s){
  const owned=new Set(s.ownedItems.map(String));let rows=s.collectionItems.filter(i=>owned.has(String(i.id))||count(s,i.id)>0);const q=query.trim().toLowerCase();if(q)rows=rows.filter(i=>[itemName(i),i.desc,i.description,i.rarity,charName(s,i.characterId)].join(' ').toLowerCase().includes(q));if(filter!=='ALL')rows=rows.filter(i=>sourceType(s,i)===filter);return rows;
}
function listMarkup(s){const rows=inventoryItems(s);return rows.length?rows.map(i=>`<button type="button" class="inv-item ${String(i.id)===String(selectedId)?'selected':''}" data-inv-select="${esc(i.id)}"><span>${esc(i.symbol||'◆')}</span><span><strong>${esc(itemName(i))}</strong><small>${esc(i.rarity||'COMMON')} · ${esc(sourceLabel(s,i))}</small></span><em>×${count(s,i.id)}</em></button>`).join(''):'<div class="inv-empty"><span>◇</span><p>아직 획득한 아이템이 없습니다.</p></div>'}
function detailMarkup(s,i){if(!i)return`<div class="inv-empty-detail"><span>◇</span><h2>아이템을 선택하세요.</h2></div>`;const n=count(s,i.id),c=charName(s,targetId||s.active),rule=giftRule(s,i,targetId||s.active);return`<section class="inv-detail"><header><div class="inv-big-symbol">${esc(i.symbol||'◆')}</div><div><small>${esc(i.rarity||'COMMON')} · ${esc(sourceLabel(s,i))}</small><h2>${esc(itemName(i))}</h2><p>${esc(i.desc||i.description||i.memo||'설명이 없습니다.')}</p></div></header><dl><div><dt>INVENTORY</dt><dd>×${n}</dd></div><div><dt>COLLECTION</dt><dd>UNLOCKED</dd></div><div><dt>RELATED</dt><dd>${esc(charName(s,i.characterId))}</dd></div></dl><section class="inv-gift-preview"><small>GIFT TO ${esc(c).toUpperCase()}</small><p>${esc(rule.response||'캐릭터 반응')}</p><span>예상 HEART ${Number(rule.affectionDelta||0)>0?'+':''}${Number(rule.affectionDelta||0)}</span></section><button class="gold-button inv-give" data-inv-give="${esc(i.id)}" ${n>0?'':'disabled'}>${n>0?`GIVE TO ${esc(c).toUpperCase()}`:'NO ITEM LEFT'}</button></section>`}
function overlayMarkup(s){const active=charName(s,targetId||s.active),total=Object.values(s.inventoryV1.counts).reduce((a,v)=>a+Math.max(0,Number(v||0)),0),unique=Object.values(s.inventoryV1.counts).filter(v=>Number(v)>0).length,sel=item(s,selectedId);return`<div class="inv-backdrop" data-inv-backdrop><section class="inv-shell"><header class="inv-head"><div><small>ITEM INVENTORY</small><h1>${esc(active)}</h1><p>Collection Item을 보관하고, 원하는 아이템을 골라 캐릭터에게 선물할 수 있습니다.</p></div><div class="inv-stats"><span>ITEMS <b>${unique}</b></span><span>TOTAL <b>${total}</b></span></div><button data-inv-close aria-label="Close">×</button></header><div class="inv-toolbar"><input type="search" data-inv-search value="${esc(query)}" placeholder="Search items..."><div>${['ALL','GACHA','DIALOGUE','BOTH'].map(x=>`<button class="${filter===x?'active':''}" data-inv-filter="${x}">${x}</button>`).join('')}</div></div><div class="inv-layout"><aside><div class="inv-list">${listMarkup(s)}</div></aside><main>${detailMarkup(s,sel)}</main></div></section></div>`}
function openInventory(){const s=read();targetId=String(s.active||targetId||'');open=true;const rows=inventoryItems(s);if(!selectedId||!item(s,selectedId))selectedId=rows[0]?.id||'';let root=$('#itemInventoryRoot');if(!root){root=document.createElement('div');root.id='itemInventoryRoot';document.body.appendChild(root)}root.innerHTML=overlayMarkup(s);document.body.classList.add('inventory-open');$('#inventoryAcquireNotice')?.remove()}
function closeInventory(){open=false;document.body.classList.remove('inventory-open');$('#itemInventoryRoot')?.remove()}
function rerender(){if(open){const root=$('#itemInventoryRoot');if(root)root.innerHTML=overlayMarkup(read())}}
function toast(msg){let root=$('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}root.innerHTML=`<div class="toast">${esc(msg)}</div>`;setTimeout(()=>{if(root)root.innerHTML=''},1700)}
function injectButtons(){
  const room=$('.character-room');if(!room)return;
  const hud=$('.room-hud',room);if(hud&&!$('[data-inventory-open]',hud)){const b=document.createElement('button');b.type='button';b.className='inventory-room-button';b.dataset.inventoryOpen='1';b.textContent='INVENTORY';const settings=$('[data-page="settings"]',hud);settings?hud.insertBefore(b,settings):hud.appendChild(b)}
  for(const util of $$('.dialogue-utility',room))if(!$('[data-inventory-open]',util)){const b=document.createElement('button');b.type='button';b.dataset.inventoryOpen='1';b.textContent='INVENTORY';const log=$('[data-vn-log]',util);log?log.after(b):util.prepend(b)}
}
function enhance(){injectButtons();if(open&&!$('#itemInventoryRoot'))open=false}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const choice=t.closest('[data-choice]');if(choice)acquireDialogue(choice.dataset.choice);
  if(t.closest('[data-inventory-open]')){e.preventDefault();e.stopImmediatePropagation();openInventory();return}
  if(t.closest('[data-inv-close]')||t.matches('[data-inv-backdrop]')){e.preventDefault();closeInventory();return}
  const sel=t.closest('[data-inv-select]');if(sel){e.preventDefault();selectedId=sel.dataset.invSelect;rerender();return}
  const f=t.closest('[data-inv-filter]');if(f){e.preventDefault();filter=f.dataset.invFilter;const s=read(),rows=inventoryItems(s);if(!rows.some(i=>String(i.id)===String(selectedId)))selectedId=rows[0]?.id||'';rerender();return}
  const give=t.closest('[data-inv-give]');if(give){e.preventDefault();e.stopImmediatePropagation();give(give.dataset.invGive);return}
  if(t.closest('[data-inv-acquire-close]')){e.preventDefault();$('#inventoryAcquireNotice')?.remove();return}
  if(t.closest('[data-inv-gift-continue]')){e.preventDefault();$('#inventoryGiftResult')?.remove();return}
},true);
document.addEventListener('input',e=>{const t=e.target;if(t.matches?.('[data-inv-search]')){query=t.value;const s=read(),rows=inventoryItems(s);if(!rows.some(i=>String(i.id)===String(selectedId)))selectedId=rows[0]?.id||'';rerender()}},true);
window.addEventListener('hellaverse:gacha-updated',()=>setTimeout(syncGacha,0));
window.addEventListener('hellaverse:state-updated',e=>{if(!String(e.detail?.source||'').startsWith('item-inventory')&&e.detail?.source==='gacha-collection')setTimeout(syncGacha,0);schedule()});
window.addEventListener('storage',e=>{if(e.key===K)schedule()});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);
initialize();if(document.readyState!=='loading')schedule();
})();