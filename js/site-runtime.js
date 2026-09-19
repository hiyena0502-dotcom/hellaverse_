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
    inventoryCounts:{},
    collectionSettings:{showLocked:true,showOwnedCount:true},
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
function normalizeAsk(a={}){
  return {
    id:a.id||uid("ask"),
    characterId:a.characterId||"",
    label:a.label||a.question||"새 질문",
    eventId:a.eventId||"",
    minAffection:clamp(a.minAffection,0,100,0),
    enabled:a.enabled!==false
  };
}
function normalizeItem(i={}){
  return {
    id:i.id||uid("item"),
    name:i.name||"새 아이템",
    category:i.category||"기타",
    rarity:RARITIES.includes(i.rarity)?i.rarity:"COMMON",
    characterId:i.characterId||"",
    description:i.description||"",
    gachaEnabled:i.gachaEnabled!==false,
    inventoryEventId:i.inventoryEventId||i.eventId||"",
    enabled:i.enabled!==false,
    weight:Math.max(.01,Number(i.weight)||1),
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
    inventoryCounts:Object.fromEntries(Object.entries(inventoryCounts).map(([id,n])=>[id,Math.max(0,Number(n)||0)])),
    collectionSettings:{
      showLocked:s.collectionSettings?.showLocked!==false,
      showOwnedCount:s.collectionSettings?.showOwnedCount!==false
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
      rarityWeights:Object.fromEntries(RARITIES.map(r=>[r,Math.max(0,Number(s.gacha?.rarityWeights?.[r]) || d.gacha.rarityWeights[r])])),
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
let pendingOrigin=state.profile.origin || "";
let roomMode="talk";
let editorDraft=null;
let editorTab="dialogue";
let dialogueSubtab="characters";
let selectedEditorCharacterId="";
let selectedEditorEventId="";
let selectedEntryId="";
let selectedThoughtId="";
let selectedAskId="";
let selectedItemId="";

let session=createSession();
let playback=null;
let typing={token:"",full:"",index:0,done:true,timer:null};
let autoMode=false;
let autoTimer=null;
let toastTimer=null;

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
function getEvent(id, source=state){return source.events.find(e=>e.id===id)||null}
function eventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId)}
function variableById(id,source=state){return source.variables.find(v=>v.id===id)||null}
function itemById(id,source=state){return source.items.find(i=>i.id===id)||null}
function itemCount(id,source=state){return Math.max(0,Number(source.inventoryCounts?.[id])||0)}
function addItem(id,count=1,source=state){
  const item=itemById(id,source);if(!item)return 0;
  source.inventoryCounts ||= {};
  source.inventoryCounts[id]=itemCount(id,source)+Math.max(0,Number(count)||0);
  return source.inventoryCounts[id];
}
function asksForCharacter(charId,source=state){
  return source.asks.filter(a=>a.characterId===charId&&a.enabled);
}
function itemsForCharacter(charId,source=state){
  return source.items.filter(i=>i.characterId===charId&&i.enabled);
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
function applyOwnerEffects(o){applyEffects(o.effects);applyAffectionEffects(o.affectionEffects);applyEmotionEffects(o.emotionEffects)}
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
  entry.affectionEffects=normalizeAffectionEffects(entry.affectionEffects).map(x=>({...x,id:uid("afx")}));
  entry.emotionEffects=normalizeEmotionEffects(entry.emotionEffects).map(x=>({...x,id:uid("efx")}));
  if(entry.type==="choice")entry.options.forEach(o=>{
    o.id=uid("option");
    o.effects=normalizeEffects(o.effects).map(x=>({...x,id:uid("fx")}));
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
  const pool=state.items.filter(i=>i.enabled&&i.gachaEnabled);
  const total=RARITIES.reduce((s,r)=>s+Number(state.gacha.rarityWeights[r]||0),0)||1;
  const history=state.gacha.history.slice(-8).reverse();
  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">GACHA</p><h1>ARCHIVE DRAW</h1></div><p>아이템 설정에서 가챠 포함으로 지정한 아이템을 추첨합니다. 획득한 아이템은 컬렉션과 인벤토리에 기록됩니다.</p></div>'+
    '<div class="gacha-layout">'+
      '<div class="gacha-stage"><div><p class="gacha-balance">'+esc(state.gacha.currencyName)+' · '+state.gacha.balance+'</p><h2>DRAW THE ARCHIVE</h2>'+
      '<p>'+pool.length+'개의 아이템이 현재 가챠 풀에 등록되어 있습니다.</p><div id="gachaResult" class="gacha-result-grid"></div>'+
      '<div class="draw-actions"><button class="gold-button" type="button" data-action="draw-gacha" data-count="1" '+(!state.gacha.enabled||!pool.length?"disabled":"")+'>1 DRAW · '+state.gacha.singleCost+'</button>'+
      '<button class="gold-button" type="button" data-action="draw-gacha" data-count="10" '+(!state.gacha.enabled||!pool.length?"disabled":"")+'>10 DRAW · '+state.gacha.tenCost+'</button></div></div></div>'+
      '<aside class="gacha-side"><div class="info-card"><h3>RATES</h3>'+RARITIES.map(r=>'<div class="rate-row"><span>'+r+'</span><b>'+((state.gacha.rarityWeights[r]/total)*100).toFixed(1)+'%</b></div>').join("")+'</div>'+
      '<div class="info-card"><h3>RECENT</h3>'+(history.length?history.map(h=>'<div class="history-row"><span>'+esc(h.rarity)+'</span><b>'+esc(h.name)+'</b></div>').join(""):'<p class="muted">아직 기록이 없습니다.</p>')+'</div></aside>'+
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
  const filterChars=["ALL",...chars.map(c=>c.id)];
  const groups=chars
    .filter(ch=>collectionFilter==="ALL"||collectionFilter===ch.id)
    .map(ch=>({
      character:ch,
      items:state.items.filter(i=>i.enabled&&i.characterId===ch.id)
        .filter(i=>state.collectionSettings.showLocked||itemCount(i.id)>0)
    }))
    .filter(g=>g.items.length || collectionFilter!=="ALL");

  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">COLLECTION</p><h1>CHARACTER ARCHIVE</h1></div><p>캐릭터마다 가진 고유 아이템을 모아두는 기록입니다. 가챠에서 얻은 아이템이 자동으로 해금됩니다.</p></div>'+
    '<div class="collection-toolbar">'+filterChars.map(id=>{
      const label=id==="ALL"?"ALL":getCharacter(id)?.name||"UNKNOWN";
      return '<button class="filter-chip '+(collectionFilter===id?"active":"")+'" data-action="collection-filter" data-id="'+esc(id)+'">'+esc(label)+'</button>';
    }).join("")+'</div>'+
    (groups.length?groups.map(g=>'<section class="collection-preview-group"><h3>'+esc(g.character.name)+'</h3><div class="collection-grid">'+
      (g.items.length?g.items.map(i=>{
        const count=itemCount(i.id);
        const unlocked=count>0;
        return '<button class="collection-card rarity-'+esc(i.rarity)+' '+(unlocked?"":"locked")+'" type="button" data-action="collection-detail" data-id="'+esc(i.id)+'">'+
          '<em>'+esc(i.category)+'</em><span class="rarity">'+esc(i.rarity)+'</span><strong>'+(unlocked?esc(i.name):"LOCKED")+'</strong>'+
          '<p>'+(unlocked?esc(i.description||"설명 없음"):"아직 획득하지 않은 아이템입니다.")+'</p>'+
          (unlocked&&state.collectionSettings.showOwnedCount?'<small>OWNED ×'+count+'</small>':'')+'</button>';
      }).join(""):'<p class="muted">표시할 아이템이 없습니다.</p>')+
      '</div></section>').join(""):'<div class="empty-panel"><div><h2>컬렉션이 비어 있습니다.</h2><p>EDITOR → 아이템 설정에서 캐릭터별 아이템을 추가하세요.</p></div></div>')+
    '</section>';
}

function startDialogue(characterId,eventId){
  const ch=getCharacter(characterId);if(!ch)return;
  selectedCharacterId=ch.id;
  roomMode="talk";
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
      for(const o of e.options){if(o.id===optionId)return o;const n=scan(o.entries);if(n)return n}
    }
    return null;
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
  if(ev?.nextEventId&&getEvent(ev.nextEventId)){jumpEvent(ev.nextEventId);return true}
  resetEventEmotion(ev);if(playback)playback.ended=true;return false;
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
  pageRoot.innerHTML=
    '<section class="room-page"><div class="room-hud"><button class="text-link" type="button" data-action="back-home">← HOME</button><strong>'+esc(ch.name)+'</strong>'+
    '<div class="room-mode-bar"><button class="room-mode-button '+(roomMode==="talk"?"active":"")+'" type="button" data-action="room-mode" data-mode="talk">TALK</button>'+
    '<button class="room-mode-button '+(roomMode==="ask"?"active":"")+'" type="button" data-action="room-mode" data-mode="ask">ASK</button>'+
    '<button class="room-mode-button '+(roomMode==="inventory"?"active":"")+'" type="button" data-action="room-mode" data-mode="inventory">INVENTORY</button></div>'+
    (roomMode==="talk"&&eventOptions.length?'<select id="roomEventSelect" style="width:auto;min-width:190px">'+eventOptions.map(e=>'<option value="'+esc(e.id)+'" '+(ev?.id===e.id?"selected":"")+'>'+esc(e.name)+'</option>').join("")+'</select>':'')+
    '<div class="room-actions"><button class="text-link" type="button" data-action="show-log">LOG</button><button class="text-link" type="button" data-action="show-affection">AFFECTION</button><button class="text-link" type="button" data-action="show-emotion">EMOTION</button></div></div>'+
    '<div class="room-stage"><div class="room-art">'+art+'</div><div id="roomDynamic"></div>'+
    (roomMode==="talk"?'<div class="room-control-bar"><button type="button" data-action="toggle-auto" class="'+(autoMode?"active":"")+'">AUTO</button><button type="button" data-action="open-play-settings">SET</button></div>':'')+
    '</div></section>';
  if(roomMode==="ask")renderAskPanel();
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
  clearTyping();clearAuto();
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  const asks=asksForCharacter(ch.id).filter(a=>affection>=a.minAffection);
  dynamic.innerHTML='<section class="ask-panel"><div class="inventory-character-head"><div><p class="page-kicker">ASK</p><h2>무엇을 물어볼까?</h2></div><p>'+esc(ch.name)+'</p></div><div class="ask-list">'+
    (asks.length?asks.map(a=>'<button class="ask-entry" type="button" data-action="ask-topic" data-id="'+esc(a.id)+'"><span>'+esc(a.label)+'</span><small>ASK</small></button>').join(""):'<div class="editor-note">현재 사용할 수 있는 질문이 없습니다.</div>')+
    '</div></section>';
}
function startAsk(id){
  const ask=state.asks.find(a=>a.id===id&&a.enabled);if(!ask)return;
  const ch=getCharacter(ask.characterId);if(!ch||selectedCharacterId!==ch.id)return;
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  if(affection<ask.minAffection){showToast("아직 물어볼 수 없습니다.");return}
  const ev=getEvent(ask.eventId);
  if(!ev){showToast("ASK에 연결된 이벤트가 없습니다.");return}
  startDialogue(ch.id,ev.id);
}
function renderInventoryPanel(){
  clearTyping();clearAuto();
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const items=itemsForCharacter(ch.id).filter(i=>itemCount(i.id)>0);
  dynamic.innerHTML='<section class="inventory-panel"><div class="inventory-character-head"><div><p class="page-kicker">INVENTORY</p><h2>'+esc(ch.name)+' ITEMS</h2></div><p>보유 아이템만 표시됩니다.</p></div><div class="inventory-list">'+
    (items.length?items.map(i=>'<button class="inventory-entry" type="button" data-action="inventory-item" data-id="'+esc(i.id)+'"><span><b>'+esc(i.name)+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+'</small></span><span class="count">×'+itemCount(i.id)+'</span></button>').join(""):'<div class="editor-note">이 캐릭터의 보유 아이템이 없습니다. 가챠에서 획득하면 여기에 나타납니다.</div>')+
    '</div></section>';
}
function useInventoryItem(id){
  const item=itemById(id);if(!item||item.characterId!==selectedCharacterId||itemCount(id)<=0)return;
  if(item.inventoryEventId&&getEvent(item.inventoryEventId)){
    startDialogue(selectedCharacterId,item.inventoryEventId);
    return;
  }
  collectionDetail(id);
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
function drawGacha(count){
  const pool=state.items.filter(i=>i.enabled&&i.gachaEnabled);
  if(!pool.length){showToast("가챠 풀이 비어 있습니다.");return}
  const cost=count===10?state.gacha.tenCost:state.gacha.singleCost;
  if(state.gacha.balance<cost){showToast(state.gacha.currencyName+"이 부족합니다.");return}
  state.gacha.balance-=cost;
  const results=[];
  for(let i=0;i<count;i++){
    const rarity=chooseWeighted(RARITIES,r=>state.gacha.rarityWeights[r])||"COMMON";
    const candidates=pool.filter(x=>x.rarity===rarity);
    const item=chooseWeighted(candidates.length?candidates:pool,x=>x.weight);
    if(!item)continue;
    addItem(item.id,1,state);
    results.push(item);
    state.gacha.history.push({name:item.name,rarity:item.rarity,itemId:item.id,at:Date.now()});
  }
  state.gacha.history=state.gacha.history.slice(-50);saveState();
  renderGacha();
  const box=$("#gachaResult");
  if(box)box.innerHTML=results.map(i=>'<div class="gacha-result-card rarity-'+esc(i.rarity)+'"><span>'+esc(i.rarity)+'</span><strong>'+esc(i.name)+'</strong><small>'+esc(getCharacter(i.characterId)?.name||"UNKNOWN")+'</small></div>').join("");
}
function collectionDetail(id){
  const i=itemById(id);if(!i)return;
  const count=itemCount(i.id);
  const unlocked=count>0;
  openModal(unlocked?i.name:"LOCKED",unlocked?'<p class="label">'+esc(i.rarity)+' · '+esc(i.category)+'</p><p style="line-height:1.7">'+esc(i.description||"설명 없음")+'</p><p class="muted">'+esc(getCharacter(i.characterId)?.name||"캐릭터 미지정")+(state.collectionSettings.showOwnedCount?' · OWNED ×'+count:'')+'</p>':'<p class="muted">아직 가챠에서 획득하지 않은 아이템입니다.</p>');
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
    '<div class="option-effects">'+renderQuickEffects(o,"option")+'<details class="advanced"><summary>고급 조건 / 변수</summary>'+renderConditions(o,"option")+renderVariableEffects(o,"option")+'</details></div></article>';
}
function renderAdvanced(owner,kind){
  return '<details class="advanced"><summary>고급 · 조건 / 호감도 / 감정 / 변수</summary>'+renderConditions(owner,kind)+renderQuickEffects(owner,kind)+renderVariableEffects(owner,kind)+'</details>';
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
function getSelectedOwner(kind,element){
  if(kind==="entry")return findEntryContext(selectedEntryId)?.entry||null;
  const card=element.closest("[data-option-id]");if(!card)return null;
  const choice=findEntryContext(selectedEntryId)?.entry;
  return choice?.type==="choice"?choice.options.find(o=>o.id===card.dataset.optionId)||null:null;
}


function renderAskEditor(){
  editorBody.innerHTML=editorHead("ASK","ASK 설정","ROOM의 ASK 목록을 관리합니다. 각 질문은 기존 대화 이벤트 하나에 연결됩니다.",'<button class="small-button" data-action="new-ask">+ 질문</button>')+
    '<div class="ask-editor-grid">'+
    (editorDraft.asks.length?editorDraft.asks.map(a=>'<div class="ask-row" data-ask-id="'+esc(a.id)+'"><select data-ask-bind="characterId">'+charOptions(a.characterId,"캐릭터 선택")+'</select><input data-ask-bind="label" value="'+esc(a.label)+'" placeholder="질문 문구"><select data-ask-bind="eventId">'+eventOptions(a.eventId,"연결 이벤트 선택",editorDraft)+'</select><label class="field"><span>최소 호감도</span><input type="number" min="0" max="100" data-ask-bind="minAffection" value="'+a.minAffection+'"></label><span><label class="checkline"><input type="checkbox" data-ask-bind="enabled" '+(a.enabled?"checked":"")+'> 사용</label><button class="danger-button" data-action="delete-ask">×</button></span></div>').join(""):'<div class="editor-note">등록된 ASK가 없습니다. 질문을 추가하고 대화 이벤트에 연결하세요.</div>')+
    '</div>';
}
function renderItemEditor(){
  editorBody.innerHTML=editorHead("ITEM","아이템 설정","캐릭터마다 여러 아이템을 만들 수 있습니다. 가챠에서 획득하면 INVENTORY와 COLLECTION에 기록됩니다.",'<button class="small-button" data-action="new-item">+ 아이템</button>')+
    '<div class="item-editor-grid">'+
    (editorDraft.items.length?editorDraft.items.map(i=>'<div class="item-row" data-item-id="'+esc(i.id)+'"><select data-item-bind="characterId">'+charOptions(i.characterId,"캐릭터 선택")+'</select><input data-item-bind="name" value="'+esc(i.name)+'" placeholder="아이템 이름"><select data-item-bind="rarity">'+RARITIES.map(r=>'<option '+(i.rarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select><input data-item-bind="category" value="'+esc(i.category)+'" placeholder="카테고리"><input type="number" min=".01" step=".01" data-item-bind="weight" value="'+i.weight+'"><button class="danger-button" data-action="delete-item">×</button>'+
      '<div class="full-row form-grid"><label class="field"><span>INVENTORY 선택 시 이벤트</span><select data-item-bind="inventoryEventId">'+eventOptions(i.inventoryEventId,"이벤트 없음",editorDraft)+'</select></label><label class="checkline"><input type="checkbox" data-item-bind="gachaEnabled" '+(i.gachaEnabled?"checked":"")+'> 가챠 포함</label><label class="checkline"><input type="checkbox" data-item-bind="enabled" '+(i.enabled?"checked":"")+'> 사용</label><label class="field full"><span>설명</span><textarea data-item-bind="description">'+esc(i.description)+'</textarea></label></div>'+
    '</div>').join(""):'<div class="editor-note">아이템이 없습니다.</div>')+
    '</div>';
}
function renderGachaEditor(){
  const total=RARITIES.reduce((s,r)=>s+Number(editorDraft.gacha.rarityWeights[r]||0),0)||1;
  const pool=editorDraft.items.filter(i=>i.enabled&&i.gachaEnabled);
  editorBody.innerHTML=editorHead("GACHA","가챠 설정","아이템 설정의 가챠 포함 항목을 대상으로 비용·확률을 관리합니다.")+
  '<div class="settings-grid"><section class="settings-card"><h3>BASIC</h3><div class="form-grid"><label class="checkline"><input type="checkbox" data-gacha-bind="enabled" '+(editorDraft.gacha.enabled?"checked":"")+'> 가챠 사용</label><label class="field"><span>재화 이름</span><input data-gacha-bind="currencyName" value="'+esc(editorDraft.gacha.currencyName)+'"></label><label class="field"><span>현재 재화</span><input type="number" min="0" data-gacha-bind="balance" value="'+editorDraft.gacha.balance+'"></label><label class="field"><span>1회 비용</span><input type="number" min="0" data-gacha-bind="singleCost" value="'+editorDraft.gacha.singleCost+'"></label><label class="field"><span>10회 비용</span><input type="number" min="0" data-gacha-bind="tenCost" value="'+editorDraft.gacha.tenCost+'"></label></div></section>'+
  '<section class="settings-card"><h3>RARITY WEIGHT</h3><div class="rarity-editor">'+RARITIES.map(r=>'<label class="rarity-edit-row"><span>'+r+' · '+((editorDraft.gacha.rarityWeights[r]/total)*100).toFixed(1)+'%</span><input type="number" min="0" step="1" data-rarity="'+r+'" value="'+editorDraft.gacha.rarityWeights[r]+'"></label>').join("")+'</div></section></div>'+
  '<div class="settings-card" style="margin-top:14px"><h3>ITEM POOL</h3><p class="muted">아이템 설정에서 “가챠 포함”을 켠 항목입니다.</p><div class="table-editor">'+
  (pool.length?pool.map(i=>'<div class="table-row"><span>'+esc(i.name)+'</span><span>'+esc(i.rarity)+'</span><span>WEIGHT '+i.weight+'</span><span>'+esc(getCharacterDraft(i.characterId)?.name||"캐릭터 미지정")+'</span><span></span></div>').join(""):'<div class="editor-note">현재 가챠 풀에 등록된 아이템이 없습니다.</div>')+'</div></div>';
}
function renderThoughtEditor(){
  editorBody.innerHTML=editorHead("THOUGHT","Thought 설정","캐릭터별 생각, 카테고리, 등장 빈도를 관리합니다.",'<button class="small-button" data-action="new-thought">+ Thought</button>')+
  '<section class="settings-card" style="margin-top:16px"><h3>CATEGORIES</h3><div class="category-list">'+editorDraft.thoughtSettings.categories.map(c=>'<span class="category-tag">'+esc(c)+'<button data-action="delete-category" data-id="'+esc(c)+'">×</button></span>').join("")+'</div><div style="display:flex;gap:7px;margin-top:10px"><input id="newCategoryInput" placeholder="새 카테고리"><button class="small-button" data-action="add-category">추가</button></div></section>'+
  '<div class="table-editor">'+(editorDraft.thoughts.length?editorDraft.thoughts.map(t=>'<div class="table-row thought-row" data-thought-id="'+esc(t.id)+'"><select data-thought-bind="characterId">'+charOptions(t.characterId,"캐릭터")+'</select><select data-thought-bind="category">'+editorDraft.thoughtSettings.categories.map(c=>'<option '+(t.category===c?"selected":"")+'>'+esc(c)+'</option>').join("")+'</select><select data-thought-bind="frequency">'+FREQUENCIES.map(f=>'<option value="'+f[0]+'" '+(t.frequency===f[0]?"selected":"")+'>'+f[1]+'</option>').join("")+'</select><select data-thought-bind="rarity">'+RARITIES.map(r=>'<option '+(t.rarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select><textarea data-thought-bind="text">'+esc(t.text)+'</textarea><span><label class="checkline"><input type="checkbox" data-thought-bind="enabled" '+(t.enabled?"checked":"")+'> 사용</label><button class="danger-button" data-action="delete-thought">×</button></span></div>').join(""):'<div class="editor-note">Thought가 없습니다.</div>')+'</div>';
}
function renderCollectionEditor(){
  const chars=editorDraft.characters;
  editorBody.innerHTML=editorHead("COLLECTION","컬렉션 설정","컬렉션은 아이템 정의가 아니라, 가챠로 얻은 캐릭터별 아이템의 아카이브입니다.")+
    '<div class="settings-grid"><section class="settings-card"><h3>DISPLAY</h3><label class="checkline"><input type="checkbox" data-collection-setting="showLocked" '+(editorDraft.collectionSettings.showLocked?"checked":"")+'> 미획득 아이템도 LOCKED로 표시</label><label class="checkline"><input type="checkbox" data-collection-setting="showOwnedCount" '+(editorDraft.collectionSettings.showOwnedCount?"checked":"")+'> 보유 개수 표시</label></section>'+
    '<section class="settings-card"><h3>SUMMARY</h3><p class="muted">아이템 추가·희귀도·가챠 여부는 “아이템 설정”에서 관리합니다.</p><p>'+editorDraft.items.length+' ITEMS · '+Object.values(editorDraft.inventoryCounts).filter(n=>Number(n)>0).length+' DISCOVERED</p></section></div>'+
    (chars.length?chars.map(ch=>'<section class="collection-preview-group"><h3>'+esc(ch.name)+'</h3><div class="collection-preview-items">'+
      (editorDraft.items.filter(i=>i.characterId===ch.id).length?editorDraft.items.filter(i=>i.characterId===ch.id).map(i=>'<div class="collection-preview-item"><b>'+esc(i.name)+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+'</small><div>현재 보유 '+itemCount(i.id,editorDraft)+'</div></div>').join(""):'<div class="editor-note">이 캐릭터의 아이템이 없습니다.</div>')+
      '</div></section>').join(""):'<div class="editor-note">캐릭터가 없습니다.</div>');
}

/* APP EVENTS */
originChoice.addEventListener("click",e=>{
  const b=e.target.closest("[data-origin]");if(!b)return;
  pendingOrigin=b.dataset.origin;$$("[data-origin]",originChoice).forEach(x=>x.classList.toggle("active",x===b));startHint.textContent="";
});
enterGameButton.addEventListener("click",enterGame);
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
  else if(a==="back-home")setPage("home");
  else if(a==="random-thought")randomThought();
  else if(a==="show-affection")showAffection();
  else if(a==="show-emotion")showEmotion();
  else if(a==="show-log")showLog();
  else if(a==="open-play-settings")showPlaySettings();
  else if(a==="toggle-auto"){autoMode=!autoMode;b.classList.toggle("active",autoMode);if(autoMode)scheduleAuto();else clearAuto()}
  else if(a==="advance-dialogue")advanceDialogue(false);
  else if(a==="choose-option")chooseOption(b.dataset.id);
  else if(a==="draw-gacha")drawGacha(Number(b.dataset.count)||1);
  else if(a==="thought-filter"){thoughtFilter=b.dataset.id;renderThought()}
  else if(a==="collection-filter"){collectionFilter=b.dataset.id;renderCollection()}
  else if(a==="collection-detail")collectionDetail(b.dataset.id);
});
pageRoot.addEventListener("change",e=>{
  if(e.target.id==="roomEventSelect")startDialogue(selectedCharacterId,e.target.value);
});
pageRoot.addEventListener("click",e=>{
  if(currentPage!=="room"||!prefs.stageClick)return;
  if(e.target.closest("button,input,select,textarea"))return;
  const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
  if(entry&&entry.type!=="choice")advanceDialogue(false);
});

editorBody.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="dialogue-subtab"){dialogueSubtab=b.dataset.id;renderDialogueEditor();return}
  if(a==="new-character"){
    const c=normalizeCharacter({id:uid("char"),name:"새 캐릭터"});editorDraft.characters.push(c);selectedEditorCharacterId=c.id;renderCharacterManager();return;
  }
  if(a==="select-character"){selectedEditorCharacterId=b.dataset.id;renderCharacterManager();return}
  if(a==="delete-character"){
    const id=selectedEditorCharacterId;editorDraft.characters=editorDraft.characters.filter(c=>c.id!==id);
    editorDraft.events.forEach(ev=>{if(ev.characterId===id)ev.characterId=""});
    editorDraft.thoughts.forEach(t=>{if(t.characterId===id)t.characterId=""});
    editorDraft.collection.forEach(i=>{if(i.characterId===id)i.characterId=""});
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
  if(["add-fx","add-afffx","add-emofx"].includes(a)){
    const owner=getSelectedOwner(b.dataset.kind,b);if(!owner)return;
    if(a==="add-fx")owner.effects.push({id:uid("fx"),variableId:editorDraft.variables[0]?.id||"",operation:"set",value:"0"});
    if(a==="add-afffx")owner.affectionEffects.push({id:uid("afx"),characterId:editorDraft.characters[0]?.id||"",amount:1});
    if(a==="add-emofx"){const c=editorDraft.characters[0];owner.emotionEffects.push({id:uid("efx"),characterId:c?.id||"",state:c?.emotionDefault||"calm",intensity:c?.emotionIntensity||0})}
    renderEventManager();return;
  }
  if(["delete-fx","delete-afffx","delete-emofx"].includes(a)){
    const kind=b.dataset.kind||b.closest("[data-fx-kind],[data-afffx-kind],[data-emofx-kind]")?.dataset?.kind;
    const owner=getSelectedOwner(kind||"entry",b);if(!owner)return;
    const fr=b.closest("[data-fx-id]"),ar=b.closest("[data-afffx-id]"),er=b.closest("[data-emofx-id]");
    if(fr)owner.effects=owner.effects.filter(x=>x.id!==fr.dataset.fxId);
    if(ar)owner.affectionEffects=owner.affectionEffects.filter(x=>x.id!==ar.dataset.afffxId);
    if(er)owner.emotionEffects=owner.emotionEffects.filter(x=>x.id!==er.dataset.emofxId);
    renderEventManager();return;
  }
  if(a==="new-thought"){const t=normalizeThought({id:uid("thought"),category:editorDraft.thoughtSettings.categories[0]||"일상"});editorDraft.thoughts.push(t);renderThoughtEditor();return}
  if(a==="delete-thought"){const row=b.closest("[data-thought-id]");editorDraft.thoughts=editorDraft.thoughts.filter(t=>t.id!==row?.dataset.thoughtId);renderThoughtEditor();return}
  if(a==="add-category"){const inp=$("#newCategoryInput",editorBody);const v=inp?.value.trim();if(v&&!editorDraft.thoughtSettings.categories.includes(v)){editorDraft.thoughtSettings.categories.push(v);renderThoughtEditor()}return}
  if(a==="delete-category"){const v=b.dataset.id;editorDraft.thoughtSettings.categories=editorDraft.thoughtSettings.categories.filter(c=>c!==v);editorDraft.thoughts.forEach(t=>{if(t.category===v)t.category=editorDraft.thoughtSettings.categories[0]||"일상"});renderThoughtEditor();return}
  if(a==="new-collection"){editorDraft.collection.push(normalizeItem({id:uid("item")}));renderCollectionEditor();return}
  if(a==="delete-collection"){const row=b.closest("[data-item-id]");editorDraft.collection=editorDraft.collection.filter(i=>i.id!==row?.dataset.itemId);renderCollectionEditor();return}
});
function sanitizeOptionTargets(events,removedId){
  function scan(entries){entries.forEach(e=>{if(e.type==="choice")e.options.forEach(o=>{if(o.targetEventId===removedId)o.targetEventId="";scan(o.entries)})})}
  events.forEach(e=>scan(e.entries));
}

editorBody.addEventListener("input",handleEditorField);
editorBody.addEventListener("change",handleEditorField);
function handleEditorField(e){
  const t=e.target;
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
  const kind=t.dataset.condKind||t.dataset.affcondKind||t.dataset.emocondKind||t.dataset.fxKind||t.dataset.afffxKind||t.dataset.emofxKind;
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
    const fxr=t.closest("[data-fx-id]"),afr=t.closest("[data-afffx-id]"),emr=t.closest("[data-emofx-id]");
    if(fxr){
      const fx=owner.effects.find(x=>x.id===fxr.dataset.fxId);if(fx)fx[t.dataset.fxField]=t.value;return;
    }
    if(afr){
      const fx=owner.affectionEffects.find(x=>x.id===afr.dataset.afffxId);if(fx)fx[t.dataset.afffxField]=t.dataset.afffxField==="amount"?clamp(t.value,-100,100,0):t.value;return;
    }
    if(emr){
      const fx=owner.emotionEffects.find(x=>x.id===emr.dataset.emofxId);if(fx)fx[t.dataset.emofxField]=t.dataset.emofxField==="intensity"?clamp(t.value,0,100,0):t.value;return;
    }
  }
  if(t.dataset.gachaBind){
    const k=t.dataset.gachaBind;editorDraft.gacha[k]=t.type==="checkbox"?t.checked:(["balance","singleCost","tenCost"].includes(k)?Math.max(0,Number(t.value)||0):t.value);return;
  }
  if(t.dataset.rarity){editorDraft.gacha.rarityWeights[t.dataset.rarity]=Math.max(0,Number(t.value)||0);return}
  const tr=t.closest("[data-thought-id]");
  if(tr&&t.dataset.thoughtBind){
    const th=editorDraft.thoughts.find(x=>x.id===tr.dataset.thoughtId);if(!th)return;
    th[t.dataset.thoughtBind]=t.type==="checkbox"?t.checked:t.value;return;
  }
  const ir=t.closest("[data-item-id]");
  if(ir&&t.dataset.itemBind){
    const item=editorDraft.collection.find(x=>x.id===ir.dataset.itemId);if(!item)return;
    const k=t.dataset.itemBind;
    item[k]=t.type==="checkbox"?t.checked:(k==="weight"?Math.max(.01,Number(t.value)||1):t.value);return;
  }
}

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(modalRoot.innerHTML){closeModal();return}
    if(!editorOverlay.hidden){closeEditor();return}
  }
  if(currentPage==="room"&&editorOverlay.hidden&&modalRoot.innerHTML===""){
    if((e.key===" "||e.key==="Enter")&&!e.target.matches("input,textarea,select,button")){
      const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
      if(entry&&entry.type!=="choice"){e.preventDefault();advanceDialogue(false)}
    }
  }
});

renderStart();
})();