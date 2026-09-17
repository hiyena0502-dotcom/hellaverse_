(()=>{
'use strict';
if(window.__HELLAVERSE_DEFAULT_CONTENT_LOADER_V2__)return;
window.__HELLAVERSE_DEFAULT_CONTENT_LOADER_V2__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const REVISION='canonical-default-content-v2';
const PART_COUNT=11;
const BASE='js/default-content/default-content-v2.part';

const ENTITY_ARRAYS={
  characters:'id',
  dialogues:'id',
  gifts:'id',
  collectionItems:'id',
  rewards:'id',
  thoughts:'id',
  events:'id',
  eventCatalog:'id',
  thoughtCategoryCatalog:'id'
};

const KEYED_CONTENT=[
  'collectionProfiles',
  'gachaProfiles',
  'giftInventoryConfig',
  'giftAffectionConfig',
  'dialogueMeta',
  'collectionTransferConfig',
  'dialogueFileMap'
];

const WHOLE_CONTENT=[
  'dialogueEpisodeSystem',
  'canonDialoguePack'
];

const SET_ARRAYS=[
  'affiliationCatalog',
  'customAffiliations',
  'thoughtCategories',
  'memoryTagCatalog'
];

const CONTENT_SCALARS=[
  'thoughtSchemaVersion',
  'collectionExchangeSeedVersion'
];

const PERSONAL_KEYS=new Set([
  'page','active','homeCharacter','profile','section','extrasTab','extraTab','action','search','filter','player','draft','settings','ui',
  'affection','moods','flags','visits','visitHistory','ownedItems','owned','newCollectionItems','seenCollectionItems',
  'memories','conversationHistory','logs','box','points','seenThoughtIds','newThoughtIds','thoughtSeenAt','thoughtArchive','thoughtRareCooldown',
  'giftInventory','giftUseHistory','lastGiftResult','gachaAddon','conversationProgress','missionProgress','collectionExchange',
  'giftManagerV2','inventoryV1','inventoryV2','migrations','archivedContent','dialogueRuntime'
]);

function readState(){
  try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}
}
function writeState(state){
  localStorage.setItem(STATE_KEY,JSON.stringify(state));
}
function deletedSet(state){
  return new Set((Array.isArray(state.deletedDefaultCharacters)?state.deletedDefaultCharacters:[]).map(String));
}
function clone(v){
  if(typeof structuredClone==='function')return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}
function entityAllowed(value,deleted){
  if(!value||typeof value!=='object')return true;
  const cid=value.characterId==null?'':String(value.characterId);
  const id=value.id==null?'':String(value.id);
  if(cid&&deleted.has(cid))return false;
  if(id&&deleted.has(id))return false;
  return true;
}
function mergeEntityArray(localValue,canonicalValue,idKey,deleted,key){
  const local=Array.isArray(localValue)?localValue:[];
  const canonical=Array.isArray(canonicalValue)?canonicalValue:[];
  const byId=new Map();
  const order=[];
  for(const item of local){
    if(!item||typeof item!=='object')continue;
    const id=String(item[idKey]??'');
    if(!id||!entityAllowed(item,deleted))continue;
    if(!byId.has(id))order.push(id);
    byId.set(id,clone(item));
  }
  for(const item of canonical){
    if(!item||typeof item!=='object'||!entityAllowed(item,deleted))continue;
    const id=String(item[idKey]??'');
    if(!id)continue;
    const old=byId.get(id)||{};
    const merged={...old,...clone(item)};
    if((key==='dialogues'||key==='gifts')&&Object.prototype.hasOwnProperty.call(old,'used'))merged.used=old.used;
    if(!byId.has(id))order.push(id);
    byId.set(id,merged);
  }
  return order.map(id=>byId.get(id)).filter(Boolean);
}
function mergeKeyed(localValue,canonicalValue,deleted){
  const local=localValue&&typeof localValue==='object'&&!Array.isArray(localValue)?clone(localValue):{};
  const canonical=canonicalValue&&typeof canonicalValue==='object'&&!Array.isArray(canonicalValue)?canonicalValue:{};
  for(const [key,value] of Object.entries(canonical)){
    if(deleted.has(String(key)))continue;
    if(value&&typeof value==='object'&&!Array.isArray(value)&&value.characterId&&deleted.has(String(value.characterId)))continue;
    const old=local[key];
    if(old&&typeof old==='object'&&!Array.isArray(old)&&value&&typeof value==='object'&&!Array.isArray(value))local[key]={...old,...clone(value)};
    else local[key]=clone(value);
  }
  for(const id of deleted)delete local[id];
  return local;
}
function unionStrings(localValue,canonicalValue){
  return [...new Set([...(Array.isArray(localValue)?localValue:[]),...(Array.isArray(canonicalValue)?canonicalValue:[])].map(v=>String(v)).filter(Boolean))];
}
function decodeBase64(value){
  const clean=String(value||'').replace(/\s+/g,'');
  const binary=atob(clean);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
async function inflate(bytes){
  if(typeof DecompressionStream!=='function')throw new Error('DecompressionStream is unavailable');
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Response(stream).text();
}
async function fetchText(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const res=await fetch(url,{cache:'no-store',signal:controller.signal});
    if(!res.ok)throw new Error(`${url} -> ${res.status}`);
    return (await res.text()).trim();
  }finally{clearTimeout(timer)}
}
async function loadCanonical(){
  const parts=await Promise.all(Array.from({length:PART_COUNT},(_,i)=>fetchText(`${BASE}${i+1}.txt?v=2`)));
  const jsonText=await inflate(decodeBase64(parts.join('')));
  const parsed=JSON.parse(jsonText);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Canonical payload is not an object');
  return parsed;
}
function mergeCanonical(state,canonical){
  const next=state&&typeof state==='object'?clone(state):{};
  const deleted=deletedSet(next);

  for(const [key,idKey] of Object.entries(ENTITY_ARRAYS)){
    if(!Object.prototype.hasOwnProperty.call(canonical,key))continue;
    next[key]=mergeEntityArray(next[key],canonical[key],idKey,deleted,key);
  }
  for(const key of KEYED_CONTENT){
    if(!Object.prototype.hasOwnProperty.call(canonical,key))continue;
    next[key]=mergeKeyed(next[key],canonical[key],deleted);
  }
  for(const key of WHOLE_CONTENT){
    if(!Object.prototype.hasOwnProperty.call(canonical,key))continue;
    next[key]=clone(canonical[key]);
  }
  for(const key of SET_ARRAYS){
    if(!Object.prototype.hasOwnProperty.call(canonical,key))continue;
    next[key]=unionStrings(next[key],canonical[key]);
  }
  for(const key of CONTENT_SCALARS){
    if(Object.prototype.hasOwnProperty.call(canonical,key))next[key]=clone(canonical[key]);
  }

  // Collection aliases must describe the same shared definitions without touching ownership/progress.
  if(Array.isArray(next.collectionItems))next.items=next.collectionItems;

  // Never import fields that belong to one player's progress even if a future payload accidentally contains them.
  for(const key of PERSONAL_KEYS){
    if(Object.prototype.hasOwnProperty.call(state,key))next[key]=clone(state[key]);
    else delete next[key];
  }
  next.deletedDefaultCharacters=[...deleted];
  next.defaultContentRevision=REVISION;
  next.defaultContentAppliedAt=new Date().toISOString();
  return next;
}

window.__HV_DEFAULT_CONTENT_READY__=(async()=>{
  try{
    const state=readState();
    if(state.defaultContentRevision===REVISION)return {ok:true,skipped:true,revision:REVISION};
    const canonical=await loadCanonical();
    const merged=mergeCanonical(state,canonical);
    writeState(merged);
    window.dispatchEvent(new CustomEvent('hellaverse:default-content-ready',{detail:{revision:REVISION}}));
    return {ok:true,skipped:false,revision:REVISION};
  }catch(error){
    console.warn('Canonical default content v2 could not be applied; continuing with existing local data.',error);
    return {ok:false,error:String(error?.message||error),revision:REVISION};
  }
})();
})();
