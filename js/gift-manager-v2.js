(()=>{
'use strict';
if(window.__HELLAVERSE_GIFT_MANAGER_V2__)return;
window.__HELLAVERSE_GIFT_MANAGER_V2__=1;

const K='hellaverse_dialogue_state_v1';
const PREFS={LOVED:5,LIKED:3,NEUTRAL:1,DISLIKED:-2,HATED:-4};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const uid=(p='gift')=>`${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
let open=false,query='',filter='ALL',selectedId='',draft=null,queued=false,giveLock=false;

function read(){
  let s={};try{s=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{}
  s.characters=Array.isArray(s.characters)?s.characters:[];
  s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
  s.gifts=Array.isArray(s.gifts)?s.gifts:[];
  s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
  s.memories=Array.isArray(s.memories)?s.memories:[];
  s.affection=s.affection&&typeof s.affection==='object'?s.affection:{};
  const raw=s.giftManagerV2&&typeof s.giftManagerV2==='object'?s.giftManagerV2:{};
  s.giftManagerV2={
    version:2,
    items:raw.items&&typeof raw.items==='object'?raw.items:{},
    counts:raw.counts&&typeof raw.counts==='object'?raw.counts:{},
    acquired:raw.acquired&&typeof raw.acquired==='object'?raw.acquired:{},
    history:Array.isArray(raw.history)?raw.history:[]
  };
  return s;
}
function write(s,source='gift-manager-v2'){
  delete s.giftInventory;
  delete s.giftInventoryConfig;
  const value=JSON.stringify(s);localStorage.setItem(K,value);
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}
}
function migrateLegacy(){
  const s=read();let changed=false;
  if(Object.prototype.hasOwnProperty.call(s,'giftInventory')){delete s.giftInventory;changed=true}
  if(Object.prototype.hasOwnProperty.call(s,'giftInventoryConfig')){delete s.giftInventoryConfig;changed=true}
  if(!s.giftManagerV2||s.giftManagerV2.version!==2){changed=true}
  if(changed)write(s,'gift-manager-v2-migrate');
}
function char(s,id){return s.characters.find(x=>String(x?.id||'')===String(id||''))||null}
function charName(s,id){return char(s,id)?.name||'Unknown'}
function gift(s,id){return s.gifts.find(x=>String(x?.id||'')===String(id||''))||null}
function meta(s,id){return s.giftManagerV2.items[String(id)]||{}}
function count(s,id){return Math.max(0,Number(s.giftManagerV2.counts[String(id)]||0))}
function scenesFor(s,cid){return s.dialogues.filter(x=>String(x?.characterId||'')===String(cid||'')&&['TALK','ASK'].includes(String(x?.kind||'').toUpperCase()))}
function choicesFor(s,cid,sceneId){
  const sc=scenesFor(s,cid).find(x=>String(x.id)===String(sceneId));if(!sc)return[];
  const out=[];for(const node of sc.nodes||[])for(const ch of node.choices||[])out.push({scene:sc,node,choice:ch});return out;
}
function findChoice(s,cid,sceneId,choiceId){return choicesFor(s,cid,sceneId).find(x=>String(x.choice?.id||'')===String(choiceId||''))||null}
function relationStage(s,cid){
  const value=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value??s.affection?.[cid]??0)));
  const a=s.affection?.[cid]||{},raw=Array.isArray(a.stages)?a.stages:String(a.stages||'').split('\n');
  for(const row of raw){const m=String(row).match(/(\d+)\s*[-–~]\s*(\d+)\s*[:=]?\s*(.+)/);if(m&&value>=+m[1]&&value<=+m[2])return m[3].trim()}
  return ['STRANGER','DISTANT','ACQUAINTANCE','FAMILIAR','COMFORTABLE','FRIENDLY','CLOSE','TRUSTED','BONDED','DEVOTED','SPECIAL'][Math.min(10,Math.floor(value/10))]||'STRANGER';
}
function eligible(s,g){
  if(!g)return false;const cid=g.characterId,heart=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value??s.affection?.[cid]??0)));
  if(heart<Number(g.requiredAffection||0))return false;
  if(g.requiredStage&&String(g.requiredStage).toUpperCase()!==relationStage(s,cid).toUpperCase())return false;
  if(split(g.requiredFlags).some(f=>!s.flags[f]))return false;
  if(split(g.blockedFlags).some(f=>!!s.flags[f]))return false;
  const tags=new Set(s.memories.filter(m=>m.characterId===cid&&!m.hidden).flatMap(m=>split(m.tags)));
  if(split(g.requiredMemoryTags).some(t=>!tags.has(t)))return false;
  if((g.onceOnly||g.repeatable===false)&&g.used)return false;
  return true;
}
function defaultGift(s){
  const target=s.active||s.characters[0]?.id||'';
  return {id:uid('gift'),characterId:target,name:'New Gift',shortDescription:'',type:'normal',affectionDelta:1,requiredAffection:0,requiredStage:'',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',repeatable:true,onceOnly:false,used:false,opening:'',response:'',choiceA:'',choiceAResponse:'',choiceADelta:0,choiceASetFlags:'',choiceARemoveFlags:'',choiceB:'',choiceBResponse:'',choiceBDelta:0,choiceBSetFlags:'',choiceBRemoveFlags:'',setFlags:'',removeFlags:'',moodChange:'',memoryTitle:'',memorySummary:'',memoryTags:'',memoryImportance:'normal',unlockItemId:'',unlockSceneId:''};
}
function defaultMeta(s,g){
  const saved=meta(s,g?.id),source=saved.sourceCharacterId||s.active||s.characters[0]?.id||'';
  return {enabled:saved.enabled===true,symbol:saved.symbol||'◆',sourceCharacterId:source,sceneId:saved.sceneId||'',choiceId:saved.choiceId||'',repeatableAcquisition:saved.repeatableAcquisition===true,preference:String(saved.preference||'NEUTRAL').toUpperCase()};
}
function statusFor(s,g){
  const m=meta(s,g.id);if(!m.enabled)return'OFF';
  if(!m.sourceCharacterId||!m.sceneId||!m.choiceId||!findChoice(s,m.sourceCharacterId,m.sceneId,m.choiceId))return'BROKEN';
  return count(s,g.id)>0?'READY':'LINKED';
}
function option(value,label,current){return `<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`}
function charOptions(s,current){return s.characters.filter(c=>!c.hidden).map(c=>option(c.id,c.name,current)).join('')}
function selectedGift(s){return gift(s,selectedId)}
function makeDraft(s,g){return {gift:JSON.parse(JSON.stringify(g)),meta:{...defaultMeta(s,g)}}}
function collectDraft(){
  const root=$('#hvGiftManagerV2');if(!root||!draft)return draft;
  const g={...draft.gift},m={...draft.meta};
  g.name=$('#gmName',root)?.value.trim()||'';g.characterId=$('#gmTarget',root)?.value||'';g.shortDescription=$('#gmDesc',root)?.value||'';g.opening=$('#gmOpening',root)?.value||'';g.response=$('#gmResponse',root)?.value||'';g.affectionDelta=Number($('#gmDelta',root)?.value||0);
  g.requiredAffection=Number($('#gmReqHeart',root)?.value||0);g.requiredStage=$('#gmReqStage',root)?.value||'';g.requiredFlags=$('#gmReqFlags',root)?.value||'';g.blockedFlags=$('#gmBlockedFlags',root)?.value||'';g.requiredMemoryTags=$('#gmReqMemory',root)?.value||'';g.repeatable=$('#gmRepeatable',root)?.value!=='false';g.onceOnly=$('#gmOnce',root)?.value==='true';
  g.moodChange=$('#gmMood',root)?.value||'';g.setFlags=$('#gmSetFlags',root)?.value||'';g.removeFlags=$('#gmRemoveFlags',root)?.value||'';g.memoryTitle=$('#gmMemoryTitle',root)?.value||'';g.memorySummary=$('#gmMemorySummary',root)?.value||'';g.memoryTags=$('#gmMemoryTags',root)?.value||'';
  g.choiceA=$('#gmChoiceA',root)?.value||'';g.choiceAResponse=$('#gmChoiceARes',root)?.value||'';g.choiceADelta=Number($('#gmChoiceADelta',root)?.value||0);g.choiceASetFlags=$('#gmChoiceASet',root)?.value||'';g.choiceARemoveFlags=$('#gmChoiceARem',root)?.value||'';
  g.choiceB=$('#gmChoiceB',root)?.value||'';g.choiceBResponse=$('#gmChoiceBRes',root)?.value||'';g.choiceBDelta=Number($('#gmChoiceBDelta',root)?.value||0);g.choiceBSetFlags=$('#gmChoiceBSet',root)?.value||'';g.choiceBRemoveFlags=$('#gmChoiceBRem',root)?.value||'';
  m.enabled=!!$('#gmEnabled',root)?.checked;m.symbol=$('#gmSymbol',root)?.value.trim()||'◆';m.sourceCharacterId=$('#gmSource',root)?.value||'';m.sceneId=$('#gmScene',root)?.value||'';m.choiceId=$('#gmChoice',root)?.value||'';m.repeatableAcquisition=!!$('#gmAcquireRepeat',root)?.checked;m.preference=$('#gmPreference',root)?.value||'NEUTRAL';
  return {gift:g,meta:m};
}
function listMarkup(s){
  const q=query.trim().toLowerCase();let rows=s.gifts.filter(g=>!q||[g.name,g.shortDescription,charName(s,g.characterId),charName(s,meta(s,g.id).sourceCharacterId)].join(' ').toLowerCase().includes(q));
  if(filter!=='ALL')rows=rows.filter(g=>statusFor(s,g)===filter);
  return rows.length?rows.map(g=>{const st=statusFor(s,g),m=meta(s,g.id);return `<button type="button" class="gm-list-item ${String(g.id)===String(selectedId)?'selected':''}" data-gm-select="${esc(g.id)}"><span class="gm-symbol">${esc(m.symbol||'◆')}</span><span><strong>${esc(g.name||'Untitled Gift')}</strong><small>${esc(charName(s,m.sourceCharacterId))} → ${esc(charName(s,g.characterId))}</small></span><em class="status-${st.toLowerCase()}">${st}${count(s,g.id)?` · ×${count(s,g.id)}`:''}</em></button>`}).join(''):'<div class="gm-empty"><span>◇</span><p>조건에 맞는 선물이 없습니다.</p></div>';
}
function editorMarkup(s,g){
  if(!g)return `<section class="gm-empty-editor"><span>◇</span><h2>선물을 선택하거나 새로 만드세요.</h2><p>Collection Item과는 완전히 별개인 선물 데이터입니다.</p><button class="gold-button" data-gm-new>+ NEW GIFT</button></section>`;
  if(!draft||String(draft.gift.id)!==String(g.id))draft=makeDraft(s,g);
  const d=draft,scenes=scenesFor(s,d.meta.sourceCharacterId),scene=scenes.find(x=>String(x.id)===String(d.meta.sceneId)),choices=scene?choicesFor(s,d.meta.sourceCharacterId,scene.id):[],linked=choices.find(x=>String(x.choice.id)===String(d.meta.choiceId)),st=statusFor(s,g);
  return `<section class="gm-editor">
    <header class="gm-editor-head"><div><p class="label">GIFT</p><h2>${esc(d.meta.symbol||'◆')} ${esc(d.gift.name||'Untitled Gift')}</h2><p>${esc(d.gift.shortDescription||'획득 경로와 반응을 설정하세요.')}</p></div><span class="gm-status status-${st.toLowerCase()}">${st}</span></header>
    <div class="gm-flow"><span><b>1</b>대화에서 획득</span><i>→</i><span><b>2</b>선물 인벤토리</span><i>→</i><span><b>3</b>대상에게 전달</span></div>
    <section class="gm-section"><div class="gm-section-title"><strong>BASIC</strong><small>플레이어에게 보이는 기본 정보</small></div><div class="gm-grid"><label>Name<input id="gmName" value="${esc(d.gift.name)}"></label><label>Symbol<input id="gmSymbol" maxlength="4" value="${esc(d.meta.symbol||'◆')}"></label><label class="full">Description<input id="gmDesc" value="${esc(d.gift.shortDescription||'')}"></label><label>Target Character<select id="gmTarget">${charOptions(s,d.gift.characterId)}</select></label><label class="gm-switch"><input id="gmEnabled" type="checkbox" ${d.meta.enabled?'checked':''}><span><b>ACTIVE</b><small>획득/선물 시스템에 사용</small></span></label></div></section>
    <section class="gm-section"><div class="gm-section-title"><strong>ACQUISITION</strong><small>어디서 이 선물을 얻는지</small></div><div class="gm-grid"><label>Source Character<select id="gmSource">${charOptions(s,d.meta.sourceCharacterId)}</select></label><label>Acquire Scene<select id="gmScene"><option value="">대화를 선택하세요</option>${scenes.map(x=>option(x.id,`${String(x.kind||'TALK').toUpperCase()} · ${x.title||x.id}`,d.meta.sceneId)).join('')}</select></label><label class="full">Acquire Choice<select id="gmChoice"><option value="">선택지를 선택하세요</option>${choices.map(x=>option(x.choice.id,`[${x.choice.type==='action'?'행동':'말'}] ${x.choice.text||x.choice.playerLine||x.choice.id}`,d.meta.choiceId)).join('')}</select><small>${linked?esc(linked.choice.text||linked.choice.playerLine||linked.choice.id):'연결된 선택지 없음'}</small></label><label class="gm-switch full"><input id="gmAcquireRepeat" type="checkbox" ${d.meta.repeatableAcquisition?'checked':''}><span><b>반복 획득 허용</b><small>끄면 이 선택지에서는 한 번만 획득합니다.</small></span></label></div><div class="gm-stock"><span>현재 보유</span><b>×${count(s,g.id)}</b><button class="ghost-button" data-gm-grant>TEST +1</button><button class="ghost-button" data-gm-clear ${count(s,g.id)?'':'disabled'}>COUNT 0</button></div></section>
    <section class="gm-section"><div class="gm-section-title"><strong>REACTION</strong><small>선물을 줄 때 실제로 나오는 반응</small></div><div class="gm-grid"><label class="full">Opening Narration<textarea id="gmOpening" rows="2">${esc(d.gift.opening||'')}</textarea></label><label class="full">Character Response<textarea id="gmResponse" rows="4">${esc(d.gift.response||'')}</textarea></label><label>Preference<select id="gmPreference">${Object.keys(PREFS).map(x=>option(x,`${x} · ${PREFS[x]>0?'+':''}${PREFS[x]}`,d.meta.preference)).join('')}</select></label><label>Heart Change<input id="gmDelta" type="number" min="-100" max="100" value="${esc(d.gift.affectionDelta||0)}"></label></div></section>
    <details class="gm-details"><summary>선물 후 선택지 A / B</summary><div class="gm-grid"><label>Choice A<input id="gmChoiceA" value="${esc(d.gift.choiceA||'')}"></label><label>Heart<input id="gmChoiceADelta" type="number" value="${esc(d.gift.choiceADelta||0)}"></label><label class="full">Response A<textarea id="gmChoiceARes" rows="2">${esc(d.gift.choiceAResponse||'')}</textarea></label><label class="full">Set Event A<input id="gmChoiceASet" value="${esc(d.gift.choiceASetFlags||'')}"></label><label class="full">Remove Event A<input id="gmChoiceARem" value="${esc(d.gift.choiceARemoveFlags||'')}"></label><label>Choice B<input id="gmChoiceB" value="${esc(d.gift.choiceB||'')}"></label><label>Heart<input id="gmChoiceBDelta" type="number" value="${esc(d.gift.choiceBDelta||0)}"></label><label class="full">Response B<textarea id="gmChoiceBRes" rows="2">${esc(d.gift.choiceBResponse||'')}</textarea></label><label class="full">Set Event B<input id="gmChoiceBSet" value="${esc(d.gift.choiceBSetFlags||'')}"></label><label class="full">Remove Event B<input id="gmChoiceBRem" value="${esc(d.gift.choiceBRemoveFlags||'')}"></label></div></details>
    <details class="gm-details"><summary>조건 & 결과</summary><div class="gm-grid"><label>Required Heart<input id="gmReqHeart" type="number" min="0" max="100" value="${esc(d.gift.requiredAffection||0)}"></label><label>Required Stage<input id="gmReqStage" value="${esc(d.gift.requiredStage||'')}"></label><label class="full">Required Events<input id="gmReqFlags" value="${esc(d.gift.requiredFlags||'')}"></label><label class="full">Blocked Events<input id="gmBlockedFlags" value="${esc(d.gift.blockedFlags||'')}"></label><label class="full">Required Memory Tags<input id="gmReqMemory" value="${esc(d.gift.requiredMemoryTags||'')}"></label><label>Repeatable<select id="gmRepeatable"><option value="true" ${d.gift.repeatable!==false?'selected':''}>true</option><option value="false" ${d.gift.repeatable===false?'selected':''}>false</option></select></label><label>Once Only<select id="gmOnce"><option value="false" ${!d.gift.onceOnly?'selected':''}>false</option><option value="true" ${d.gift.onceOnly?'selected':''}>true</option></select></label><label>Mood Change<input id="gmMood" value="${esc(d.gift.moodChange||'')}"></label><label class="full">Set Events<input id="gmSetFlags" value="${esc(d.gift.setFlags||'')}"></label><label class="full">Remove Events<input id="gmRemoveFlags" value="${esc(d.gift.removeFlags||'')}"></label><label class="full">Memory Title<input id="gmMemoryTitle" value="${esc(d.gift.memoryTitle||'')}"></label><label class="full">Memory Summary<textarea id="gmMemorySummary" rows="2">${esc(d.gift.memorySummary||'')}</textarea></label><label class="full">Memory Tags<input id="gmMemoryTags" value="${esc(d.gift.memoryTags||'')}"></label></div></details>
    <footer class="gm-actions"><button class="text-link danger" data-gm-delete>DELETE</button><button class="ghost-button" data-gm-duplicate>DUPLICATE</button><button class="gold-button" data-gm-save>SAVE GIFT</button></footer>
  </section>`;
}
function managerMarkup(s){
  const active=s.gifts.filter(g=>meta(s,g.id).enabled===true).length,stock=s.gifts.reduce((n,g)=>n+count(s,g.id),0),broken=s.gifts.filter(g=>statusFor(s,g)==='BROKEN').length;
  return `<div class="gm-backdrop" data-gm-backdrop><section class="gm-shell"><header class="gm-head"><div><small>HELLAVERSE SYSTEM</small><h1>GIFT MANAGER</h1><p>Collection과 분리된 실제 선물 데이터만 관리합니다.</p></div><div class="gm-stats"><span>ACTIVE <b>${active}</b></span><span>STOCK <b>${stock}</b></span><span>BROKEN <b>${broken}</b></span></div><button data-gm-close aria-label="Close">×</button></header><div class="gm-toolbar"><input type="search" data-gm-search value="${esc(query)}" placeholder="Search gifts..."><div>${['ALL','READY','LINKED','BROKEN','OFF'].map(x=>`<button class="${filter===x?'active':''}" data-gm-filter="${x}">${x}</button>`).join('')}</div><button class="gold-button" data-gm-new>+ NEW GIFT</button></div><div class="gm-layout"><aside><div class="gm-list">${listMarkup(s)}</div></aside><main>${editorMarkup(s,selectedGift(s))}</main></div></section></div>`;
}
function openManager(id=''){
  const s=read();open=true;if(id)selectedId=String(id);if(!selectedId||!gift(s,selectedId))selectedId=s.gifts[0]?.id||'';draft=selectedId?makeDraft(s,gift(s,selectedId)):null;
  let root=$('#hvGiftManagerV2');if(!root){root=document.createElement('div');root.id='hvGiftManagerV2';document.body.appendChild(root)}root.innerHTML=managerMarkup(s);document.body.classList.add('gm-open');
}
function closeManager(){open=false;draft=null;document.body.classList.remove('gm-open');$('#hvGiftManagerV2')?.remove()}
function rerender(){if(!open)return;const root=$('#hvGiftManagerV2');if(root)root.innerHTML=managerMarkup(read())}
function toast(text){let root=$('#toastRoot');if(!root){root=document.createElement('div');root.id='toastRoot';document.body.appendChild(root)}root.innerHTML=`<div class="toast">${esc(text)}</div>`;setTimeout(()=>{if(root)root.innerHTML=''},1800)}
function saveGift(){
  const s=read(),next=collectDraft();if(!next)return;const g=next.gift,m=next.meta;
  if(!g.name)return toast('선물 이름을 입력해주세요.');if(!g.characterId)return toast('받을 캐릭터를 선택해주세요.');
  if(m.enabled){if(!m.sourceCharacterId||!m.sceneId||!m.choiceId)return toast('획득 캐릭터, 대화, 선택지를 모두 연결해주세요.');if(!findChoice(s,m.sourceCharacterId,m.sceneId,m.choiceId))return toast('선택한 획득 선택지를 찾을 수 없습니다.');
    const conflict=s.gifts.find(x=>x.id!==g.id&&meta(s,x.id).enabled===true&&meta(s,x.id).sourceCharacterId===m.sourceCharacterId&&meta(s,x.id).sceneId===m.sceneId&&meta(s,x.id).choiceId===m.choiceId);if(conflict)return toast(`이 선택지는 이미 「${conflict.name}」 획득에 사용 중입니다.`);
  }
  const i=s.gifts.findIndex(x=>String(x.id)===String(g.id));if(i>=0)s.gifts[i]=g;else s.gifts.push(g);s.giftManagerV2.items[String(g.id)]={...m,updatedAt:new Date().toISOString()};write(s,'gift-manager-v2-save');selectedId=g.id;draft=makeDraft(read(),gift(read(),g.id));rerender();toast('GIFT SAVED');
}
function newGift(){const s=read(),g=defaultGift(s);s.gifts.push(g);s.giftManagerV2.items[g.id]={...defaultMeta(s,g),enabled:false};write(s,'gift-manager-v2-new');selectedId=g.id;draft=makeDraft(read(),gift(read(),g.id));rerender()}
function duplicateGift(){const s=read(),src=selectedGift(s);if(!src)return;const copy=JSON.parse(JSON.stringify(src));copy.id=uid('gift');copy.name=`${src.name} COPY`;copy.used=false;s.gifts.push(copy);s.giftManagerV2.items[copy.id]={...meta(s,src.id),enabled:false,choiceId:'',sceneId:'',updatedAt:new Date().toISOString()};write(s,'gift-manager-v2-duplicate');selectedId=copy.id;draft=makeDraft(read(),gift(read(),copy.id));rerender()}
function deleteGift(){const s=read(),g=selectedGift(s);if(!g)return;if(!confirm(`Delete gift “${g.name}”?`))return;s.gifts=s.gifts.filter(x=>x.id!==g.id);delete s.giftManagerV2.items[g.id];delete s.giftManagerV2.counts[g.id];for(const k of Object.keys(s.giftManagerV2.acquired))if(k.startsWith(`${g.id}:`))delete s.giftManagerV2.acquired[k];write(s,'gift-manager-v2-delete');selectedId=s.gifts[0]?.id||'';draft=selectedId?makeDraft(read(),gift(read(),selectedId)):null;rerender()}
function adjustStock(delta){const s=read(),g=selectedGift(s);if(!g)return;s.giftManagerV2.counts[g.id]=delta===0?0:count(s,g.id)+delta;s.giftManagerV2.history.unshift({id:uid('gift-stock'),type:delta===0?'RESET':'TEST_GRANT',giftId:g.id,at:new Date().toISOString()});s.giftManagerV2.history=s.giftManagerV2.history.slice(0,200);write(s,'gift-manager-v2-stock');rerender()}
function acquireByChoice(choiceId){
  const s=read(),matches=s.gifts.filter(g=>{const m=meta(s,g.id);return m.enabled===true&&String(m.choiceId||'')===String(choiceId||'')&&findChoice(s,m.sourceCharacterId,m.sceneId,m.choiceId)});if(!matches.length)return;
  const gained=[];for(const g of matches){const m=meta(s,g.id),key=`${g.id}:${choiceId}`;if(!m.repeatableAcquisition&&s.giftManagerV2.acquired[key])continue;s.giftManagerV2.counts[g.id]=count(s,g.id)+1;if(!m.repeatableAcquisition)s.giftManagerV2.acquired[key]=new Date().toISOString();s.giftManagerV2.history.unshift({id:uid('gift-acquired'),type:'ACQUIRED',giftId:g.id,sourceCharacterId:m.sourceCharacterId,sceneId:m.sceneId,choiceId,at:new Date().toISOString()});gained.push(g)}
  if(!gained.length)return;s.giftManagerV2.history=s.giftManagerV2.history.slice(0,200);write(s,'gift-manager-v2-acquired');showAcquired(gained,read());
}
function showAcquired(gifts,s){
  $('#gmAcquireNotice')?.remove();const root=document.createElement('div');root.id='gmAcquireNotice';root.className='gm-acquire-backdrop';root.innerHTML=`<section class="gm-acquire"><p class="label">GIFT ACQUIRED</p>${gifts.map(g=>`<article><span>${esc(meta(s,g.id).symbol||'◆')}</span><div><strong>${esc(g.name)}</strong><small>${esc(charName(s,meta(s,g.id).sourceCharacterId))}와의 대화에서 획득 · 보유 ×${count(s,g.id)}</small></div></article>`).join('')}<button class="gold-button" data-gm-acquire-close>CONTINUE</button></section>`;document.body.appendChild(root);
}
function giftMenu(s,targetId){
  const rows=s.gifts.filter(g=>meta(s,g.id).enabled===true&&String(g.characterId||'')===String(targetId||'')&&count(s,g.id)>0&&eligible(s,g));
  if(!rows.length)return `<p class="speaker">GIVE A GIFT</p><div class="gm-room-empty"><span>◇</span><strong>지금 줄 수 있는 선물이 없습니다.</strong><p>다른 캐릭터와 대화해 선물을 획득하면 여기에 나타납니다.</p></div><button class="dialogue-return" data-end>BACK TO CONVERSATION</button>`;
  return `<p class="speaker">GIFT INVENTORY · ${esc(charName(s,targetId))}</p><p class="gm-room-note">획득한 선물만 표시됩니다.</p><div class="choice-list gm-room-list">${rows.map((g,i)=>`<button class="choice-option" data-gm-give="${esc(g.id)}"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(meta(s,g.id).symbol||'◆')} ${esc(g.name)}</span><small>${esc(g.shortDescription||'')} · ×${count(s,g.id)}</small></button>`).join('')}</div><button class="dialogue-return" data-end>BACK TO CONVERSATION</button>`;
}
function patchRoomGiftMenu(){
  const s=read();for(const box of $$('.character-room .dialogue-box')){const text=String(box.textContent||''),isGift=!!$('[data-gift]',box)||/SELECT A GIFT|GIVE A GIFT|There is nothing to give yet/i.test(text);if(!isGift&&!box.dataset.gmV2)return;const target=String(s.active||'');const sig=JSON.stringify([target,s.giftManagerV2.counts,s.gifts.map(g=>[g.id,g.characterId,g.name,g.used]),s.giftManagerV2.items]);if(box.dataset.gmV2===sig)return;box.dataset.gmV2=sig;box.innerHTML=giftMenu(s,target)}
}
function giveGift(id){
  if(giveLock)return;const s=read(),g=gift(s,id);if(!g||count(s,id)<1||!eligible(s,g))return toast('지금은 이 선물을 줄 수 없습니다.');giveLock=true;s.giftManagerV2.counts[id]=Math.max(0,count(s,id)-1);s.giftManagerV2.history.unshift({id:uid('gift-given'),type:'GIVEN',giftId:id,targetCharacterId:g.characterId,at:new Date().toISOString()});s.giftManagerV2.history=s.giftManagerV2.history.slice(0,200);write(s,'gift-manager-v2-give');
  const host=$('.character-room')||document.body,b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.gift=id;host.appendChild(b);try{b.click()}finally{b.remove();setTimeout(()=>{giveLock=false},250)}
}
function injectButtons(){
  for(const menu of $$('.admin-menu'))if(!$('[data-gm-open]',menu)){const b=document.createElement('button');b.type='button';b.dataset.gmOpen='1';b.textContent='GIFT MANAGER';menu.prepend(b)}
  const side=$('.editor-sidebar');if(side&&!$('[data-gm-open]',side)){const b=document.createElement('button');b.type='button';b.className='ghost-button gm-editor-open';b.dataset.gmOpen='1';b.textContent='GIFT MANAGER';side.appendChild(b)}
}
function enhance(){injectButtons();patchRoomGiftMenu()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const choice=t.closest('[data-choice]');if(choice){const id=choice.dataset.choice;setTimeout(()=>acquireByChoice(id),90)}
  if(t.closest('[data-gm-open]')){e.preventDefault();e.stopImmediatePropagation();openManager();return}
  if(t.closest('[data-gm-close]')||t.matches('[data-gm-backdrop]')){e.preventDefault();closeManager();return}
  const sel=t.closest('[data-gm-select]');if(sel){e.preventDefault();selectedId=sel.dataset.gmSelect;draft=makeDraft(read(),gift(read(),selectedId));rerender();return}
  const f=t.closest('[data-gm-filter]');if(f){e.preventDefault();filter=f.dataset.gmFilter;rerender();return}
  if(t.closest('[data-gm-new]')){e.preventDefault();newGift();return}
  if(t.closest('[data-gm-save]')){e.preventDefault();saveGift();return}
  if(t.closest('[data-gm-duplicate]')){e.preventDefault();duplicateGift();return}
  if(t.closest('[data-gm-delete]')){e.preventDefault();deleteGift();return}
  if(t.closest('[data-gm-grant]')){e.preventDefault();adjustStock(1);return}
  if(t.closest('[data-gm-clear]')){e.preventDefault();adjustStock(0);return}
  if(t.closest('[data-gm-acquire-close]')){e.preventDefault();$('#gmAcquireNotice')?.remove();return}
  const give=t.closest('[data-gm-give]');if(give){e.preventDefault();e.stopImmediatePropagation();giveGift(give.dataset.gmGive);return}
},true);
document.addEventListener('input',e=>{const t=e.target;if(t.matches?.('[data-gm-search]')){query=t.value;const l=$('.gm-list');if(l)l.innerHTML=listMarkup(read())}},true);
document.addEventListener('change',e=>{const t=e.target;if(!open||!draft)return;if(t.id==='gmSource'){draft=collectDraft();draft.meta.sourceCharacterId=t.value;draft.meta.sceneId='';draft.meta.choiceId='';rerender()}else if(t.id==='gmScene'){draft=collectDraft();draft.meta.sceneId=t.value;draft.meta.choiceId='';rerender()}},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);
migrateLegacy();if(document.readyState!=='loading')schedule();
})();