(()=>{
'use strict';
if(window.__HELLAVERSE_GIFT_V2_LEGACY_CLEANUP__)return;
window.__HELLAVERSE_GIFT_V2_LEGACY_CLEANUP__=1;
const K='hellaverse_dialogue_state_v1';
function readRaw(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function findChoice(state,choiceId){
  for(const scene of Array.isArray(state.dialogues)?state.dialogues:[]){
    for(const node of Array.isArray(scene?.nodes)?scene.nodes:[]){
      const choice=(Array.isArray(node?.choices)?node.choices:[]).find(x=>String(x?.id||'')===String(choiceId||''));
      if(choice)return choice;
    }
  }
  return null;
}
function run(){
  const state=readRaw();
  const legacy=state.giftInventoryConfig&&typeof state.giftInventoryConfig==='object'?state.giftInventoryConfig:null;
  let changed=false,cleared=0;
  const rows=legacy?.items&&typeof legacy.items==='object'?legacy.items:{};
  for(const [collectionItemId,config] of Object.entries(rows)){
    const choiceId=String(config?.choiceId||'').trim();
    if(!choiceId)continue;
    const choice=findChoice(state,choiceId);
    if(choice&&String(choice.unlockItemId||'')===String(collectionItemId)){
      choice.unlockItemId='';
      changed=true;
      cleared++;
    }
  }
  if(Object.prototype.hasOwnProperty.call(state,'giftInventory')){delete state.giftInventory;changed=true}
  if(Object.prototype.hasOwnProperty.call(state,'giftInventoryConfig')){delete state.giftInventoryConfig;changed=true}
  if(!changed)return;
  state.migrations=state.migrations&&typeof state.migrations==='object'?state.migrations:{};
  state.migrations.giftManagerV2={at:new Date().toISOString(),legacyCollectionGiftLinksCleared:cleared};
  const value=JSON.stringify(state);
  localStorage.setItem(K,value);
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'gift-v2-legacy-cleanup',clearDirty:false}}));
}
run();
})();