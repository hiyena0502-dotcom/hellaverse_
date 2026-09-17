(()=>{
'use strict';
if(window.__HELLAVERSE_CAST_EXCLUSIONS_V2__)return;
window.__HELLAVERSE_CAST_EXCLUSIONS_V2__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const PROGRESS_KEY='hellaverse_conversation_progress_v1';
const REMOVED_IDS=new Set(['lilith-morningstar','speaker-of-god','saint-peter','st-peter','peter']);
const norm=v=>String(v||'').trim().toLowerCase().replace(/[_\s.]+/g,'-');

function read(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function isRemovedCharacter(c){
  const id=norm(c?.id),name=String(c?.name||'').trim().toUpperCase();
  if(REMOVED_IDS.has(id))return true;
  if(name==='LILITH MORNINGSTAR'||name==='SAINT PETER'||name==='ST. PETER')return true;
  if(/SPEAKER OF GOD|GOD'?S SPEAKER|신의\s*대변자/.test(name))return true;
  return false;
}
function clean(){
  const s=read(STATE_KEY,{});
  if(!s||typeof s!=='object')return;
  s.characters=Array.isArray(s.characters)?s.characters:[];
  const ids=new Set(REMOVED_IDS);
  for(const c of s.characters)if(isRemovedCharacter(c)&&c?.id)ids.add(String(c.id));

  const itemIds=new Set((Array.isArray(s.collectionItems)?s.collectionItems:[])
    .filter(x=>ids.has(String(x?.characterId||'')))
    .map(x=>String(x?.id||''))
    .filter(Boolean));
  const dialogueIds=new Set((Array.isArray(s.dialogues)?s.dialogues:[])
    .filter(x=>ids.has(String(x?.characterId||'')))
    .map(x=>String(x?.id||''))
    .filter(Boolean));

  s.deletedDefaultCharacters=[...new Set([...(Array.isArray(s.deletedDefaultCharacters)?s.deletedDefaultCharacters:[]),...ids])];
  s.characters=s.characters.filter(x=>!ids.has(String(x?.id||''))&&!isRemovedCharacter(x));

  for(const key of ['dialogues','gifts','thoughts','memories','conversationHistory']){
    if(Array.isArray(s[key]))s[key]=s[key].filter(x=>!ids.has(String(x?.characterId||''))&&!ids.has(String(x?.id||'')));
  }
  if(Array.isArray(s.collectionItems))s.collectionItems=s.collectionItems.filter(x=>!ids.has(String(x?.characterId||''))&&!itemIds.has(String(x?.id||'')));
  s.items=s.collectionItems||[];
  if(Array.isArray(s.rewards))s.rewards=s.rewards.filter(x=>!ids.has(String(x?.characterId||''))&&!itemIds.has(String(x?.itemId||'')));
  for(const key of ['ownedItems','owned','newCollectionItems'])if(Array.isArray(s[key]))s[key]=s[key].filter(id=>!itemIds.has(String(id)));

  for(const key of ['affection','moods','visits','collectionProfiles','gachaProfiles']){
    if(s[key]&&typeof s[key]==='object')for(const id of ids)delete s[key][id];
  }

  // Profile maps are character-scoped. Remove stale entries left behind by characters
  // deleted by other content packs (for example Michael/Gabriel), so diagnostics
  // never keep reporting orphan character profiles after the character is gone.
  const validCharacterIds=new Set(s.characters.map(c=>String(c?.id||'')).filter(Boolean));
  for(const key of ['collectionProfiles','gachaProfiles']){
    if(!s[key]||typeof s[key]!=='object')continue;
    for(const id of Object.keys(s[key]))if(!validCharacterIds.has(String(id)))delete s[key][id];
  }

  if(s.dialogueFileMap&&typeof s.dialogueFileMap==='object')for(const id of dialogueIds)delete s.dialogueFileMap[id];
  if(Array.isArray(s.events))s.events=s.events.filter(e=>!ids.has(String(e?.characterId||'')));

  if(ids.has(String(s.active||'')))s.active='lucifer-morningstar';
  if(ids.has(String(s.homeCharacter||'')))s.homeCharacter='lucifer-morningstar';
  if(ids.has(String(s.profile||'')))s.profile='';

  const p=read(PROGRESS_KEY,{version:2,characters:{}});
  if(p?.characters&&typeof p.characters==='object'){
    for(const id of ids)delete p.characters[id];
    for(const id of Object.keys(p.characters))if(!validCharacterIds.has(String(id)))delete p.characters[id];
    write(PROGRESS_KEY,p);
  }

  write(STATE_KEY,s);
}
clean();
})();
