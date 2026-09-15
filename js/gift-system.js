(()=>{
'use strict';
if(window.__HELLAVERSE_GIFT_INVENTORY_V1__)return;
window.__HELLAVERSE_GIFT_INVENTORY_V1__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const PREFS={LOVED:5,LIKED:3,NEUTRAL:1,DISLIKED:-2,HATED:-4};
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clamp=value=>Math.max(0,Math.min(100,Number(value||0)));
const normalize=value=>String(value||'').normalize('NFKC').replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();

let managerQuery='';
let selectedItemId='';
let managerDraft=null;
let queued=false;

function read(){
  try{return ensure(JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{})}
  catch{return ensure({})}
}

function ensure(state){
  state.characters=Array.isArray(state.characters)?state.characters:[];
  state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
  state.collectionItems=Array.isArray(state.collectionItems)?state.collectionItems:(Array.isArray(state.items)?state.items:[]);
  state.items=state.collectionItems;
  state.ownedItems=Array.isArray(state.ownedItems)?[...new Set(state.ownedItems.map(String))]:[];
  state.newCollectionItems=Array.isArray(state.newCollectionItems)?[...new Set(state.newCollectionItems.map(String))]:[];
  state.affection=state.affection&&typeof state.affection==='object'?state.affection:{};
  state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};
  state.visits=state.visits&&typeof state.visits==='object'?state.visits:{};
  state.memories=Array.isArray(state.memories)?state.memories:[];
  state.conversationHistory=Array.isArray(state.conversationHistory)?state.conversationHistory:[];

  const rawInventory=state.giftInventory&&typeof state.giftInventory==='object'?state.giftInventory:{};
  state.giftInventory={
    version:1,
    ownedCounts:rawInventory.ownedCounts&&typeof rawInventory.ownedCounts==='object'?rawInventory.ownedCounts:{},
    acquiredChoiceIds:rawInventory.acquiredChoiceIds&&typeof rawInventory.acquiredChoiceIds==='object'?rawInventory.acquiredChoiceIds:{},
    history:Array.isArray(rawInventory.history)?rawInventory.history:[]
  };
  const rawConfig=state.giftInventoryConfig&&typeof state.giftInventoryConfig==='object'?state.giftInventoryConfig:{};
  state.giftInventoryConfig={
    version:1,
    items:rawConfig.items&&typeof rawConfig.items==='object'?rawConfig.items:{}
  };
  return state;
}

function write(state,source='gift-inventory'){
  state=ensure(state);
  const serialized=JSON.stringify(state);
  localStorage.setItem(STATE_KEY,serialized);
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,state,clearDirty:false}}));
  try{window.dispatchEvent(new StorageEvent('storage',{key:STATE_KEY,newValue:serialized}))}catch{}
  return state;
}

function character(state,id){return state.characters.find(row=>String(row?.id||'')===String(id||''))||null}
function collectionItem(state,id){return state.collectionItems.find(row=>String(row?.id||'')===String(id||''))||null}
function itemName(item){return item?.name||item?.title||'Untitled Item'}
function characterName(state,id){return character(state,id)?.name||'Unknown'}
function count(state,id){return Math.max(0,Number(state.giftInventory.ownedCounts[String(id)]||0))}
function config(state,id){return state.giftInventoryConfig.items[String(id)]||{}}

function allChoices(state,characterId='',sceneId=''){
  const rows=[];
  for(const scene of state.dialogues){
    if(characterId&&String(scene?.characterId||'')!==String(characterId))continue;
    if(sceneId&&String(scene?.id||'')!==String(sceneId))continue;
    for(const node of Array.isArray(scene?.nodes)?scene.nodes:[]){
      for(const choice of Array.isArray(node?.choices)?node.choices:[]){
        rows.push({scene,node,choice});
      }
    }
  }
  return rows;
}

function choiceLink(state,itemId){
  return allChoices(state).find(row=>String(row.choice?.unlockItemId||'')===String(itemId||''))||null;
}

function defaultDraft(state,item){
  const saved=config(state,item?.id),linked=choiceLink(state,item?.id);
  const sourceId=saved.sourceCharacterId||linked?.scene?.characterId||item?.characterId||state.active||state.characters[0]?.id||'';
  return{
    enabled:saved.enabled===true,
    sourceCharacterId:sourceId,
    targetCharacterId:saved.targetCharacterId||'lucifer-morningstar',
    sceneId:saved.sceneId||linked?.scene?.id||'',
    choiceId:saved.choiceId||linked?.choice?.id||'',
    reaction:saved.reaction||'',
    preference:String(saved.preference||'NEUTRAL').toUpperCase(),
    affectionDelta:Number.isFinite(Number(saved.affectionDelta))?Number(saved.affectionDelta):1,
    dialogueOnly:saved.dialogueOnly!==false,
    repeatableAcquisition:saved.repeatableAcquisition===true
  };
}

function availableForTarget(state,targetId){
  return state.collectionItems.filter(item=>{
    const setting=config(state,item.id);
    return setting.enabled===true&&String(setting.targetCharacterId||'')===String(targetId||'')&&count(state,item.id)>0;
  });
}

function renderGiftMenu(targetId){
  const state=read(),target=character(state,targetId),items=availableForTarget(state,targetId);
  const title=target?.name||'CHARACTER';
  if(!items.length){
    return `<p class="speaker">GIVE A GIFT</p><div class="hvgift-empty"><span>◇</span><strong>아직 줄 수 있는 선물이 없습니다.</strong><p>다른 캐릭터와 대화하며 특정 말이나 행동을 선택하면 선물을 획득할 수 있습니다.</p></div><button class="dialogue-return" data-end>BACK TO CONVERSATION</button>`;
  }
  return `<p class="speaker">GIFT INVENTORY · ${esc(title)}</p><p class="hvgift-menu-note">대화에서 직접 획득한 선물만 표시됩니다.</p><div class="choice-list hvgift-choice-list">${items.map((item,index)=>{const setting=config(state,item.id),source=characterName(state,setting.sourceCharacterId||item.characterId);return `<button class="choice-option hvgift-choice" type="button" data-hvgift-give="${esc(item.id)}" data-hvgift-target="${esc(targetId)}"><b>${String(index+1).padStart(2,'0')}</b><span>${esc(item.symbol||'◆')} ${esc(itemName(item))}</span><small>FROM ${esc(source)} · ×${count(state,item.id)}</small></button>`}).join('')}</div><button class="dialogue-return" data-end>BACK TO CONVERSATION</button>`;
}

function reactionFor(state,item,setting,targetId){
  const custom=String(setting.reaction||'').trim();
  if(custom)return custom;
  if(String(targetId)==='lucifer-morningstar'&&String(item.gachaLine||'').trim())return String(item.gachaLine).trim();
  return `${characterName(state,targetId)}가 「${itemName(item)}」을 받아든다.`;
}

function showNotice(markup,kind='notice'){
  $('#hvGiftNotice')?.remove();
  const root=document.createElement('div');
  root.id='hvGiftNotice';
  root.className='hvgift-notice-backdrop';
  root.dataset.hvgiftNoticeKind=kind;
  root.innerHTML=markup;
  document.body.appendChild(root);
}

function showAcquired(state,item,setting){
  const source=characterName(state,setting.sourceCharacterId||item.characterId);
  const target=characterName(state,setting.targetCharacterId);
  showNotice(`<section class="hvgift-notice"><p class="label">NEW GIFT ACQUIRED</p><div class="hvgift-notice-symbol">${esc(item.symbol||'◆')}</div><h2>${esc(itemName(item))}</h2><p><b>${esc(source)}</b>와의 대화에서 획득했습니다.</p><small>이제 ${esc(target)}의 GIFT 메뉴에 표시됩니다.</small><button class="gold-button" type="button" data-hvgift-notice-close>CONTINUE</button></section>`,'acquired');
}

function acquireFromChoice(itemId,choiceId){
  const state=read(),item=collectionItem(state,itemId),setting=config(state,itemId);
  if(!item||setting.enabled!==true||String(setting.choiceId||'')!==String(choiceId||''))return;
  if(!setting.repeatableAcquisition&&state.giftInventory.acquiredChoiceIds[choiceId])return;
  state.giftInventory.ownedCounts[itemId]=count(state,itemId)+1;
  if(!setting.repeatableAcquisition)state.giftInventory.acquiredChoiceIds[choiceId]=new Date().toISOString();
  if(!state.ownedItems.includes(String(itemId)))state.ownedItems.push(String(itemId));
  if(!state.newCollectionItems.includes(String(itemId)))state.newCollectionItems.push(String(itemId));
  state.giftInventory.history.unshift({id:`gift-acquired-${Date.now()}`,type:'ACQUIRED',itemId:String(itemId),sourceCharacterId:setting.sourceCharacterId||'',sceneId:setting.sceneId||'',choiceId:String(choiceId),at:new Date().toISOString()});
  state.giftInventory.history=state.giftInventory.history.slice(0,200);
  write(state,'gift-acquired');
  showAcquired(state,item,setting);
}

function giveItem(itemId,targetId){
  const state=read(),item=collectionItem(state,itemId),setting=config(state,itemId),available=count(state,itemId);
  if(!item||setting.enabled!==true||String(setting.targetCharacterId||'')!==String(targetId||'')||available<1)return;
  const target=character(state,targetId);if(!target)return;
  const delta=Number(setting.affectionDelta||0),before=clamp(state.affection?.[targetId]?.value||0),after=clamp(before+delta);
  const reaction=reactionFor(state,item,setting,targetId),source=characterName(state,setting.sourceCharacterId||item.characterId);
  state.giftInventory.ownedCounts[itemId]=available-1;
  state.affection[targetId]={...(state.affection[targetId]||{}),value:after};
  state.visits[targetId]={firstMet:'',visitCount:0,lastVisitDate:'',conversationsCount:0,giftsCount:0,recentSceneIds:[],...(state.visits[targetId]||{})};
  state.visits[targetId].giftsCount=Number(state.visits[targetId].giftsCount||0)+1;
  state.flags[`gift.${String(itemId).replace(/[^a-z0-9._-]+/gi,'-')}.given.${targetId}`]=true;
  const now=new Date().toISOString();
  state.giftInventory.history.unshift({id:`gift-given-${Date.now()}`,type:'GIVEN',itemId:String(itemId),sourceCharacterId:setting.sourceCharacterId||'',targetCharacterId:String(targetId),heartBefore:before,heartAfter:after,delta,at:now});
  state.giftInventory.history=state.giftInventory.history.slice(0,200);
  state.memories.unshift({id:`gift-memory-${Date.now()}`,characterId:String(targetId),type:'event',title:`GIFT: ${itemName(item)}`,summary:`${source}에게서 얻은 「${itemName(item)}」을 ${target.name}에게 건넸다.`,tags:['gift','dialogue-acquired',String(itemId)],sourceType:'giftInventory',sourceId:String(itemId),importance:'normal',createdAt:now,pinned:false,hidden:false});
  state.conversationHistory.unshift({id:`gift-history-${Date.now()}`,characterId:String(targetId),sceneId:`gift-inventory:${itemId}`,sceneTitle:`Gift: ${itemName(item)}`,startedAt:now,endedAt:now,messages:[{speaker:'YOU',text:`「${itemName(item)}」을 건넸다.`,type:'speech'},{speaker:String(target.name||'CHARACTER').toUpperCase(),text:reaction,type:'speech'}]});
  state.conversationHistory=state.conversationHistory.slice(0,150);
  write(state,'gift-given');
  showNotice(`<section class="hvgift-notice hvgift-result"><p class="label">GIFT</p><div class="hvgift-notice-symbol">${esc(item.symbol||'◆')}</div><h2>${esc(itemName(item))}</h2><p class="hvgift-route">${esc(source)} <span>→</span> ${esc(target.name)}</p><blockquote>${esc(reaction)}</blockquote><div class="hvgift-result-meta"><span>HEART <b>${delta>0?'+':''}${delta}</b></span><span>LEFT <b>×${Math.max(0,available-1)}</b></span></div><button class="gold-button" type="button" data-hvgift-return>BACK TO CONVERSATION</button></section>`,'result');
}

function scenesFor(state,characterId){
  return state.dialogues.filter(scene=>String(scene?.characterId||'')===String(characterId||'')&&['TALK','ASK'].includes(String(scene?.kind||'').toUpperCase()));
}

function option(value,label,current){return `<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`}
function characterOptions(state,current){return state.characters.filter(row=>!row.hidden).map(row=>option(row.id,row.name,current)).join('')}

function draftFromDom(){
  const root=$('#hvGiftManager');if(!root||!managerDraft)return managerDraft;
  return{
    ...managerDraft,
    enabled:!!$('#hvgiftEnabled',root)?.checked,
    sourceCharacterId:$('#hvgiftSource',root)?.value||'',
    targetCharacterId:$('#hvgiftTarget',root)?.value||'',
    sceneId:$('#hvgiftScene',root)?.value||'',
    choiceId:$('#hvgiftChoice',root)?.value||'',
    reaction:$('#hvgiftReaction',root)?.value||'',
    preference:$('#hvgiftPreference',root)?.value||'NEUTRAL',
    affectionDelta:Number($('#hvgiftDelta',root)?.value||0),
    dialogueOnly:!!$('#hvgiftDialogueOnly',root)?.checked,
    repeatableAcquisition:!!$('#hvgiftRepeatable',root)?.checked
  };
}

function itemListMarkup(state){
  const q=normalize(managerQuery).toLocaleLowerCase();
  const items=state.collectionItems.filter(item=>!q||[itemName(item),characterName(state,item.characterId),item.rarity].join(' ').toLocaleLowerCase().includes(q));
  return items.length?items.map(item=>{const setting=config(state,item.id),active=setting.enabled===true,owned=count(state,item.id),route=setting.targetCharacterId?`${characterName(state,setting.sourceCharacterId||item.characterId)} → ${characterName(state,setting.targetCharacterId)}`:`${characterName(state,item.characterId)} COLLECTION · ${item.rarity||'COMMON'}`;return `<button type="button" class="hvgift-manager-item ${String(item.id)===String(selectedItemId)?'selected':''}" data-hvgift-select="${esc(item.id)}"><span>${esc(item.symbol||'◆')}</span><span><strong>${esc(itemName(item))}</strong><small>${esc(route)}</small></span><em>${active?owned?`×${owned}`:'ACTIVE':'OFF'}</em></button>`}).join(''):'<p class="hvgift-manager-empty">검색 결과가 없습니다.</p>';
}

function editorMarkup(state,item){
  if(!item)return `<section class="hvgift-manager-empty-panel"><span>◇</span><h2>선물 아이템을 선택하세요.</h2><p>컬렉션 아이템 하나를 대화 획득형 선물로 연결할 수 있습니다.</p></section>`;
  if(!managerDraft)managerDraft=defaultDraft(state,item);
  const draft=managerDraft,scenes=scenesFor(state,draft.sourceCharacterId),scene=scenes.find(row=>String(row.id)===String(draft.sceneId));
  const choices=scene?allChoices(state,draft.sourceCharacterId,scene.id):[];
  const linked=choices.find(row=>String(row.choice.id)===String(draft.choiceId));
  const currentCount=count(state,item.id);
  const selectedText=linked?`${linked.choice.type==='action'?'행동':'말'} · ${linked.choice.text||linked.choice.playerLine||linked.choice.id}`:'아직 선택되지 않음';
  return `<section class="hvgift-editor"><header><div><p class="label">GIFT ITEM</p><h2>${esc(item.symbol||'◆')} ${esc(itemName(item))}</h2><p>${esc(item.desc||item.description||'')}</p></div><span class="hvgift-status ${draft.enabled?'on':''}">${draft.enabled?'ACTIVE':'OFF'}</span></header><div class="hvgift-flow"><span><b>1</b>대화 선택</span><i>→</i><span><b>2</b>선물 획득</span><i>→</i><span><b>3</b>다른 캐릭터에게 전달</span></div><div class="hvgift-editor-grid"><label class="hvgift-check full"><input id="hvgiftEnabled" type="checkbox" ${draft.enabled?'checked':''}><span><b>선물 시스템에 사용</b><small>활성화해도 실제 대화에서 획득하기 전에는 GIFT 메뉴에 보이지 않습니다.</small></span></label><label>획득할 캐릭터<select id="hvgiftSource">${characterOptions(state,draft.sourceCharacterId)}</select></label><label>선물을 받을 캐릭터<select id="hvgiftTarget">${characterOptions(state,draft.targetCharacterId)}</select></label><label class="full">획득 대화<select id="hvgiftScene"><option value="">대화를 선택하세요</option>${scenes.map(row=>option(row.id,`${String(row.kind||'TALK').toUpperCase()} · ${row.title||row.id}`,draft.sceneId)).join('')}</select></label><label class="full">획득시키는 말 / 행동<select id="hvgiftChoice"><option value="">선택지를 선택하세요</option>${choices.map(row=>option(row.choice.id,`[${row.choice.type==='action'?'행동':'말'}] ${row.choice.text||row.choice.playerLine||row.choice.id}`,draft.choiceId)).join('')}</select><small class="hvgift-link-preview">${esc(selectedText)}</small></label><label>받는 캐릭터의 반응 분류<select id="hvgiftPreference">${Object.keys(PREFS).map(value=>option(value,`${value} · ${PREFS[value]>0?'+':''}${PREFS[value]}`,draft.preference)).join('')}</select></label><label>Heart 변화<input id="hvgiftDelta" type="number" min="-100" max="100" value="${esc(draft.affectionDelta)}"></label><label class="full">받는 캐릭터의 반응<textarea id="hvgiftReaction" rows="5" placeholder="비워두면 아이템에 저장된 캐릭터 반응을 사용합니다.">${esc(draft.reaction)}</textarea></label><label class="hvgift-check full"><input id="hvgiftDialogueOnly" type="checkbox" ${draft.dialogueOnly?'checked':''}><span><b>대화 전용 획득</b><small>이 아이템을 가챠 풀에서 제외해 다른 캐릭터와 대화해야만 얻도록 합니다.</small></span></label><label class="hvgift-check full"><input id="hvgiftRepeatable" type="checkbox" ${draft.repeatableAcquisition?'checked':''}><span><b>같은 선택지에서 반복 획득 허용</b><small>꺼두면 해당 말이나 행동으로는 한 번만 획득합니다.</small></span></label></div><footer><div><span>현재 선물 인벤토리</span><b>×${currentCount}</b></div><div class="hvgift-actions"><button class="ghost-button" type="button" data-hvgift-grant="${esc(item.id)}">TEST +1</button><button class="ghost-button" type="button" data-hvgift-clear="${esc(item.id)}" ${currentCount?'':'disabled'}>COUNT 0</button><button class="gold-button" type="button" data-hvgift-save>SAVE GIFT</button></div></footer></section>`;
}

function managerMarkup(state){
  const selected=collectionItem(state,selectedItemId);
  const active=Object.values(state.giftInventoryConfig.items).filter(row=>row?.enabled===true).length;
  const inventory=Object.values(state.giftInventory.ownedCounts).reduce((sum,value)=>sum+Math.max(0,Number(value||0)),0);
  return `<div class="hvgift-manager-backdrop" data-hvgift-manager-backdrop><section class="hvgift-manager-shell"><header class="hvgift-manager-head"><div><small>HELLAVERSE SYSTEM</small><h1>GIFT MANAGER</h1><p>컬렉션 아이템을 특정 대화 선택지와 연결하고, 누구에게 줄 수 있는지 한곳에서 관리합니다.</p></div><div class="hvgift-manager-stats"><span>ACTIVE <b>${active}</b></span><span>INVENTORY <b>${inventory}</b></span></div><button type="button" data-hvgift-manager-close aria-label="Close">×</button></header><div class="hvgift-manager-layout"><aside><input type="search" data-hvgift-search value="${esc(managerQuery)}" placeholder="Search gift item..."><div class="hvgift-manager-list">${itemListMarkup(state)}</div></aside><main>${editorMarkup(state,selected)}</main></div></section></div>`;
}

function openManager(itemId=''){
  const state=read();
  if(itemId)selectedItemId=String(itemId);
  if(!selectedItemId||!collectionItem(state,selectedItemId))selectedItemId=state.collectionItems[0]?.id||'';
  managerDraft=selectedItemId?defaultDraft(state,collectionItem(state,selectedItemId)):null;
  let root=$('#hvGiftManager');if(!root){root=document.createElement('div');root.id='hvGiftManager';document.body.appendChild(root)}
  root.innerHTML=managerMarkup(state);
  document.body.classList.add('hvgift-manager-open');
}

function closeManager(){document.body.classList.remove('hvgift-manager-open');$('#hvGiftManager')?.remove();managerDraft=null}

function rerenderManager(){const root=$('#hvGiftManager');if(root)root.innerHTML=managerMarkup(read())}

function saveManager(){
  const state=read(),item=collectionItem(state,selectedItemId);if(!item)return;
  const next=draftFromDom();
  if(next.enabled&&(!next.sourceCharacterId||!next.targetCharacterId||!next.sceneId||!next.choiceId))return toast('획득 캐릭터, 대화, 선택지를 모두 골라주세요.');
  const link=next.choiceId?allChoices(state,next.sourceCharacterId,next.sceneId).find(row=>String(row.choice.id)===String(next.choiceId)):null;
  if(next.enabled&&!link)return toast('선택한 대화 선택지를 찾을 수 없습니다.');
  if(link&&link.choice.unlockItemId&&String(link.choice.unlockItemId)!==String(item.id))return toast('이 선택지는 이미 다른 아이템을 해금합니다.');
  const previous=config(state,item.id);
  if(previous.choiceId&&String(previous.choiceId)!==String(next.choiceId)){
    const old=allChoices(state).find(row=>String(row.choice.id)===String(previous.choiceId));
    if(old&&String(old.choice.unlockItemId||'')===String(item.id))old.choice.unlockItemId='';
  }
  if(next.enabled&&link)link.choice.unlockItemId=String(item.id);
  if(!next.enabled&&link&&String(link.choice.unlockItemId||'')===String(item.id))link.choice.unlockItemId='';
  if(next.enabled)item.gachaEnabled=!next.dialogueOnly;
  state.giftInventoryConfig.items[String(item.id)]={...next,version:1,updatedAt:new Date().toISOString()};
  write(state,'gift-manager-save');
  managerDraft={...next};
  rerenderManager();
  toast(next.enabled?'대화 획득형 선물로 연결했습니다.':'선물 설정을 저장했습니다.');
}

function adjustInventory(itemId,mode){
  const state=read(),item=collectionItem(state,itemId);if(!item)return;
  state.giftInventory.ownedCounts[itemId]=mode==='clear'?0:count(state,itemId)+1;
  if(mode!=='clear'){
    if(!state.ownedItems.includes(String(itemId)))state.ownedItems.push(String(itemId));
    if(!state.newCollectionItems.includes(String(itemId)))state.newCollectionItems.push(String(itemId));
  }
  state.giftInventory.history.unshift({id:`gift-manager-${Date.now()}`,type:mode==='clear'?'COUNT_RESET':'TEST_GRANT',itemId:String(itemId),at:new Date().toISOString()});
  state.giftInventory.history=state.giftInventory.history.slice(0,200);
  write(state,'gift-manager-inventory');
  rerenderManager();
  toast(mode==='clear'?'선물 인벤토리 수량을 0으로 만들었습니다.':'테스트용 선물 1개를 추가했습니다.');
}

function injectManagerButton(){
  for(const menu of $$('.admin-menu')){
    if($('[data-hvgift-manage]',menu))continue;
    const button=document.createElement('button');button.type='button';button.dataset.hvgiftManage='1';button.textContent='GIFT MANAGER';menu.prepend(button);
  }
}

function patchGiftMenus(){
  const state=read();
  for(const box of $$('.character-room .dialogue-box')){
    const text=String(box.textContent||'');
    const isGiftMenu=!!$('[data-gift]',box)||/SELECT A GIFT|GIVE A GIFT|There is nothing to give yet/i.test(text);
    if(!isGiftMenu&&!box.dataset.hvgiftMenu)return;
    const targetId=String(state.active||'');
    const signature=JSON.stringify([targetId,state.giftInventory.ownedCounts,state.giftInventoryConfig.items]);
    if(box.dataset.hvgiftMenu===signature)return;
    box.dataset.hvgiftMenu=signature;
    box.innerHTML=renderGiftMenu(targetId);
  }
}

function captureChoice(choiceId){
  const state=read(),row=allChoices(state).find(entry=>String(entry.choice.id)===String(choiceId));
  if(!row?.choice?.unlockItemId)return;
  const itemId=String(row.choice.unlockItemId),setting=config(state,itemId);
  if(setting.enabled!==true||String(setting.choiceId||'')!==String(choiceId))return;
  setTimeout(()=>acquireFromChoice(itemId,choiceId),80);
}

function toast(message){
  let root=$('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}
  root.innerHTML=`<div class="toast">${esc(message)}</div>`;
  setTimeout(()=>{if(root)root.innerHTML=''},1700);
}

function enhance(){injectManagerButton();patchGiftMenus()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const choice=target.closest('[data-choice]');if(choice)captureChoice(choice.dataset.choice);
  const give=target.closest('[data-hvgift-give]');if(give){event.preventDefault();event.stopImmediatePropagation();giveItem(give.dataset.hvgiftGive,give.dataset.hvgiftTarget);return}
  if(target.closest('[data-hvgift-manage]')){event.preventDefault();event.stopImmediatePropagation();openManager();return}
  if(target.closest('[data-hvgift-manager-close]')||target.matches('[data-hvgift-manager-backdrop]')){event.preventDefault();closeManager();return}
  const select=target.closest('[data-hvgift-select]');if(select){event.preventDefault();selectedItemId=select.dataset.hvgiftSelect;const state=read();managerDraft=defaultDraft(state,collectionItem(state,selectedItemId));rerenderManager();return}
  if(target.closest('[data-hvgift-save]')){event.preventDefault();saveManager();return}
  const grant=target.closest('[data-hvgift-grant]');if(grant){event.preventDefault();adjustInventory(grant.dataset.hvgiftGrant,'grant');return}
  const clear=target.closest('[data-hvgift-clear]');if(clear){event.preventDefault();adjustInventory(clear.dataset.hvgiftClear,'clear');return}
  if(target.closest('[data-hvgift-notice-close]')){event.preventDefault();$('#hvGiftNotice')?.remove();return}
  if(target.closest('[data-hvgift-return]')){event.preventDefault();$('#hvGiftNotice')?.remove();$('.character-room .dialogue-box [data-end]')?.click();return}
},true);

document.addEventListener('input',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.matches('[data-hvgift-search]')){managerQuery=target.value;const list=$('.hvgift-manager-list');if(list)list.innerHTML=itemListMarkup(read())}
},true);

document.addEventListener('change',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target||!$('#hvGiftManager'))return;
  if(target.id==='hvgiftSource'){
    managerDraft=draftFromDom();managerDraft.sourceCharacterId=target.value;managerDraft.sceneId='';managerDraft.choiceId='';rerenderManager();return;
  }
  if(target.id==='hvgiftScene'){
    managerDraft=draftFromDom();managerDraft.sceneId=target.value;managerDraft.choiceId='';rerenderManager();return;
  }
  managerDraft=draftFromDom();
},true);

function boot(){
  const state=read();
  const reminder=state.collectionItems.find(item=>normalize(itemName(item))==='사탄의 독촉장');
  if(reminder&&!state.giftInventoryConfig.items[String(reminder.id)]){
    state.giftInventoryConfig.items[String(reminder.id)]={...defaultDraft(state,reminder),enabled:false,sourceCharacterId:'satan',targetCharacterId:'lucifer-morningstar',reaction:String(reminder.gachaLine||''),dialogueOnly:true,preference:'LIKED',affectionDelta:3};
    write(state,'gift-manager-example');
  }
  enhance();
  const app=$('#app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
}

window.HVGiftInventory={renderGiftMenu,openManager,readState:read};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('hellaverse:state-updated',schedule);
})();
