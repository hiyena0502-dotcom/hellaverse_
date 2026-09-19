(()=>{
'use strict';
if(window.__HELLAVERSE_CONTENT_INTEGRITY_REPAIR_V2__)return;
window.__HELLAVERSE_CONTENT_INTEGRITY_REPAIR_V2__=1;

const K='hellaverse_dialogue_state_v1';
const REPORT_KEY='hellaverse_content_integrity_report_v1';
const SOURCE='content-integrity-repair-v1';
const ALLOWED_RARITY=new Set(['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MISTIC']);
const OWNER_ALIASES={
 'lucifer-morningstar':['루시퍼','Lucifer'],
 'charlie-morningstar':['찰리','Charlie'],
 'vaggie':['바기','배기','Vaggie'],
 'alastor':['알래스터','Alastor'],
 'angel-dust':['엔젤 더스트','엔젤','Angel Dust'],
 'husk':['허스크','Husk'],
 'niffty':['니프티','Niffty'],
 'sir-pentious':['펜셔스','Sir Pentious','Pentious'],
 'cherri-bomb':['체리 밤','체리','Cherri Bomb','Cherri'],
 'sera':['세라','Sera'],
 'emily':['에밀리','Emily'],
 'lute':['류트','Lute'],
 'adam':['아담','Adam'],
 'vox':['복스','Vox'],
 'valentino':['발렌티노','Valentino'],
 'velvette':['벨벳','Velvette'],
 'carmilla-carmine':['카밀라','Carmilla'],
 'rosie':['로지','Rosie'],
 'zestial':['제스티얼','Zestial'],
 'baxter':['백스터','Baxter'],
 'abel':['아벨','Abel'],
 'blitzo':['블리츠','Blitzø','Blitzo'],
 'paimon':['파이몬','Paimon'],
 'satan':['사탄','Satan'],
 'mammon':['마몬','Mammon'],
 'asmodeus':['아스모데우스','오지','Asmodeus'],
 'beelzebub':['비엘제붑','베엘제붑','퀸비','Beelzebub'],
 'belphegor':['벨페고르','Belphegor'],
 'leviathan':['레비아탄','Leviathan'],
 'stolas':['스토라스','Stolas'],
 'loona':['루나','Loona'],
 'moxxie':['목시','Moxxie'],
 'millie':['밀리','Millie'],
 'fizzarolli':['피자로리','피즈','Fizzarolli','Fizz'],
 'octavia':['옥타비아','Octavia']
};

let queued=false,running=false;
const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const escRe=v=>clean(v).replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{const value=JSON.stringify(s);localStorage.setItem(K,value);try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value,storageArea:localStorage,url:location.href}))}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:SOURCE,clearDirty:false}}))};
const push=(arr,type,entity,id,detail)=>{if(arr.length<120)arr.push({type,entity,id:String(id||''),detail})};

function rarity(v){
 let r=clean(v||'').toUpperCase();
 if(r==='MYSTIC')r='MISTIC';
 if(r==='LEGEND')r='LEGENDARY';
 return r;
}
function ids(state){
 return new Set((Array.isArray(state.characters)?state.characters:[]).map(c=>String(c?.id||'')).filter(Boolean));
}
function ownerFromCollectionId(id,valid){
 id=String(id||'');
 for(const cid of valid)if(id.startsWith(cid+'-collection-'))return cid;
 return'';
}
function ownerFromDialogueId(id,valid){
 id=String(id||'');
 for(const cid of valid){
  if(id.startsWith('ambient100-'+cid+'-'))return cid;
  if(id.startsWith('fanon50-'+cid+'-'))return cid;
  if(id.startsWith(cid+'-'))return cid;
 }
 return'';
}
function ownerFromExplicitName(name,valid){
 const n=clean(name);if(!n)return'';
 for(const [cid,names] of Object.entries(OWNER_ALIASES)){
  if(!valid.has(cid))continue;
  for(const alias of names){
   const a=escRe(alias);
   const p1=new RegExp('^'+a+'(?:가|이)\\s*(?:보낸|준|만든|쓰던|남긴|전해준|골라준|주워온|적은|쓴)(?:\\s|$)','i');
   if(p1.test(n))return cid;
  }
 }
 return'';
}
function leadingNamedSpeaker(text){
 const s=clean(text).replace(/^\[\[(?:CHARACTER|NARRATION|PLAYER)\]\]\s*/i,'');if(!s)return'';
 for(const [cid,names] of Object.entries(OWNER_ALIASES))for(const alias of names){
  if(new RegExp('^[“"‘’]*'+escRe(alias)+'\\s*(?::|：|—|-)','i').test(s))return cid;
 }
 return'';
}
function reportSignature(r){return JSON.stringify([r.counts,r.fixed,r.warnings])}

function run(){
 if(running)return;
 running=true;
 try{
  const s=read(),valid=ids(s);
  s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
  s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);
  s.items=s.collectionItems;
  const fixed=[],warnings=[];let changed=false;

  const dialogueIds=new Set();
  for(const sc of s.dialogues){
   const id=String(sc?.id||'');
   if(id){if(dialogueIds.has(id))push(warnings,'DUPLICATE_DIALOGUE_ID','dialogue',id,'같은 dialogue id가 둘 이상 있습니다.');dialogueIds.add(id)}
   const current=String(sc?.characterId||''),implied=ownerFromDialogueId(id,valid);
   if(implied&&current!==implied){
    sc.characterId=implied;changed=true;push(fixed,'DIALOGUE_OWNER_FROM_ID','dialogue',id,current+' → '+implied);
   }else if(current&&!valid.has(current))push(warnings,'INVALID_DIALOGUE_CHARACTER','dialogue',id,'존재하지 않는 characterId: '+current);
   const kind=clean(sc?.kind).toUpperCase();
   if(kind&&!['TALK','ASK','ENTRY','EXIT','IDLE','HOME'].includes(kind))push(warnings,'UNKNOWN_DIALOGUE_KIND','dialogue',id,kind);
   const m=s.dialogueMeta?.[id];
   if(m&&typeof m==='object'&&!Array.isArray(m)&&m.characterId&&String(m.characterId)!==String(sc.characterId||'')){
    m.characterId=String(sc.characterId||'');changed=true;push(fixed,'DIALOGUE_META_OWNER','dialogue',id,'dialogueMeta.characterId 동기화');
   }
  }

  const itemIds=new Set();
  for(const item of s.collectionItems){
   const id=String(item?.id||''),name=clean(item?.name||item?.title),current=String(item?.characterId||'');
   if(id){if(itemIds.has(id))push(warnings,'DUPLICATE_ITEM_ID','collection',id,'같은 collection item id가 둘 이상 있습니다.');itemIds.add(id)}
   const byId=ownerFromCollectionId(id,valid);
   if(byId&&current!==byId){
    item.characterId=byId;changed=true;push(fixed,'ITEM_OWNER_FROM_ID','collection',id||name,current+' → '+byId);
   }else if(current&&!valid.has(current))push(warnings,'INVALID_ITEM_CHARACTER','collection',id||name,'존재하지 않는 characterId: '+current);

   const nameCue=ownerFromExplicitName(name,valid);
   if(nameCue&&current&&nameCue!==current)push(warnings,'ITEM_NAME_MENTIONS_OTHER_CHARACTER','collection',id||name,'이름은 '+nameCue+'를 가리키지만 collection owner는 '+current+'입니다. 선물/관련 물건일 수 있어 자동 수정하지 않음.');

   if(item.dialogueSourceCharacterId&&!valid.has(String(item.dialogueSourceCharacterId))){
    push(warnings,'INVALID_ITEM_DIALOGUE_SOURCE','collection',id||name,'존재하지 않는 dialogueSourceCharacterId: '+String(item.dialogueSourceCharacterId));
   }

   const rr=rarity(item.rarity),rawRarity=clean(item.rarity).toUpperCase();
   if((rawRarity==='MYSTIC'||rawRarity==='LEGEND')&&rr!==rawRarity){
    const before=String(item.rarity||'');item.rarity=rr;changed=true;push(fixed,'RARITY_NORMALIZED','collection',id||name,before+' → '+rr);
   }else if(rawRarity&&!ALLOWED_RARITY.has(rr)){
    push(warnings,'UNKNOWN_RARITY','collection',id||name,'알 수 없는 rarity: '+rawRarity+' (자동 수정하지 않음)');
   }
   const desc=clean(item.desc||item.description||item.memo||item.body);
   if(!clean(item.gachaDescription)&&desc){
    item.gachaDescription=desc;changed=true;push(fixed,'GACHA_DESCRIPTION_FILLED','collection',id||name,'기본 설명을 가챠 설명으로 사용');
   }
   if(item.desc&&item.description&&clean(item.desc)!==clean(item.description))push(warnings,'DESCRIPTION_CONFLICT','collection',id||name,'desc와 description 내용이 다릅니다.');
   const sp=leadingNamedSpeaker(item.gachaLine||item.revealLine||item.claimLine||'');
   if(sp&&sp!==String(item.characterId||''))push(warnings,'REVEAL_SPEAKER_MISMATCH','collection',id||name,'당첨/획득 문구 화자 '+sp+' / 소유자 '+String(item.characterId||''));
  }

  for(const key of ['rewards','thoughts','gifts']){
   const arr=Array.isArray(s[key])?s[key]:[];
   for(const row of arr){const cid=String(row?.characterId||'');if(cid&&!valid.has(cid))push(warnings,'INVALID_'+key.toUpperCase()+'_CHARACTER',key,row?.id||row?.name,'존재하지 않는 characterId: '+cid)}
  }

  const byName=new Map();
  for(const item of s.collectionItems){const n=clean(item?.name||item?.title).toLowerCase();if(!n)continue;const rows=byName.get(n)||[];rows.push(item);byName.set(n,rows)}
  for(const [name,rows] of byName){const owners=[...new Set(rows.map(x=>String(x?.characterId||'')))];if(rows.length>1&&owners.length>1)push(warnings,'SAME_NAME_DIFFERENT_OWNERS','collection',name,'owners: '+owners.join(', '))}

  let prev=null;try{prev=JSON.parse(localStorage.getItem(REPORT_KEY)||'null')}catch{}
  const lastFixed=fixed.length?fixed:(Array.isArray(prev?.lastFixed)?prev.lastFixed:[]);
  const lastFixedAt=fixed.length?new Date().toISOString():String(prev?.lastFixedAt||'');
  const report={version:1,at:new Date().toISOString(),counts:{characters:valid.size,dialogues:s.dialogues.length,collectionItems:s.collectionItems.length,rewards:Array.isArray(s.rewards)?s.rewards.length:0,thoughts:Array.isArray(s.thoughts)?s.thoughts.length:0,gifts:Array.isArray(s.gifts)?s.gifts.length:0},fixed,warnings,lastFixed,lastFixedAt,summary:{fixed:fixed.length,lastFixed:lastFixed.length,warnings:warnings.length}};
  try{if(!prev||reportSignature(prev)!==reportSignature(report)||JSON.stringify(prev?.lastFixed||[])!==JSON.stringify(lastFixed))localStorage.setItem(REPORT_KEY,JSON.stringify(report));else localStorage.setItem(REPORT_KEY,JSON.stringify({...prev,...report,lastFixed,lastFixedAt}))}catch{try{localStorage.setItem(REPORT_KEY,JSON.stringify(report))}catch{}}
  if(changed)write(s);
 }catch(error){console.warn('Hellaverse content integrity audit failed safely.',error)}
 finally{running=false}
}
function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;run()},80)}
window.addEventListener('hellaverse:state-updated',e=>{if(e.detail?.source!==SOURCE)schedule()});
window.addEventListener('hellaverse:default-content-ready',schedule);
window.addEventListener('pageshow',schedule);
window.addEventListener('load',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();