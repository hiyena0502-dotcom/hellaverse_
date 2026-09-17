(()=>{
'use strict';
if(window.__HELLAVERSE_COLLECTION_GACHA_EDITOR_V1__)return;
window.__HELLAVERSE_COLLECTION_GACHA_EDITOR_V1__=1;

const K='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
let queued=false,pendingSave=null;

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(state){
  const value=JSON.stringify(state);localStorage.setItem(K,value);
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'collection-gacha-editor',clearDirty:false}}));
}
function currentItem(state){
  const id=String(state.draft?.item||'');
  return (state.collectionItems||[]).find(item=>String(item.id)===id)||null;
}
function inject(){
  const name=$('#iName');if(!name)return;
  const card=name.closest('.editor-card');if(!card||$('[data-inline-gacha]',card))return;
  const state=read(),item=currentItem(state)||{};
  const enabled=item.gachaEnabled!==false,weight=Number(item.gachaWeight)>0?Number(item.gachaWeight):'',line=String(item.gachaLine||item.drawLine||item.revealLine||'');
  const wrap=document.createElement('section');wrap.className='collection-gacha-inline';wrap.dataset.inlineGacha='1';
  wrap.innerHTML=`<div class="collection-gacha-inline-head"><span><p class="label">GACHA</p><h3>Collection Draw Settings</h3></span><small>이 카드가 Gacha에 들어갈지만 간단히 설정합니다.</small></div><div class="form-grid"><label>Gacha Pool<select id="iGachaEnabled"><option value="true" ${enabled?'selected':''}>ON</option><option value="false" ${!enabled?'selected':''}>OFF</option></select></label><label>Draw Weight<input id="iGachaWeight" type="number" min="0" step="1" value="${weight}" placeholder="AUTO"></label><label class="full">Reveal Line<input id="iGachaLine" value="${line.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" placeholder="선택 사항 · 비우면 기본 결과 문구 사용"></label></div><p class="muted collection-gacha-help">Weight를 비우면 카드 Rarity 기본값을 사용합니다. 별도 캐릭터 이모지 설정은 사용하지 않습니다.</p>`;
  const buttons=$('.button-row',card);
  if(buttons)card.insertBefore(wrap,buttons);else card.appendChild(wrap);
}
function capture(){
  const enabled=$('#iGachaEnabled'),weight=$('#iGachaWeight'),line=$('#iGachaLine');if(!enabled)return null;
  return{enabled:enabled.value!=='false',weight:Number(weight?.value||0),line:String(line?.value||'').trim()};
}
function applyPending(){
  if(!pendingSave)return;
  const data=pendingSave;pendingSave=null;
  const state=read(),item=currentItem(state);if(!item)return;
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
