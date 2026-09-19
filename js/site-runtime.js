(() => {
"use strict";

const STATE_KEY = "hellaverse-studio-state-v2";
const PREFS_KEY = "hellaverse-studio-prefs-v2";
const RARITIES = ["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MISTIC"];
const ORIGINS = [
  ["sinner","죄인 · SINNER","hell"],
  ["hellborn","헬본 · HELLBORN","hell"],
  ["angel","천사 · ANGEL","heaven"],
  ["winner","위너 · WINNER","heaven"]
];
const EMOTIONS = [
  ["calm","평온"],["joy","기쁨"],["embarrassed","당황"],["sad","슬픔"],
  ["angry","화남"],["anxious","불안"],["curious","호기심"],["guarded","경계"]
];
const FREQUENCIES = [["common","Common"],["normal","Normal"],["rare","Rare"]];
const DEFAULT_CATEGORIES = ["일상","관계","과거","천국","지옥","비밀"];
const DEFAULT_ITEM_CATEGORIES = ["개인 소지품","음식","장신구","편지·문서","장난감","수제품","기념품","열쇠·도구","기타"];
const GIFT_PREFERENCES = [
  ["LOVED",5],["LIKED",3],["NEUTRAL",1],["DISLIKED",-2],["HATED",-4]
];
const RARITY_ORDER = {COMMON:0,UNCOMMON:1,RARE:2,EPIC:3,LEGENDARY:4,MISTIC:5};

const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];
const uid = p => p + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
const clone = v => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clamp = (v,min,max,fallback=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;
};
const emotionLabel = id => EMOTIONS.find(x=>x[0]===id)?.[1] || "평온";
const originLabel = id => ORIGINS.find(x=>x[0]===id)?.[1] || "헬본 · HELLBORN";
const originRealm = id => ORIGINS.find(x=>x[0]===id)?.[2] || "hell";
const validOrigin = id => ORIGINS.some(x=>x[0]===id);
const normalizeOrigin = id => id==="heaven" ? "angel" : validOrigin(id) ? id : "hellborn";

function defaultState(){
  return {
    profile:{name:"",origin:""},
    characters:[],
    events:[],
    variables:[],
    asks:[],
    items:[],
    itemCategories:[...DEFAULT_ITEM_CATEGORIES],
    inventoryCounts:{},
    newItemIds:[],
    itemHistory:[],
    discoveredGiftReactionKeys:[],
    giftInteractionCounts:{},
    askedAskIds:[],
    unlockedAskIds:[],
    interactionHistory:[],
    collectionSettings:{showLocked:true,showOwnedCount:true,view:"grouped",sort:"recent"},
    thoughts:[],
    thoughtSettings:{categories:[...DEFAULT_CATEGORIES]},
    gacha:{
      enabled:true,
      currencyName:"SOUL",
      balance:100,
      singleCost:10,
      tenCost:90,
      rarityWeights:{COMMON:50,UNCOMMON:28,RARE:14,EPIC:7,LEGENDARY:3,MISTIC:1},
      history:[]
    },
    discoveredThoughtIds:[]
  };
}

function normalizeCharacter(c={}){
  return {
    id:c.id || uid("char"),
    name:c.name || "새 캐릭터",
    origin:normalizeOrigin(c.origin),
    role:c.role || "",
    quote:c.quote || "",
    image:c.image || "",
    enabled:c.enabled !== false,
    affectionStart:clamp(c.affectionStart,0,100,0),
    emotionDefault:EMOTIONS.some(x=>x[0]===c.emotionDefault) ? c.emotionDefault : "calm",
    emotionIntensity:clamp(c.emotionIntensity,0,100,10)
  };
}

function normalizeCondition(c){
  if(!c || typeof c!=="object") return null;
  return {variableId:c.variableId||"",operator:c.operator||"==",value:c.value??""};
}
function normalizeEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("fx"),variableId:x.variableId||"",operation:x.operation||"set",value:x.value??""
  })) : [];
}
function normalizeItemEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("itemfx"),
    itemId:x.itemId||"",
    amount:Math.max(1,Number(x.amount)||1)
  })) : [];
}
function normalizeItemCondition(c){
  if(!c || typeof c!=="object")return null;
  return {itemId:c.itemId||"",operator:c.operator||">=",value:Math.max(0,Number(c.value)||0)};
}
function normalizeAskCondition(c){
  if(!c || typeof c!=="object")return null;
  return {askId:c.askId||"",status:["asked","not-asked","unlocked","locked"].includes(c.status)?c.status:"asked"};
}
function normalizeAffectionCondition(c){
  if(!c || typeof c!=="object") return null;
  return {characterId:c.characterId||c.targetId||"",operator:c.operator||">=",value:clamp(c.value,0,100,0)};
}
function normalizeAffectionEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("afx"),characterId:x.characterId||x.targetId||"",amount:clamp(x.amount,-100,100,0)
  })) : [];
}
function normalizeEmotionCondition(c){
  if(!c || typeof c!=="object") return null;
  return {
    characterId:c.characterId||c.targetId||"",
    state:EMOTIONS.some(x=>x[0]===c.state)?c.state:"",
    intensityOperator:c.intensityOperator||">=",
    intensityValue:clamp(c.intensityValue,0,100,0)
  };
}
function normalizeEmotionEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("efx"),
    characterId:x.characterId||x.targetId||"",
    state:EMOTIONS.some(y=>y[0]===x.state)?x.state:"calm",
    intensity:clamp(x.intensity,0,100,0)
  })) : [];
}

function normalizeEntry(entry={}){
  const base={
    id:entry.id||uid("entry"),
    type:["dialogue","narration","choice"].includes(entry.type)?entry.type:"dialogue",
    condition:normalizeCondition(entry.condition),
    effects:normalizeEffects(entry.effects),
    itemEffects:normalizeItemEffects(entry.itemEffects),
    itemCondition:normalizeItemCondition(entry.itemCondition),
    askCondition:normalizeAskCondition(entry.askCondition),
    affectionCondition:normalizeAffectionCondition(entry.affectionCondition),
    affectionEffects:normalizeAffectionEffects(entry.affectionEffects),
    emotionCondition:normalizeEmotionCondition(entry.emotionCondition),
    emotionEffects:normalizeEmotionEffects(entry.emotionEffects)
  };
  if(base.type==="narration") return {...base,text:entry.text||""};
  if(base.type==="choice"){
    return {
      ...base,
      prompt:entry.prompt||"",
      options:Array.isArray(entry.options)?entry.options.map(o=>({
        id:o.id||uid("option"),
        label:o.label||"",
        entries:Array.isArray(o.entries)?o.entries.map(normalizeEntry):[],
        condition:normalizeCondition(o.condition),
        effects:normalizeEffects(o.effects),
        itemEffects:normalizeItemEffects(o.itemEffects),
        itemCondition:normalizeItemCondition(o.itemCondition),
        askCondition:normalizeAskCondition(o.askCondition),
        affectionCondition:normalizeAffectionCondition(o.affectionCondition),
        affectionEffects:normalizeAffectionEffects(o.affectionEffects),
        emotionCondition:normalizeEmotionCondition(o.emotionCondition),
        emotionEffects:normalizeEmotionEffects(o.emotionEffects),
        exitMode:o.exitMode==="end"?"end":"continue",
        targetEventId:o.targetEventId||""
      })):[]
    };
  }
  return {...base,speaker:entry.speaker||"",text:entry.text||""};
}

function normalizeEvent(e={}){
  return {
    id:e.id||uid("event"),
    name:e.name||"새 이벤트",
    characterId:e.characterId||"",
    nextEventId:e.nextEventId||"",
    emotionExitMode:e.emotionExitMode==="reset"?"reset":"keep",
    entries:Array.isArray(e.entries)?e.entries.map(normalizeEntry):[]
  };
}
function normalizeVariable(v={}){
  const type=["number","boolean","string"].includes(v.type)?v.type:"number";
  return {id:v.id||uid("var"),name:v.name||"새 변수",type,defaultValue:v.defaultValue??(type==="boolean"?"false":"0")};
}
function legacyInteractionEntry(type,text){
  if(!text)return null;
  return normalizeEntry({
    type:type==="narration"?"narration":"dialogue",
    speaker:"",
    text:String(text),
    condition:null,
    effects:[],
    affectionCondition:null,
    affectionEffects:[],
    emotionCondition:null,
    emotionEffects:[]
  });
}
function normalizeAsk(a={}){
  let entries=Array.isArray(a.entries)?a.entries.map(normalizeEntry):[];
  if(!entries.length&&a.reactionText){
    const legacy=legacyInteractionEntry(a.reactionType,a.reactionText);
    if(legacy)entries=[legacy];
  }
  return {
    id:a.id||uid("ask"),
    characterId:a.characterId||"",
    label:a.label||a.question||"새 질문",
    minAffection:clamp(a.minAffection,0,100,0),
    startLocked:Boolean(a.startLocked),
    unlockMinAffection:clamp(a.unlockMinAffection,0,100,0),
    unlockCondition:normalizeCondition(a.unlockCondition),
    unlockItemCondition:normalizeItemCondition(a.unlockItemCondition),
    unlockAskCondition:normalizeAskCondition(a.unlockAskCondition),
    unlockEmotionCondition:normalizeEmotionCondition(a.unlockEmotionCondition),
    affectionDelta:clamp(a.affectionDelta ?? a.reactionAffectionDelta,-100,100,0),
    emotionState:EMOTIONS.some(x=>x[0]===a.emotionState) ? a.emotionState : "",
    emotionIntensity:clamp(a.emotionIntensity ?? a.reactionEmotionIntensity,0,100,0),
    entries,
    enabled:a.enabled!==false
  };
}
function normalizeItemReaction(r={},fallbackCharacterId=""){
  let entries=Array.isArray(r.entries)?r.entries.map(normalizeEntry):[];
  if(!entries.length&&r.reactionText){
    const legacy=legacyInteractionEntry(r.reactionType,r.reactionText);
    if(legacy)entries=[legacy];
  }
  return {
    id:r.id||uid("item-reaction"),
    characterId:r.characterId||fallbackCharacterId||"",
    preference:GIFT_PREFERENCES.some(x=>x[0]===r.preference)?r.preference:
      ((Number(r.affectionDelta??r.giftAffectionDelta)||0)>=5?"LOVED":
       (Number(r.affectionDelta??r.giftAffectionDelta)||0)>=3?"LIKED":
       (Number(r.affectionDelta??r.giftAffectionDelta)||0)<-2?"HATED":
       (Number(r.affectionDelta??r.giftAffectionDelta)||0)<0?"DISLIKED":"NEUTRAL"),
    affectionDelta:clamp(r.affectionDelta ?? r.giftAffectionDelta,-100,100,0),
    emotionState:EMOTIONS.some(x=>x[0]===r.emotionState) ? r.emotionState : "",
    emotionIntensity:clamp(r.emotionIntensity ?? r.giftEmotionIntensity,0,100,0),
    firstEntries:Array.isArray(r.firstEntries)?r.firstEntries.map(normalizeEntry):entries.map(normalizeEntry),
    repeatEntries:Array.isArray(r.repeatEntries)?r.repeatEntries.map(normalizeEntry):entries.map(normalizeEntry),
    specialEntries:Array.isArray(r.specialEntries)?r.specialEntries.map(normalizeEntry):[],
    specialMinAffection:clamp(r.specialMinAffection,0,100,0),
    specialEmotionState:EMOTIONS.some(x=>x[0]===r.specialEmotionState)?r.specialEmotionState:"",
    specialEmotionIntensity:clamp(r.specialEmotionIntensity,0,100,0)
  };
}
function normalizeItem(i={}){
  const collectionCharacterId=i.collectionCharacterId||i.ownerCharacterId||i.characterId||"";
  let reactions=Array.isArray(i.reactions)?i.reactions.map(r=>normalizeItemReaction(r)):[];
  if(!reactions.length&&(i.reactionText||i.affectionDelta||i.emotionState)){
    reactions=[normalizeItemReaction({
      characterId:i.characterId||collectionCharacterId,
      affectionDelta:i.affectionDelta,
      emotionState:i.emotionState,
      emotionIntensity:i.emotionIntensity,
      reactionType:i.reactionType,
      reactionText:i.reactionText
    },i.characterId||collectionCharacterId)];
  }
  return {
    id:i.id||uid("item"),
    name:i.name||"새 아이템",
    category:i.category||"기타",
    rarity:RARITIES.includes(i.rarity)?i.rarity:"COMMON",
    collectionCharacterId,
    description:i.description||"",
    acquisitionMode:i.acquisitionMode==="unique"?"unique":"repeatable",
    giftUseMode:i.giftUseMode==="consume"?"consume":"keep",
    secret:Boolean(i.secret),
    gachaEnabled:i.gachaEnabled!==false,
    enabled:i.enabled!==false,
    weight:Math.max(.01,Number(i.weight)||1),
    reactions,
    legacyOwned:Math.max(0,Number(i.owned)||0),
    legacyUnlocked:Boolean(i.unlocked)
  };
}
function normalizeThought(t={}){
  return {
    id:t.id||uid("thought"),
    characterId:t.characterId||"",
    category:t.category||"일상",
    rarity:RARITIES.includes(t.rarity)?t.rarity:"COMMON",
    frequency:["common","normal","rare"].includes(t.frequency)?t.frequency:"common",
    text:t.text||"",
    enabled:t.enabled!==false
  };
}
function normalizeState(raw){
  const d=defaultState();
  const s=raw&&typeof raw==="object"?raw:{};
  const rawItems=Array.isArray(s.items) ? s.items : Array.isArray(s.collection) ? s.collection : [];
  const items=rawItems.map(normalizeItem);
  const inventoryCounts={...(s.inventoryCounts&&typeof s.inventoryCounts==="object"?s.inventoryCounts:{})};
  items.forEach(item=>{
    if(inventoryCounts[item.id]===undefined && (item.legacyOwned>0 || item.legacyUnlocked)){
      inventoryCounts[item.id]=Math.max(1,item.legacyOwned||0);
    }
    delete item.legacyOwned;
    delete item.legacyUnlocked;
  });
  const rawOrigin=s.profile?.origin;
  return {
    profile:{
      name:String(s.profile?.name||""),
      origin:rawOrigin ? normalizeOrigin(rawOrigin) : ""
    },
    characters:Array.isArray(s.characters)?s.characters.map(normalizeCharacter):[],
    events:Array.isArray(s.events)?s.events.map(normalizeEvent):[],
    variables:Array.isArray(s.variables)?s.variables.map(normalizeVariable):[],
    asks:Array.isArray(s.asks)?s.asks.map(normalizeAsk):[],
    items,
    itemCategories:[...new Set([
      ...(Array.isArray(s.itemCategories)&&s.itemCategories.length?s.itemCategories:d.itemCategories),
      ...items.map(i=>i.category),
      "기타"
    ].map(String).map(x=>x.trim()).filter(Boolean))],
    inventoryCounts:Object.fromEntries(Object.entries(inventoryCounts).map(([id,n])=>[id,Math.max(0,Number(n)||0)])),
    newItemIds:Array.isArray(s.newItemIds)?[...new Set(s.newItemIds.map(String))]:[],
    itemHistory:Array.isArray(s.itemHistory)?s.itemHistory.slice(-500):[],
    discoveredGiftReactionKeys:Array.isArray(s.discoveredGiftReactionKeys)?[...new Set(s.discoveredGiftReactionKeys.map(String))]:[],
    giftInteractionCounts:s.giftInteractionCounts&&typeof s.giftInteractionCounts==="object"
      ? Object.fromEntries(Object.entries(s.giftInteractionCounts).map(([k,v])=>[k,Math.max(0,Number(v)||0)]))
      : {},
    askedAskIds:Array.isArray(s.askedAskIds)?[...new Set(s.askedAskIds.map(String))]:[],
    unlockedAskIds:Array.isArray(s.unlockedAskIds)?[...new Set(s.unlockedAskIds.map(String))]:[],
    interactionHistory:Array.isArray(s.interactionHistory)?s.interactionHistory.slice(-500):[],
    collectionSettings:{
      showLocked:s.collectionSettings?.showLocked!==false,
      showOwnedCount:s.collectionSettings?.showOwnedCount!==false,
      view:s.collectionSettings?.view==="all"?"all":"grouped",
      sort:["recent","rarity","name","count"].includes(s.collectionSettings?.sort)?s.collectionSettings.sort:"recent"
    },
    thoughts:Array.isArray(s.thoughts)?s.thoughts.map(normalizeThought):[],
    thoughtSettings:{
      categories:Array.isArray(s.thoughtSettings?.categories)&&s.thoughtSettings.categories.length
        ? [...new Set(s.thoughtSettings.categories.map(String).filter(Boolean))]
        : d.thoughtSettings.categories
    },
    gacha:{
      enabled:s.gacha?.enabled!==false,
      currencyName:String(s.gacha?.currencyName||"SOUL"),
      balance:Math.max(0,Number(s.gacha?.balance ?? d.gacha.balance) || 0),
      singleCost:Math.max(0,Number(s.gacha?.singleCost ?? d.gacha.singleCost) || 0),
      tenCost:Math.max(0,Number(s.gacha?.tenCost ?? d.gacha.tenCost) || 0),
      rarityWeights:Object.fromEntries(RARITIES.map(r=>[r,Math.max(0,Number(s.gacha?.rarityWeights?.[r] ?? d.gacha.rarityWeights[r]) || 0)])),
      history:Array.isArray(s.gacha?.history)?s.gacha.history.slice(-50):[]
    },
    discoveredThoughtIds:Array.isArray(s.discoveredThoughtIds)?[...new Set(s.discoveredThoughtIds)]:[]
  };
}
function readState(){
  try{return normalizeState(JSON.parse(localStorage.getItem(STATE_KEY)))}catch{return normalizeState(null)}
}
function saveState(){localStorage.setItem(STATE_KEY,JSON.stringify(state))}
function readPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(PREFS_KEY)||"{}");
    return {textSpeed:clamp(p.textSpeed,0,80,24),autoDelay:clamp(p.autoDelay,250,3000,900),stageClick:p.stageClick!==false};
  }catch{return{textSpeed:24,autoDelay:900,stageClick:true}}
}
function savePrefs(){localStorage.setItem(PREFS_KEY,JSON.stringify(prefs))}

let state=readState();
let prefs=readPrefs();
let currentPage="home";
let selectedCharacterId="";
let homeIndex=0;
let thoughtFilter="ALL";
let collectionFilter="ALL";
let collectionRarity="ALL";
let collectionCategory="ALL";
let collectionStatus="ALL";
let collectionSource="ALL";
let collectionQuery="";
let pendingOrigin=state.profile.origin || "";
let roomMode="talk";
let activeInteractionReaction=null;
let activeInteractionEvent=null;
let interactionContext=null;
let editorDraft=null;
let editorTab="dialogue";
let dialogueSubtab="characters";
let selectedEditorCharacterId="";
let selectedEditorEventId="";
let selectedEntryId="";
let selectedThoughtId="";
let selectedAskId="";
let selectedItemId="";
let editorItemQuery="";
let editorItemCharacterFilter="ALL";
let editorItemRarityFilter="ALL";
let editorItemCategoryFilter="ALL";

let session=createSession();
let playback=null;
let typing={token:"",full:"",index:0,done:true,timer:null};
let autoMode=false;
let autoTimer=null;
let toastTimer=null;
let gachaAnimating=false;

const startScreen=$("#startScreen");
const gameShell=$("#gameShell");
const startForm=$("#startForm");
const playerNameInput=$("#playerNameInput");
const originChoice=$("#originChoice");
const enterGameButton=$("#enterGameButton");
const startHint=$("#startHint");
const playerBadge=$("#playerBadge");
const pageRoot=$("#pageRoot");
const modalRoot=$("#modalRoot");
const toastEl=$("#toast");
const editorOverlay=$("#editorOverlay");
const editorBody=$("#editorBody");

function createSession(){
  const variables={};
  state.variables.forEach(v=>variables[v.id]=parseVariable(v,v.defaultValue));
  const affection={};
  const emotions={};
  state.characters.forEach(c=>{
    affection[c.id]=c.affectionStart;
    emotions[c.id]={state:c.emotionDefault,intensity:c.emotionIntensity};
  });
  return {variables,affection,emotions,log:[]};
}
function syncSessionDefinitions(){
  state.variables.forEach(v=>{
    if(!(v.id in session.variables))session.variables[v.id]=parseVariable(v,v.defaultValue);
  });
  state.characters.forEach(c=>{
    if(!(c.id in session.affection))session.affection[c.id]=c.affectionStart;
    if(!(c.id in session.emotions))session.emotions[c.id]={state:c.emotionDefault,intensity:c.emotionIntensity};
  });
}
function parseVariable(v,value){
  if(!v)return value;
  if(v.type==="number"){const n=Number(value);return Number.isFinite(n)?n:0}
  if(v.type==="boolean")return value===true||String(value).toLowerCase()==="true";
  return String(value??"");
}
function getCharacter(id, source=state){return source.characters.find(c=>c.id===id)||null}
function enabledCharacters(source=state){return source.characters.filter(c=>c.enabled)}
function getEvent(id, source=state){
  if(activeInteractionEvent&&activeInteractionEvent.id===id)return activeInteractionEvent;
  return source.events.find(e=>e.id===id)||null;
}
function eventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId)}
function variableById(id,source=state){return source.variables.find(v=>v.id===id)||null}
function itemById(id,source=state){return source.items.find(i=>i.id===id)||null}
function itemCount(id,source=state){return Math.max(0,Number(source.inventoryCounts?.[id])||0)}
function itemLastAcquiredAt(id,source=state){
  for(let i=source.itemHistory.length-1;i>=0;i--){
    if(source.itemHistory[i]?.itemId===id)return Number(source.itemHistory[i].at)||0;
  }
  return 0;
}
function markItemSeen(id,source=state){
  source.newItemIds=(source.newItemIds||[]).filter(x=>x!==id);
}
function showItemAcquired(item,count,sourceType,isNew){
  const host=document.createElement("div");
  host.className="item-acquire-toast";
  host.innerHTML='<span class="item-acquire-kicker">'+esc(isNew?"NEW ITEM":"ITEM ACQUIRED")+'</span>'+
    '<strong>'+esc(item.name)+'</strong>'+
    '<small>'+esc(item.rarity)+' · '+esc(sourceType)+' · ×'+count+'</small>';
  document.body.appendChild(host);
  setTimeout(()=>host.classList.add("show"),20);
  setTimeout(()=>{host.classList.remove("show");setTimeout(()=>host.remove(),250)},2200);
}
function acquireItem(id,count=1,sourceType="BASIC",source=state,{notify=true}={}){
  const item=itemById(id,source);if(!item)return{count:itemCount(id,source),gained:0,isNew:false};
  source.inventoryCounts ||= {};
  source.newItemIds ||= [];
  source.itemHistory ||= [];
  const before=itemCount(id,source);
  let gain=Math.max(0,Number(count)||0);
  if(item.acquisitionMode==="unique"){
    gain=before>0?0:Math.min(1,gain);
  }
  const after=before+gain;
  source.inventoryCounts[id]=after;
  const isNew=before===0&&gain>0;
  if(isNew&&!source.newItemIds.includes(id))source.newItemIds.push(id);
  if(gain>0){
    source.itemHistory.push({
      id:uid("item-history"),itemId:id,source:String(sourceType||"BASIC").toUpperCase(),
      amount:gain,at:Date.now()
    });
    source.itemHistory=source.itemHistory.slice(-500);
    if(source===state){
      saveState();
      if(notify)showItemAcquired(item,after,String(sourceType||"BASIC").toUpperCase(),isNew);
    }
  }
  return{count:after,gained:gain,isNew};
}
function addItem(id,count=1,source=state){
  return acquireItem(id,count,"BASIC",source,{notify:false}).count;
}
function asksForCharacter(charId,source=state){
  return source.asks.filter(a=>a.characterId===charId&&a.enabled);
}
function itemsForCharacter(charId,source=state){
  return source.items.filter(i=>i.enabled&&(i.collectionCharacterId===charId||i.reactions.some(r=>r.characterId===charId)));
}
function flowHasItemGrant(entries,itemId){
  for(const entry of entries||[]){
    if((entry.itemEffects||[]).some(f=>f.itemId===itemId))return true;
    if(entry.type==="choice"){
      for(const option of entry.options||[]){
        if((option.itemEffects||[]).some(f=>f.itemId===itemId))return true;
        if(flowHasItemGrant(option.entries,itemId))return true;
      }
    }
  }
  return false;
}
function itemSourceTypes(item,source=state){
  const sources=[];
  if(item.gachaEnabled)sources.push("GACHA");
  let dialogue=false;
  for(const event of source.events||[])if(flowHasItemGrant(event.entries,item.id)){dialogue=true;break}
  if(!dialogue)for(const ask of source.asks||[])if(flowHasItemGrant(ask.entries,item.id)){dialogue=true;break}
  if(!dialogue){
    for(const it of source.items||[]){
      for(const reaction of it.reactions||[]){
        if(flowHasItemGrant(reaction.entries,item.id)){dialogue=true;break}
      }
      if(dialogue)break;
    }
  }
  if(dialogue)sources.push("DIALOGUE");
  return sources.length?sources:["BASIC"];
}
function itemSourceLabel(item,source=state){
  const s=itemSourceTypes(item,source);
  return s.includes("GACHA")&&s.includes("DIALOGUE")?"BOTH":s[0];
}


function conditionPasses(c){
  if(!c?.variableId)return true;
  const v=variableById(c.variableId); if(!v)return true;
  const cur=session.variables[v.id]??parseVariable(v,v.defaultValue);
  const exp=parseVariable(v,c.value);
  switch(c.operator){
    case"!=":return cur!==exp;case">":return Number(cur)>Number(exp);case">=":return Number(cur)>=Number(exp);
    case"<":return Number(cur)<Number(exp);case"<=":return Number(cur)<=Number(exp);
    case"truthy":return Boolean(cur);case"falsy":return !cur;default:return cur===exp;
  }
}
function affectionConditionPasses(c){
  if(!c?.characterId)return true;
  const ch=getCharacter(c.characterId);if(!ch)return true;
  const cur=Number(session.affection[ch.id]??ch.affectionStart),exp=Number(c.value)||0;
  switch(c.operator){case">":return cur>exp;case"<":return cur<exp;case"<=":return cur<=exp;case"==":return cur===exp;case"!=":return cur!==exp;default:return cur>=exp}
}
function emotionConditionPasses(c){
  if(!c?.characterId)return true;
  const ch=getCharacter(c.characterId);if(!ch)return true;
  const cur=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  if(c.state&&cur.state!==c.state)return false;
  const x=Number(cur.intensity)||0,y=Number(c.intensityValue)||0;
  switch(c.intensityOperator){case">":return x>y;case"<":return x<y;case"<=":return x<=y;case"==":return x===y;case"!=":return x!==y;default:return x>=y}
}
function ownerPasses(o){return conditionPasses(o?.condition)&&affectionConditionPasses(o?.affectionCondition)&&emotionConditionPasses(o?.emotionCondition)}
function applyEffects(arr){
  normalizeEffects(arr).forEach(f=>{
    const v=variableById(f.variableId);if(!v)return;
    const cur=session.variables[v.id]??parseVariable(v,v.defaultValue);
    const val=parseVariable(v,f.value);
    if(f.operation==="add")session.variables[v.id]=Number(cur)+Number(val);
    else if(f.operation==="subtract")session.variables[v.id]=Number(cur)-Number(val);
    else if(f.operation==="toggle")session.variables[v.id]=!Boolean(cur);
    else session.variables[v.id]=val;
  });
}
function applyAffectionEffects(arr){
  const messages=[];
  normalizeAffectionEffects(arr).forEach(f=>{
    const ch=getCharacter(f.characterId);if(!ch||!f.amount)return;
    const cur=Number(session.affection[ch.id]??ch.affectionStart);
    const next=clamp(cur+Number(f.amount),0,100,cur);
    const delta=next-cur;session.affection[ch.id]=next;
    if(delta)messages.push(ch.name+" 호감도 "+(delta>0?"+":"")+delta);
  });
  if(messages.length)showToast(messages.join(" · "));
}
function applyEmotionEffects(arr){
  const messages=[];
  normalizeEmotionEffects(arr).forEach(f=>{
    const ch=getCharacter(f.characterId);if(!ch)return;
    session.emotions[ch.id]={state:f.state,intensity:f.intensity};
    messages.push(ch.name+" 감정 → "+emotionLabel(f.state)+" "+f.intensity);
  });
  if(messages.length)showToast(messages.join(" · "));
}
function applyItemEffects(arr){
  normalizeItemEffects(arr).forEach(f=>{
    if(!f.itemId)return;
    acquireItem(f.itemId,f.amount,"DIALOGUE",state,{notify:true});
  });
}
function applyOwnerEffects(o){
  applyEffects(o.effects);
  applyItemEffects(o.itemEffects);
  applyAffectionEffects(o.affectionEffects);
  applyEmotionEffects(o.emotionEffects);
}
function applyInteractionEffects(source){
  const ch=getCharacter(source.characterId);if(!ch)return;
  const messages=[];
  const delta=clamp(source.affectionDelta,-100,100,0);
  if(delta){
    const current=Number(session.affection[ch.id]??ch.affectionStart);
    const next=clamp(current+delta,0,100,current);
    const applied=next-current;
    session.affection[ch.id]=next;
    if(applied)messages.push(ch.name+" 호감도 "+(applied>0?"+":"")+applied);
  }
  if(source.emotionState){
    const intensity=clamp(source.emotionIntensity,0,100,0);
    session.emotions[ch.id]={state:source.emotionState,intensity};
    messages.push(ch.name+" 감정 → "+emotionLabel(source.emotionState)+" "+intensity);
  }
  if(messages.length)showToast(messages.join(" · "));
}
function beginInteractionReaction(kind,source,entries,label=""){
  const ch=getCharacter(source.characterId);if(!ch)return;
  if(!interactionContext){
    interactionContext={
      playback:playback ? clone(playback) : null,
      selectedCharacterId,
      typing:{token:typing.token||"",full:typing.full||"",index:(typing.full||"").length,done:true,timer:null},
      followupActive:true
    };
  }
  clearTyping();clearAuto();autoMode=false;
  applyInteractionEffects(source);
  activeInteractionReaction=null;
  activeInteractionEvent={
    id:"__interaction__"+uid("flow"),
    name:(kind==="ask"?"ASK · ":"ITEM · ")+(label||"INTERACTION"),
    characterId:ch.id,
    nextEventId:"",
    emotionExitMode:"keep",
    entries:Array.isArray(entries)&&entries.length?entries:[normalizeEntry({
      type:"narration",
      text:"별다른 반응은 없었다.",
      condition:null,effects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]
    })]
  };
  selectedCharacterId=ch.id;
  roomMode="talk";
  playback={
    characterId:ch.id,
    eventId:activeInteractionEvent.id,
    frames:[{sourceType:"event",sourceId:activeInteractionEvent.id,index:0,label:kind.toUpperCase(),exitMode:"continue",targetEventId:""}],
    ended:false
  };
  typing={token:"",full:"",index:0,done:true,timer:null};
  renderRoom();
}
function renderInteractionReaction(){
  const dynamic=$("#roomDynamic");if(!dynamic||!activeInteractionReaction)return;
  const ch=getCharacter(activeInteractionReaction.characterId);
  const speaker=activeInteractionReaction.type==="narration"?"NARRATION":(ch?.name||"UNKNOWN");
  const text=activeInteractionReaction.text || (activeInteractionReaction.type==="narration"?"아무 일도 일어나지 않았다.":"...");
  dynamic.innerHTML='<div class="dialogue-box interaction-reaction"><p class="speaker">'+esc(speaker)+'</p><p class="dialogue-text">'+esc(text)+'</p><div class="dialogue-meta"><span>INTERRUPT · '+esc(activeInteractionReaction.kind.toUpperCase())+' · '+esc(activeInteractionReaction.label)+'</span><button type="button" data-action="finish-interaction">NEXT</button></div></div>';
}
function finishInteractionReaction(){
  const reaction=activeInteractionReaction;if(!reaction)return;
  activeInteractionReaction=null;
  if(reaction.followEventId&&getEvent(reaction.followEventId)){
    startInteractionFollowEvent(reaction.followEventId);
    return;
  }
  restoreInterruptedDialogue();
  renderRoom();
}
function startInteractionFollowEvent(eventId){
  const ev=getEvent(eventId);
  if(!ev){restoreInterruptedDialogue();renderRoom();return}
  interactionContext ||= {
    playback:playback ? clone(playback) : null,
    selectedCharacterId,
    typing:{token:"",full:"",index:0,done:true,timer:null},
    followupActive:false
  };
  interactionContext.followupActive=true;
  selectedCharacterId=ev.characterId||selectedCharacterId;
  roomMode="talk";
  playback={
    characterId:selectedCharacterId,
    eventId:ev.id,
    frames:[{sourceType:"event",sourceId:ev.id,index:0,label:"상호작용",exitMode:"continue",targetEventId:""}],
    ended:false
  };
  typing={token:"",full:"",index:0,done:true,timer:null};
  renderRoom();
}
function restoreInterruptedDialogue(){
  if(!interactionContext)return false;
  clearTyping();clearAuto();
  const saved=interactionContext;
  interactionContext=null;
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  selectedCharacterId=saved.selectedCharacterId||selectedCharacterId;
  playback=saved.playback ? clone(saved.playback) : null;
  typing={
    token:saved.typing?.token||"",
    full:saved.typing?.full||"",
    index:(saved.typing?.full||"").length,
    done:true,
    timer:null
  };
  roomMode="talk";
  return true;
}
function resetEventEmotion(event){
  if(event?.emotionExitMode!=="reset")return;
  const ch=getCharacter(event.characterId);if(ch)session.emotions[ch.id]={state:ch.emotionDefault,intensity:ch.emotionIntensity};
}

function makeEntry(type){
  const common={id:uid("entry"),condition:null,effects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]};
  if(type==="narration")return{...common,type,text:""};
  if(type==="choice")return{...common,type,prompt:"",options:[makeOption("선택지 1"),makeOption("선택지 2")]};
  return{...common,type:"dialogue",speaker:"",text:""};
}
function makeOption(label){
  return{id:uid("option"),label,entries:[],condition:null,effects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[],exitMode:"continue",targetEventId:""};
}
function regenerateIds(entry){
  entry.id=uid("entry");
  entry.effects=normalizeEffects(entry.effects).map(x=>({...x,id:uid("fx")}));
  entry.itemEffects=normalizeItemEffects(entry.itemEffects).map(x=>({...x,id:uid("itemfx")}));
  entry.affectionEffects=normalizeAffectionEffects(entry.affectionEffects).map(x=>({...x,id:uid("afx")}));
  entry.emotionEffects=normalizeEmotionEffects(entry.emotionEffects).map(x=>({...x,id:uid("efx")}));
  if(entry.type==="choice")entry.options.forEach(o=>{
    o.id=uid("option");
    o.effects=normalizeEffects(o.effects).map(x=>({...x,id:uid("fx")}));
    o.itemEffects=normalizeItemEffects(o.itemEffects).map(x=>({...x,id:uid("itemfx")}));
    o.affectionEffects=normalizeAffectionEffects(o.affectionEffects).map(x=>({...x,id:uid("afx")}));
    o.emotionEffects=normalizeEmotionEffects(o.emotionEffects).map(x=>({...x,id:uid("efx")}));
    o.entries.forEach(regenerateIds);
  });
}

function showToast(text){
  clearTimeout(toastTimer);
  toastEl.textContent=text;toastEl.hidden=false;
  toastTimer=setTimeout(()=>toastEl.hidden=true,1500);
}
function openModal(title,body){
  modalRoot.innerHTML='<div class="modal-backdrop" data-close-modal><section class="modal-card" role="dialog"><button class="modal-close" type="button" data-close-modal>×</button><p class="label">HELLAVERSE</p><h2>'+esc(title)+'</h2>'+body+'</section></div>';
}
function closeModal(){modalRoot.innerHTML=""}

function renderStart(){
  playerNameInput.value=state.profile.name||"";
  pendingOrigin=validOrigin(state.profile.origin)?state.profile.origin:(validOrigin(pendingOrigin)?pendingOrigin:"");
  $$("[data-origin]",originChoice).forEach(b=>b.classList.toggle("active",b.dataset.origin===pendingOrigin));
  startHint.textContent="";
  startScreen.hidden=false;gameShell.hidden=true;
}
function enterGame(){
  const name=playerNameInput.value.trim();
  if(!name||!validOrigin(pendingOrigin)){startHint.textContent="이름과 출신을 모두 선택하세요.";return false}
  state.profile={name,origin:pendingOrigin};saveState();
  startScreen.hidden=true;gameShell.hidden=false;
  updatePlayerBadge();
  const chars=enabledCharacters();
  if(chars.length&&!getCharacter(selectedCharacterId))selectedCharacterId=chars[0].id;
  currentPage="home";renderNav();renderPage();
  return true;
}
function updatePlayerBadge(){playerBadge.textContent=(state.profile.name||"PLAYER")+" · "+originLabel(state.profile.origin)}
function renderNav(){
  $$(".nav-button").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage));
}
function setPage(page){
  if(page!=="room"){
    activeInteractionReaction=null;
    interactionContext=null;
  }
  currentPage=page;
  renderNav();
  renderPage();
}
function renderPage(){
  if(currentPage==="home")renderHome();
  else if(currentPage==="gacha")renderGacha();
  else if(currentPage==="thought")renderThought();
  else if(currentPage==="collection")renderCollection();
  else if(currentPage==="room")renderRoom();
}
function renderHome(){
  const chars=enabledCharacters();
  if(!chars.length){
    pageRoot.innerHTML='<section class="empty-panel"><div><p class="page-kicker">HOME</p><h2>대화할 캐릭터가 없습니다.</h2><p>EDITOR → 대화 이벤트 → 캐릭터에서 첫 캐릭터를 추가하세요.</p><button class="gold-button" type="button" data-action="open-editor">편집기 열기</button></div></section>';
    return;
  }
  homeIndex=Math.max(0,Math.min(homeIndex,chars.length-1));
  const ch=chars[homeIndex];
  selectedCharacterId=ch.id;
  const aff=Math.round(session.affection[ch.id]??ch.affectionStart);
  const emo=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'" />':'<div class="silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</div>';
  pageRoot.innerHTML=
    '<section class="home-lobby">'+
      '<div class="lobby-character">'+
        '<div class="home-character"><div class="character-art">'+art+'</div></div>'+
        (chars.length>1?'<button class="lobby-arrow left" type="button" data-action="home-prev">‹</button><button class="lobby-arrow right" type="button" data-action="home-next">›</button>':'')+
        '<div class="lobby-copy"><p class="page-kicker">'+esc(originLabel(ch.origin))+'</p><h1>'+esc(ch.name)+'</h1>'+
          '<p class="role-line">'+esc(ch.role||"ROLE NOT SET")+'</p><p class="origin-line">AFFECTION '+aff+' · '+esc(emotionLabel(emo.state))+' '+emo.intensity+'</p>'+
          '<p class="quote-line">'+esc(ch.quote||"편집기에서 캐릭터 소개 문구를 설정할 수 있습니다.")+'</p></div>'+
        '<div class="character-counter">'+String(homeIndex+1).padStart(2,"0")+' / '+String(chars.length).padStart(2,"0")+'</div>'+
      '</div>'+
      '<div class="lobby-dashboard">'+
        '<button type="button" data-action="talk"><span>01 · ROOM</span><strong>TALK</strong><small>'+eventsForCharacter(ch.id).length+' EVENTS</small></button>'+
        '<button type="button" data-action="random-thought"><span>02 · INNER VOICE</span><strong>THOUGHT</strong><small>'+state.thoughts.filter(t=>t.characterId===ch.id&&t.enabled).length+' LINES</small></button>'+
        '<button type="button" data-action="show-affection"><span>03 · RELATION</span><strong>AFFECTION</strong><small>'+aff+' / 100</small></button>'+
        '<button type="button" data-action="show-emotion"><span>04 · STATUS</span><strong>EMOTION</strong><small>'+esc(emotionLabel(emo.state))+'</small></button>'+
      '</div>'+
    '</section>';
}
function renderGacha(){
  const availablePool=state.items.filter(i=>i.enabled&&i.gachaEnabled&&(i.acquisitionMode!=="unique"||itemCount(i.id)===0));
  const hasRepeatable=availablePool.some(i=>i.acquisitionMode==="repeatable");
  const canTen=hasRepeatable||availablePool.length>=10;
  const total=RARITIES.reduce((s,r)=>s+Number(state.gacha.rarityWeights[r]||0),0)||1;
  const history=state.gacha.history.slice(-8).reverse();
  const drawDisabled=gachaAnimating||!state.gacha.enabled||!availablePool.length;

  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">GACHA</p><h1>ARCHIVE DRAW</h1></div><p>아이템 설정에서 가챠 포함으로 지정한 아이템을 추첨합니다. UNIQUE는 한 번 획득하면 풀에서 빠집니다.</p></div>'+
    '<div class="gacha-layout">'+
      '<div class="gacha-stage '+(gachaAnimating?'is-drawing':'')+'"><div class="gacha-core"><p class="gacha-balance">'+esc(state.gacha.currencyName)+' · '+state.gacha.balance+'</p><h2>DRAW THE ARCHIVE</h2>'+
      '<p>'+availablePool.length+'개의 현재 획득 가능한 아이템이 있습니다.</p><div id="gachaResult" class="gacha-result-grid"></div>'+
      '<div class="draw-actions"><button class="gold-button" type="button" data-action="draw-gacha" data-count="1" '+(drawDisabled?"disabled":"")+'>1 DRAW · '+state.gacha.singleCost+'</button>'+
      '<button class="gold-button" type="button" data-action="draw-gacha" data-count="10" '+(drawDisabled||!canTen?"disabled":"")+'>10 DRAW · '+state.gacha.tenCost+'</button></div>'+
      (!canTen&&availablePool.length?'<p class="gacha-pool-note">REPEATABLE이 없고 UNIQUE 풀이 10개 미만이라 10회 뽑기가 잠겨 있습니다.</p>':'')+
      '</div><div class="gacha-aura" aria-hidden="true"></div></div>'+
      '<aside class="gacha-side"><div class="info-card"><h3>RATES</h3>'+RARITIES.map(r=>'<div class="rate-row"><span>'+r+'</span><b>'+((state.gacha.rarityWeights[r]/total)*100).toFixed(1)+'%</b></div>').join("")+'</div>'+
      '<div class="info-card"><div class="info-card-head"><h3>RECENT</h3><button class="small-button history-clear" type="button" data-action="clear-gacha-history" '+(!history.length||gachaAnimating?"disabled":"")+'>CLEAR</button></div>'+
      (history.length?history.map(h=>'<div class="history-row"><span>'+esc(h.rarity)+'</span><b>'+esc(h.name)+'</b></div>').join(""):'<p class="muted">아직 기록이 없습니다.</p>')+'</div></aside>'+
    '</div></section>';
}
function renderThought(){
  const discovered=new Set(state.discoveredThoughtIds);
  const chars=enabledCharacters();
  const visible=state.thoughts.filter(t=>discovered.has(t.id)&&(thoughtFilter==="ALL"||t.characterId===thoughtFilter));
  const groups={};
  visible.forEach(t=>(groups[t.category] ||= []).push(t));
  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">THOUGHT</p><h1>INNER ARCHIVE</h1></div><p>HOME에서 발견한 생각이 이곳에 기록됩니다.</p></div>'+
    '<div class="thought-toolbar"><button class="filter-chip '+(thoughtFilter==="ALL"?"active":"")+'" data-action="thought-filter" data-id="ALL">ALL</button>'+
      chars.map(c=>'<button class="filter-chip '+(thoughtFilter===c.id?"active":"")+'" data-action="thought-filter" data-id="'+esc(c.id)+'">'+esc(c.name)+'</button>').join("")+'</div>'+
    (Object.keys(groups).length?'<div class="thought-groups">'+Object.entries(groups).map(([cat,list])=>'<section class="thought-group"><h2>'+esc(cat)+'</h2>'+list.map(t=>'<article class="thought-card"><small>'+esc(getCharacter(t.characterId)?.name||"UNKNOWN")+' · '+esc(t.frequency.toUpperCase())+'</small><p>'+esc(t.text)+'</p></article>').join("")+'</section>').join("")+'</div>':
    '<div class="empty-panel"><div><h2>아직 발견한 Thought가 없습니다.</h2><p>HOME에서 캐릭터를 선택한 뒤 THOUGHT를 눌러보세요.</p></div></div>')+
    '</section>';
}
function renderCollection(){
  const chars=enabledCharacters();
  const categories=[...new Set(state.items.map(i=>i.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
  const query=collectionQuery.trim().toLowerCase();
  let items=state.items.filter(i=>i.enabled).filter(i=>{
    const count=itemCount(i.id),isNew=state.newItemIds.includes(i.id),source=itemSourceLabel(i);
    if(!state.collectionSettings.showLocked&&count<=0)return false;
    if(collectionFilter!=="ALL"&&i.collectionCharacterId!==collectionFilter)return false;
    if(collectionRarity!=="ALL"&&i.rarity!==collectionRarity)return false;
    if(collectionCategory!=="ALL"&&i.category!==collectionCategory)return false;
    if(collectionSource!=="ALL"&&source!==collectionSource)return false;
    if(collectionStatus==="NEW"&&!isNew)return false;
    if(collectionStatus==="OWNED"&&count<=0)return false;
    if(collectionStatus==="LOCKED"&&count>0)return false;
    if(query){
      const text=[i.name,i.description,i.category,i.rarity,source,getCharacter(i.collectionCharacterId)?.name].join(" ").toLowerCase();
      if(!text.includes(query))return false;
    }
    return true;
  });

  const sort=state.collectionSettings.sort||"recent";
  items.sort((a,b)=>{
    if(sort==="rarity")return (RARITY_ORDER[b.rarity]||0)-(RARITY_ORDER[a.rarity]||0)||a.name.localeCompare(b.name,"ko");
    if(sort==="name")return a.name.localeCompare(b.name,"ko");
    if(sort==="count")return itemCount(b.id)-itemCount(a.id)||a.name.localeCompare(b.name,"ko");
    return itemLastAcquiredAt(b.id)-itemLastAcquiredAt(a.id)||a.name.localeCompare(b.name,"ko");
  });

  const card=i=>{
    const count=itemCount(i.id),unlocked=count>0,isNew=state.newItemIds.includes(i.id),source=itemSourceLabel(i);
    return '<button class="collection-card rarity-'+esc(i.rarity)+' '+(unlocked?"":"locked")+' '+(isNew?"is-new":"")+'" type="button" data-action="collection-detail" data-id="'+esc(i.id)+'">'+
      (isNew?'<span class="collection-new-badge">NEW</span>':'')+
      '<em>'+esc(i.category)+'</em><span class="rarity">'+esc(i.rarity)+'</span>'+
      '<strong>'+(unlocked?esc(i.name):"LOCKED")+'</strong>'+
      '<div class="collection-card-meta"><span>'+esc(source)+'</span><span>'+esc(i.acquisitionMode.toUpperCase())+'</span></div>'+
      '<p>'+(unlocked?esc(i.description||"설명 없음"):"아직 획득하지 않은 아이템입니다.")+'</p>'+
      (unlocked&&state.collectionSettings.showOwnedCount?'<small>OWNED ×'+count+'</small>':'')+
    '</button>';
  };

  let body="";
  if(!items.length){
    body='<div class="empty-panel"><div><h2>조건에 맞는 아이템이 없습니다.</h2><p>필터를 바꾸거나 아이템을 획득해보세요.</p></div></div>';
  }else if(state.collectionSettings.view==="all"){
    body='<div class="collection-grid">'+items.map(card).join("")+'</div>';
  }else{
    const groups=chars
      .filter(ch=>collectionFilter==="ALL"||ch.id===collectionFilter)
      .map(ch=>({character:ch,items:items.filter(i=>i.collectionCharacterId===ch.id)}))
      .filter(g=>g.items.length);
    const unassigned=items.filter(i=>!getCharacter(i.collectionCharacterId));
    body=groups.map(g=>'<section class="collection-preview-group"><h3>'+esc(g.character.name)+'</h3><div class="collection-grid">'+g.items.map(card).join("")+'</div></section>').join("");
    if(unassigned.length)body+='<section class="collection-preview-group"><h3>UNASSIGNED</h3><div class="collection-grid">'+unassigned.map(card).join("")+'</div></section>';
  }

  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">COLLECTION</p><h1>CHARACTER ARCHIVE</h1></div><p>획득한 아이템과 아직 잠긴 아이템을 캐릭터별로 정리합니다.</p></div>'+
    '<div class="collection-viewbar"><div class="collection-view-buttons"><button class="filter-chip '+(state.collectionSettings.view==="grouped"?"active":"")+'" data-action="collection-view" data-view="grouped">캐릭터별</button><button class="filter-chip '+(state.collectionSettings.view==="all"?"active":"")+'" data-action="collection-view" data-view="all">전체</button></div>'+
      '<input data-collection-control="query" value="'+esc(collectionQuery)+'" placeholder="컬렉션 검색">'+
      '<select data-collection-control="rarity"><option value="ALL">모든 희귀도</option>'+RARITIES.map(r=>'<option value="'+r+'" '+(collectionRarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
      '<select data-collection-control="category"><option value="ALL">모든 카테고리</option>'+categories.map(cat=>'<option value="'+esc(cat)+'" '+(collectionCategory===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
      '<select data-collection-control="status"><option value="ALL" '+(collectionStatus==="ALL"?"selected":"")+'>전체 상태</option><option value="NEW" '+(collectionStatus==="NEW"?"selected":"")+'>NEW</option><option value="OWNED" '+(collectionStatus==="OWNED"?"selected":"")+'>OWNED</option><option value="LOCKED" '+(collectionStatus==="LOCKED"?"selected":"")+'>LOCKED</option></select>'+
      '<select data-collection-control="source"><option value="ALL">모든 획득처</option>'+["GACHA","DIALOGUE","BOTH","BASIC"].map(s=>'<option value="'+s+'" '+(collectionSource===s?"selected":"")+'>'+s+'</option>').join("")+'</select>'+
      '<select data-collection-control="sort"><option value="recent" '+(sort==="recent"?"selected":"")+'>최근 획득</option><option value="rarity" '+(sort==="rarity"?"selected":"")+'>희귀도</option><option value="name" '+(sort==="name"?"selected":"")+'>이름</option><option value="count" '+(sort==="count"?"selected":"")+'>보유 수</option></select>'+
    '</div>'+
    '<div class="collection-toolbar"><button class="filter-chip '+(collectionFilter==="ALL"?"active":"")+'" data-action="collection-filter" data-id="ALL">ALL</button>'+chars.map(ch=>'<button class="filter-chip '+(collectionFilter===ch.id?"active":"")+'" data-action="collection-filter" data-id="'+esc(ch.id)+'">'+esc(ch.name)+'</button>').join("")+'</div>'+
    '<div class="collection-summary">'+items.length+' ITEMS · '+state.newItemIds.filter(id=>itemCount(id)>0).length+' NEW · '+state.items.filter(i=>itemCount(i.id)>0).length+' OWNED</div>'+
    body+'</section>';
}

function startDialogue(characterId,eventId){
  const ch=getCharacter(characterId);if(!ch)return;
  selectedCharacterId=ch.id;
  roomMode="talk";
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  interactionContext=null;
  const ev=eventId?getEvent(eventId):eventsForCharacter(ch.id)[0];
  playback=ev?{
    characterId:ch.id,eventId:ev.id,
    frames:[{sourceType:"event",sourceId:ev.id,index:0,label:"본편",exitMode:"continue",targetEventId:""}],
    ended:false
  }:null;
  typing.token="";
  autoMode=false;clearTimeout(autoTimer);
  currentPage="room";renderNav();renderRoom();
}
function currentEvent(){return playback?getEvent(playback.eventId):null}
function findOptionGlobal(optionId){
  function scan(entries){
    for(const e of entries){
      if(e.type!=="choice")continue;
      for(const o of e.options){
        if(o.id===optionId)return o;
        const n=scan(o.entries);if(n)return n;
      }
    }
    return null;
  }
  if(activeInteractionEvent){
    const f=scan(activeInteractionEvent.entries);
    if(f)return f;
  }
  for(const ev of state.events){const f=scan(ev.entries);if(f)return f}
  return null;
}
function frameEntries(frame){
  if(!frame)return[];
  if(frame.sourceType==="option")return findOptionGlobal(frame.sourceId)?.entries||[];
  return getEvent(frame.sourceId)?.entries||[];
}
function visibleOptions(entry){return entry.options.filter(ownerPasses)}
function jumpEvent(id){
  const departing=currentEvent();const ev=getEvent(id);
  if(!ev){if(playback)playback.ended=true;return}
  resetEventEmotion(departing);
  playback.eventId=ev.id;playback.characterId=ev.characterId||playback.characterId;
  playback.frames=[{sourceType:"event",sourceId:ev.id,index:0,label:"본편",exitMode:"continue",targetEventId:""}];
  playback.ended=false;typing.token="";
}
function finishEvent(){
  const ev=currentEvent();
  if(activeInteractionEvent&&ev?.id===activeInteractionEvent.id){
    restoreInterruptedDialogue();
    return true;
  }
  if(ev?.nextEventId&&getEvent(ev.nextEventId)){jumpEvent(ev.nextEventId);return true}
  resetEventEmotion(ev);
  if(interactionContext?.followupActive){
    restoreInterruptedDialogue();
    return true;
  }
  if(playback)playback.ended=true;
  return false;
}
function settlePlayback(){
  if(!playback||playback.ended)return false;
  let guard=0;
  while(guard++<1000){
    const frame=playback.frames.at(-1);if(!frame){playback.ended=true;return false}
    const entries=frameEntries(frame);
    if(frame.index>=entries.length){
      if(frame.sourceType==="option"){
        playback.frames.pop();
        if(frame.targetEventId){jumpEvent(frame.targetEventId);continue}
        if(frame.exitMode==="end"){finishEvent();continue}
        continue;
      }
      if(finishEvent())continue;
      return false;
    }
    const entry=entries[frame.index];
    if(!ownerPasses(entry)){frame.index++;continue}
    if(entry.type==="choice"&&!visibleOptions(entry).length){frame.index++;continue}
    return true;
  }
  playback.ended=true;return false;
}
function clearTyping(){if(typing.timer)clearInterval(typing.timer);typing.timer=null}
function clearAuto(){clearTimeout(autoTimer);autoTimer=null}
function scheduleAuto(){
  clearAuto();
  if(!autoMode||!typing.done||!playback||playback.ended)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame?.index];
  if(!entry||entry.type==="choice")return;
  autoTimer=setTimeout(()=>advanceDialogue(true),prefs.autoDelay);
}
function startTyping(text,token){
  clearTyping();clearAuto();
  typing={token,full:text||"",index:0,done:false,timer:null};
  const target=$("#dialogueText");
  if(!target)return;
  if(prefs.textSpeed===0||!text){typing.done=true;target.textContent=text||"";scheduleAuto();return}
  target.textContent="";
  typing.timer=setInterval(()=>{
    typing.index++;target.textContent=typing.full.slice(0,typing.index);
    if(typing.index>=typing.full.length){clearTyping();typing.done=true;scheduleAuto()}
  },prefs.textSpeed);
}
function renderRoom(){
  const ch=getCharacter(selectedCharacterId);
  if(!ch){setPage("home");return}
  const ev=currentEvent();
  const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'" />':'<div class="silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</div>';
  const eventOptions=eventsForCharacter(ch.id);
  const interactionLocked=Boolean(activeInteractionReaction||interactionContext?.followupActive);

  pageRoot.innerHTML=
    '<section class="room-page"><div class="room-hud"><button class="text-link" type="button" data-action="back-home">← HOME</button><strong>'+esc(ch.name)+'</strong>'+
    '<div class="room-mode-bar"><button class="room-mode-button '+(roomMode==="talk"?"active":"")+'" type="button" data-action="room-mode" data-mode="talk" '+(interactionLocked?"disabled":"")+'>TALK</button>'+
    '<button class="room-mode-button '+(roomMode==="ask"?"active":"")+'" type="button" data-action="room-mode" data-mode="ask" '+(interactionLocked?"disabled":"")+'>ASK</button>'+
    '<button class="room-mode-button '+(roomMode==="inventory"?"active":"")+'" type="button" data-action="room-mode" data-mode="inventory" '+(interactionLocked?"disabled":"")+'>INVENTORY</button></div>'+
    (roomMode==="talk"&&eventOptions.length&&!interactionLocked?'<select id="roomEventSelect" style="width:auto;min-width:190px">'+eventOptions.map(e=>'<option value="'+esc(e.id)+'" '+(ev?.id===e.id?"selected":"")+'>'+esc(e.name)+'</option>').join("")+'</select>':'')+
    '<div class="room-actions"><button class="text-link" type="button" data-action="show-log">LOG</button><button class="text-link" type="button" data-action="show-affection">AFFECTION</button><button class="text-link" type="button" data-action="show-emotion">EMOTION</button></div></div>'+
    '<div class="room-stage"><div class="room-art">'+art+'</div><div id="roomDynamic"></div>'+
    (roomMode==="talk"&&!activeInteractionReaction?'<div class="room-control-bar"><button type="button" data-action="toggle-auto" class="'+(autoMode?"active":"")+'">AUTO</button><button type="button" data-action="open-play-settings">SET</button></div>':'')+
    '</div></section>';

  if(activeInteractionReaction)renderInteractionReaction();
  else if(roomMode==="ask")renderAskPanel();
  else if(roomMode==="inventory")renderInventoryPanel();
  else renderRoomBeat();
}
function renderRoomBeat(){
  if(roomMode!=="talk")return;
  if(playback?.characterId && playback.characterId!==selectedCharacterId){
    selectedCharacterId=playback.characterId;
    renderRoom();
    return;
  }
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  if(!playback){
    dynamic.innerHTML='<div class="room-empty"><h2>등록된 이벤트가 없습니다.</h2><p>편집기에서 이 캐릭터의 이벤트를 추가하세요.</p></div>';return;
  }
  if(!settlePlayback()){
    dynamic.innerHTML='<div class="room-empty"><h2>이벤트가 끝났습니다.</h2><p>다른 이벤트를 선택하거나 ASK / INVENTORY를 이용할 수 있습니다.</p></div>';clearTyping();clearAuto();return;
  }
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(entry.type==="choice"){
    clearTyping();clearAuto();
    const opts=visibleOptions(entry);
    dynamic.innerHTML='<div class="choice-box"><p class="page-kicker">CHOICE</p><h2>'+esc(entry.prompt||"무엇을 선택할까?")+'</h2><div class="choice-list">'+opts.map(o=>'<button class="choice-option" type="button" data-action="choose-option" data-id="'+esc(o.id)+'">'+esc(o.label||"이름 없는 선택지")+'</button>').join("")+'</div></div>';
    return;
  }
  const token=playback.eventId+"|"+playback.frames.map(f=>f.sourceId+":"+f.index).join("|")+"|"+entry.id;
  const speaker=entry.type==="narration"?"":(entry.speaker||chName(playback.characterId));
  dynamic.innerHTML='<div class="dialogue-box"><p class="speaker">'+esc(entry.type==="narration"?"NARRATION":speaker)+'</p><p id="dialogueText" class="dialogue-text"></p><div class="dialogue-meta"><span>'+esc(frame.label)+' · '+(frame.index+1)+' / '+frameEntries(frame).length+'</span><button type="button" data-action="advance-dialogue">NEXT</button></div></div>';
  if(typing.token!==token){
    session.log.push({kind:entry.type,speaker,text:entry.text||"",eventName:currentEvent()?.name||""});
    if(session.log.length>200)session.log.splice(0,session.log.length-200);
    startTyping(entry.text||"",token);
  }else{
    $("#dialogueText").textContent=typing.done?typing.full:typing.full.slice(0,typing.index);
    scheduleAuto();
  }
}

function renderAskPanel(){
  if(!typing.done){
    clearTyping();
    typing.index=typing.full.length;
    typing.done=true;
  }
  clearAuto();
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  const asks=asksForCharacter(ch.id).filter(a=>affection>=a.minAffection);
  dynamic.innerHTML='<section class="ask-panel"><div class="inventory-character-head"><div><p class="page-kicker">ASK</p><h2>대화 중 무엇을 물어볼까?</h2></div><p>현재 대화는 그대로 유지됩니다.</p></div><div class="ask-list">'+
    (asks.length?asks.map(a=>'<button class="ask-entry" type="button" data-action="ask-topic" data-id="'+esc(a.id)+'"><span>'+esc(a.label)+'</span><small>INTERRUPT</small></button>').join(""):'<div class="editor-note">현재 사용할 수 있는 질문이 없습니다.</div>')+
    '</div></section>';
}
function startAsk(id){
  const ask=state.asks.find(a=>a.id===id&&a.enabled);if(!ask)return;
  const ch=getCharacter(ask.characterId);if(!ch||selectedCharacterId!==ch.id)return;
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  if(affection<ask.minAffection){showToast("아직 물어볼 수 없습니다.");return}
  beginInteractionReaction("ask",ask,ask.entries,ask.label);
}
function renderInventoryPanel(){
  if(!typing.done){
    clearTyping();
    typing.index=typing.full.length;
    typing.done=true;
  }
  clearAuto();
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const items=state.items.filter(i=>i.enabled&&itemCount(i.id)>0);
  dynamic.innerHTML='<section class="inventory-panel"><div class="inventory-character-head"><div><p class="page-kicker">INVENTORY</p><h2>GIVE ITEM</h2></div><p>'+esc(ch.name)+'에게 보유 아이템을 건넬 수 있습니다.</p></div><div class="inventory-list">'+
    (items.length?items.map(i=>{
      const reaction=i.reactions.find(r=>r.characterId===ch.id);
      const reactionLabel=reaction?(reaction.preference+' · REACTION'):'DEFAULT';
      return '<button class="inventory-entry" type="button" data-action="inventory-item" data-id="'+esc(i.id)+'"><span><b>'+esc(i.name)+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+' · '+esc(reactionLabel)+'</small></span><span class="count">GIVE · ×'+itemCount(i.id)+'</span></button>';
    }).join(""):'<div class="editor-note">보유 아이템이 없습니다.</div>')+
    '</div></section>';
}
function useInventoryItem(id){
  const item=itemById(id);if(!item||itemCount(id)<=0)return;
  const reaction=item.reactions.find(r=>r.characterId===selectedCharacterId) || {
    id:uid("item-reaction"),
    characterId:selectedCharacterId,
    affectionDelta:0,
    emotionState:"",
    emotionIntensity:0,
    entries:[normalizeEntry({
      type:"narration",
      text:"상대는 아이템을 받아 들였지만 특별한 반응은 보이지 않았다.",
      condition:null,effects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]
    })]
  };
  beginInteractionReaction("item",reaction,reaction.entries,item.name);
}
function chName(id){return getCharacter(id)?.name||"UNKNOWN"}
function advanceDialogue(fromAuto=false){
  if(!playback||playback.ended)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(!entry||entry.type==="choice")return;
  if(!typing.done&&!fromAuto){typing.index=typing.full.length;typing.done=true;clearTyping();$("#dialogueText").textContent=typing.full;scheduleAuto();return}
  clearAuto();applyOwnerEffects(entry);frame.index++;typing.token="";renderRoomBeat();
}
function chooseOption(id){
  if(!playback)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(!entry||entry.type!=="choice")return;
  const option=entry.options.find(o=>o.id===id);if(!option||!ownerPasses(option))return;
  applyOwnerEffects(entry);applyOwnerEffects(option);
  session.log.push({kind:"choice",speaker:"CHOICE",text:(entry.prompt||"선택")+" → "+(option.label||""),eventName:currentEvent()?.name||""});
  frame.index++;
  if(option.entries.length){
    playback.frames.push({sourceType:"option",sourceId:option.id,index:0,label:option.label||"분기",exitMode:option.exitMode,targetEventId:option.targetEventId||""});
  }else if(option.targetEventId)jumpEvent(option.targetEventId);
  else if(option.exitMode==="end")finishEvent();
  typing.token="";renderRoomBeat();
}

function showAffection(){
  const chars=enabledCharacters();
  openModal("AFFECTION",'<div class="status-list">'+(chars.length?chars.map(c=>{
    const v=clamp(session.affection[c.id]??c.affectionStart,0,100,0);
    return '<div class="status-card"><div class="status-head"><strong>'+esc(c.name)+'</strong><span>'+v+' / 100</span></div><div class="status-track"><div class="status-fill" style="width:'+v+'%"></div></div></div>';
  }).join(""):'<p class="muted">등록된 캐릭터가 없습니다.</p>')+'</div>');
}
function showEmotion(){
  const chars=enabledCharacters();
  openModal("EMOTION",'<div class="status-list">'+(chars.length?chars.map(c=>{
    const v=session.emotions[c.id]||{state:c.emotionDefault,intensity:c.emotionIntensity};
    return '<div class="status-card"><div class="status-head"><strong>'+esc(c.name)+'</strong><span>'+esc(emotionLabel(v.state))+'</span></div><div class="status-track"><div class="status-fill" style="width:'+v.intensity+'%"></div></div><small class="muted">강도 '+v.intensity+' / 100</small></div>';
  }).join(""):'<p class="muted">등록된 캐릭터가 없습니다.</p>')+'</div>');
}
function showLog(){
  openModal("DIALOGUE LOG",'<div class="log-list">'+(session.log.length?session.log.slice().reverse().map(x=>'<article class="log-row"><small>'+esc(x.eventName)+(x.speaker?' · '+esc(x.speaker):'')+'</small><p>'+esc(x.text)+'</p></article>').join(""):'<p class="muted">아직 기록이 없습니다.</p>')+'</div>');
}
function showPlaySettings(){
  openModal("PLAY SETTINGS",'<div class="settings-grid"><label class="field"><span>텍스트 속도</span><input id="prefTextSpeed" type="range" min="0" max="80" step="1" value="'+prefs.textSpeed+'"></label><label class="field"><span>AUTO 대기</span><input id="prefAutoDelay" type="range" min="250" max="3000" step="50" value="'+prefs.autoDelay+'"></label><label class="checkline"><input id="prefStageClick" type="checkbox" '+(prefs.stageClick?"checked":"")+'> 대화 영역 클릭으로 진행</label></div>');
}
function randomThought(){
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const candidates=state.thoughts.filter(t=>t.enabled&&t.characterId===ch.id);
  if(!candidates.length){showToast("등록된 Thought가 없습니다.");return}
  const weight={common:8,normal:4,rare:1};
  const total=candidates.reduce((s,t)=>s+(weight[t.frequency]||1),0);
  let roll=Math.random()*total,chosen=candidates[0];
  for(const t of candidates){roll-=weight[t.frequency]||1;if(roll<=0){chosen=t;break}}
  if(!state.discoveredThoughtIds.includes(chosen.id))state.discoveredThoughtIds.push(chosen.id);
  saveState();
  openModal(ch.name+" · THOUGHT",'<p class="label">'+esc(chosen.category)+' · '+esc(chosen.frequency.toUpperCase())+'</p><p style="white-space:pre-wrap;line-height:1.8;font-family:Georgia,serif;font-size:1.2rem">'+esc(chosen.text)+'</p>');
}
function chooseWeighted(items,getWeight){
  const total=items.reduce((s,x)=>s+Math.max(0,Number(getWeight(x))||0),0);
  if(total<=0)return items[Math.floor(Math.random()*items.length)];
  let roll=Math.random()*total;
  for(const item of items){roll-=Math.max(0,Number(getWeight(item))||0);if(roll<=0)return item}
  return items.at(-1);
}
function playGachaAnimation(results){
  const stage=$(".gacha-stage",pageRoot);
  const box=$("#gachaResult");
  if(!stage||!box){gachaAnimating=false;return}
  stage.classList.add("is-drawing");
  box.innerHTML='<div class="gacha-summon"><span class="gacha-sigil">✦</span><b>SUMMONING</b><small>ARCHIVE LINK</small></div>';
  setTimeout(()=>{
    stage.classList.add("is-reveal");
    box.innerHTML=results.map((result,index)=>{
      const i=result.item;
      return '<div class="gacha-result-card gacha-reveal-card rarity-'+esc(i.rarity)+' '+(result.isNew?"is-new":"")+'" style="animation-delay:'+(index*80)+'ms">'+
        (result.isNew?'<span class="gacha-new-badge">NEW</span>':'')+
        '<span>'+esc(i.rarity)+'</span><strong>'+esc(i.name)+'</strong>'+
        '<small>'+esc(getCharacter(i.collectionCharacterId)?.name||"UNASSIGNED")+' · ×'+result.count+'</small></div>';
    }).join("");
    setTimeout(()=>{
      gachaAnimating=false;
      stage.classList.remove("is-drawing","is-reveal");
      $$(".draw-actions button",pageRoot).forEach(button=>button.disabled=false);
    },Math.max(900,results.length*80+600));
  },650);
}
function clearGachaHistory(){
  state.gacha.history=[];
  saveState();
  renderGacha();
  showToast("가챠 RECENT 기록을 비웠습니다.");
}
function drawGacha(count){
  if(gachaAnimating)return;
  const initialPool=state.items.filter(i=>i.enabled&&i.gachaEnabled&&(i.acquisitionMode!=="unique"||itemCount(i.id)===0));
  if(!initialPool.length){showToast("현재 뽑을 수 있는 가챠 아이템이 없습니다.");return}
  if(count===10&&!initialPool.some(i=>i.acquisitionMode==="repeatable")&&initialPool.length<10){
    showToast("10회 뽑기에 필요한 획득 가능 아이템이 부족합니다.");
    return;
  }
  const cost=count===10?state.gacha.tenCost:state.gacha.singleCost;
  if(state.gacha.balance<cost){showToast(state.gacha.currencyName+"이 부족합니다.");return}
  state.gacha.balance-=cost;
  const results=[];

  for(let n=0;n<count;n++){
    const pool=state.items.filter(i=>i.enabled&&i.gachaEnabled&&(i.acquisitionMode!=="unique"||itemCount(i.id)===0));
    if(!pool.length)break;
    const rarity=chooseWeighted(RARITIES,r=>state.gacha.rarityWeights[r])||"COMMON";
    const candidates=pool.filter(x=>x.rarity===rarity);
    const item=chooseWeighted(candidates.length?candidates:pool,x=>x.weight);
    if(!item)continue;
    const acquired=acquireItem(item.id,1,"GACHA",state,{notify:false});
    if(!acquired.gained)continue;
    results.push({item,isNew:acquired.isNew,count:acquired.count});
    state.gacha.history.push({name:item.name,rarity:item.rarity,itemId:item.id,at:Date.now()});
  }

  state.gacha.history=state.gacha.history.slice(-50);
  saveState();
  if(!results.length){showToast("획득 가능한 아이템이 없습니다.");renderGacha();return}
  gachaAnimating=true;
  renderGacha();
  playGachaAnimation(results);
}
function collectionDetail(id){
  const i=itemById(id);if(!i)return;
  const count=itemCount(i.id),unlocked=count>0;
  const wasNew=state.newItemIds.includes(i.id);
  if(wasNew){
    markItemSeen(i.id,state);
    saveState();
    if(currentPage==="collection")renderCollection();
  }
  const sources=itemSourceTypes(i).join(" + ");
  const recent=state.itemHistory.filter(h=>h.itemId===i.id).slice(-5).reverse();
  openModal(unlocked?i.name:"LOCKED",unlocked?
    '<p class="label">'+esc(i.rarity)+' · '+esc(i.category)+'</p>'+
    '<p style="line-height:1.7">'+esc(i.description||"설명 없음")+'</p>'+
    '<div class="collection-detail-meta"><span>COLLECTION · '+esc(getCharacter(i.collectionCharacterId)?.name||"미지정")+'</span><span>'+esc(sources)+'</span><span>'+esc(i.acquisitionMode.toUpperCase())+'</span>'+(state.collectionSettings.showOwnedCount?'<span>OWNED ×'+count+'</span>':'')+'</div>'+
    (recent.length?'<div class="collection-history-mini">'+recent.map(h=>'<div><span>'+esc(h.source)+'</span><b>+'+h.amount+'</b></div>').join("")+'</div>':'')
    :'<p class="muted">아직 획득하지 않은 아이템입니다.</p>');
}

/* EDITOR */
function openEditor(){
  editorDraft=clone(state);
  editorTab="dialogue";
  dialogueSubtab="characters";
  selectedEditorCharacterId=editorDraft.characters[0]?.id||"";
  selectedEditorEventId=editorDraft.events[0]?.id||"";
  selectedEntryId="";
  selectedThoughtId=editorDraft.thoughts[0]?.id||"";
  selectedAskId=editorDraft.asks[0]?.id||"";
  selectedItemId=editorDraft.items[0]?.id||"";
  editorOverlay.hidden=false;document.body.style.overflow="hidden";
  renderEditor();
}
function closeEditor(){
  editorOverlay.hidden=true;document.body.style.overflow="";
  editorDraft=null;
}
function saveEditor(){
  state=normalizeState(editorDraft);
  saveState();
  session=createSession();
  playback=null;
  autoMode=false;
  clearAuto();
  if(selectedCharacterId&&!getCharacter(selectedCharacterId))selectedCharacterId=enabledCharacters()[0]?.id||"";
  closeEditor();renderPage();
}
function renderEditor(){
  $$(".editor-nav").forEach(b=>b.classList.toggle("active",b.dataset.editorTab===editorTab));
  if(editorTab==="dialogue")renderDialogueEditor();
  else if(editorTab==="ask")renderAskEditor();
  else if(editorTab==="item")renderItemEditor();
  else if(editorTab==="gacha")renderGachaEditor();
  else if(editorTab==="thought")renderThoughtEditor();
  else renderCollectionEditor();
}
function editorHead(kicker,title,desc,actions=""){
  return '<div class="editor-section-head"><div><p class="label">'+esc(kicker)+'</p><h2>'+esc(title)+'</h2></div><div><p>'+esc(desc)+'</p>'+actions+'</div></div>';
}
function charOptions(selected="",blank="선택 안 함",source=editorDraft){
  return '<option value="">'+esc(blank)+'</option>'+source.characters.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===selected?"selected":"")+'>'+esc(c.name)+'</option>').join("");
}
function eventOptions(selected="",blank="이벤트 종료",source=editorDraft,exclude=""){
  return '<option value="">'+esc(blank)+'</option>'+source.events.filter(e=>e.id!==exclude).map(e=>'<option value="'+esc(e.id)+'" '+(e.id===selected?"selected":"")+'>'+esc(e.name)+'</option>').join("");
}
function renderDialogueEditor(){
  editorBody.innerHTML=editorHead("DIALOGUE","대화 이벤트 설정","캐릭터와 이벤트, 변수·분기를 관리합니다.")+
  '<div class="subtabs"><button class="subtab '+(dialogueSubtab==="characters"?"active":"")+'" data-action="dialogue-subtab" data-id="characters">CHARACTERS</button><button class="subtab '+(dialogueSubtab==="events"?"active":"")+'" data-action="dialogue-subtab" data-id="events">EVENTS</button><button class="subtab '+(dialogueSubtab==="variables"?"active":"")+'" data-action="dialogue-subtab" data-id="variables">VARIABLES</button></div>'+
  '<div id="dialogueEditorContent"></div>';
  if(dialogueSubtab==="characters")renderCharacterManager();
  else if(dialogueSubtab==="events")renderEventManager();
  else renderVariableManager();
}
function renderCharacterManager(){
  const root=$("#dialogueEditorContent",editorBody);
  const c=editorDraft.characters.find(x=>x.id===selectedEditorCharacterId)||null;
  root.innerHTML='<div class="manager-layout"><aside class="manager-list"><div class="manager-list-head"><strong>CHARACTERS</strong><button class="small-button" data-action="new-character">+ 추가</button></div><div class="manager-list-items">'+
    (editorDraft.characters.length?editorDraft.characters.map(x=>'<button class="manager-item '+(x.id===selectedEditorCharacterId?"active":"")+'" data-action="select-character" data-id="'+esc(x.id)+'"><strong>'+esc(x.name)+'</strong><small>'+esc(originLabel(x.origin))+(x.enabled?"":" · HIDDEN")+'</small></button>').join(""):'<div class="editor-note">캐릭터가 없습니다.</div>')+
    '</div></aside><section class="manager-detail">'+(c?characterForm(c):'<div class="inspector-empty">왼쪽에서 캐릭터를 추가하세요.</div>')+'</section></div>';
}
function characterForm(c){
  return '<div class="form-grid">'+
    '<label class="field"><span>이름</span><input data-bind="char-name" value="'+esc(c.name)+'"></label>'+
    '<label class="field"><span>출신 분류</span><select data-bind="char-origin">'+ORIGINS.map(o=>'<option value="'+o[0]+'" '+(c.origin===o[0]?"selected":"")+'>'+o[1]+'</option>').join("")+'</select></label>'+
    '<label class="field"><span>역할 / 설명</span><input data-bind="char-role" value="'+esc(c.role)+'" placeholder="예: 호텔 관리자"></label>'+
    '<label class="field"><span>이미지 URL</span><input data-bind="char-image" value="'+esc(c.image)+'" placeholder="https://..."></label>'+
    '<label class="field full"><span>HOME 소개 문구</span><textarea data-bind="char-quote">'+esc(c.quote)+'</textarea></label>'+
    '<label class="field"><span>초기 호감도</span><input type="number" min="0" max="100" data-bind="char-affection" value="'+c.affectionStart+'"></label>'+
    '<label class="field"><span>기본 감정</span><select data-bind="char-emotion">'+EMOTIONS.map(e=>'<option value="'+e[0]+'" '+(c.emotionDefault===e[0]?"selected":"")+'>'+e[1]+'</option>').join("")+'</select></label>'+
    '<label class="field"><span>기본 감정 강도</span><input type="number" min="0" max="100" data-bind="char-intensity" value="'+c.emotionIntensity+'"></label>'+
    '<label class="checkline"><input type="checkbox" data-bind="char-enabled" '+(c.enabled?"checked":"")+'> HOME에 표시</label>'+
    '<div class="full"><button class="danger-button" data-action="delete-character">현재 캐릭터 삭제</button></div>'+
  '</div>';
}
function renderVariableManager(){
  const root=$("#dialogueEditorContent",editorBody);
  root.innerHTML='<div class="settings-card"><div class="manager-list-head"><div><strong>VARIABLES</strong><p class="muted">조건과 선택 결과에 사용할 일반 변수입니다.</p></div><button class="small-button" data-action="new-variable">+ 변수</button></div><div class="table-editor">'+
  (editorDraft.variables.length?editorDraft.variables.map(v=>'<div class="table-row" data-var-id="'+esc(v.id)+'"><input data-bind="var-name" value="'+esc(v.name)+'"><select data-bind="var-type"><option value="number" '+(v.type==="number"?"selected":"")+'>숫자</option><option value="boolean" '+(v.type==="boolean"?"selected":"")+'>참/거짓</option><option value="string" '+(v.type==="string"?"selected":"")+'>문자</option></select><input data-bind="var-default" value="'+esc(v.defaultValue)+'"><span class="muted">'+esc(v.id)+'</span><button class="danger-button" data-action="delete-variable">×</button></div>').join(""):'<div class="editor-note">변수가 없습니다.</div>')+
  '</div></div>';
}
function renderEventManager(){
  const root=$("#dialogueEditorContent",editorBody);
  const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId)||null;
  root.innerHTML='<div class="dialogue-editor-layout"><aside class="manager-list"><div class="manager-list-head"><strong>EVENTS</strong><button class="small-button" data-action="new-event">+ 추가</button></div><div class="manager-list-items">'+
    (editorDraft.events.length?editorDraft.events.map(x=>'<button class="manager-item '+(x.id===selectedEditorEventId?"active":"")+'" data-action="select-event" data-id="'+esc(x.id)+'"><strong>'+esc(x.name)+'</strong><small>'+esc(getCharacterDraft(x.characterId)?.name||"캐릭터 미지정")+' · '+x.entries.length+'개</small></button>').join(""):'<div class="editor-note">이벤트가 없습니다.</div>')+
    '</div>'+(ev?'<div style="margin-top:12px">'+eventProperties(ev)+'</div>':'')+'</aside><section class="flow-column"><div class="manager-list-head"><strong>FLOW</strong><span class="muted">'+(ev?ev.entries.length:0)+'개</span></div>'+
    (ev?'<div class="flow-adds"><button data-action="add-entry" data-type="dialogue">+ 대사</button><button data-action="add-entry" data-type="narration">+ 지문</button><button data-action="add-entry" data-type="choice">+ 선택지</button></div><div class="flow-list">'+renderFlowRows(ev.entries)+'</div>':'<div class="inspector-empty">이벤트를 추가하세요.</div>')+
    '</section><section class="inspector-column">'+renderInspector()+'</section></div>';
}
function getCharacterDraft(id){return editorDraft.characters.find(c=>c.id===id)||null}
function eventProperties(ev){
  return '<label class="field"><span>이벤트 이름</span><input data-bind="event-name" value="'+esc(ev.name)+'"></label>'+
    '<label class="field" style="margin-top:9px"><span>캐릭터</span><select data-bind="event-character">'+charOptions(ev.characterId,"캐릭터 선택")+'</select></label>'+
    '<label class="field" style="margin-top:9px"><span>종료 후 이동</span><select data-bind="event-next">'+eventOptions(ev.nextEventId,"이벤트 종료",editorDraft,ev.id)+'</select></label>'+
    '<label class="field" style="margin-top:9px"><span>종료 시 감정</span><select data-bind="event-emotion-exit"><option value="keep" '+(ev.emotionExitMode==="keep"?"selected":"")+'>현재 감정 유지</option><option value="reset" '+(ev.emotionExitMode==="reset"?"selected":"")+'>기본 감정으로 초기화</option></select></label>'+
    '<button class="danger-button" style="width:100%;margin-top:10px" data-action="delete-event">이벤트 삭제</button>';
}
function entryLabel(e){
  if(e.type==="choice")return e.prompt||"선택지";
  if(e.type==="narration")return e.text||"빈 지문";
  return (e.speaker?e.speaker+": ":"")+(e.text||"빈 대사");
}
function renderFlowRows(entries){
  if(!entries.length)return'<div class="editor-note">위 버튼으로 첫 항목을 추가하세요.</div>';
  return entries.map((e,i)=>'<button class="flow-row '+(e.id===selectedEntryId?"active":"")+'" data-action="select-entry" data-id="'+esc(e.id)+'"><span>'+String(i+1).padStart(2,"0")+'</span><span><small>'+esc(e.type.toUpperCase())+'</small><b>'+esc(entryLabel(e))+'</b></span></button>').join("");
}
function findEntryContext(id,entries=(editorDraft.events.find(e=>e.id===selectedEditorEventId)?.entries||[]),anc=[]){
  for(let i=0;i<entries.length;i++){
    const e=entries[i];if(e.id===id)return{entry:e,list:entries,index:i,ancestors:anc};
    if(e.type==="choice")for(const o of e.options){const f=findEntryContext(id,o.entries,[...anc,{choice:e,option:o}]);if(f)return f}
  }
  return null;
}
function renderInspector(){
  const ctx=findEntryContext(selectedEntryId);
  if(!ctx)return'<div class="inspector-empty">FLOW에서 항목을 선택하세요.</div>';
  const e=ctx.entry;
  return '<div class="inspector-head"><div><p class="label">'+esc(e.type.toUpperCase())+'</p><h3>'+esc(e.type==="choice"?"선택지 편집":e.type==="narration"?"지문 편집":"대사 편집")+'</h3></div><div class="icon-actions"><button class="icon-button" data-action="move-entry" data-dir="-1" '+(ctx.index===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-entry" data-dir="1" '+(ctx.index===ctx.list.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="duplicate-entry">⧉</button><button class="icon-button" data-action="delete-entry">×</button></div></div><div class="inspector-content">'+
  (e.type==="dialogue"?'<label class="field"><span>화자</span><input data-entry-field="speaker" value="'+esc(e.speaker)+'"></label><label class="field"><span>대사</span><textarea data-entry-field="text">'+esc(e.text)+'</textarea></label>':
   e.type==="narration"?'<label class="field"><span>지문</span><textarea data-entry-field="text">'+esc(e.text)+'</textarea></label>':
   renderChoiceEditor(e))+
  renderAdvanced(e,"entry")+'</div>';
}
function renderChoiceEditor(e){
  return '<label class="field"><span>질문 / 상황</span><textarea data-entry-field="prompt">'+esc(e.prompt)+'</textarea></label><div class="editor-block"><div class="manager-list-head"><h4>OPTIONS</h4><button class="small-button" data-action="add-option">+ 선택지</button></div>'+
    (e.options.length?e.options.map((o,i)=>renderOptionCard(e,o,i)).join(""):'<div class="editor-note">선택지가 없습니다.</div>')+'</div>';
}
function renderOptionCard(choice,o,index){
  return '<article class="option-card" data-option-id="'+esc(o.id)+'"><div class="option-main"><div class="inline-grid"><label class="field"><span>문구</span><input data-option-field="label" value="'+esc(o.label)+'"></label><label class="field"><span>분기 종료 후</span><select data-option-field="exit"><option value="continue" '+(!o.targetEventId&&o.exitMode!=="end"?"selected":"")+'>상위 흐름 계속</option><option value="end" '+(!o.targetEventId&&o.exitMode==="end"?"selected":"")+'>현재 이벤트 종료</option>'+editorDraft.events.map(ev=>'<option value="event:'+esc(ev.id)+'" '+(o.targetEventId===ev.id?"selected":"")+'>이벤트 이동 · '+esc(ev.name)+'</option>').join("")+'</select></label><div class="icon-actions"><button class="icon-button" data-action="move-option" data-dir="-1" '+(index===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-option" data-dir="1" '+(index===choice.options.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="delete-option">×</button></div></div>'+
    '<div class="branch-list">'+(o.entries.length?o.entries.map((be,bi)=>'<div class="branch-row"><button data-action="select-entry" data-id="'+esc(be.id)+'">'+esc(be.type.toUpperCase())+' · '+esc(entryLabel(be))+'</button><span class="icon-actions"><button class="icon-button" data-action="move-branch" data-index="'+bi+'" data-dir="-1" '+(bi===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-branch" data-index="'+bi+'" data-dir="1" '+(bi===o.entries.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="delete-branch" data-index="'+bi+'">×</button></span></div>').join(""):'<div class="editor-note">분기 뒤에 바로 상위 흐름으로 돌아갑니다.</div>')+'</div>'+
    '<div class="flow-adds"><button data-action="add-branch" data-type="dialogue">+ 대사</button><button data-action="add-branch" data-type="narration">+ 지문</button><button data-action="add-branch" data-type="choice">+ 선택지</button></div></div>'+
    '<div class="option-effects">'+renderQuickEffects(o,"option")+'<details class="advanced"><summary>고급 조건 / 변수 / 아이템</summary>'+renderConditions(o,"option")+renderVariableEffects(o,"option")+renderItemEffects(o,"option")+'</details></div></article>';
}
function renderAdvanced(owner,kind){
  return '<details class="advanced"><summary>고급 · 조건 / 호감도 / 감정 / 변수 / 아이템</summary>'+renderConditions(owner,kind)+renderQuickEffects(owner,kind)+renderVariableEffects(owner,kind)+renderItemEffects(owner,kind)+'</details>';
}
function renderConditions(o,kind){
  const c=o.condition||{variableId:"",operator:"==",value:""};
  const a=o.affectionCondition||{characterId:"",operator:">=",value:0};
  const m=o.emotionCondition||{characterId:"",state:"",intensityOperator:">=",intensityValue:0};
  return '<div class="editor-block"><h4>표시 조건</h4><div class="condition-grid"><select data-cond-kind="'+kind+'" data-cond-field="variableId">'+variableOptions(c.variableId)+'</select><select data-cond-kind="'+kind+'" data-cond-field="operator">'+conditionOperatorOptions(c.operator)+'</select><input data-cond-kind="'+kind+'" data-cond-field="value" value="'+esc(c.value)+'"><span></span></div>'+
  '<div class="condition-grid"><select data-affcond-kind="'+kind+'" data-affcond-field="characterId">'+charOptions(cnv(a.characterId),"호감도 무관")+'</select><select data-affcond-kind="'+kind+'" data-affcond-field="operator">'+numberOperatorOptions(a.operator)+'</select><input type="number" min="0" max="100" data-affcond-kind="'+kind+'" data-affcond-field="value" value="'+a.value+'"><span></span></div>'+
  '<div class="condition-grid"><select data-emocond-kind="'+kind+'" data-emocond-field="characterId">'+charOptions(cnv(m.characterId),"감정 무관")+'</select><select data-emocond-kind="'+kind+'" data-emocond-field="state"><option value="">감정 무관</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(m.state===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select><select data-emocond-kind="'+kind+'" data-emocond-field="intensityOperator">'+numberOperatorOptions(m.intensityOperator,true)+'</select><input type="number" min="0" max="100" data-emocond-kind="'+kind+'" data-emocond-field="intensityValue" value="'+m.intensityValue+'"></div></div>';
}
function cnv(v){return v||""}
function variableOptions(sel){return'<option value="">변수 무관</option>'+editorDraft.variables.map(v=>'<option value="'+esc(v.id)+'" '+(v.id===sel?"selected":"")+'>'+esc(v.name)+'</option>').join("")}
function conditionOperatorOptions(sel){return[["==","="],["!=","≠"],[">",">"],[">=","≥"],["<","<"],["<=","≤"],["truthy","참"],["falsy","거짓"]].map(x=>'<option value="'+x[0]+'" '+(sel===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")}
function numberOperatorOptions(sel,prefix=false){return[[">=","≥"],[">",">"],["==","="],["!=","≠"],["<=","≤"],["<","<"]].map(x=>'<option value="'+x[0]+'" '+(sel===x[0]?"selected":"")+'>'+(prefix?"강도 ":"")+x[1]+'</option>').join("")}
function renderQuickEffects(o,kind){
  return '<div class="editor-block"><h4>호감도 변화</h4><div class="effect-stack">'+
    (o.affectionEffects.length?o.affectionEffects.map(x=>'<div class="effect-row" data-afffx-id="'+esc(x.id)+'"><select data-afffx-kind="'+kind+'" data-afffx-field="characterId">'+charOptions(x.characterId,"대상 선택")+'</select><input type="number" min="-100" max="100" data-afffx-kind="'+kind+'" data-afffx-field="amount" value="'+x.amount+'"><span></span><button class="icon-button" data-action="delete-afffx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">변화 없음</div>')+
    '<button class="small-button" data-action="add-afffx" data-kind="'+kind+'">+ 호감도 변화</button></div></div>'+
    '<div class="editor-block"><h4>감정 변화</h4><div class="effect-stack">'+
    (o.emotionEffects.length?o.emotionEffects.map(x=>'<div class="effect-row" data-emofx-id="'+esc(x.id)+'"><select data-emofx-kind="'+kind+'" data-emofx-field="characterId">'+charOptions(x.characterId,"대상 선택")+'</select><select data-emofx-kind="'+kind+'" data-emofx-field="state">'+EMOTIONS.map(y=>'<option value="'+y[0]+'" '+(x.state===y[0]?"selected":"")+'>'+y[1]+'</option>').join("")+'</select><input type="number" min="0" max="100" data-emofx-kind="'+kind+'" data-emofx-field="intensity" value="'+x.intensity+'"><button class="icon-button" data-action="delete-emofx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">변화 없음</div>')+
    '<button class="small-button" data-action="add-emofx" data-kind="'+kind+'">+ 감정 변화</button></div></div>';
}
function renderVariableEffects(o,kind){
  return '<div class="editor-block"><h4>변수 효과</h4><div class="effect-stack">'+
  (o.effects.length?o.effects.map(x=>'<div class="effect-row" data-fx-id="'+esc(x.id)+'"><select data-fx-kind="'+kind+'" data-fx-field="variableId">'+variableOptions(x.variableId)+'</select><select data-fx-kind="'+kind+'" data-fx-field="operation"><option value="set" '+(x.operation==="set"?"selected":"")+'>대입</option><option value="add" '+(x.operation==="add"?"selected":"")+'>더하기</option><option value="subtract" '+(x.operation==="subtract"?"selected":"")+'>빼기</option><option value="toggle" '+(x.operation==="toggle"?"selected":"")+'>토글</option></select><input data-fx-kind="'+kind+'" data-fx-field="value" value="'+esc(x.value)+'"><button class="icon-button" data-action="delete-fx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">효과 없음</div>')+
  '<button class="small-button" data-action="add-fx" data-kind="'+kind+'">+ 변수 효과</button></div></div>';
}
function itemOptions(selected=""){
  return '<option value="">아이템 선택</option>'+editorDraft.items.map(i=>
    '<option value="'+esc(i.id)+'" '+(i.id===selected?"selected":"")+'>'+esc(i.name)+' · '+esc(i.rarity)+'</option>'
  ).join("");
}
function renderItemEffects(o,kind){
  const list=o.itemEffects||[];
  return '<div class="editor-block"><h4>아이템 지급</h4><div class="effect-stack">'+
    (list.length?list.map(x=>'<div class="effect-row" data-itemfx-id="'+esc(x.id)+'"><select data-itemfx-kind="'+kind+'" data-itemfx-field="itemId">'+itemOptions(x.itemId)+'</select><input type="number" min="1" step="1" data-itemfx-kind="'+kind+'" data-itemfx-field="amount" value="'+x.amount+'"><span class="muted">'+esc(itemById(x.itemId,editorDraft)?.acquisitionMode==="unique"?"UNIQUE":"REPEATABLE")+'</span><button class="icon-button" data-action="delete-itemfx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">지급 없음</div>')+
    '<button class="small-button" data-action="add-itemfx" data-kind="'+kind+'">+ 아이템 지급</button></div></div>';
}

function getSelectedOwner(kind,element){
  if(kind==="entry")return findEntryContext(selectedEntryId)?.entry||null;
  const card=element.closest("[data-option-id]");if(!card)return null;
  const choice=findEntryContext(selectedEntryId)?.entry;
  return choice?.type==="choice"?choice.options.find(o=>o.id===card.dataset.optionId)||null:null;
}


function getInteractionFlowOwner(scope,ownerId,itemId=""){
  if(scope==="ask")return editorDraft.asks.find(a=>a.id===ownerId)||null;
  if(scope==="item-reaction"){
    const item=editorDraft.items.find(i=>i.id===itemId);
    return item?.reactions.find(r=>r.id===ownerId)||null;
  }
  return null;
}
function findFlowEntryContext(entries,id,ancestors=[]){
  for(let i=0;i<entries.length;i++){
    const entry=entries[i];
    if(entry.id===id)return{entry,list:entries,index:i,ancestors};
    if(entry.type==="choice"){
      for(const option of entry.options){
        const found=findFlowEntryContext(option.entries,id,[...ancestors,{entry,option}]);
        if(found)return found;
      }
    }
  }
  return null;
}
function findFlowOption(entries,id){
  for(const entry of entries){
    if(entry.type!=="choice")continue;
    for(const option of entry.options){
      if(option.id===id)return option;
      const nested=findFlowOption(option.entries,id);
      if(nested)return nested;
    }
  }
  return null;
}
function removeFlowOption(entries,id){
  for(const entry of entries){
    if(entry.type!=="choice")continue;
    const index=entry.options.findIndex(option=>option.id===id);
    if(index>=0){entry.options.splice(index,1);return true}
    for(const option of entry.options){
      if(removeFlowOption(option.entries,id))return true;
    }
  }
  return false;
}
function refreshInteractionEditor(scope){
  if(scope==="ask")renderAskEditor();
  else renderItemEditor();
}
function flowData(scope,ownerId,itemId=""){
  return ' data-flow-scope="'+esc(scope)+'" data-flow-owner-id="'+esc(ownerId)+'" data-flow-item-id="'+esc(itemId)+'"';
}
function renderInteractionFlow(entries,scope,ownerId,itemId="",depth=0){
  const attrs=flowData(scope,ownerId,itemId);
  const list=entries.length?entries.map((entry,index)=>{
    let body="";
    if(entry.type==="dialogue"){
      body='<div class="mini-flow-fields"><input '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="speaker" value="'+esc(entry.speaker||"")+'" placeholder="화자 (비우면 현재 캐릭터)"><textarea '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="text" placeholder="대사">'+esc(entry.text||"")+'</textarea></div>';
    }else if(entry.type==="narration"){
      body='<div class="mini-flow-fields"><textarea '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="text" placeholder="지문">'+esc(entry.text||"")+'</textarea></div>';
    }else{
      body='<div class="mini-flow-fields"><textarea '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="prompt" placeholder="선택지 질문 / 상황">'+esc(entry.prompt||"")+'</textarea>'+
        '<div class="mini-options">'+entry.options.map(option=>
          '<article class="mini-option"><div class="mini-option-head"><input '+attrs+' data-mini-option-id="'+esc(option.id)+'" data-mini-option-field="label" value="'+esc(option.label||"")+'" placeholder="선택지 문구"><select '+attrs+' data-mini-option-id="'+esc(option.id)+'" data-mini-option-field="exit"><option value="continue" '+(option.exitMode!=="end"?"selected":"")+'>분기 뒤 계속</option><option value="end" '+(option.exitMode==="end"?"selected":"")+'>상호작용 종료</option></select><button class="icon-button" type="button" data-action="mini-delete-option" '+attrs+' data-mini-option-id="'+esc(option.id)+'">×</button></div>'+
          renderInteractionFlow(option.entries,scope,ownerId,itemId,depth+1)+
          '<div class="mini-add-row"><button class="small-button" type="button" data-action="mini-add-branch" data-type="dialogue" '+attrs+' data-parent-option-id="'+esc(option.id)+'">+ 대사</button><button class="small-button" type="button" data-action="mini-add-branch" data-type="narration" '+attrs+' data-parent-option-id="'+esc(option.id)+'">+ 지문</button><button class="small-button" type="button" data-action="mini-add-branch" data-type="choice" '+attrs+' data-parent-option-id="'+esc(option.id)+'">+ 선택지</button></div></article>'
        ).join("")+'</div>'+
        '<button class="small-button" type="button" data-action="mini-add-option" '+attrs+' data-mini-entry-id="'+esc(entry.id)+'">+ 선택지 항목</button></div>';
    }
    return '<article class="mini-flow-entry depth-'+Math.min(depth,3)+'"><header><span>'+(index+1)+' · '+esc(entry.type.toUpperCase())+'</span><button class="icon-button" type="button" data-action="mini-delete-entry" '+attrs+' data-mini-entry-id="'+esc(entry.id)+'">×</button></header>'+body+'</article>';
  }).join(""):'<div class="editor-note">아직 흐름이 없습니다.</div>';
  return '<div class="mini-flow-list">'+list+'</div>';
}
function interactionFlowEditor(entries,scope,ownerId,itemId=""){
  const attrs=flowData(scope,ownerId,itemId);
  return '<section class="mini-flow-editor"><div class="mini-flow-title"><div><strong>REACTION FLOW</strong><small>대사 · 지문 · 선택지를 원하는 순서로 구성합니다.</small></div><div class="mini-add-row"><button class="small-button" type="button" data-action="mini-add-entry" data-type="dialogue" '+attrs+'>+ 대사</button><button class="small-button" type="button" data-action="mini-add-entry" data-type="narration" '+attrs+'>+ 지문</button><button class="small-button" type="button" data-action="mini-add-entry" data-type="choice" '+attrs+'>+ 선택지</button></div></div>'+renderInteractionFlow(entries,scope,ownerId,itemId)+'</section>';
}
function renderAskEditor(){
  editorBody.innerHTML=editorHead("ASK","ASK 설정","질문마다 호감도·감정 변화와 대사/지문/선택지 흐름을 직접 구성합니다.",'<button class="small-button" data-action="new-ask">+ 질문</button>')+
    '<div class="ask-editor-grid">'+
    (editorDraft.asks.length?editorDraft.asks.map(a=>'<div class="ask-row interaction-editor-row" data-ask-id="'+esc(a.id)+'">'+
      '<select data-ask-bind="characterId">'+charOptions(a.characterId,"질문 대상")+'</select>'+
      '<input data-ask-bind="label" value="'+esc(a.label)+'" placeholder="질문 문구">'+
      '<label class="field"><span>최소 호감도</span><input type="number" min="0" max="100" data-ask-bind="minAffection" value="'+a.minAffection+'"></label>'+
      '<label class="checkline"><input type="checkbox" data-ask-bind="enabled" '+(a.enabled?"checked":"")+'> 사용</label>'+
      '<button class="danger-button" data-action="delete-ask">×</button>'+
      '<div class="full-row interaction-response-editor"><div class="interaction-effect-grid">'+
        '<label class="field"><span>상호작용 호감도 변화</span><input type="number" min="-100" max="100" data-ask-bind="affectionDelta" value="'+a.affectionDelta+'"></label>'+
        '<label class="field"><span>감정 변화</span><select data-ask-bind="emotionState"><option value="">변경 없음</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(a.emotionState===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select></label>'+
        '<label class="field"><span>감정 강도</span><input type="number" min="0" max="100" data-ask-bind="emotionIntensity" value="'+a.emotionIntensity+'"></label>'+
      '</div>'+interactionFlowEditor(a.entries,"ask",a.id)+'</div>'+
    '</div>').join(""):'<div class="editor-note">등록된 ASK가 없습니다.</div>')+
    '</div>';
}
function renderItemEditor(){
  const q=editorItemQuery.trim().toLowerCase();
  const categories=editorDraft.itemCategories?.length?editorDraft.itemCategories:["기타"];
  const visible=editorDraft.items.filter(i=>{
    if(editorItemCharacterFilter!=="ALL"&&i.collectionCharacterId!==editorItemCharacterFilter)return false;
    if(editorItemRarityFilter!=="ALL"&&i.rarity!==editorItemRarityFilter)return false;
    if(editorItemCategoryFilter!=="ALL"&&i.category!==editorItemCategoryFilter)return false;
    if(q){
      const text=[i.name,i.description,i.category,i.rarity,itemSourceLabel(i,editorDraft),getCharacterDraft(i.collectionCharacterId)?.name]
        .join(" ").toLowerCase();
      if(!text.includes(q))return false;
    }
    return true;
  });

  editorBody.innerHTML=editorHead("ITEM","아이템 설정","아이템의 분류·획득 방식·컬렉션 소속과 캐릭터별 선물 반응을 관리합니다.",'<button class="small-button" data-action="new-item">+ 아이템</button>')+
    '<section class="settings-card item-category-manager"><div class="manager-list-head"><div><h3>CATEGORIES</h3><p class="muted">희귀도와 별개인 물건 종류입니다.</p></div></div>'+
      '<div class="category-list">'+categories.map(cat=>'<span class="category-tag">'+esc(cat)+(cat!=="기타"?'<button type="button" data-action="delete-item-category" data-id="'+esc(cat)+'">×</button>':'')+'</span>').join("")+'</div>'+
      '<div class="category-add-row"><input id="newItemCategoryInput" placeholder="새 아이템 카테고리"><button class="small-button" type="button" data-action="add-item-category">추가</button></div>'+
    '</section>'+
    '<div class="item-editor-toolbar">'+
      '<input data-item-editor-filter="query" value="'+esc(editorItemQuery)+'" placeholder="아이템 검색 · 이름 / 설명 / 캐릭터 / 획득처">'+
      '<select data-item-editor-filter="character"><option value="ALL">모든 캐릭터</option>'+editorDraft.characters.map(ch=>'<option value="'+esc(ch.id)+'" '+(editorItemCharacterFilter===ch.id?"selected":"")+'>'+esc(ch.name)+'</option>').join("")+'</select>'+
      '<select data-item-editor-filter="rarity"><option value="ALL">모든 희귀도</option>'+RARITIES.map(r=>'<option value="'+r+'" '+(editorItemRarityFilter===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
      '<select data-item-editor-filter="category"><option value="ALL">모든 카테고리</option>'+categories.map(cat=>'<option value="'+esc(cat)+'" '+(editorItemCategoryFilter===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
      '<span class="item-filter-count">'+visible.length+' / '+editorDraft.items.length+'</span>'+
    '</div>'+
    '<div class="item-editor-grid">'+
    (visible.length?visible.map(i=>{
      const configured=new Set(i.reactions.map(r=>r.characterId).filter(id=>editorDraft.characters.some(ch=>ch.id===id))).size;
      const categoryOptions=[...new Set([...categories,i.category].filter(Boolean))];
      return '<div class="item-row interaction-editor-row" data-item-id="'+esc(i.id)+'">'+
        '<select data-item-bind="collectionCharacterId">'+charOptions(i.collectionCharacterId,"컬렉션 소속")+'</select>'+
        '<input data-item-bind="name" value="'+esc(i.name)+'" placeholder="아이템 이름">'+
        '<select data-item-bind="rarity">'+RARITIES.map(r=>'<option '+(i.rarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
        '<select data-item-bind="category">'+categoryOptions.map(cat=>'<option value="'+esc(cat)+'" '+(i.category===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
        '<select data-item-bind="acquisitionMode"><option value="repeatable" '+(i.acquisitionMode==="repeatable"?"selected":"")+'>REPEATABLE</option><option value="unique" '+(i.acquisitionMode==="unique"?"selected":"")+'>UNIQUE</option></select>'+
        '<button class="danger-button" data-action="delete-item">×</button>'+
        '<div class="full-row item-meta-strip"><span>'+esc(itemSourceLabel(i,editorDraft))+'</span><span>'+configured+' / '+editorDraft.characters.length+' REACTIONS</span><span>OWNED ×'+itemCount(i.id,editorDraft)+'</span></div>'+
        '<div class="full-row interaction-response-editor">'+
          '<div class="inline-grid"><label class="checkline"><input type="checkbox" data-item-bind="gachaEnabled" '+(i.gachaEnabled?"checked":"")+'> 가챠 포함</label><label class="checkline"><input type="checkbox" data-item-bind="enabled" '+(i.enabled?"checked":"")+'> 사용</label><label class="field"><span>가챠 가중치</span><input type="number" min=".01" step=".01" data-item-bind="weight" value="'+i.weight+'"></label></div>'+
          '<label class="field full"><span>아이템 설명</span><textarea data-item-bind="description">'+esc(i.description)+'</textarea></label>'+
          '<div class="reaction-manager"><div class="manager-list-head"><div><strong>CHARACTER REACTIONS</strong><p class="muted">같은 아이템을 여러 캐릭터에게 줄 수 있습니다. 취향은 기본 호감도 변화값을 자동 제안합니다.</p></div><button class="small-button" type="button" data-action="new-item-reaction" data-item-id="'+esc(i.id)+'">+ 캐릭터 반응</button></div>'+
          (i.reactions.length?i.reactions.map(r=>'<article class="item-reaction-card" data-item-id="'+esc(i.id)+'" data-reaction-id="'+esc(r.id)+'"><div class="item-reaction-head">'+
            '<select data-reaction-bind="characterId">'+charOptions(r.characterId,"선물 대상")+'</select>'+
            '<label class="field"><span>취향</span><select data-reaction-bind="preference">'+GIFT_PREFERENCES.map(p=>'<option value="'+p[0]+'" '+(r.preference===p[0]?"selected":"")+'>'+p[0]+'</option>').join("")+'</select></label>'+
            '<label class="field"><span>호감도</span><input type="number" min="-100" max="100" data-reaction-bind="affectionDelta" value="'+r.affectionDelta+'"></label>'+
            '<label class="field"><span>감정</span><select data-reaction-bind="emotionState"><option value="">변경 없음</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(r.emotionState===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select></label>'+
            '<label class="field"><span>강도</span><input type="number" min="0" max="100" data-reaction-bind="emotionIntensity" value="'+r.emotionIntensity+'"></label>'+
            '<button class="danger-button" type="button" data-action="delete-item-reaction">×</button></div>'+
            interactionFlowEditor(r.entries,"item-reaction",r.id,i.id)+'</article>').join(""):'<div class="editor-note">캐릭터별 반응이 없습니다. 설정하지 않은 캐릭터에게도 줄 수 있지만 기본 무반응 지문이 나옵니다.</div>')+
          '</div>'+
        '</div>'+
      '</div>';
    }).join(""):'<div class="editor-note">현재 필터에 맞는 아이템이 없습니다.</div>')+
    '</div>';
}
function renderGachaEditor(){
  const total=RARITIES.reduce((s,r)=>s+Number(editorDraft.gacha.rarityWeights[r]||0),0)||1;
  const pool=editorDraft.items.filter(i=>i.enabled&&i.gachaEnabled);
  editorBody.innerHTML=editorHead("GACHA","가챠 설정","아이템 설정의 가챠 포함 항목을 대상으로 비용·확률을 관리합니다.")+
  '<div class="settings-grid"><section class="settings-card"><h3>BASIC</h3><div class="form-grid"><label class="checkline"><input type="checkbox" data-gacha-bind="enabled" '+(editorDraft.gacha.enabled?"checked":"")+'> 가챠 사용</label><label class="field"><span>재화 이름</span><input data-gacha-bind="currencyName" value="'+esc(editorDraft.gacha.currencyName)+'"></label><label class="field"><span>현재 재화</span><input type="number" min="0" data-gacha-bind="balance" value="'+editorDraft.gacha.balance+'"></label><label class="field"><span>1회 비용</span><input type="number" min="0" data-gacha-bind="singleCost" value="'+editorDraft.gacha.singleCost+'"></label><label class="field"><span>10회 비용</span><input type="number" min="0" data-gacha-bind="tenCost" value="'+editorDraft.gacha.tenCost+'"></label></div></section>'+
  '<section class="settings-card"><h3>RARITY WEIGHT</h3><div class="rarity-editor">'+RARITIES.map(r=>'<label class="rarity-edit-row"><span>'+r+' · '+((editorDraft.gacha.rarityWeights[r]/total)*100).toFixed(1)+'%</span><input type="number" min="0" step="1" data-rarity="'+r+'" value="'+editorDraft.gacha.rarityWeights[r]+'"></label>').join("")+'</div></section></div>'+
  '<div class="settings-card" style="margin-top:14px"><h3>ITEM POOL</h3><p class="muted">아이템 설정에서 “가챠 포함”을 켠 항목입니다.</p><div class="table-editor">'+
  (pool.length?pool.map(i=>'<div class="table-row"><span>'+esc(i.name)+'</span><span>'+esc(i.rarity)+'</span><span>WEIGHT '+i.weight+'</span><span>'+esc(getCharacterDraft(i.collectionCharacterId)?.name||"캐릭터 미지정")+'</span><span></span></div>').join(""):'<div class="editor-note">현재 가챠 풀에 등록된 아이템이 없습니다.</div>')+'</div></div>';
}
function renderThoughtEditor(){
  editorBody.innerHTML=editorHead("THOUGHT","Thought 설정","캐릭터별 생각, 카테고리, 등장 빈도를 관리합니다.",'<button class="small-button" data-action="new-thought">+ Thought</button>')+
  '<section class="settings-card" style="margin-top:16px"><h3>CATEGORIES</h3><div class="category-list">'+editorDraft.thoughtSettings.categories.map(c=>'<span class="category-tag">'+esc(c)+'<button data-action="delete-category" data-id="'+esc(c)+'">×</button></span>').join("")+'</div><div style="display:flex;gap:7px;margin-top:10px"><input id="newCategoryInput" placeholder="새 카테고리"><button class="small-button" data-action="add-category">추가</button></div></section>'+
  '<div class="table-editor">'+(editorDraft.thoughts.length?editorDraft.thoughts.map(t=>'<div class="table-row thought-row" data-thought-id="'+esc(t.id)+'"><select data-thought-bind="characterId">'+charOptions(t.characterId,"캐릭터")+'</select><select data-thought-bind="category">'+editorDraft.thoughtSettings.categories.map(c=>'<option '+(t.category===c?"selected":"")+'>'+esc(c)+'</option>').join("")+'</select><select data-thought-bind="frequency">'+FREQUENCIES.map(f=>'<option value="'+f[0]+'" '+(t.frequency===f[0]?"selected":"")+'>'+f[1]+'</option>').join("")+'</select><select data-thought-bind="rarity">'+RARITIES.map(r=>'<option '+(t.rarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select><textarea data-thought-bind="text">'+esc(t.text)+'</textarea><span><label class="checkline"><input type="checkbox" data-thought-bind="enabled" '+(t.enabled?"checked":"")+'> 사용</label><button class="danger-button" data-action="delete-thought">×</button></span></div>').join(""):'<div class="editor-note">Thought가 없습니다.</div>')+'</div>';
}
function renderCollectionEditor(){
  const chars=editorDraft.characters;
  const owned=editorDraft.items.filter(i=>itemCount(i.id,editorDraft)>0).length;
  const fresh=editorDraft.newItemIds.filter(id=>itemCount(id,editorDraft)>0).length;
  editorBody.innerHTML=editorHead("COLLECTION","컬렉션 설정","컬렉션은 아이템 정의가 아니라 획득 상태를 보여주는 캐릭터별 아카이브입니다.")+
    '<div class="settings-grid">'+
      '<section class="settings-card"><h3>DISPLAY</h3>'+
        '<label class="checkline"><input type="checkbox" data-collection-setting="showLocked" '+(editorDraft.collectionSettings.showLocked?"checked":"")+'> 미획득 아이템도 LOCKED로 표시</label>'+
        '<label class="checkline"><input type="checkbox" data-collection-setting="showOwnedCount" '+(editorDraft.collectionSettings.showOwnedCount?"checked":"")+'> 보유 개수 표시</label>'+
        '<label class="field"><span>기본 보기</span><select data-collection-setting="view"><option value="grouped" '+(editorDraft.collectionSettings.view==="grouped"?"selected":"")+'>캐릭터별 묶기</option><option value="all" '+(editorDraft.collectionSettings.view==="all"?"selected":"")+'>전체 카드</option></select></label>'+
        '<label class="field"><span>기본 정렬</span><select data-collection-setting="sort"><option value="recent" '+(editorDraft.collectionSettings.sort==="recent"?"selected":"")+'>최근 획득</option><option value="rarity" '+(editorDraft.collectionSettings.sort==="rarity"?"selected":"")+'>희귀도</option><option value="name" '+(editorDraft.collectionSettings.sort==="name"?"selected":"")+'>이름</option><option value="count" '+(editorDraft.collectionSettings.sort==="count"?"selected":"")+'>보유 수</option></select></label>'+
      '</section>'+
      '<section class="settings-card"><h3>SUMMARY</h3><p class="muted">아이템 정의·카테고리·선물 반응은 “아이템 설정”에서 관리합니다.</p>'+
        '<div class="collection-editor-summary"><b>'+editorDraft.items.length+'</b><span>TOTAL</span><b>'+owned+'</b><span>OWNED</span><b>'+fresh+'</b><span>NEW</span></div>'+
      '</section>'+
    '</div>'+
    (chars.length?chars.map(ch=>{
      const items=editorDraft.items.filter(i=>i.collectionCharacterId===ch.id);
      return '<section class="collection-preview-group"><h3>'+esc(ch.name)+'</h3><div class="collection-preview-items">'+
        (items.length?items.map(i=>{
          const count=itemCount(i.id,editorDraft),isNew=editorDraft.newItemIds.includes(i.id);
          return '<div class="collection-preview-item '+(isNew?"is-new":"")+'"><b>'+esc(i.name)+(isNew?' · NEW':'')+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+' · '+esc(itemSourceLabel(i,editorDraft))+'</small><div>'+esc(i.acquisitionMode.toUpperCase())+' · 현재 보유 '+count+' · '+new Set(i.reactions.map(r=>r.characterId).filter(Boolean)).size+' REACTIONS</div></div>';
        }).join(""):'<div class="editor-note">이 캐릭터의 아이템이 없습니다.</div>')+
      '</div></section>';
    }).join(""):'<div class="editor-note">캐릭터가 없습니다.</div>');
}

/* APP EVENTS */
originChoice.addEventListener("click",e=>{
  const b=e.target.closest("[data-origin]");if(!b)return;
  pendingOrigin=b.dataset.origin;$$("[data-origin]",originChoice).forEach(x=>x.classList.toggle("active",x===b));startHint.textContent="";
});
startForm.addEventListener("submit",event=>{
  event.preventDefault();
  enterGame();
});
$("#changeProfileButton").addEventListener("click",renderStart);
$("#brandButton").addEventListener("click",()=>setPage("home"));
$("#editorButton").addEventListener("click",openEditor);
$$(".nav-button").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
$("#editorCancelButton").addEventListener("click",closeEditor);
$("#editorSaveButton").addEventListener("click",saveEditor);
$$(".editor-nav").forEach(b=>b.addEventListener("click",()=>{editorTab=b.dataset.editorTab;renderEditor()}));

modalRoot.addEventListener("click",e=>{if(e.target.matches("[data-close-modal]"))closeModal()});
modalRoot.addEventListener("input",e=>{
  if(e.target.id==="prefTextSpeed"){prefs.textSpeed=Number(e.target.value);savePrefs()}
  if(e.target.id==="prefAutoDelay"){prefs.autoDelay=Number(e.target.value);savePrefs()}
});
modalRoot.addEventListener("change",e=>{
  if(e.target.id==="prefStageClick"){prefs.stageClick=e.target.checked;savePrefs()}
});

pageRoot.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="open-editor")openEditor();
  else if(a==="home-prev"){const n=enabledCharacters().length;homeIndex=(homeIndex-1+n)%n;renderHome()}
  else if(a==="home-next"){const n=enabledCharacters().length;homeIndex=(homeIndex+1)%n;renderHome()}
  else if(a==="talk")startDialogue(selectedCharacterId);
  else if(a==="room-mode"){
    if(activeInteractionReaction||interactionContext?.followupActive)return;
    roomMode=b.dataset.mode||"talk";
    autoMode=false;clearAuto();
    renderRoom();
  }
  else if(a==="ask-topic")startAsk(b.dataset.id);
  else if(a==="inventory-item")useInventoryItem(b.dataset.id);
  else if(a==="finish-interaction")finishInteractionReaction();
  else if(a==="back-home"){activeInteractionReaction=null;interactionContext=null;setPage("home")}
  else if(a==="random-thought")randomThought();
  else if(a==="show-affection")showAffection();
  else if(a==="show-emotion")showEmotion();
  else if(a==="show-log")showLog();
  else if(a==="open-play-settings")showPlaySettings();
  else if(a==="toggle-auto"){autoMode=!autoMode;b.classList.toggle("active",autoMode);if(autoMode)scheduleAuto();else clearAuto()}
  else if(a==="advance-dialogue")advanceDialogue(false);
  else if(a==="choose-option")chooseOption(b.dataset.id);
  else if(a==="draw-gacha")drawGacha(Number(b.dataset.count)||1);
  else if(a==="clear-gacha-history")clearGachaHistory();
  else if(a==="thought-filter"){thoughtFilter=b.dataset.id;renderThought()}
  else if(a==="collection-filter"){collectionFilter=b.dataset.id;renderCollection()}
  else if(a==="collection-view"){
    state.collectionSettings.view=b.dataset.view==="all"?"all":"grouped";
    saveState();
    renderCollection();
  }
  else if(a==="collection-detail")collectionDetail(b.dataset.id);
});
pageRoot.addEventListener("input",e=>{
  const t=e.target;
  if(t.dataset.collectionControl==="query"){
    collectionQuery=t.value;
    const pos=window.scrollY;
    renderCollection();
    window.scrollTo(0,pos);
    const input=$('[data-collection-control="query"]',pageRoot);
    if(input){input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch{}}
  }
});
pageRoot.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="roomEventSelect"){
    roomMode="talk";
    startDialogue(selectedCharacterId,t.value);
    return;
  }
  if(t.dataset.collectionControl){
    const k=t.dataset.collectionControl;
    if(k==="rarity")collectionRarity=t.value;
    if(k==="category")collectionCategory=t.value;
    if(k==="status")collectionStatus=t.value;
    if(k==="source")collectionSource=t.value;
    if(k==="sort"){state.collectionSettings.sort=t.value;saveState()}
    renderCollection();
  }
});
pageRoot.addEventListener("click",e=>{
  if(currentPage!=="room"||roomMode!=="talk"||!prefs.stageClick)return;
  if(e.target.closest("button,input,select,textarea"))return;
  const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
  if(entry&&entry.type!=="choice")advanceDialogue(false);
});

editorBody.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="mini-add-entry"||a==="mini-add-branch"){
    const owner=getInteractionFlowOwner(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId);
    if(!owner)return;
    const targetOption=b.dataset.parentOptionId?findFlowOption(owner.entries,b.dataset.parentOptionId):null;
    const list=targetOption?targetOption.entries:owner.entries;
    list.push(makeEntry(b.dataset.type||"dialogue"));
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="mini-delete-entry"){
    const owner=getInteractionFlowOwner(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId);
    const ctx=owner?findFlowEntryContext(owner.entries,b.dataset.miniEntryId):null;
    if(ctx)ctx.list.splice(ctx.index,1);
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="mini-add-option"){
    const owner=getInteractionFlowOwner(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId);
    const ctx=owner?findFlowEntryContext(owner.entries,b.dataset.miniEntryId):null;
    if(ctx?.entry.type==="choice")ctx.entry.options.push(makeOption("선택지 "+(ctx.entry.options.length+1)));
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="mini-delete-option"){
    const owner=getInteractionFlowOwner(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId);
    if(owner)removeFlowOption(owner.entries,b.dataset.miniOptionId);
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="dialogue-subtab"){dialogueSubtab=b.dataset.id;renderDialogueEditor();return}
  if(a==="new-character"){
    const c=normalizeCharacter({id:uid("char"),name:"새 캐릭터"});editorDraft.characters.push(c);selectedEditorCharacterId=c.id;renderCharacterManager();return;
  }
  if(a==="select-character"){selectedEditorCharacterId=b.dataset.id;renderCharacterManager();return}
  if(a==="delete-character"){
    const id=selectedEditorCharacterId;editorDraft.characters=editorDraft.characters.filter(c=>c.id!==id);
    editorDraft.events.forEach(ev=>{if(ev.characterId===id)ev.characterId=""});
    editorDraft.thoughts.forEach(t=>{if(t.characterId===id)t.characterId=""});
    editorDraft.asks.forEach(a=>{if(a.characterId===id)a.characterId=""});
    editorDraft.items.forEach(i=>{
      if(i.collectionCharacterId===id)i.collectionCharacterId="";
      i.reactions.forEach(r=>{if(r.characterId===id)r.characterId=""});
    });
    selectedEditorCharacterId=editorDraft.characters[0]?.id||"";renderCharacterManager();return;
  }
  if(a==="new-variable"){editorDraft.variables.push(normalizeVariable({id:uid("var"),name:"새 변수"}));renderVariableManager();return}
  if(a==="delete-variable"){
    const row=b.closest("[data-var-id]");const id=row?.dataset.varId;if(!id)return;
    editorDraft.variables=editorDraft.variables.filter(v=>v.id!==id);renderVariableManager();return;
  }
  if(a==="new-event"){
    const ev=normalizeEvent({id:uid("event"),name:"새 이벤트",characterId:selectedEditorCharacterId||editorDraft.characters[0]?.id||""});
    editorDraft.events.push(ev);selectedEditorEventId=ev.id;selectedEntryId="";renderEventManager();return;
  }
  if(a==="select-event"){selectedEditorEventId=b.dataset.id;selectedEntryId="";renderEventManager();return}
  if(a==="delete-event"){
    const id=selectedEditorEventId;editorDraft.events=editorDraft.events.filter(x=>x.id!==id);
    editorDraft.events.forEach(x=>{if(x.nextEventId===id)x.nextEventId=""});
    editorDraft.asks.forEach(a=>{if(a.eventId===id)a.eventId=""});
    editorDraft.items.forEach(i=>{if(i.inventoryEventId===id)i.inventoryEventId=""});
    sanitizeOptionTargets(editorDraft.events,id);
    selectedEditorEventId=editorDraft.events[0]?.id||"";selectedEntryId="";renderEventManager();return;
  }
  if(a==="add-entry"){
    const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId);if(!ev)return;
    const ne=makeEntry(b.dataset.type);ev.entries.push(ne);selectedEntryId=ne.id;renderEventManager();return;
  }
  if(a==="select-entry"){selectedEntryId=b.dataset.id;renderEventManager();return}
  if(a==="move-entry"){
    const ctx=findEntryContext(selectedEntryId);if(!ctx)return;const ni=ctx.index+Number(b.dataset.dir);
    if(ni<0||ni>=ctx.list.length)return;[ctx.list[ctx.index],ctx.list[ni]]=[ctx.list[ni],ctx.list[ctx.index]];renderEventManager();return;
  }
  if(a==="duplicate-entry"){
    const ctx=findEntryContext(selectedEntryId);if(!ctx)return;const cp=clone(ctx.entry);regenerateIds(cp);ctx.list.splice(ctx.index+1,0,cp);selectedEntryId=cp.id;renderEventManager();return;
  }
  if(a==="delete-entry"){
    const ctx=findEntryContext(selectedEntryId);if(!ctx)return;ctx.list.splice(ctx.index,1);selectedEntryId=ctx.list[Math.min(ctx.index,ctx.list.length-1)]?.id||ctx.ancestors.at(-1)?.choice?.id||"";renderEventManager();return;
  }
  if(a==="add-option"){
    const ctx=findEntryContext(selectedEntryId);if(ctx?.entry.type!=="choice")return;ctx.entry.options.push(makeOption("선택지 "+(ctx.entry.options.length+1)));renderEventManager();return;
  }
  const optionCard=b.closest("[data-option-id]");
  const choice=findEntryContext(selectedEntryId)?.entry;
  const option=choice?.type==="choice"&&optionCard?choice.options.find(o=>o.id===optionCard.dataset.optionId):null;
  if(a==="delete-option"&&option){choice.options=choice.options.filter(o=>o.id!==option.id);renderEventManager();return}
  if(a==="move-option"&&option){
    const i=choice.options.indexOf(option),ni=i+Number(b.dataset.dir);if(ni<0||ni>=choice.options.length)return;
    [choice.options[i],choice.options[ni]]=[choice.options[ni],choice.options[i]];renderEventManager();return;
  }
  if(a==="add-branch"&&option){
    const ne=makeEntry(b.dataset.type);option.entries.push(ne);selectedEntryId=ne.id;renderEventManager();return;
  }
  if(a==="move-branch"&&option){
    const i=Number(b.dataset.index),ni=i+Number(b.dataset.dir);if(ni<0||ni>=option.entries.length)return;
    [option.entries[i],option.entries[ni]]=[option.entries[ni],option.entries[i]];renderEventManager();return;
  }
  if(a==="delete-branch"&&option){option.entries.splice(Number(b.dataset.index),1);renderEventManager();return}
  if(["add-fx","add-afffx","add-emofx","add-itemfx"].includes(a)){
    const owner=getSelectedOwner(b.dataset.kind,b);if(!owner)return;
    if(a==="add-fx")owner.effects.push({id:uid("fx"),variableId:editorDraft.variables[0]?.id||"",operation:"set",value:"0"});
    if(a==="add-afffx")owner.affectionEffects.push({id:uid("afx"),characterId:editorDraft.characters[0]?.id||"",amount:1});
    if(a==="add-emofx"){const c=editorDraft.characters[0];owner.emotionEffects.push({id:uid("efx"),characterId:c?.id||"",state:c?.emotionDefault||"calm",intensity:c?.emotionIntensity||0})}
    if(a==="add-itemfx"){owner.itemEffects ||= [];owner.itemEffects.push({id:uid("itemfx"),itemId:editorDraft.items[0]?.id||"",amount:1})}
    renderEventManager();return;
  }
  if(["delete-fx","delete-afffx","delete-emofx","delete-itemfx"].includes(a)){
    const kind=b.dataset.kind||b.closest("[data-fx-kind],[data-afffx-kind],[data-emofx-kind],[data-itemfx-kind]")?.dataset?.kind;
    const owner=getSelectedOwner(kind||"entry",b);if(!owner)return;
    const fr=b.closest("[data-fx-id]"),ar=b.closest("[data-afffx-id]"),er=b.closest("[data-emofx-id]"),ir=b.closest("[data-itemfx-id]");
    if(fr)owner.effects=owner.effects.filter(x=>x.id!==fr.dataset.fxId);
    if(ar)owner.affectionEffects=owner.affectionEffects.filter(x=>x.id!==ar.dataset.afffxId);
    if(er)owner.emotionEffects=owner.emotionEffects.filter(x=>x.id!==er.dataset.emofxId);
    if(ir)owner.itemEffects=(owner.itemEffects||[]).filter(x=>x.id!==ir.dataset.itemfxId);
    renderEventManager();return;
  }
  if(a==="new-ask"){
    editorDraft.asks.push(normalizeAsk({id:uid("ask"),characterId:editorDraft.characters[0]?.id||""}));
    renderAskEditor();return;
  }
  if(a==="delete-ask"){
    const row=b.closest("[data-ask-id]");
    editorDraft.asks=editorDraft.asks.filter(a=>a.id!==row?.dataset.askId);
    renderAskEditor();return;
  }
  if(a==="add-item-category"){
    const input=$("#newItemCategoryInput",editorBody);
    const value=input?.value.trim();
    if(value&&!editorDraft.itemCategories.includes(value)){
      editorDraft.itemCategories.push(value);
      renderItemEditor();
    }
    return;
  }
  if(a==="delete-item-category"){
    const value=b.dataset.id;
    if(value&&value!=="기타"){
      editorDraft.itemCategories=editorDraft.itemCategories.filter(cat=>cat!==value);
      editorDraft.items.forEach(item=>{if(item.category===value)item.category="기타"});
      if(editorItemCategoryFilter===value)editorItemCategoryFilter="ALL";
      renderItemEditor();
    }
    return;
  }
  if(a==="new-item"){
    editorDraft.items.push(normalizeItem({id:uid("item"),collectionCharacterId:editorDraft.characters[0]?.id||""}));
    renderItemEditor();return;
  }
  if(a==="new-item-reaction"){
    const item=editorDraft.items.find(i=>i.id===b.dataset.itemId);if(!item)return;
    item.reactions.push(normalizeItemReaction({
      id:uid("item-reaction"),
      characterId:editorDraft.characters[0]?.id||"",
      preference:"NEUTRAL",
      affectionDelta:1,
      entries:[]
    }));
    renderItemEditor();return;
  }
  if(a==="delete-item-reaction"){
    const card=b.closest("[data-reaction-id]");
    const item=editorDraft.items.find(i=>i.id===card?.dataset.itemId);if(!item)return;
    item.reactions=item.reactions.filter(r=>r.id!==card.dataset.reactionId);
    renderItemEditor();return;
  }
  if(a==="delete-item"){
    const row=b.closest("[data-item-id]");const id=row?.dataset.itemId;
    editorDraft.items=editorDraft.items.filter(i=>i.id!==id);
    if(id){
      delete editorDraft.inventoryCounts[id];
      editorDraft.newItemIds=editorDraft.newItemIds.filter(x=>x!==id);
      editorDraft.itemHistory=editorDraft.itemHistory.filter(h=>h.itemId!==id);
      const cleanEntries=entries=>{
        for(const entry of entries||[]){
          entry.itemEffects=(entry.itemEffects||[]).filter(fx=>fx.itemId!==id);
          if(entry.type==="choice"){
            for(const option of entry.options||[]){
              option.itemEffects=(option.itemEffects||[]).filter(fx=>fx.itemId!==id);
              cleanEntries(option.entries);
            }
          }
        }
      };
      editorDraft.events.forEach(ev=>cleanEntries(ev.entries));
      editorDraft.asks.forEach(ask=>cleanEntries(ask.entries));
      editorDraft.items.forEach(item=>item.reactions.forEach(r=>cleanEntries(r.entries)));
    }
    renderItemEditor();return;
  }
  if(a==="new-thought"){const t=normalizeThought({id:uid("thought"),category:editorDraft.thoughtSettings.categories[0]||"일상"});editorDraft.thoughts.push(t);renderThoughtEditor();return}
  if(a==="delete-thought"){const row=b.closest("[data-thought-id]");editorDraft.thoughts=editorDraft.thoughts.filter(t=>t.id!==row?.dataset.thoughtId);renderThoughtEditor();return}
  if(a==="add-category"){const inp=$("#newCategoryInput",editorBody);const v=inp?.value.trim();if(v&&!editorDraft.thoughtSettings.categories.includes(v)){editorDraft.thoughtSettings.categories.push(v);renderThoughtEditor()}return}
  if(a==="delete-category"){const v=b.dataset.id;editorDraft.thoughtSettings.categories=editorDraft.thoughtSettings.categories.filter(c=>c!==v);editorDraft.thoughts.forEach(t=>{if(t.category===v)t.category=editorDraft.thoughtSettings.categories[0]||"일상"});renderThoughtEditor();return}
});
function sanitizeOptionTargets(events,removedId){
  function scan(entries){entries.forEach(e=>{if(e.type==="choice")e.options.forEach(o=>{if(o.targetEventId===removedId)o.targetEventId="";scan(o.entries)})})}
  events.forEach(e=>scan(e.entries));
}

editorBody.addEventListener("input",handleEditorField);
editorBody.addEventListener("change",handleEditorField);
function handleEditorField(e){
  const t=e.target;

  if(t.dataset.itemEditorFilter){
    const kind=t.dataset.itemEditorFilter;
    if(kind==="query")editorItemQuery=t.value;
    if(kind==="character")editorItemCharacterFilter=t.value;
    if(kind==="rarity")editorItemRarityFilter=t.value;
    if(kind==="category")editorItemCategoryFilter=t.value;
    const pos=editorBody.scrollTop;
    renderItemEditor();
    editorBody.scrollTop=pos;
    const search=$('[data-item-editor-filter="query"]',editorBody);
    if(kind==="query"&&search){search.focus();try{search.setSelectionRange(search.value.length,search.value.length)}catch{}}
    return;
  }

  if(t.dataset.miniEntryField){
    const owner=getInteractionFlowOwner(t.dataset.flowScope,t.dataset.flowOwnerId,t.dataset.flowItemId);
    const ctx=owner?findFlowEntryContext(owner.entries,t.dataset.miniEntryId):null;
    if(ctx)ctx.entry[t.dataset.miniEntryField]=t.value;
    return;
  }
  if(t.dataset.miniOptionField){
    const owner=getInteractionFlowOwner(t.dataset.flowScope,t.dataset.flowOwnerId,t.dataset.flowItemId);
    const option=owner?findFlowOption(owner.entries,t.dataset.miniOptionId):null;
    if(option){
      if(t.dataset.miniOptionField==="exit")option.exitMode=t.value==="end"?"end":"continue";
      else option[t.dataset.miniOptionField]=t.value;
      option.targetEventId="";
    }
    return;
  }
  const reactionCard=t.closest("[data-reaction-id]");
  if(reactionCard&&t.dataset.reactionBind){
    const item=editorDraft.items.find(i=>i.id===reactionCard.dataset.itemId);
    const reaction=item?.reactions.find(r=>r.id===reactionCard.dataset.reactionId);
    if(!reaction)return;
    const k=t.dataset.reactionBind;
    if(k==="preference"){
      reaction.preference=t.value;
      reaction.affectionDelta=GIFT_PREFERENCES.find(p=>p[0]===t.value)?.[1]??reaction.affectionDelta;
      renderItemEditor();
      return;
    }
    if(k==="affectionDelta")reaction[k]=clamp(t.value,-100,100,0);
    else if(k==="emotionIntensity")reaction[k]=clamp(t.value,0,100,0);
    else reaction[k]=t.value;
    return;
  }

  const ch=editorDraft?.characters.find(x=>x.id===selectedEditorCharacterId);
  const ev=editorDraft?.events.find(x=>x.id===selectedEditorEventId);
  if(t.dataset.bind&&ch){
    const m={
      "char-name":"name","char-origin":"origin","char-role":"role","char-image":"image","char-quote":"quote",
      "char-affection":"affectionStart","char-emotion":"emotionDefault","char-intensity":"emotionIntensity","char-enabled":"enabled"
    };
    const k=m[t.dataset.bind];if(k){ch[k]=t.type==="checkbox"?t.checked:(["affectionStart","emotionIntensity"].includes(k)?clamp(t.value,0,100,0):t.value);return}
  }
  if(t.dataset.bind&&ev){
    if(t.dataset.bind==="event-name"){ev.name=t.value;return}
    if(t.dataset.bind==="event-character"){ev.characterId=t.value;return}
    if(t.dataset.bind==="event-next"){ev.nextEventId=t.value;return}
    if(t.dataset.bind==="event-emotion-exit"){ev.emotionExitMode=t.value==="reset"?"reset":"keep";return}
  }
  const vr=t.closest("[data-var-id]");
  if(vr){
    const v=editorDraft.variables.find(x=>x.id===vr.dataset.varId);if(!v)return;
    if(t.dataset.bind==="var-name")v.name=t.value;
    if(t.dataset.bind==="var-type")v.type=t.value;
    if(t.dataset.bind==="var-default")v.defaultValue=t.value;
    return;
  }
  const ctx=findEntryContext(selectedEntryId),entry=ctx?.entry;
  if(t.dataset.entryField&&entry){entry[t.dataset.entryField]=t.value;return}
  const optionCard=t.closest("[data-option-id]");
  const option=entry?.type==="choice"&&optionCard?entry.options.find(o=>o.id===optionCard.dataset.optionId):null;
  if(t.dataset.optionField&&option){
    if(t.dataset.optionField==="label")option.label=t.value;
    if(t.dataset.optionField==="exit"){
      if(t.value.startsWith("event:")){option.targetEventId=t.value.slice(6);option.exitMode="continue"}
      else{option.targetEventId="";option.exitMode=t.value==="end"?"end":"continue"}
    }
    return;
  }
  const kind=t.dataset.condKind||t.dataset.affcondKind||t.dataset.emocondKind||t.dataset.fxKind||t.dataset.afffxKind||t.dataset.emofxKind||t.dataset.itemfxKind;
  if(kind){
    const owner=getSelectedOwner(kind,t);if(!owner)return;
    if(t.dataset.condField){
      if(t.dataset.condField==="variableId"&&!t.value){owner.condition=null;return}
      owner.condition ||= {variableId:"",operator:"==",value:""};
      owner.condition[t.dataset.condField]=t.value;return;
    }
    if(t.dataset.affcondField){
      if(t.dataset.affcondField==="characterId"&&!t.value){owner.affectionCondition=null;return}
      owner.affectionCondition ||= {characterId:"",operator:">=",value:0};
      owner.affectionCondition[t.dataset.affcondField]=t.dataset.affcondField==="value"?clamp(t.value,0,100,0):t.value;return;
    }
    if(t.dataset.emocondField){
      if(t.dataset.emocondField==="characterId"&&!t.value){owner.emotionCondition=null;return}
      owner.emotionCondition ||= {characterId:"",state:"",intensityOperator:">=",intensityValue:0};
      owner.emotionCondition[t.dataset.emocondField]=t.dataset.emocondField==="intensityValue"?clamp(t.value,0,100,0):t.value;return;
    }
    const fxr=t.closest("[data-fx-id]"),afr=t.closest("[data-afffx-id]"),emr=t.closest("[data-emofx-id]"),ifr=t.closest("[data-itemfx-id]");
    if(fxr){
      const fx=owner.effects.find(x=>x.id===fxr.dataset.fxId);if(fx)fx[t.dataset.fxField]=t.value;return;
    }
    if(afr){
      const fx=owner.affectionEffects.find(x=>x.id===afr.dataset.afffxId);if(fx)fx[t.dataset.afffxField]=t.dataset.afffxField==="amount"?clamp(t.value,-100,100,0):t.value;return;
    }
    if(emr){
      const fx=owner.emotionEffects.find(x=>x.id===emr.dataset.emofxId);if(fx)fx[t.dataset.emofxField]=t.dataset.emofxField==="intensity"?clamp(t.value,0,100,0):t.value;return;
    }
    if(ifr){
      const fx=(owner.itemEffects||[]).find(x=>x.id===ifr.dataset.itemfxId);
      if(fx)fx[t.dataset.itemfxField]=t.dataset.itemfxField==="amount"?Math.max(1,Number(t.value)||1):t.value;
      return;
    }
  }
  if(t.dataset.gachaBind){
    const k=t.dataset.gachaBind;editorDraft.gacha[k]=t.type==="checkbox"?t.checked:(["balance","singleCost","tenCost"].includes(k)?Math.max(0,Number(t.value)||0):t.value);return;
  }
  if(t.dataset.rarity){editorDraft.gacha.rarityWeights[t.dataset.rarity]=Math.max(0,Number(t.value)||0);return}
  const ar=t.closest("[data-ask-id]");
  if(ar&&t.dataset.askBind){
    const ask=editorDraft.asks.find(x=>x.id===ar.dataset.askId);if(!ask)return;
    const k=t.dataset.askBind;
    if(t.type==="checkbox")ask[k]=t.checked;
    else if(k==="minAffection"||k==="emotionIntensity")ask[k]=clamp(t.value,0,100,0);
    else if(k==="affectionDelta")ask[k]=clamp(t.value,-100,100,0);
    else ask[k]=t.value;
    return;
  }
  const tr=t.closest("[data-thought-id]");
  if(tr&&t.dataset.thoughtBind){
    const th=editorDraft.thoughts.find(x=>x.id===tr.dataset.thoughtId);if(!th)return;
    th[t.dataset.thoughtBind]=t.type==="checkbox"?t.checked:t.value;return;
  }
  const ir=t.closest("[data-item-id]");
  if(ir&&t.dataset.itemBind){
    const item=editorDraft.items.find(x=>x.id===ir.dataset.itemId);if(!item)return;
    const k=t.dataset.itemBind;
    if(t.type==="checkbox")item[k]=t.checked;
    else if(k==="weight")item[k]=Math.max(.01,Number(t.value)||1);
    else item[k]=t.value;
    return;
  }
  if(t.dataset.collectionSetting){
    const key=t.dataset.collectionSetting;
    editorDraft.collectionSettings[key]=t.type==="checkbox"?t.checked:t.value;
    return;
  }
}

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(modalRoot.innerHTML){closeModal();return}
    if(!editorOverlay.hidden){closeEditor();return}
  }
  if(currentPage==="room"&&roomMode==="talk"&&editorOverlay.hidden&&modalRoot.innerHTML===""){
    if((e.key===" "||e.key==="Enter")&&!e.target.matches("input,textarea,select,button")){
      const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
      if(entry&&entry.type!=="choice"){e.preventDefault();advanceDialogue(false)}
    }
  }
});

renderStart();
})();