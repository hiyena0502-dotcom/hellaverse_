(()=>{
'use strict';
if(window.__HELLAVERSE_ITEM_INVENTORY_MIGRATION_V1__)return;
window.__HELLAVERSE_ITEM_INVENTORY_MIGRATION_V1__=1;
const K='hellaverse_dialogue_state_v1';
const norm=v=>String(v||'').normalize('NFKC').trim().toLowerCase();
const safe=v=>String(v||'item').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'item';
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function findChoice(s,id){for(const sc of Array.isArray(s.dialogues)?s.dialogues:[])for(const node of Array.isArray(sc?.nodes)?sc.nodes:[]){const ch=(Array.isArray(node?.choices)?node.choices:[]).find(x=>String(x?.id||'')===String(id||''));if(ch)return ch}return null}
function run(){
  const s=read();s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);s.items=s.collectionItems;s.gifts=Array.isArray(s.gifts)?s.gifts:[];
  const raw=s.inventoryV1&&typeof s.inventoryV1==='object'?s.inventoryV1:{};raw.version=1;raw.counts=raw.counts&&typeof raw.counts==='object'?raw.counts:{};raw.giftRules=raw.giftRules&&typeof raw.giftRules==='object'?raw.giftRules:{};raw.legacyGiftItemMap=raw.legacyGiftItemMap&&typeof raw.legacyGiftItemMap==='object'?raw.legacyGiftItemMap:{};s.inventoryV1=raw;
  let changed=false,created=0,linked=0;
  const legacyConfig=s.giftInventoryConfig?.items&&typeof s.giftInventoryConfig.items==='object'?s.giftInventoryConfig.items:{};
  for(const [itemId,cfg] of Object.entries(legacyConfig)){
    const ch=cfg?.choiceId?findChoice(s,cfg.choiceId):null;if(ch&&!ch.unlockItemId){ch.unlockItemId=itemId;linked++;changed=true}
  }
  const legacyCounts=s.giftInventory?.ownedCounts&&typeof s.giftInventory.ownedCounts==='object'?s.giftInventory.ownedCounts:{};
  for(const [itemId,n] of Object.entries(legacyCounts)){const v=Math.max(0,Number(n||0));if(v>Number(raw.counts[itemId]||0)){raw.counts[itemId]=v;changed=true}}
  const v2=s.giftManagerV2&&typeof s.giftManagerV2==='object'?s.giftManagerV2:{},v2meta=v2.items&&typeof v2.items==='object'?v2.items:{},v2counts=v2.counts&&typeof v2.counts==='object'?v2.counts:{};
  for(const g of s.gifts){
    if(!g?.id||!g?.name)continue;let i=s.collectionItems.find(x=>norm(x?.name||x?.title)===norm(g.name));
    if(!i){let base=`gift-item-${safe(g.id)}`,id=base,n=2;while(s.collectionItems.some(x=>String(x.id)===id))id=`${base}-${n++}`;i={id,characterId:g.characterId||'',name:g.name,symbol:'◆',rarity:'COMMON',condition:'Gift / dialogue item',desc:g.shortDescription||g.description||'',gachaEnabled:false,legacyGiftId:g.id};s.collectionItems.push(i);created++;changed=true}
    raw.legacyGiftItemMap[g.id]=i.id;raw.giftRules[i.id]=raw.giftRules[i.id]&&typeof raw.giftRules[i.id]==='object'?raw.giftRules[i.id]:{};
    if(g.characterId&&!raw.giftRules[i.id][g.characterId]){raw.giftRules[i.id][g.characterId]={opening:g.opening||'',response:g.response||'',affectionDelta:Number(g.affectionDelta||0),setFlags:g.setFlags||'',removeFlags:g.removeFlags||'',moodChange:g.moodChange||'',memoryTitle:g.memoryTitle||'',memorySummary:g.memorySummary||'',memoryTags:g.memoryTags||''};changed=true}
    const m=v2meta[g.id];if(m?.choiceId){const ch=findChoice(s,m.choiceId);if(ch&&!ch.unlockItemId){ch.unlockItemId=i.id;linked++;changed=true}}
    const c=Math.max(0,Number(v2counts[g.id]||0));if(c>Number(raw.counts[i.id]||0)){raw.counts[i.id]=c;changed=true}
  }
  if(!changed)return;s.migrations=s.migrations&&typeof s.migrations==='object'?s.migrations:{};s.migrations.itemInventoryV1={at:new Date().toISOString(),legacyGiftItemsCreated:created,dialogueItemLinksRestored:linked};const value=JSON.stringify(s);localStorage.setItem(K,value);try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value}))}catch{}
}
run();
})();