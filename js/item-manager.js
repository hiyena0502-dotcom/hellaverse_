(()=>{
'use strict';
if(window.__HELLAVERSE_ITEM_MANAGER_V1__)return;
window.__HELLAVERSE_ITEM_MANAGER_V1__=1;

const K='hellaverse_dialogue_state_v1';
const PREFS={LOVED:5,LIKED:3,NEUTRAL:1,DISLIKED:-2,HATED:-4};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
let open=false,query='',selectedItemId='',selectedCharacterId='',draft=null,queued=false;

function read(){
  let s={};try{s=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{}
  s.characters=Array.isArray(s.characters)?s.characters:[];
  s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);s.items=s.collectionItems;
  s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
  s.events=Array.isArray(s.events)?s.events:[];
  s.eventCatalog=Array.isArray(s.eventCatalog)?s.eventCatalog:[];
  const raw=s.inventoryV1&&typeof s.inventoryV1==='object'?s.inventoryV1:{};
  s.inventoryV1={...raw,version:1,counts:raw.counts&&typeof raw.counts==='object'?raw.counts:{},giftRules:raw.giftRules&&typeof raw.giftRules==='object'?raw.giftRules:{},history:Array.isArray(raw.history)?raw.history:[]};
  return s;
}
function write(s,source='item-manager'){
  const value=JSON.stringify(s);localStorage.setItem(K,value);
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}
}
function item(s,id){return s.collectionItems.find(x=>String(x?.id||'')===String(id||''))||null}
function char(s,id){return s.characters.find(x=>String(x?.id||'')===String(id||''))||null}
function itemName(i){return i?.name||i?.title||'Untitled Item'}
function charName(s,id){return char(s,id)?.name||'CHARACTER'}
function rulesFor(s,itemId){const root=s.inventoryV1.giftRules?.[String(itemId)];return root&&typeof root==='object'?root:{}}
function currentRule(s,itemId,cid){return rulesFor(s,itemId)[String(cid)]||null}
function eventRows(s){
  const map=new Map();
  for(const list of [s.events,s.eventCatalog])for(const e of list){const id=String(e?.id||'').trim();if(!id)continue;const old=map.get(id)||{};map.set(id,{id,name:e.name||e.title||old.name||id,type:e.type||old.type||'STATE'})}
  for(const id of Object.keys(s.flags||{}))if(!map.has(id))map.set(id,{id,name:id,type:'ACTIVE'});
  return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));
}
function defaultRule(s,i,cid){
  const own=String(i?.characterId||'')===String(cid||''),name=charName(s,cid);
  return {preference:own?'LIKED':'NEUTRAL',affectionDelta:own?3:1,opening:`「${itemName(i)}」을 ${name}에게 건넸다.`,response:'',afterEvent:'',setFlags:'',removeFlags:'',moodChange:'',memoryTitle:`GIFT: ${itemName(i)}`,memorySummary:`${name}에게 「${itemName(i)}」을 선물했다.`,memoryTags:`gift, ${i?.id||''}`};
}
function makeDraft(s,i,cid){return {...defaultRule(s,i,cid),...(currentRule(s,i?.id,cid)||{})}}
function configuredCount(s,itemId){return Object.keys(rulesFor(s,itemId)).filter(cid=>currentRule(s,itemId,cid)).length}
function sourceLabel(i){if(i?.gachaEnabled===false)return'DIALOGUE / SPECIAL';return'COLLECTION ITEM'}
function itemList(s){
  const q=query.trim().toLowerCase();const rows=s.collectionItems.filter(i=>!q||[itemName(i),i.rarity,i.desc,i.description,charName(s,i.characterId)].join(' ').toLowerCase().includes(q));
  return rows.length?rows.map(i=>`<button type="button" class="itm-item ${String(i.id)===String(selectedItemId)?'selected':''}" data-itm-item="${esc(i.id)}"><span>${esc(i.symbol||'◆')}</span><span><strong>${esc(itemName(i))}</strong><small>${esc(i.rarity||'COMMON')} · ${esc(charName(s,i.characterId))}</small></span><em>${configuredCount(s,i.id)} REACTIONS</em></button>`).join(''):'<div class="itm-empty"><span>◇</span><p>검색 결과가 없습니다.</p></div>';
}
function charOptions(s,current){return s.characters.filter(c=>!c.hidden).map(c=>`<option value="${esc(c.id)}" ${String(c.id)===String(current)?'selected':''}>${esc(c.name)}</option>`).join('')}
function eventOptions(s,current){const rows=eventRows(s);return `<option value="">NONE</option>${rows.map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(current)?'selected':''}>${esc(e.name)} · ${esc(e.id)}</option>`).join('')}`}
function configuredChips(s,i){
  const rules=rulesFor(s,i.id),ids=Object.keys(rules).filter(cid=>char(s,cid));
  if(!ids.length)return'<span class="itm-none">아직 전용 반응 없음</span>';
  return ids.map(cid=>`<button type="button" class="itm-char-chip ${cid===selectedCharacterId?'active':''}" data-itm-char-chip="${esc(cid)}">${esc(charName(s,cid))}<small>${esc(String(rules[cid]?.preference||'CUSTOM'))}</small></button>`).join('');
}
function editor(s,i){
  if(!i)return'<section class="itm-empty-editor"><span>◇</span><h2>아이템을 선택하세요.</h2><p>Collection Item마다 캐릭터별 선물 반응을 설정할 수 있습니다.</p></section>';
  if(!selectedCharacterId||!char(s,selectedCharacterId))selectedCharacterId=s.active||s.characters.find(c=>!c.hidden)?.id||'';
  if(!draft)draft=makeDraft(s,i,selectedCharacterId);
  const custom=!!currentRule(s,i.id,selectedCharacterId),d=draft,character=charName(s,selectedCharacterId),events=eventRows(s);
  const eventValid=!d.afterEvent||events.some(e=>e.id===d.afterEvent);
  return `<section class="itm-editor">
    <header class="itm-editor-head"><div class="itm-item-mark">${esc(i.symbol||'◆')}</div><div><small>${esc(i.rarity||'COMMON')} · ${esc(sourceLabel(i))}</small><h2>${esc(itemName(i))}</h2><p>${esc(i.desc||i.description||i.memo||'설명이 없습니다.')}</p></div><span class="itm-rule-status ${custom?'custom':''}">${custom?'CUSTOM':'DEFAULT'}</span></header>
    <section class="itm-character-bar"><label>REACTION FOR<select id="itmCharacter">${charOptions(s,selectedCharacterId)}</select></label><div class="itm-configured">${configuredChips(s,i)}</div></section>
    <section class="itm-section"><div class="itm-section-head"><strong>REACTION</strong><small>가장 자주 쓰는 설정</small></div>
      <div class="itm-pref-row">${Object.entries(PREFS).map(([key,val])=>`<button type="button" class="itm-pref ${String(d.preference)===key?'active':''}" data-itm-pref="${key}"><b>${key}</b><small>${val>0?'+':''}${val}</small></button>`).join('')}</div>
      <div class="itm-grid"><label>HEART CHANGE<input id="itmDelta" type="number" min="-100" max="100" value="${esc(d.affectionDelta)}"><small>프리셋 선택 후 직접 수정할 수 있습니다.</small></label><label>AFTER EVENT<select id="itmAfterEvent" class="${eventValid?'':'invalid'}">${eventOptions(s,d.afterEvent)}</select><small>${eventValid?'선물 반응 직후 활성화됩니다.':'현재 Event Manager에 없는 Event입니다.'}</small></label><label class="full">OPENING / ACTION<textarea id="itmOpening" rows="2" placeholder="예: 당신은 사탄의 문진을 내민다.">${esc(d.opening||'')}</textarea></label><label class="full">CHARACTER RESPONSE<textarea id="itmResponse" rows="5" placeholder="이 아이템을 받았을 때의 전용 반응 대사">${esc(d.response||'')}</textarea></label></div>
    </section>
    <details class="itm-details"><summary>ADVANCED · EVENT / MOOD / MEMORY <small>필요할 때만 펼치기</small></summary><div class="itm-grid">
      <label>ADDITIONAL SET EVENTS<input id="itmSetFlags" value="${esc(d.setFlags||'')}" placeholder="event.id, event.id"></label><label>REMOVE EVENTS<input id="itmRemoveFlags" value="${esc(d.removeFlags||'')}" placeholder="event.id"></label>
      <label>MOOD CHANGE<select id="itmMood"><option value="">NO CHANGE</option>${['GOOD','NORMAL','TIRED','ANNOYED','SAD','EXCITED'].map(x=>`<option ${String(d.moodChange)===x?'selected':''}>${x}</option>`).join('')}</select></label><label>MEMORY TAGS<input id="itmMemoryTags" value="${esc(d.memoryTags||'')}"></label>
      <label class="full">MEMORY TITLE<input id="itmMemoryTitle" value="${esc(d.memoryTitle||'')}"></label><label class="full">MEMORY SUMMARY<textarea id="itmMemorySummary" rows="2">${esc(d.memorySummary||'')}</textarea></label>
    </div></details>
    <section class="itm-preview"><div><small>PREVIEW · ${esc(character.toUpperCase())}</small><p>${esc(d.opening||`「${itemName(i)}」을 건넨다.`)}</p>${d.response?`<blockquote><strong>${esc(character)}</strong>${esc(d.response)}</blockquote>`:'<blockquote class="muted">전용 반응 대사가 비어 있습니다.</blockquote>'}</div><div><span>${esc(d.preference||'NEUTRAL')}</span><b>HEART ${Number(d.affectionDelta||0)>0?'+':''}${Number(d.affectionDelta||0)}</b>${d.afterEvent?`<small>→ ${esc(d.afterEvent)}</small>`:''}</div></section>
    <footer class="itm-actions"><button type="button" class="ghost-button danger" data-itm-reset ${custom?'':'disabled'}>RESET TO DEFAULT</button><button type="button" class="ghost-button" data-itm-preview>PREVIEW</button><button type="button" class="gold-button" data-itm-save>SAVE REACTION</button></footer>
  </section>`;
}
function shell(s){const i=item(s,selectedItemId),total=s.collectionItems.length,configured=s.collectionItems.reduce((n,row)=>n+configuredCount(s,row.id),0);return `<div class="itm-backdrop" data-itm-backdrop><section class="itm-shell"><header class="itm-head"><div><small>ITEM SYSTEM</small><h1>ITEM MANAGER</h1><p>Collection Item의 캐릭터별 선물 반응, 호감도, Event를 관리합니다.</p></div><div class="itm-stats"><span>ITEMS <b>${total}</b></span><span>REACTIONS <b>${configured}</b></span></div><button type="button" data-itm-close aria-label="Close">×</button></header><div class="itm-layout"><aside><input type="search" data-itm-search value="${esc(query)}" placeholder="Search item..."><div class="itm-list">${itemList(s)}</div></aside><main>${editor(s,i)}</main></div></section></div>`}
function collect(){
  if(!draft)return null;return {...draft,preference:String(draft.preference||'NEUTRAL'),affectionDelta:Number($('#itmDelta')?.value||0),opening:$('#itmOpening')?.value||'',response:$('#itmResponse')?.value||'',afterEvent:$('#itmAfterEvent')?.value||'',setFlags:$('#itmSetFlags')?.value||'',removeFlags:$('#itmRemoveFlags')?.value||'',moodChange:$('#itmMood')?.value||'',memoryTitle:$('#itmMemoryTitle')?.value||'',memorySummary:$('#itmMemorySummary')?.value||'',memoryTags:$('#itmMemoryTags')?.value||''};
}
function openManager(){
  const s=read();open=true;if(!selectedItemId||!item(s,selectedItemId))selectedItemId=s.collectionItems[0]?.id||'';if(!selectedCharacterId||!char(s,selectedCharacterId))selectedCharacterId=s.active||s.characters.find(c=>!c.hidden)?.id||'';draft=selectedItemId?makeDraft(s,item(s,selectedItemId),selectedCharacterId):null;let root=$('#itemManagerRoot');if(!root){root=document.createElement('div');root.id='itemManagerRoot';document.body.appendChild(root)}root.innerHTML=shell(s);document.body.classList.add('itm-open')
}
function closeManager(){open=false;draft=null;document.body.classList.remove('itm-open');$('#itemManagerRoot')?.remove()}
function rerender(){if(!open)return;const root=$('#itemManagerRoot');if(root)root.innerHTML=shell(read())}
function saveRule(){
  const s=read(),i=item(s,selectedItemId),c=char(s,selectedCharacterId);if(!i||!c)return toast('ITEM / CHARACTER REQUIRED');const next=collect();if(!next)return;
  const validEvents=new Set(eventRows(s).map(e=>e.id));if(next.afterEvent&&!validEvents.has(next.afterEvent))return toast('AFTER EVENT NOT FOUND');
  const set=[...new Set([next.afterEvent,...split(next.setFlags)].filter(Boolean))];next.setFlags=set.join(', ');next.updatedAt=new Date().toISOString();
  s.inventoryV1.giftRules[String(i.id)]=s.inventoryV1.giftRules[String(i.id)]&&typeof s.inventoryV1.giftRules[String(i.id)]==='object'?s.inventoryV1.giftRules[String(i.id)]:{};s.inventoryV1.giftRules[String(i.id)][String(c.id)]=next;write(s,'item-manager-save');draft={...next};rerender();toast('REACTION SAVED')
}
function resetRule(){const s=read(),i=item(s,selectedItemId);if(!i)return;const root=s.inventoryV1.giftRules?.[String(i.id)];if(root)delete root[String(selectedCharacterId)];write(s,'item-manager-reset');draft=makeDraft(read(),item(read(),selectedItemId),selectedCharacterId);rerender();toast('DEFAULT REACTION RESTORED')}
function preview(){const s=read(),i=item(s,selectedItemId),c=char(s,selectedCharacterId),d=collect();if(!i||!c||!d)return;$('#itmPreviewRoot')?.remove();const root=document.createElement('div');root.id='itmPreviewRoot';root.className='itm-preview-backdrop';root.innerHTML=`<section class="itm-preview-modal"><p class="label">GIFT PREVIEW</p><div class="itm-preview-symbol">${esc(i.symbol||'◆')}</div><h2>${esc(itemName(i))}</h2>${d.opening?`<p class="itm-preview-action">${esc(d.opening)}</p>`:''}${d.response?`<blockquote><strong>${esc(c.name)}</strong>${esc(d.response)}</blockquote>`:'<p class="muted">전용 반응 대사가 없습니다.</p>'}<div class="itm-preview-meta"><span>${esc(d.preference)}</span><b>HEART ${Number(d.affectionDelta)>0?'+':''}${Number(d.affectionDelta||0)}</b>${d.afterEvent?`<small>EVENT → ${esc(d.afterEvent)}</small>`:''}</div><button class="gold-button" data-itm-preview-close>CLOSE</button></section>`;document.body.appendChild(root)}
function toast(msg){let root=$('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}root.innerHTML=`<div class="toast">${esc(msg)}</div>`;setTimeout(()=>{if(root)root.innerHTML=''},1700)}
function injectButtons(){
  for(const menu of $$('.admin-menu'))if(!$('[data-itm-open]',menu)){const b=document.createElement('button');b.type='button';b.dataset.itmOpen='1';b.textContent='ITEM MANAGER';menu.prepend(b)}
  const side=$('.editor-sidebar');if(side&&!$('[data-itm-open]',side)){const b=document.createElement('button');b.type='button';b.className='ghost-button itm-editor-open';b.dataset.itmOpen='1';b.textContent='ITEM MANAGER';side.appendChild(b)}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;injectButtons()})}

document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-itm-open]')){e.preventDefault();e.stopImmediatePropagation();openManager();return}
  if(t.closest('[data-itm-close]')||t.matches('[data-itm-backdrop]')){e.preventDefault();closeManager();return}
  const ib=t.closest('[data-itm-item]');if(ib){e.preventDefault();selectedItemId=ib.dataset.itmItem;draft=makeDraft(read(),item(read(),selectedItemId),selectedCharacterId);rerender();return}
  const cb=t.closest('[data-itm-char-chip]');if(cb){e.preventDefault();selectedCharacterId=cb.dataset.itmCharChip;draft=makeDraft(read(),item(read(),selectedItemId),selectedCharacterId);rerender();return}
  const p=t.closest('[data-itm-pref]');if(p){e.preventDefault();draft=collect()||draft;draft.preference=p.dataset.itmPref;draft.affectionDelta=PREFS[draft.preference];rerender();return}
  if(t.closest('[data-itm-save]')){e.preventDefault();saveRule();return}
  if(t.closest('[data-itm-reset]')){e.preventDefault();resetRule();return}
  if(t.closest('[data-itm-preview]')){e.preventDefault();preview();return}
  if(t.closest('[data-itm-preview-close]')){e.preventDefault();$('#itmPreviewRoot')?.remove();return}
},true);
document.addEventListener('input',e=>{const t=e.target;if(t.matches?.('[data-itm-search]')){query=t.value;const list=$('.itm-list');if(list)list.innerHTML=itemList(read())}},true);
document.addEventListener('change',e=>{const t=e.target;if(!open)return;if(t.id==='itmCharacter'){draft=collect()||draft;selectedCharacterId=t.value;draft=makeDraft(read(),item(read(),selectedItemId),selectedCharacterId);rerender()}},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hellaverse:state-updated',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();