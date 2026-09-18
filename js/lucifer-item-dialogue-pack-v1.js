(()=>{
'use strict';
if(window.__HELLAVERSE_LUCIFER_ITEM_DIALOGUE_PACK_V1__)return;
window.__HELLAVERSE_LUCIFER_ITEM_DIALOGUE_PACK_V1__=1;
const K='hellaverse_dialogue_state_v1',PACK='lucifer-item-dialogue-v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-item-dialogue-pack',clearDirty:false}}));return true}catch(error){console.warn('Lucifer item dialogue pack could not be saved safely.',error);return false}};
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const split=v=>Array.isArray(v)?v.map(String).map(clean).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(clean).filter(Boolean);
const up=v=>clean(v).toUpperCase();
const hasChar=(s,id)=>!!(s.characters||[]).find(c=>c?.id===id&&!c.hidden);
const cname=(s,id)=>(s.characters||[]).find(c=>c?.id===id)?.name||id;
const itemText=i=>[i?.name,i?.title,i?.desc,i?.description,i?.condition,...(Array.isArray(i?.tags)?i.tags:split(i?.tags))].filter(Boolean).join(' ').toLowerCase();
const rare=v=>{let r=up(v||'COMMON');if(r==='MYSTIC')r='MISTIC';if(r==='LEGEND')r='LEGENDARY';return r};
const addToken=(v,id)=>[...new Set([...split(v),id])].join(', ');
const safeId=v=>clean(v).toLowerCase().normalize('NFKD').replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-|-$/g,'')||'item';
const putEvent=(s,e)=>{s.events=Array.isArray(s.events)?s.events:[];const i=s.events.findIndex(x=>x?.id===e.id);if(i>=0)s.events[i]={...s.events[i],...e};else s.events.push(e)};
const putScene=(s,sc)=>{s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};const i=s.dialogues.findIndex(x=>x?.id===sc.id);if(i>=0){sc.used=s.dialogues[i]?.used||false;s.dialogues[i]=sc}else s.dialogues.push(sc);s.dialogueFileMap[sc.id]='CONVERSATION'};

function fixCharlieRibbon(s){
 const items=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);
 for(const i of items){
  const text=clean((i.name||i.title||'')+' '+(i.desc||i.description||''));
  if(!/(찰리의 첫 리본|첫 리본|charlie.*first.*ribbon|first.*ribbon)/i.test(text))continue;
  i.characterId='charlie-morningstar';
  i.desc='찰리가 아주 어릴 때 처음으로 자기 물건이라고 아끼기 시작한 붉은 리본. 오래된 가족사진 속에서도 같은 리본을 볼 수 있다.';
  i.description=i.desc;
  i.revealLine='찰리가 리본을 두 손가락 사이에 걸어 보고는 조금 민망하게 웃는다. “이게 내가 처음 진짜 좋아했던 리본이야. 어릴 땐 매일 비슷하게 묶는 것도 엄청 중요한 일처럼 느껴졌거든.”';
  i.claimLine=i.revealLine;
  i.condition='찰리와 어린 시절·가족 이야기를 충분히 나눈 뒤 획득 가능';
  i.dialogueSourceCharacterId='charlie-morningstar';
  const id=String(i.id||'');if(!id)continue;
  for(const sc of s.dialogues||[])for(const n of sc.nodes||[])for(const ch of n.choices||[])if(ch?.unlockItemId===id&&sc.characterId!=='charlie-morningstar')ch.unlockItemId='';
  const flag='collection.charlie.'+safeId(id)+'.received';
  putEvent(s,{id:flag,name:'Charlie · '+(i.name||'어린 시절 리본')+' 획득',description:'찰리와 관련된 개인적인 물건을 찰리에게 직접 받았다.',type:'MILESTONE',characterId:'charlie-morningstar',namespace:'collection.charlie'});
  const scid='collection-charlie-first-ribbon-'+safeId(id);
  putScene(s,{id:scid,characterId:'charlie-morningstar',title:'찰리의 첫 리본 이야기',kind:'TALK',sceneRole:'CONVERSATION',repeatable:true,requiredAffection:35,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:'ambient100.charlie-morningstar.opened',blockedFlags:flag,requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:12,probability:35,opening:'찰리가 오래된 상자에서 붉은 리본을 하나 꺼낸다. 사진 속 어린 시절의 자신을 확인하듯 잠깐 바라본다.\n찰리는 낡은 리본을 펴다가 작게 웃는다. “이거 아직 있었네.”',openingType:'character',exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:[
   {id:scid+'-take',type:'speech',text:'소중한 거라면 내가 잘 보관할게.',playerLine:'',response:i.revealLine,affectionDelta:1,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:flag,removeFlags:'',addMemoryTitle:'Charlie의 어린 시절 리본',addMemorySummary:'찰리가 어린 시절 쓰던 리본을 직접 건넸다.',addMemoryTags:'charlie, family, childhood, collection',moodChange:'',unlockItemId:id,nextNodeId:'',endConversation:true},
   {id:scid+'-ask',type:'speech',text:'사진 속에서 자주 보이던 리본이 이거야?',playerLine:'',response:'찰리가 고개를 끄덕인다. “응. 지금 보면 그냥 리본인데, 그땐 이거 하나 제대로 묶는 것도 큰일이었거든.”',affectionDelta:0,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:'',unlockItemId:'',nextNodeId:'',endConversation:true}
  ]}],openingNodeId:'start',contentPack:PACK});
 }
 s.collectionItems=items;s.items=items;
}

function giverFor(s,i){
 const t=itemText(i);
 const candidates=[];
 const add=(id,score)=>{if(hasChar(s,id))candidates.push({id,score})};
 if(/오버로드.*회의|overlord.*meeting|overlord.*council|회의.*(장|패스|badge|카드)|angelic weapon|천사.*무기|steel|무기고|arms dealer/.test(t))add('carmilla-carmine',100);
 if(/호텔|hotel|찰리|charlie|딸|daughter|가족|family|어린|childhood|사진|photo/.test(t))add('charlie-morningstar',75);
 if(/보안|경비|security|대피|emergency|계획서/.test(t))add('vaggie',70);
 if(/라디오|radio|broadcast|방송|주파수|frequency/.test(t))add('alastor',72);
 if(/천국|heaven|angel|천사|날개|feather|halo|seraph/.test(t)){add('emily',68);add('sera',62)}
 if(/재판|court|sin|칠죄|왕좌|throne|법령|decree/.test(t))add('satan',60);
 if(/goetia|게티아|귀족|royal document|왕실 문서/.test(t))add('paimon',58);
 if(/오리|duck|피아노|piano|사과|apple|모자|hat|지팡이|cane|공방|workshop|발명|invention/.test(t))add('lucifer-morningstar',95);
 if(/lilith|릴리스|결혼|wedding/.test(t)){add('lucifer-morningstar',88);add('charlie-morningstar',70)}
 if(/alastor|알래스터/.test(t))add('alastor',78);
 if(!candidates.length)add('lucifer-morningstar',50);
 candidates.sort((a,b)=>b.score-a.score);return candidates[0]?.id||'lucifer-morningstar';
}
const GIVER={
 'lucifer-morningstar':{
  open:(i)=>'루시퍼가 '+(i.name||'물건')+'을 손에 들고 한동안 설명부터 늘어놓다가, 결국 당신 쪽으로 내민다.',
  good:'그게 네게 중요한 물건이라면 가볍게 다루지 않을게.',
  line:(i)=>clean(i.revealLine||i.claimLine)||'루시퍼가 괜히 아무렇지 않은 척 웃는다. “좋아, 네가 가지고 있어. 대신 잃어버리면 내가 엄청 과장되게 슬퍼할 거야.”',
  bad:'왜 나한테 주려는 건지부터 물어본다.',
  badline:'루시퍼가 손을 거두진 않지만 바로 넘기지도 않는다. “음… 그 질문부터 하는 것도 맞지. 이건 그냥 남는 물건이라 주는 건 아니야.”'
 },
 'carmilla-carmine':{
  open:(i)=>'카밀라가 보관 문서 사이에서 '+(i.name||'물건')+'을 꺼낸다. “이건 내 쪽에 남아 있을 이유가 없어졌어.”',
  good:'그럼 의미가 맞는 사람 쪽에 남겨둘게.',
  line:(i)=>'카밀라가 '+(i.name||'물건')+'을 건넨다. “이건 장식품이 아니라 기록이야. 누구 손에서 어떤 의미를 가졌는지 잊지 마.”',
  bad:'왜 직접 루시퍼에게 주지 않는지 묻는다.',
  badline:'카밀라가 눈썹을 아주 조금 올린다. “필요한 물건을 필요한 곳에 보내는 데 왕을 직접 호출할 이유는 없지.”'
 },
 'charlie-morningstar':{
  open:(i)=>'찰리가 '+(i.name||'물건')+'을 양손으로 들고 온다. “이건 아빠랑 관련된 거라서… 아무한테나 넘기고 싶진 않았어.”',
  good:'아빠와 관련된 기억이라면 잘 보관할게.',
  line:(i)=>'찰리가 안도한 듯 웃으며 '+(i.name||'물건')+'을 건넨다. “고마워. 물건 자체보다, 이걸 왜 남겨뒀는지까지 기억해주면 좋겠어.”',
  bad:'루시퍼에게 직접 돌려주는 게 낫지 않을까?',
  badline:'찰리가 잠깐 고민한다. “그럴 수도 있어. 근데 아빠는 가끔 중요한 걸 너무 빨리 서랍에 넣어버리거든.”'
 },
 'vaggie':{
  open:(i)=>'바기가 '+(i.name||'물건')+'을 확인하듯 한 번 뒤집어 본다. “상태는 멀쩡해. 보관할 거면 제대로 해.”',
  good:'필요할 때 찾을 수 있게 잘 정리해둘게.',
  line:(i)=>'바기가 물건을 넘긴다. “좋아. 어디 뒀는지 잊지만 마. 중요한 건 멋있게 보관하는 게 아니라 필요할 때 찾는 거야.”',
  bad:'굳이 내가 가지고 있어야 하는 이유를 묻는다.',
  badline:'“없어.” 바기가 단호하게 답한다. “다만 네가 맡겠다면 방치하진 않을 것 같아서.”'
 },
 'alastor':{
  open:(i)=>'알래스터가 '+(i.name||'물건')+'을 손끝으로 들어 보인다. “뜻밖의 유실물이 제 자리를 찾을 시간이군요.”',
  good:'원래 이야기도 함께 기억해둘게.',
  line:(i)=>'알래스터가 웃으며 물건을 건넨다. “훌륭합니다. 물건은 이야기가 붙어 있을 때 훨씬 오래 살아남는 법이지요.”',
  bad:'왜 당신이 이걸 가지고 있었는지 묻는다.',
  badline:'알래스터의 미소가 조금 더 커진다. “그 질문의 답이 물건보다 재미있을 수도 있겠군요. 오늘은 물건 쪽만 드리지요.”'
 },
 'emily':{
  open:(i)=>'에밀리가 '+(i.name||'물건')+'을 조심스럽게 들고 온다. “이걸 제가 계속 가지고 있는 것보다 이야기를 아는 사람이 보관하는 게 맞을 것 같아요.”',
  good:'누구에게서 왔는지도 잊지 않을게.',
  line:(i)=>'에밀리가 밝게 웃으며 건넨다. “고마워요. 오래된 물건이라고 오래된 의미로만 남아야 하는 건 아니잖아요.”',
  bad:'천국에 남겨두는 편이 안전하지 않을까?',
  badline:'에밀리가 잠깐 생각한다. “안전하다는 이유로 계속 숨기기만 하면 아무도 배우지 못할 수도 있어요.”'
 },
 'sera':{
  open:(i)=>'세라가 '+(i.name||'물건')+'을 확인한 뒤 조심스럽게 탁자에 내려놓는다. “이것은 보관 장소보다 맥락이 중요한 물건입니다.”',
  good:'기록의 맥락까지 함께 보관하겠다고 말한다.',
  line:(i)=>'세라가 천천히 고개를 끄덕인다. “그렇다면 맡기겠습니다. 과거를 보존하는 일과 과거의 판단을 반복하는 일은 다르니까요.”',
  bad:'왜 지금 이걸 넘기는지 묻는다.',
  badline:'“지금은 이전과 다른 증거가 있기 때문입니다.” 세라는 더 설명하지 않지만 물건을 치우지도 않는다.'
 },
 'satan':{
  open:(i)=>'사탄이 '+(i.name||'물건')+'을 손에 들고 짧게 말한다. “이거. 네가 맡아.”',
  good:'필요한 이유가 있다면 맡겠다고 한다.',
  line:(i)=>'사탄이 물건을 넘긴다. “좋아. 쓸데없이 신성시하진 마라. 대신 잃어버리진 말고.”',
  bad:'설명 없이 받기는 어렵다고 한다.',
  badline:'사탄이 낮게 한숨 쉰다. “설명까지 필요한 물건이었나. 좋아, 그럼 나중에 다시 와.”'
 },
 'paimon':{
  open:(i)=>'파이몬이 시종에게 시켜 '+(i.name||'물건')+'을 가져오게 한다. “이런 것은 적절한 손에 두는 것이 행정상 편하지.”',
  good:'가문의 기록이라면 함부로 다루지 않겠다고 한다.',
  line:(i)=>'파이몬이 만족스럽게 고개를 끄덕인다. “그래. 그 정도 분별은 있어 보이는군. 가지고 가거라.”',
  bad:'왜 직접 보관하지 않는지 묻는다.',
  badline:'“내가 모든 낡은 기록을 직접 들고 있어야 한단 말이냐?” 파이몬이 진심으로 이해하지 못한 표정을 짓는다.'
 }
};
function giverCfg(id){return GIVER[id]||GIVER['lucifer-morningstar']}
function rarityRule(r){
 r=rare(r);
 return r==='MISTIC'?{heart:90,p:2,gate:'personal'}:r==='LEGENDARY'?{heart:75,p:6,gate:'trust'}:r==='EPIC'?{heart:50,p:18,gate:'pattern'}:r==='RARE'?{heart:30,p:35,gate:'opened'}:r==='UNCOMMON'?{heart:15,p:60,gate:''}:{heart:0,p:85,gate:''};
}
function eventReq(giver,r){
 const rule=rarityRule(r),need=[];
 if(rule.gate)need.push('ambient100.lucifer-morningstar.'+rule.gate);
 if(rule.gate&&giver!=='lucifer-morningstar')need.push('ambient100.'+giver+'.'+rule.gate);
 return need.join(', ');
}
function ensureLuciferItemScenes(s){
 const items=(s.collectionItems||[]).filter(i=>i?.characterId==='lucifer-morningstar');
 s.collectionTransferConfig=s.collectionTransferConfig&&typeof s.collectionTransferConfig==='object'?s.collectionTransferConfig:{};
 s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
 for(const i of items){
  const id=String(i.id||'');if(!id)continue;
  const giver=giverFor(s,i),cfg=giverCfg(giver),rule=rarityRule(i.rarity),claim='collection.lucifer.'+safeId(id)+'.received';
  if((s.ownedItems||[]).includes(id))s.flags[claim]=true;
  putEvent(s,{id:claim,name:'Lucifer Collection · '+(i.name||id),description:cname(s,giver)+'의 대화에서 '+(i.name||'아이템')+'을 획득했다.',type:'MILESTONE',characterId:'lucifer-morningstar',namespace:'collection.lucifer'});
  i.dialogueSourceCharacterId=giver;
  const baseCondition=clean(i.condition||'');const dialogueCondition=cname(s,giver)+' 대화 · Heart '+rule.heart+'+ · 등장 확률 '+rule.p+'%';
  if(!baseCondition.includes(cname(s,giver)))i.condition=baseCondition?baseCondition+' / '+dialogueCondition:dialogueCondition;
  const old=s.collectionTransferConfig[id]||{};s.collectionTransferConfig[id]={...old,dialogueSourceCharacterId:giver,dialogueRequiredHeart:rule.heart,dialogueProbability:rule.p,dialogueRequiredEvent:eventReq(giver,i.rarity)};
  const scid='lucifer-item-'+safeId(id),goodLine=cfg.line(i),badLine=cfg.badline;
  putScene(s,{id:scid,characterId:giver,title:(i.name||'컬렉션 아이템')+' · 보관을 맡기다',kind:'TALK',sceneRole:'CONVERSATION',repeatable:true,requiredAffection:rule.heart,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:eventReq(giver,i.rarity),blockedFlags:claim,requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:rule.p<=6?30:rule.p<=18?18:12,probability:rule.p,opening:cfg.open(i),openingType:'character',exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:[
    {id:scid+'-accept',type:'speech',text:cfg.good,playerLine:'',response:goodLine,affectionDelta:1,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:claim,removeFlags:'',addMemoryTitle:i.name||'Collection Item',addMemorySummary:cname(s,giver)+'에게서 '+(i.name||'아이템')+'을 건네받았다.',addMemoryTags:'collection, lucifer, '+giver,moodChange:'',unlockItemId:id,nextNodeId:'',endConversation:true},
    {id:scid+'-wait',type:'speech',text:cfg.bad,playerLine:'',response:badLine,affectionDelta:rule.p<=6?-1:0,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:'',unlockItemId:'',nextNodeId:'',endConversation:true}
  ]}],openingNodeId:'start',contentPack:PACK,canonGrounding:'relationship-aware fanmade acquisition scene'});
 }
 s.items=s.collectionItems;
}
const s=read();s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);fixCharlieRibbon(s);ensureLuciferItemScenes(s);write(s);
window.__HV_LUCIFER_ITEM_DIALOGUE_PACK_INFO__={owner:'lucifer-morningstar',crossCharacter:true,rareGates:true};
})();