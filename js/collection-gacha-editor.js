(()=>{
'use strict';
if(window.__HELLAVERSE_COLLECTION_GACHA_EDITOR_V2__)return;
window.__HELLAVERSE_COLLECTION_GACHA_EDITOR_V2__=1;

const K='hellaverse_dialogue_state_v1';
const RARITIES=['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MISTIC'];
const $=(s,r=document)=>r.querySelector(s);
let queued=false,pendingSave=null;

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(state){
  const value=JSON.stringify(state);localStorage.setItem(K,value);
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'collection-gacha-editor',clearDirty:false}}));
}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function rarity(v){let r=String(v||'COMMON').trim().toUpperCase();if(r==='MYSTIC'||r==='SECRET')r='MISTIC';if(r==='LEGEND')r='LEGENDARY';return RARITIES.includes(r)?r:'COMMON'}
function currentItem(state){
  const id=String(state.draft?.item||'');
  return (state.collectionItems||[]).find(item=>String(item.id)===id)||null;
}
function ensureRarityField(card,item){
  let select=$('#iRare',card);
  if(select){
    const label=select.closest('label');
    if(label){label.hidden=false;label.style.removeProperty('display');label.dataset.collectionRarityField='1'}
    return select;
  }
  const name=$('#iName',card),grid=name?.closest('.form-grid');if(!grid)return null;
  const label=document.createElement('label');label.dataset.collectionRarityField='1';label.innerHTML=`Rarity<select id="iRare">${RARITIES.map(r=>`<option value="${r}" ${rarity(item?.rarity)===r?'selected':''}>${r}</option>`).join('')}</select>`;
  const symbol=$('#iSym',grid)?.closest('label');
  if(symbol?.nextSibling)grid.insertBefore(label,symbol.nextSibling);else grid.appendChild(label);
  return $('#iRare',card);
}
function inject(){
  const name=$('#iName');if(!name)return;
  const card=name.closest('.editor-card');if(!card)return;
  const state=read(),item=currentItem(state)||{};
  ensureRarityField(card,item);
  if($('[data-inline-gacha]',card))return;
  const enabled=item.gachaEnabled!==false,weight=Number(item.gachaWeight)>0?Number(item.gachaWeight):'',line=String(item.gachaLine||item.drawLine||item.revealLine||'');
  const wrap=document.createElement('section');wrap.className='collection-gacha-inline';wrap.dataset.inlineGacha='1';
  wrap.innerHTML=`<div class="collection-gacha-inline-head"><span><p class="label">GACHA</p><h3>Collection Draw Settings</h3></span><small>Rarity는 Collection 기본 정보로 유지되고, 아래 항목은 뽑기 동작만 설정합니다.</small></div><div class="form-grid"><label>Gacha Pool<select id="iGachaEnabled"><option value="true" ${enabled?'selected':''}>ON</option><option value="false" ${!enabled?'selected':''}>OFF</option></select></label><label>Draw Weight<input id="iGachaWeight" type="number" min="0" step="1" value="${weight}" placeholder="AUTO"></label><label class="full">Reveal Line<input id="iGachaLine" value="${esc(line)}" placeholder="뽑기 결과와 Collection 상세에서 함께 표시될 문구"></label></div><p class="muted collection-gacha-help">Weight를 비우면 위 Rarity의 기본 확률 가중치를 사용합니다. Reveal Line은 카드 획득 시 결과 화면과 Collection 상세에서 함께 표시됩니다.</p>`;
  const save=$('[data-save-item]',card);
  if(save)card.insertBefore(wrap,save);else card.appendChild(wrap);
}
function capture(){
  const enabled=$('#iGachaEnabled'),weight=$('#iGachaWeight'),line=$('#iGachaLine'),rare=$('#iRare');if(!enabled)return null;
  return{enabled:enabled.value!=='false',weight:Number(weight?.value||0),line:String(line?.value||'').trim(),rarity:rarity(rare?.value)};
}
function applyPending(){
  if(!pendingSave)return;
  const data=pendingSave;pendingSave=null;
  const state=read(),item=currentItem(state);if(!item)return;
  item.rarity=data.rarity;
  item.gachaEnabled=data.enabled;
  if(data.weight>0)item.gachaWeight=data.weight;else delete item.gachaWeight;
  if(data.line)item.gachaLine=data.line;else delete item.gachaLine;
  write(state);schedule();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject()})}

document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('[data-save-item]')){
    pendingSave=capture();if(pendingSave)setTimeout(applyPending,0);
  }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
