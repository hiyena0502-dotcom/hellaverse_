(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_COLLECTION_REWARD_V1__)return;
window.__HELLAVERSE_DIALOGUE_COLLECTION_REWARD_V1__=1;
const K='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function findChoice(s,id){for(const sc of s.dialogues||[])for(const node of sc.nodes||[]){const ch=(node.choices||[]).find(x=>String(x?.id||'')===String(id||''));if(ch)return{scene:sc,choice:ch}}return null}
function item(s,id){return(s.collectionItems||s.items||[]).find(x=>String(x?.id||'')===String(id||''))||null}
function show(itemData){
  $('#hvDialogueCollectionReward')?.remove();const root=document.createElement('div');root.id='hvDialogueCollectionReward';root.className='dcr-backdrop';
  root.innerHTML=`<section class="dcr-card"><p class="label">COLLECTION ITEM</p><div class="dcr-symbol">${esc(itemData.symbol||'◆')}</div><h2>${esc(itemData.name||itemData.title||'New Collection Item')}</h2><span class="dcr-rarity">${esc(itemData.rarity||'COMMON')}</span><p>${esc(itemData.desc||itemData.description||itemData.memo||'컬렉션에 새로운 아이템이 추가되었습니다.')}</p><div class="dcr-actions"><button class="ghost-button" data-dcr-close>CONTINUE</button><button class="gold-button" data-dcr-view="${esc(itemData.id)}">VIEW COLLECTION</button></div></section>`;
  document.body.appendChild(root);
}
function viewCollection(id){
  $('#hvDialogueCollectionReward')?.remove();const button=$('[data-page="collection"]');if(button){button.click()}else{const s=read();s.page='collection';const v=JSON.stringify(s);localStorage.setItem(K,v);try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:v}))}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'dialogue-collection-reward'}}))}
  setTimeout(()=>{const card=document.querySelector(`[data-hvg-detail="${CSS.escape(String(id))}"]`);card?.click()},180);
}
document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const choice=t.closest('[data-choice]');if(choice){const before=read(),row=findChoice(before,choice.dataset.choice),itemId=String(row?.choice?.unlockItemId||'');if(itemId){const wasOwned=(before.ownedItems||before.owned||[]).map(String).includes(itemId);setTimeout(()=>{const after=read(),it=item(after,itemId),nowOwned=(after.ownedItems||after.owned||[]).map(String).includes(itemId);if(it&&!wasOwned&&nowOwned)show(it)},130)}}
  if(t.closest('[data-dcr-close]')||t===document.querySelector('.dcr-backdrop')){$('#hvDialogueCollectionReward')?.remove();return}
  const view=t.closest('[data-dcr-view]');if(view){e.preventDefault();viewCollection(view.dataset.dcrView)}
},true);
})();