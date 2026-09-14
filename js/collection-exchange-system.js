(()=>{
if(window.__HELLAVERSE_COLLECTION_EXCHANGE_V1__)return;
window.__HELLAVERSE_COLLECTION_EXCHANGE_V1__=1;

const K='hellaverse_dialogue_state_v1';
const LUCIFER='lucifer-morningstar';
const PREFS={LOVED:5,LIKED:3,NEUTRAL:1,DISLIKED:-2,HATED:-4};
const RARITY_HEART={COMMON:10,UNCOMMON:20,RARE:40,EPIC:60,LEGENDARY:80,MISTIC:95};
const POS_MOOD={GOOD:1,NORMAL:1,TIRED:.75,ANNOYED:.25,SAD:.6,EXCITED:1.15};
const NEG_MOOD={GOOD:.8,NORMAL:1,TIRED:1.1,ANNOYED:1.5,SAD:1.2,EXCITED:.8};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clamp=v=>Math.max(0,Math.min(100,Number(v||0)));
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function save(s,source='collection-exchange'){
  localStorage.setItem(K,JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
  window.dispatchEvent(new CustomEvent('hellaverse:collection-exchange',{detail:{source}}));
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:localStorage.getItem(K)}))}catch{}
}
function ensure(s){
  s.characters=Array.isArray(s.characters)?s.characters:[];
  s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);
  s.ownedItems=Array.isArray(s.ownedItems)?s.ownedItems.map(String):[];
  s.newCollectionItems=Array.isArray(s.newCollectionItems)?s.newCollectionItems.map(String):[];
  s.affection=s.affection&&typeof s.affection==='object'?s.affection:{};
  s.moods=s.moods&&typeof s.moods==='object'?s.moods:{};
  s.memories=Array.isArray(s.memories)?s.memories:[];
  s.conversationHistory=Array.isArray(s.conversationHistory)?s.conversationHistory:[];
  s.collectionTransferConfig=s.collectionTransferConfig&&typeof s.collectionTransferConfig==='object'?s.collectionTransferConfig:{};
  let x=s.collectionExchange&&typeof s.collectionExchange==='object'?s.collectionExchange:{};
  s.collectionExchange={version:1,grantedCounts:x.grantedCounts&&typeof x.grantedCounts==='object'?x.grantedCounts:{},sentCounts:x.sentCounts&&typeof x.sentCounts==='object'?x.sentCounts:{},claims:x.claims&&typeof x.claims==='object'?x.claims:{},history:Array.isArray(x.history)?x.history:[]};
  return s;
}
function char(s,id){return s.characters.find(c=>String(c.id)===String(id))||null}
function item(s,id){return s.collectionItems.find(i=>String(i.id)===String(id))||null}
function rarity(i){let r=String(i?.rarity||'COMMON').toUpperCase();if(r==='MYSTIC'||r==='SECRET')r='MISTIC';if(r==='LEGEND')r='LEGENDARY';return r}
function heart(s,cid){return clamp(s.affection?.[cid]?.value||0)}
function cfg(s,id){return s.collectionTransferConfig?.[id]||{}}
function totalCopies(s,id){
  s=ensure(s);id=String(id);
  const g=Math.max(0,Number(s.gachaAddon?.counts?.[id]||0));
  const granted=Math.max(0,Number(s.collectionExchange.grantedCounts[id]||0));
  const fallback=(s.ownedItems.includes(id)&&g+granted===0)?1:0;
  return g+granted+fallback;
}
function availableCopies(s,id){return Math.max(0,totalCopies(s,id)-Math.max(0,Number(ensure(s).collectionExchange.sentCounts[String(id)]||0)))}
function transferable(s,i){return !!i&&cfg(s,i.id).transferable!==false}
function claimMin(s,i){let c=cfg(s,i.id),n=Number(c.claimMinHeart);return Number.isFinite(n)&&n>=0?n:(RARITY_HEART[rarity(i)]??20)}
function claimable(s,i){return !!i&&cfg(s,i.id).claimable===true}
function claimKey(cid,id){return`${cid}:${id}`}
function claimed(s,cid,id){return !!ensure(s).collectionExchange.claims[claimKey(cid,id)]}
function sourceName(s,i){return char(s,i?.characterId)?.name||'Character'}
function prefFor(s,i,targetId){let c=cfg(s,i.id),p=String(c.characterOverrides?.[targetId]||c.defaultPreference||'NEUTRAL').toUpperCase();return PREFS[p]!=null?p:'NEUTRAL'}
function giftDelta(s,i,targetId){
  const p=prefFor(s,i,targetId),raw=PREFS[p]||0,m=String(s.moods?.[targetId]||'NORMAL').toUpperCase();
  if(!raw)return{preference:p,delta:0};
  const mult=(raw>0?POS_MOOD:NEG_MOOD)[m]??1;
  return{preference:p,delta:Math.round(raw*mult)};
}
function transferNarration(s,i,targetId,pref){
  let c=cfg(s,i.id),custom=String(c.characterLines?.[targetId]||'').trim(),target=char(s,targetId)?.name||'상대',owner=sourceName(s,i);
  if(custom)return custom;
  if(String(i.characterId)===String(targetId))return`${target}에게 원래 그 캐릭터의 컬렉션 아이템인 「${i.name||i.title||'Item'}」을 다시 건넸다.`;
  if(pref==='LOVED')return`${target}가 「${i.name||i.title||'Item'}」을 아주 마음에 들어 하는 기색을 보인다. ${owner}에게서 온 물건이라는 점도 흥미로워한다.`;
  if(pref==='LIKED')return`${target}가 「${i.name||i.title||'Item'}」을 기분 좋게 받아든다.`;
  if(pref==='DISLIKED')return`${target}가 「${i.name||i.title||'Item'}」을 받아들고 조금 난감한 표정을 짓는다.`;
  if(pref==='HATED')return`${target}는 「${i.name||i.title||'Item'}」을 받고도 전혀 반가워하지 않는다.`;
  return`${target}가 「${i.name||i.title||'Item'}」을 받아든다. ${owner}의 컬렉션에서 온 물건이라고 설명했다.`;
}

const LUCIFER_SEEDS=[
  {item:{id:'lucifer-keepsake-mini-duck',characterId:LUCIFER,name:'루시퍼가 만든 미니 고무 오리',symbol:'♛',rarity:'UNCOMMON',condition:'루시퍼에게 직접 받기 · Heart 20+',desc:'루시퍼가 작업대에서 직접 만든 작은 고무 오리. 모자 부분만 유난히 공들여 칠해져 있다.',gachaEnabled:false},config:{claimable:true,claimMinHeart:20,transferable:true,defaultPreference:'NEUTRAL',tags:['duck','handmade','lucifer'],claimLine:'"이건 내가 만든 거야. 하나쯤 가져가도 돼. 잃어버리진 말고."',characterOverrides:{'charlie-morningstar':'LIKED'}}},
  {item:{id:'lucifer-keepsake-gold-apple-pin',characterId:LUCIFER,name:'금빛 사과 핀',symbol:'◆',rarity:'RARE',condition:'루시퍼에게 직접 받기 · Heart 40+',desc:'작은 금빛 사과 모양 핀. 루시퍼가 서랍에서 꺼내 아무렇지 않은 척 건넨 물건이다.',gachaEnabled:false},config:{claimable:true,claimMinHeart:40,transferable:true,defaultPreference:'NEUTRAL',tags:['apple','gold','accessory'],claimLine:'"계속 쳐다보길래. 가져. 나한텐 비슷한 게 또 있으니까."',characterOverrides:{'charlie-morningstar':'LIKED'}}},
  {item:{id:'lucifer-keepsake-clockwork-duck',characterId:LUCIFER,name:'태엽식 미니 오리',symbol:'⚙',rarity:'EPIC',condition:'루시퍼에게 직접 받기 · Heart 60+',desc:'태엽을 감으면 짧은 거리를 뒤뚱거리며 걷는 정교한 미니 오리. 작은 기어가 전부 손으로 조정되어 있다.',gachaEnabled:false},config:{claimable:true,claimMinHeart:60,transferable:true,defaultPreference:'LIKED',tags:['duck','mechanical','handmade'],claimLine:'"이건 조금 공들였어. 망가뜨리면 내가 고치긴 할 건데... 되도록 그러지 마."',characterOverrides:{'charlie-morningstar':'LOVED'}}},
  {item:{id:'lucifer-keepsake-handwritten-card',characterId:LUCIFER,name:'루시퍼의 손글씨 카드',symbol:'✦',rarity:'LEGENDARY',condition:'루시퍼에게 직접 받기 · Heart 80+',desc:'장식적인 필체로 짧은 문장이 적힌 카드. 앞면보다 뒷면의 급하게 덧붙인 한 줄이 더 솔직해 보인다.',gachaEnabled:false},config:{claimable:true,claimMinHeart:80,transferable:true,defaultPreference:'LIKED',tags:['memory','handwritten','lucifer'],claimLine:'"물건이라고 하기엔 좀 애매하지만... 버리진 마. 그럼 됐어."',characterOverrides:{'charlie-morningstar':'LOVED'}}},
  {item:{id:'lucifer-keepsake-private-blueprint',characterId:LUCIFER,name:'오리 장치 비공개 설계도',symbol:'◇',rarity:'MISTIC',condition:'루시퍼에게 직접 받기 · Heart 95+',desc:'여러 번 접었다 펼친 흔적이 있는 설계도. 완성되지 않은 기계 오리와 수정 메모가 빼곡하다.',gachaEnabled:false},config:{claimable:true,claimMinHeart:95,transferable:true,defaultPreference:'LIKED',tags:['duck','mechanical','blueprint','memory'],claimLine:'"이건 복사본 없어. 네가 가지고 있어. ...그러니까 아무한테나 보여주진 말고."',characterOverrides:{'charlie-morningstar':'LOVED'}}}
];
function seed(){
  let s=ensure(read());if(Number(s.collectionExchangeSeedVersion||0)>=1)return;
  for(const row of LUCIFER_SEEDS){if(!item(s,row.item.id))s.collectionItems.push({...row.item});s.collectionTransferConfig[row.item.id]={...row.config,...(s.collectionTransferConfig[row.item.id]||{})}}
  s.collectionExchangeSeedVersion=1;save(s,'collection-exchange-seed');
}

function addMemory(s,cid,title,summary,tags=[]){
  s.memories.unshift({id:`exchange-memory-${Date.now()}-${Math.random().toString(16).slice(2)}`,characterId:cid,type:'event',title,summary,tags,sourceType:'collectionExchange',sourceId:cid,importance:'normal',createdAt:new Date().toISOString(),pinned:false,hidden:false});
}
function addHistory(s,cid,title,messages){
  s.conversationHistory.unshift({id:`exchange-history-${Date.now()}-${Math.random().toString(16).slice(2)}`,characterId:cid,sceneId:'collection-exchange',sceneTitle:title,startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),messages});
  s.conversationHistory=s.conversationHistory.slice(0,150);
}

let overlay=null,detailItemId='';
function closeOverlay(){overlay?.remove();overlay=null}
function mount(html){closeOverlay();overlay=document.createElement('div');overlay.id='collectionExchangeRoot';overlay.className='collection-exchange-backdrop';overlay.innerHTML=html;document.body.appendChild(overlay)}
function itemVisual(i){return`<span class="ce-symbol">${esc(i.symbol||'◆')}</span><span><strong>${esc(i.name||i.title||'Item')}</strong><small>${esc(rarity(i))}</small></span>`}
function claimItemsFor(s,cid){return s.collectionItems.filter(i=>String(i.characterId)===String(cid)&&claimable(s,i))}
function openKeepsakes(cid){
  let s=ensure(read()),c=char(s,cid),h=heart(s,cid),items=claimItemsFor(s,cid);if(!c||!items.length)return;
  mount(`<section class="collection-exchange-card"><button class="ce-close" data-ce-close>×</button><p class="label">CHARACTER KEEPSAKES</p><h2>${esc(c.name)}</h2><p class="ce-sub">관계가 깊어지면 이 캐릭터에게서 직접 컬렉션 아이템을 받을 수 있습니다. 받은 아이템은 COLLECTION에 영구 기록되고, 보유 복사본은 다른 캐릭터에게 선물할 수 있습니다.</p><div class="ce-list">${items.map(i=>{let min=claimMin(s,i),done=claimed(s,cid,i.id),ok=h>=min&&!done;return`<button ${ok?'':'disabled'} data-ce-claim="${esc(i.id)}" data-ce-cid="${esc(cid)}">${itemVisual(i)}<em>${done?'RECEIVED':h<min?`♥ ${min} REQUIRED`:'RECEIVE'}</em></button>`}).join('')}</div><p class="ce-foot">CURRENT HEART <b>♥ ${h}</b></p></section>`)}
function claimItem(cid,id){
  let s=ensure(read()),i=item(s,id),c=char(s,cid);if(!i||!c||!claimable(s,i)||claimed(s,cid,id)||heart(s,cid)<claimMin(s,i))return;
  let key=claimKey(cid,id),line=String(cfg(s,id).claimLine||'').trim();
  s.collectionExchange.claims[key]=new Date().toISOString();
  s.collectionExchange.grantedCounts[id]=Number(s.collectionExchange.grantedCounts[id]||0)+1;
  if(!s.ownedItems.includes(String(id)))s.ownedItems.push(String(id));
  if(!s.newCollectionItems.includes(String(id)))s.newCollectionItems.push(String(id));
  s.collectionExchange.history.unshift({id:`claim-${Date.now()}`,type:'RECEIVED',itemId:id,fromCharacterId:cid,at:new Date().toISOString()});
  s.collectionExchange.history=s.collectionExchange.history.slice(0,200);
  addMemory(s,cid,`${c.name}에게서 받은 물건`,`${c.name}에게서 「${i.name||i.title}」을 직접 받았다.`,['collection','keepsake','received']);
  addHistory(s,cid,`Keepsake: ${i.name||i.title}`,[{speaker:'',text:`${c.name}에게서 「${i.name||i.title}」을 받았다.`,type:'narration'},...(line?[{speaker:String(c.name).toUpperCase(),text:line,type:'speech'}]:[])]);
  save(s);
  mount(`<section class="collection-exchange-card ce-result"><button class="ce-close" data-ce-close>×</button><p class="label">NEW COLLECTION ITEM</p>${itemVisual(i)}<p>${esc(line||`${c.name}에게서 직접 받은 물건이 컬렉션에 등록되었습니다.`)}</p><div class="ce-result-actions"><button data-ce-close>CONTINUE</button><button data-ce-open-collection>OPEN COLLECTION</button></div></section>`)}

function inventoryItems(s){return s.collectionItems.filter(i=>s.ownedItems.includes(String(i.id))&&transferable(s,i)&&availableCopies(s,i.id)>0)}
function openInventoryForTarget(targetId){
  let s=ensure(read()),target=char(s,targetId),items=inventoryItems(s);if(!target)return;
  mount(`<section class="collection-exchange-card"><button class="ce-close" data-ce-close>×</button><p class="label">GIVE COLLECTION ITEM</p><h2>${esc(target.name)}</h2><p class="ce-sub">컬렉션 기록은 사라지지 않습니다. 대신 실제로 건넬 수 있는 보유 복사본 수가 1개 줄어듭니다.</p><div class="ce-list ce-inventory-list">${items.length?items.map(i=>`<button data-ce-send="${esc(i.id)}" data-ce-target="${esc(targetId)}">${itemVisual(i)}<em>×${availableCopies(s,i.id)} · ${esc(prefFor(s,i,targetId))}</em></button>`).join(''):'<p class="ce-empty">전달할 수 있는 보유 아이템이 없습니다.</p>'}</div></section>`)}
function openRecipients(id){
  let s=ensure(read()),i=item(s,id);if(!i||availableCopies(s,id)<=0||!transferable(s,i))return;
  let chars=s.characters.filter(c=>!c.hidden);
  mount(`<section class="collection-exchange-card"><button class="ce-close" data-ce-close>×</button><p class="label">GIVE TO CHARACTER</p><h2>${esc(i.name||i.title||'Item')}</h2><p class="ce-sub">누구에게 전달할지 선택하세요. 대상 캐릭터의 현재 Mood와 이 아이템의 Preference 설정에 따라 Heart 변화가 달라집니다.</p><div class="ce-list ce-character-list">${chars.map(c=>`<button data-ce-send="${esc(id)}" data-ce-target="${esc(c.id)}"><span class="ce-avatar">${esc((c.name||'?').slice(0,1))}</span><span><strong>${esc(c.name)}</strong><small>${esc(prefFor(s,i,c.id))}</small></span><em>♥ ${heart(s,c.id)}</em></button>`).join('')}</div></section>`)}
function sendItem(id,targetId){
  let s=ensure(read()),i=item(s,id),target=char(s,targetId);if(!i||!target||!transferable(s,i)||availableCopies(s,id)<=0)return;
  let result=giftDelta(s,i,targetId),before=heart(s,targetId),after=clamp(before+result.delta),note=transferNarration(s,i,targetId,result.preference),owner=sourceName(s,i);
  s.affection[targetId]={...(s.affection[targetId]||{}),value:after};
  s.collectionExchange.sentCounts[id]=Number(s.collectionExchange.sentCounts[id]||0)+1;
  s.collectionExchange.history.unshift({id:`send-${Date.now()}-${Math.random().toString(16).slice(2)}`,type:'GIVEN',itemId:id,toCharacterId:targetId,fromCollectionCharacterId:i.characterId||'',preference:result.preference,delta:result.delta,heartBefore:before,heartAfter:after,at:new Date().toISOString()});
  s.collectionExchange.history=s.collectionExchange.history.slice(0,200);
  addHistory(s,targetId,`Collection Gift: ${i.name||i.title}`,[{speaker:'YOU',text:`「${i.name||i.title}」을 건넸다.`,type:'speech'},{speaker:'',text:note,type:'narration'}]);
  save(s);
  mount(`<section class="collection-exchange-card ce-result"><button class="ce-close" data-ce-close>×</button><p class="label">COLLECTION GIFT</p>${itemVisual(i)}<p>${esc(note)}</p><div class="ce-transfer-result"><span>FROM <b>${esc(owner)}</b></span><span>TO <b>${esc(target.name)}</b></span><span>REACTION <b>${esc(result.preference)}</b></span><span>HEART <b>${result.delta>0?'+':''}${result.delta}</b></span><span>LEFT <b>×${availableCopies(s,id)}</b></span></div><div class="ce-result-actions"><button data-ce-close>CONTINUE</button></div></section>`)}

function patchRoom(){
  let s=ensure(read()),room=$('.character-room'),links=room?.querySelector('.room-links');if(!room||!links||links.querySelector('[data-ce-keepsakes]'))return;
  let cid=String(s.active||''),items=claimItemsFor(s,cid);if(!items.length)return;
  let b=document.createElement('button');b.type='button';b.dataset.ceKeepsakes=cid;b.textContent='KEEPSAKES';links.appendChild(b)
}
function patchGiftMenu(){
  let s=ensure(read());$$('.character-room .dialogue-box').forEach(box=>{if(box.querySelector('[data-ce-gift-launch]'))return;let text=String(box.textContent||''),giftMode=/SELECT A GIFT|There is nothing to give yet/i.test(text)||!!box.querySelector('[data-gift]');if(!giftMode)return;let cid=String(s.active||''),n=inventoryItems(s).length;if(!cid||!n)return;let b=document.createElement('button');b.type='button';b.className='choice-option ce-gift-launch';b.dataset.ceGiftLaunch=cid;b.innerHTML=`<b>◇</b><span>COLLECTION ITEM</span><small>${n} AVAILABLE</small>`;let list=box.querySelector('.choice-list');if(list)list.appendChild(b);else{let ret=box.querySelector('[data-end]');ret?ret.insertAdjacentElement('beforebegin',b):box.appendChild(b)}})
}
function patchDetail(){
  let root=$('#hvgDetailRoot'),card=root?.querySelector('.hvg-detail');if(!card||card.querySelector('[data-ce-detail-actions]'))return;
  let s=ensure(read()),i=detailItemId?item(s,detailItemId):null;
  if(!i){let name=String(card.querySelector('h2')?.textContent||'').trim();i=s.collectionItems.find(x=>String(x.name||x.title||'').trim()===name)||null}
  if(!i||!s.ownedItems.includes(String(i.id)))return;
  detailItemId=String(i.id);let copies=availableCopies(s,i.id),section=document.createElement('section');section.dataset.ceDetailActions='1';section.className='ce-detail-actions';section.innerHTML=`<p><span>GIFTABLE COPIES</span><b>×${copies}</b></p><small>컬렉션 등록 기록은 유지됩니다. 캐릭터에게 전달하면 보유 복사본만 감소합니다.</small><button type="button" data-ce-recipients="${esc(i.id)}" ${copies>0&&transferable(s,i)?'':'disabled'}>${transferable(s,i)?copies>0?'GIVE TO CHARACTER':'NO COPY AVAILABLE':'BOUND ITEM'}</button>`;card.querySelector('div:last-child')?.appendChild(section)
}

function parseOverrides(v){let out={};String(v||'').split('\n').map(x=>x.trim()).filter(Boolean).forEach(line=>{let m=line.match(/^([^=|:]+)\s*[=|:]\s*(LOVED|LIKED|NEUTRAL|DISLIKED|HATED)$/i);if(m)out[m[1].trim()]=m[2].toUpperCase()});return out}
function parseLines(v){let out={};String(v||'').split('\n').map(x=>x.trim()).filter(Boolean).forEach(line=>{let p=line.indexOf('=');if(p<0)p=line.indexOf('|');if(p>0)out[line.slice(0,p).trim()]=line.slice(p+1).trim()});return out}
function prefOptions(v='NEUTRAL'){v=String(v||'NEUTRAL').toUpperCase();return Object.keys(PREFS).map(p=>`<option ${p===v?'selected':''}>${p}</option>`).join('')}
function patchEditor(){
  let card=$('#iName')?.closest('.editor-card');if(!card||card.dataset.collectionExchangeEditor==='1')return;let s=ensure(read()),id=s.draft?.item||'',c=cfg(s,id),form=$('.form-grid',card);if(!form)return;card.dataset.collectionExchangeEditor='1';
  let overrides=Object.entries(c.characterOverrides||{}).map(([k,v])=>`${k}=${v}`).join('\n'),lines=Object.entries(c.characterLines||{}).map(([k,v])=>`${k}=${v}`).join('\n');
  form.insertAdjacentHTML('afterend',`<details class="sub-editor ce-editor"><summary>CHARACTER REWARD / TRANSFER</summary><p class="muted">컬렉션 아이템을 관련 캐릭터에게 직접 받게 하거나, 획득한 복사본을 다른 캐릭터에게 선물할 수 있습니다.</p><div class="ce-editor-grid"><label class="checkline"><input id="ceClaimable" type="checkbox" ${c.claimable?'checked':''}> 관련 캐릭터에게 직접 획득 가능</label><label>Claim Heart<input id="ceClaimHeart" type="number" min="0" max="100" value="${esc(c.claimMinHeart??'')}" placeholder="rarity default"></label><label class="checkline"><input id="ceTransferable" type="checkbox" ${c.transferable!==false?'checked':''}> 다른 캐릭터에게 전달 가능</label><label>Default Preference<select id="ceDefaultPref">${prefOptions(c.defaultPreference)}</select></label><label class="full">Gift Tags<input id="ceTags" value="${esc(split(c.tags).join(', '))}" placeholder="duck, handmade, family..."></label><label class="full">Character Grant Line<textarea id="ceClaimLine" rows="2">${esc(c.claimLine||'')}</textarea></label><label class="full">Character Preference Overrides<textarea id="ceOverrides" rows="4" placeholder="charlie-morningstar=LOVED\nalastor=DISLIKED">${esc(overrides)}</textarea></label><label class="full">Custom Transfer Narration<textarea id="ceLines" rows="4" placeholder="charlie-morningstar=특수 반응 문장">${esc(lines)}</textarea></label></div></details>`)
}
function collectEditor(){let card=$('#iName')?.closest('.editor-card');if(!card)return null;let h=String($('#ceClaimHeart',card)?.value||'').trim();return{claimable:!!$('#ceClaimable',card)?.checked,claimMinHeart:h===''?'':Number(h),transferable:!!$('#ceTransferable',card)?.checked,defaultPreference:String($('#ceDefaultPref',card)?.value||'NEUTRAL'),tags:split($('#ceTags',card)?.value||''),claimLine:String($('#ceClaimLine',card)?.value||'').trim(),characterOverrides:parseOverrides($('#ceOverrides',card)?.value||''),characterLines:parseLines($('#ceLines',card)?.value||'')}}
let pendingEditor=null;
function persistEditorSoon(){pendingEditor=collectEditor();if(!pendingEditor)return;setTimeout(()=>{let s=ensure(read()),id=s.draft?.item;if(!id)return;s.collectionTransferConfig[id]={...(s.collectionTransferConfig[id]||{}),...pendingEditor};pendingEditor=null;save(s,'collection-exchange-editor')},40)}

function enhance(){patchRoom();patchGiftMenu();patchDetail();patchEditor()}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
function observe(){let app=$('#app');if(app&&!app.dataset.collectionExchangeV1){app.dataset.collectionExchangeV1='1';new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true})}let body=document.body;if(body&&!body.dataset.collectionExchangeBodyV1){body.dataset.collectionExchangeBodyV1='1';new MutationObserver(schedule).observe(body,{childList:true,subtree:true})}}

document.addEventListener('click',e=>{
  let t=e.target;if(!(t instanceof Element))return;
  let d=t.closest('[data-hvg-detail]');if(d)detailItemId=String(d.dataset.hvgDetail||'');
  let k=t.closest('[data-ce-keepsakes]');if(k){e.preventDefault();e.stopImmediatePropagation();openKeepsakes(k.dataset.ceKeepsakes);return}
  let claim=t.closest('[data-ce-claim]');if(claim){e.preventDefault();e.stopImmediatePropagation();claimItem(claim.dataset.ceCid,claim.dataset.ceClaim);return}
  let launch=t.closest('[data-ce-gift-launch]');if(launch){e.preventDefault();e.stopImmediatePropagation();openInventoryForTarget(launch.dataset.ceGiftLaunch);return}
  let rec=t.closest('[data-ce-recipients]');if(rec){e.preventDefault();e.stopImmediatePropagation();openRecipients(rec.dataset.ceRecipients);return}
  let send=t.closest('[data-ce-send]');if(send){e.preventDefault();e.stopImmediatePropagation();sendItem(send.dataset.ceSend,send.dataset.ceTarget);return}
  if(t.closest('[data-ce-open-collection]')){e.preventDefault();closeOverlay();let s=ensure(read());s.page='collection';save(s);schedule();return}
  if(t.closest('[data-ce-close]')||t.classList.contains('collection-exchange-backdrop')){e.preventDefault();closeOverlay();return}
  if(t.closest('[data-save-item]'))persistEditorSoon()
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay){e.preventDefault();closeOverlay()}});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:gacha-updated',schedule);
window.addEventListener('storage',e=>{if(!e.key||e.key===K)schedule()});
document.addEventListener('DOMContentLoaded',()=>{seed();observe();enhance()});
window.addEventListener('load',()=>{seed();observe();enhance()});
setTimeout(()=>{seed();observe();enhance()},220);
})();