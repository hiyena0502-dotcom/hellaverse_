(()=>{
const STATE_KEY='hellaverse_dialogue_state_v1';
const KEY='hellaverse_lucifer_pilot_owner_version';
const VERSION=4;
const CID='lucifer-morningstar';
let current=0;try{current=Number(localStorage.getItem(KEY)||0)||0}catch{}
if(current>=VERSION)return;

const split=v=>Array.isArray(v)?[...new Set(v.map(String).map(x=>x.trim()).filter(Boolean))]:[...new Set(String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean))];
const join=(a,b)=>[...new Set([...split(a),...split(b)])].join(', ');
const removeToken=(v,token)=>split(v).filter(x=>x!==token).join(', ');
const upper=v=>String(v||'').trim().toUpperCase();
let state={};try{state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{state={}}
state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
state.events=Array.isArray(state.events)?state.events:[];
state.memories=Array.isArray(state.memories)?state.memories:[];
state.lorebook=Array.isArray(state.lorebook)?state.lorebook:[];
state.affection=state.affection&&typeof state.affection==='object'?state.affection:{};
state.moods=state.moods&&typeof state.moods==='object'?state.moods:{};
state.dialogueMeta=state.dialogueMeta&&typeof state.dialogueMeta==='object'?state.dialogueMeta:{};

const generic=[[0,9,'STRANGER','아직 거의 모르는 관계'],[10,19,'DISTANT','조금 익숙해졌지만 아직 거리가 있는 관계'],[20,29,'ACQUAINTANCE','서로 어느 정도 알고 있는 관계'],[30,39,'FAMILIAR','상대에게 제법 익숙해진 관계'],[40,49,'COMFORTABLE','함께 있어도 어색하지 않은 관계'],[50,59,'FRIENDLY','상대에게 호의적인 관계'],[60,69,'CLOSE','가까운 관계'],[70,79,'TRUSTED','서로 신뢰하기 시작한 관계'],[80,89,'BONDED','깊은 유대가 생긴 관계'],[90,99,'DEVOTED','매우 특별하고 깊은 관계'],[100,100,'SPECIAL','최고 단계의 특별한 관계']];
const oldLuciferDescriptions=[
'화려한 농담과 과장된 태도로 거리를 둔다. 개인적인 질문에는 쉽게 선을 긋는다.',
'얼굴은 익혔지만 아직 손님 취급이다. 가벼운 농담과 일상 이야기 정도만 허용한다.',
'고무 오리나 호텔처럼 안전한 취향과 일상 이야기를 조금씩 꺼낸다.',
'찰리와 호텔에 대한 솔직한 감정이 드문드문 섞이기 시작한다.',
'가족과 후회 같은 불편한 주제도 무조건 농담으로 피하지는 않는다.',
'자신의 실패와 아버지 역할에 대한 자책을 조금씩 인정한다.',
'천국과 추락 이후의 과거를 제한적으로 이야기하기 시작한다.',
'상처와 두려움을 숨기기보다 조심스럽게 보여주며, 당신의 반응을 신경 쓴다.',
'말하지 않던 기억과 죄책감을 자발적으로 꺼내기도 한다.',
'당신이 찾아오는 일을 당연하게 기다리며, 곁에 있다는 사실에서 안도감을 느낀다.',
'가장 취약한 감정까지 숨기지 않고 이 관계를 특별한 것으로 인정한다.'
];
const luciferStages=[
[0,9,'STRANGER','낯선 손님에게도 기본적으로 화려하고 장난스럽다. 세상을 완전히 포기한 사람은 아니며, 찰리의 꿈을 비웃기보다 옆에서 지켜보고 도우려 한다. 다만 가족과 오래된 과거에 대한 무례한 접근에는 바로 선을 긋는다.'],
[10,19,'DISTANT','얼굴을 익힌 손님으로 대한다. 호텔의 소동을 투덜거리면서도 찰리가 만든 공간이라는 이유로 자연스럽게 신경 쓰고, 가벼운 취향과 일상 이야기를 편하게 나눈다.'],
[20,29,'ACQUAINTANCE','고무 오리, 호텔, 일상 같은 사소한 이야기를 먼저 꺼내기도 한다. 찰리의 계획에 대해 농담은 해도 깎아내리지 않으며 실질적으로 도울 방법을 고민한다.'],
[30,39,'FAMILIAR','찰리를 자랑스러워하는 마음과 걱정을 조금 더 솔직하게 말한다. 찰리의 이상에서 예전의 자신을 떠올릴 때가 있어 조심스러워질 뿐, 그 꿈 자체를 싫어하는 것은 아니다.'],
[40,49,'COMFORTABLE','가족과 자신의 실수에 관한 질문에도 무조건 피하지 않는다. 장난스러운 태도 뒤에 남아 있는 낙관과 책임감을 보여주기 시작한다.'],
[50,59,'FRIENDLY','실패를 겪었어도 가능성 자체를 버리지는 않았다는 태도가 분명해진다. 찰리의 꿈을 돕는 이유와 아버지로서 다시 곁에 있고 싶은 마음을 인정한다.'],
[60,69,'CLOSE','천국과 추락, 과거의 이상을 제한적으로 이야기한다. 예전의 자신을 찰리에게서 보는 것이 때로 두렵지만 그 때문에 오히려 찰리를 혼자 두고 싶지 않다고 말한다.'],
[70,79,'TRUSTED','상처와 실패를 숨기기보다 조심스럽게 보여준다. 당신이 가족을 존중하고 선을 지켜준다는 믿음이 생겨 더 복잡한 이야기도 허용한다.'],
[80,89,'BONDED','외로움, 죄책감, 가족에 대한 두려움까지 자발적으로 꺼낸다. 여전히 농담을 하지만 중요한 순간에는 농담 뒤로 숨지 않는다.'],
[90,99,'DEVOTED','당신의 방문과 의견을 기대하며, 찰리와 호텔을 돕는 현재의 삶에 당신도 자연스럽게 포함시킨다. 불편한 진실도 숨기지 않고 함께 생각하려 한다.'],
[100,100,'SPECIAL','가장 취약한 감정과 오래된 꿈까지 숨기지 않는다. 낙관을 순진함이 아니라 다시 선택하는 용기로 받아들이며, 당신과 가족을 자신의 현재에 분명히 포함시킨다.']
];
const old=state.affection[CID]||{},table=Array.isArray(old.stageTable)?old.stageTable:[];
const looksGeneric=!table.length||(table.length===generic.length&&generic.every((g,i)=>{const r=table[i]||{};return Number(r.min)===g[0]&&Number(r.max)===g[1]&&String(r.name||'')===g[2]&&(!String(r.description||'').trim()||String(r.description||'')===g[3])}));
const looksManaged=table.length===11&&table.every((r,i)=>String(r.name||'')===luciferStages[i][2]&&(!String(r.description||'').trim()||String(r.description||'')===oldLuciferDescriptions[i]));
if(looksGeneric||looksManaged)state.affection[CID]={...old,value:Math.max(0,Math.min(100,Number(old.value||0))),stageTable:luciferStages.map(([min,max,name,description])=>({min,max,name,description})),stages:luciferStages.map(x=>`${x[0]}-${x[1]}: ${x[2]}`)};
if(!state.moods[CID])state.moods[CID]='NORMAL';

const EVENT_ID_MIGRATION={
'lucifer_duck_hobby_shared':'lucifer.duck_hobby_shared',
'lucifer_charlie_concern_shared':'lucifer.charlie_concern_shared',
'lucifer_fatherhood_regret_shared':'lucifer.fatherhood_regret_shared',
'lucifer_heaven_topic_opened':'lucifer.heaven_topic_opened',
'lucifer_deep_trust_reached':'lucifer.deep_trust_reached',
'lucifer_player_offended_him':'lucifer.player_offended_him'
};
function replaceListValue(v){const out=split(v).map(x=>EVENT_ID_MIGRATION[x]||x);return Array.isArray(v)?out:out.join(', ')}
function migrateEventIds(){
 for(const scene of state.dialogues){for(const f of ['requiredFlags','blockedFlags'])if(scene[f])scene[f]=replaceListValue(scene[f]);for(const node of scene.nodes||[])for(const c of node.choices||[])for(const f of ['requiredFlags','blockedFlags','setFlags','removeFlags'])if(c[f])c[f]=replaceListValue(c[f])}
 for(const gift of state.gifts||[])for(const f of ['requiredFlags','blockedFlags','setFlags','removeFlags','choiceASetFlags','choiceARemoveFlags','choiceBSetFlags','choiceBRemoveFlags'])if(gift[f])gift[f]=replaceListValue(gift[f]);
 for(const thought of state.thoughts||[])for(const f of ['requiredFlags','blockedFlags','setFlags','removeFlags'])if(thought[f])thought[f]=replaceListValue(thought[f]);
 for(const [oldId,newId] of Object.entries(EVENT_ID_MIGRATION)){if(state.flags?.[oldId]){state.flags=state.flags||{};state.flags[newId]=true;delete state.flags[oldId]}for(const src of ['events','eventCatalog'])if(Array.isArray(state[src]))for(const e of state[src])if(e?.id===oldId)e.id=newId}
}
migrateEventIds();

const eventDefs=[
['lucifer.duck_hobby_shared','오리 취미를 보여줌','루시퍼가 고무 오리를 만드는 일이 단순한 장난 이상의 휴식이라는 점을 플레이어에게 드러냈다.','MILESTONE'],
['lucifer.charlie_concern_shared','찰리에 대한 걱정을 털어놓음','루시퍼가 찰리를 자랑스러워하면서도 상처받을까 두려워한다는 마음을 솔직하게 말했다.','MILESTONE'],
['lucifer.fatherhood_regret_shared','아버지로서의 후회를 인정함','루시퍼가 찰리에게서 멀어졌던 시간을 후회하고 더 나은 아버지가 되려 한다고 인정했다.','MILESTONE'],
['lucifer.heaven_topic_opened','천국 이야기를 허락함','루시퍼가 천국과 추락 이전의 기억을 완전히 피하지 않고 조금씩 이야기하기로 했다.','MILESTONE'],
['lucifer.deep_trust_reached','깊은 신뢰를 드러냄','루시퍼가 플레이어의 방문과 존재 자체를 편안함과 연결하기 시작했다.','MILESTONE'],
['lucifer.player_offended_him','플레이어의 말에 기분이 상함','대화 중 무례하거나 가족을 깎아내리는 말을 들어 루시퍼가 현재 언짢아진 상태다.','TEMPORARY'],
['lucifer.charlie_dream_supported','찰리의 꿈을 지지한다고 밝힘','루시퍼가 찰리의 구원 계획을 비웃는 것이 아니라 성공할 수 있도록 돕고 싶다고 분명히 말했다.','MILESTONE'],
['lucifer.optimism_shared','남아 있는 낙관을 드러냄','실패를 겪었어도 가능성 자체를 완전히 포기하지는 않았다는 태도를 플레이어에게 보였다.','MILESTONE'],
['lucifer.alastor_annoyance_shared','알래스터에 대한 불편함을 드러냄','루시퍼가 알래스터의 태도와 찰리 주변에서 구는 방식을 상당히 못마땅해한다고 드러냈다.','MILESTONE'],
['lucifer.hotel_support_committed','호텔을 돕겠다는 의지를 밝힘','찰리의 꿈이 현실이 되도록 자신이 할 수 있는 일을 하겠다는 태도를 분명히 했다.','MILESTONE'],
['lucifer.family_boundary_shared','가족에 대한 선을 분명히 함','자신은 놀려도 괜찮지만 가족을 깎아내리는 무례함은 참기 어렵다고 말했다.','MILESTONE'],
['lucifer.player_impression_shared','플레이어에 대한 인상을 말함','루시퍼가 현재 관계에서 플레이어를 어떻게 보고 있는지 직접 말했다.','MILESTONE']
];
for(const [id,name,description,type] of eventDefs){const i=state.events.findIndex(e=>e?.id===id);const next={...(i>=0?state.events[i]:{}),id,name,description,type,characterId:CID,namespace:'lucifer'};if(i>=0)state.events[i]=next;else state.events.push(next)}

const baselineMemory={id:'lucifer-memory-first-impression',characterId:CID,type:'observation',title:'루시퍼에 대한 첫인상',summary:'말투는 화려하고 장난이 많다. 완전히 냉소적인 사람은 아니며 찰리와 호텔의 가능성을 돕고 싶어 한다. 다만 가족을 비하하거나 무례하게 선을 넘는 태도에는 즉각 예민해진다.',tags:['lucifer','first-impression','observation'],sourceType:'baseline',sourceId:CID,importance:'normal',createdAt:'2026-09-14T00:00:00.000Z',pinned:false,hidden:false};
const bmi=state.memories.findIndex(m=>m?.id===baselineMemory.id);if(bmi>=0&&state.memories[bmi]?.sourceType==='baseline')state.memories[bmi]=baselineMemory;else if(bmi<0)state.memories.push(baselineMemory);
const lore=[
{id:'lucifer-lore-king-of-hell',title:'LUCIFER MORNINGSTAR',category:'CHARACTER',keywords:['lucifer','king of hell','morningstar','optimism'],content:'지옥의 왕. 화려하고 장난스러우며 자존심도 강하지만 본질적으로 가능성을 아주 쉽게 포기하는 타입은 아니다. 오래된 실패 때문에 조심스러워졌을 뿐, 여전히 좋은 결과를 바라며 다시 손을 내밀 수 있다.',relatedCharacters:[CID],enabled:true,priority:10},
{id:'lucifer-lore-ducks',title:'고무 오리 작업대',category:'HABIT',keywords:['duck','hobby','workbench'],content:'작은 고무 오리와 장난감 같은 물건을 만드는 데 몰두할 때가 있다. 거창한 실패와 책임에서 잠시 벗어나 작은 결과를 직접 고칠 수 있다는 점이 그에게 휴식이 된다.',relatedCharacters:[CID],enabled:true,priority:5},
{id:'lucifer-lore-charlie',title:'찰리와의 관계',category:'RELATIONSHIP',keywords:['charlie','family','fatherhood','dream'],content:'찰리를 깊이 사랑하고 자랑스러워한다. 찰리의 구원이라는 꿈을 비웃거나 무시할 의도는 없으며, 지금은 오히려 그 꿈이 현실이 되도록 돕고 싶어 한다. 다만 찰리의 이상에서 추락 이전의 자신을 떠올릴 때가 있어, 같은 상처를 겪을까 두려워 조심스러워질 수 있다.',relatedCharacters:[CID,'charlie-morningstar'],enabled:true,priority:10},
{id:'lucifer-lore-heaven',title:'천국과 추락의 기억',category:'PAST',keywords:['heaven','fall','past'],content:'천국은 루시퍼에게 단순한 적대 대상이 아니라 과거의 이상과 실패, 상실이 겹쳐 있는 장소다. 모두를 똑같이 미워한다기보다 자신이 겪은 체계와 판단에 상처가 깊다.',relatedCharacters:[CID],enabled:true,priority:9},
{id:'lucifer-lore-hotel',title:'호텔에서의 현재',category:'PRESENT',keywords:['hotel','charlie','present','support'],content:'호텔의 소란과 허술한 운영에는 투덜거리지만 찰리의 꿈 자체를 깎아내리지 않는다. 약속한 대로 돕고 싶어 하며, 필요하면 자신의 지식과 권한을 쓰려 한다. 걱정이 많아지는 이유는 실패를 바라서가 아니라 찰리가 다칠까 두렵기 때문이다.',relatedCharacters:[CID,'charlie-morningstar'],enabled:true,priority:9},
{id:'lucifer-lore-alastor',title:'알래스터에 대한 태도',category:'RELATIONSHIP',keywords:['alastor','rivalry','hotel'],content:'알래스터의 과하게 여유로운 태도와 찰리 주변에서 영향력을 행사하는 방식을 특히 못마땅해한다. 단순한 질투만이 아니라 가족 주변에서 속내를 읽기 어려운 사람이 주도권을 쥐는 상황 자체를 싫어한다.',relatedCharacters:[CID,'alastor'],enabled:true,priority:8},
{id:'lucifer-lore-boundary',title:'루시퍼가 싫어하는 선 넘기',category:'PERSONALITY',keywords:['family','rude','boundary'],content:'자신을 향한 가벼운 놀림은 과장되게 받아칠 수 있지만, 찰리나 가족을 깎아내리거나 약점을 이용해 모욕하는 태도에는 훨씬 진지하게 화낸다. 예의 없는 압박과 가족을 비하하는 말은 관계를 크게 깎을 수 있다.',relatedCharacters:[CID],enabled:true,priority:8}
];
for(const x of lore){const i=state.lorebook.findIndex(l=>l?.id===x.id);if(i>=0)state.lorebook[i]={...state.lorebook[i],...x};else state.lorebook.push(x)}

function choice(id,text,response,delta=0,nextNodeId='',opts={}){return{id,type:opts.type==='action'?'action':'speech',text,playerLine:text,response,affectionDelta:Number(delta||0),requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:opts.setFlags||'',removeFlags:opts.removeFlags||'',addMemoryTitle:opts.addMemoryTitle||'',addMemorySummary:opts.addMemorySummary||'',addMemoryTags:opts.addMemoryTags||'',moodChange:opts.moodChange||'',unlockItemId:'',nextNodeId,endConversation:!nextNodeId}}
function upsertDialogue(scene){const i=state.dialogues.findIndex(s=>s?.id===scene.id);if(i>=0)state.dialogues[i]={...state.dialogues[i],...scene};else state.dialogues.push(scene)}
function askChoice(id,text,response,delta=0,opts={}){return choice(id,text,response,delta,'',{moodChange:opts.moodChange||'',setFlags:opts.setFlags||'',removeFlags:opts.removeFlags||'',type:opts.type||'speech'})}
function askScene({id,title,min=0,max=100,narration,reaction,choices,topics=[],type='CASUAL'}){return{id,characterId:CID,title,kind:'ASK',repeatable:true,requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:0,probability:100,opening:narration,openingType:'narration',sceneRole:'ASK',conversationType:type,topics,followUpTopics:topics,exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:reaction,choices:choices.map((c,i)=>askChoice(`${id}-c${i+1}`,c.text,c.response,c.delta||0,c))}],openingNodeId:'start'}}
function talkScene({id,title,opening,reaction,choices,requiredFlags='',topics=[],type='CASUAL',min=0,max=100,priority=10}){return{id,characterId:CID,title,kind:'TALK',repeatable:false,requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',requiredFlags,blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'narration',sceneRole:'CONVERSATION',conversationType:type,topics,followUpTopics:topics,exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:reaction,choices:choices.map((c,i)=>choice(`${id}-c${i+1}`,c.text,c.response,c.delta||0,'',{moodChange:c.moodChange||'',setFlags:c.setFlags||'',removeFlags:c.removeFlags||'',type:c.type||'speech'}))}],openingNodeId:'start',_authoredAffection:true}}

function repairScene(){return{id:'lucifer-v1-annoyed-repair',characterId:CID,title:'조금 언짢아진 뒤',kind:'TALK',repeatable:true,requiredAffection:0,maxAffection:100,requiredStage:'',requiredMood:'ANNOYED',requiredFlags:'lucifer.player_offended_him',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:60,probability:100,opening:'루시퍼는 아까보다 눈에 띄게 말수가 줄어 있다. 농담도 잠시 사라졌다. "그래서, 계속 얘기할 건가?"',openingType:'character',sceneRole:'CONVERSATION',conversationType:'CASUAL',topics:['repair','mood'],followUpTopics:['daily','hotel'],exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:[choice('luc-repair-c1','아까 말은 미안해요.','...좋아. 사과는 받을게. 사람 신경을 긁는 재주는 다음엔 조금만 덜 발휘해줘.',0,'',{moodChange:'NORMAL',removeFlags:'lucifer.player_offended_him'}),choice('luc-repair-c2','다른 얘기 해요.','그래. 지금은 그게 낫겠네.',0,'',{moodChange:'NORMAL',removeFlags:'lucifer.player_offended_him'}),choice('luc-repair-c3','그 정도로 화낼 일이에요?','가족까지 건드려놓고 그 질문이면... 응. 아직 화날 일이네.',-1,'',{moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'})]}],openingNodeId:'start',_authoredAffection:true}}
upsertDialogue(repairScene());

const asks=[
askScene({id:'lucifer-ask-food',title:'좋아하는 음식 있어요?',narration:'가벼운 취향 질문이 나오자 루시퍼는 뜻밖에도 진지하게 고민하는 척 턱을 괸다.',reaction:'"좋아하는 음식? 왕에게 이렇게 평범한 질문을 할 줄은 몰랐네. ...애플파이는 꽤 훌륭하지."',topics:['daily','food'],choices:[
{text:'의외로 평범하네요.',response:'"평범해서 좋은 것도 있어. 모든 걸 불태워 장식할 필요는 없지."',delta:0},{text:'직접 만들기도 해요?',response:'"할 수는 있어. 하고 싶을 때만. 그 차이가 중요해."',delta:1},{text:'나중에 같이 먹어요.',response:'그가 눈을 한 번 깜빡인다. "...좋아. 그 정도 계획은 꽤 마음에 드네."',delta:1}
]}),
askScene({id:'lucifer-ask-ducks',title:'고무오리는 왜 좋아해요?',narration:'당신의 시선이 작업대 위 오리들에게 향하자 루시퍼는 괜히 하나를 똑바로 세운다.',reaction:'"작아서 좋아. 망치면 다시 만들면 되고, 잘되면 귀엽고. 생각을 정리하기에도 꽤 괜찮아."',topics:['duck','hobby'],choices:[
{text:'생각보다 진지한 취미네요.',response:'"생각보다라는 말은 빼면 완벽한 칭찬이군."',delta:1},{text:'저도 하나 만들어봐도 돼요?',response:'"도구를 함부로 안 만진다는 조건이면. 그리고 내 것보다 잘 만들면 안 돼."',delta:1},{text:'하나 선물해줄래요?',response:'그가 오리를 내려다본다. "완성도 검사를 통과한 게 생기면 생각해보지."',delta:1}
]}),
askScene({id:'lucifer-ask-king-work',title:'지옥의 왕이면 평소엔 무슨 일 해요?',narration:'업무 이야기를 꺼내자 루시퍼는 아주 미묘하게 시선을 피한다.',reaction:'"아주 중요하고, 아주 지루하고, 놀라울 정도로 끝이 없는 일들. 왕관에는 서류가 따라오더라고."',topics:['daily','work','hell'],choices:[
{text:'일하기 싫어하는 얼굴인데요.',response:'"정확해. 관찰력 점수는 주지."',delta:0},{text:'그래도 요즘은 하려고 하죠?',response:'그가 작게 어깨를 으쓱한다. "해야 할 이유가 다시 생겼으니까."',delta:1},{text:'도와줄 일 있으면 말해요.',response:'"새 손님에게 지옥 행정을 맡길 정도로 망가지진 않았어. 그래도 말은 고맙네."',delta:1}
]}),
askScene({id:'lucifer-ask-hat',title:'그 모자는 왜 항상 쓰고 있어요?',narration:'모자 챙을 가리키자 루시퍼는 기다렸다는 듯 자세를 바로잡는다.',reaction:'"왜냐하면 잘 어울리니까. 이보다 완벽한 논리가 필요한가?"',topics:['appearance','hat'],choices:[
{text:'확실히 눈에 띄긴 해요.',response:'"눈에 띄는 건 절반의 성공이지."',delta:0},{text:'안 쓴 모습도 궁금해요.',response:'"호기심이 많네. 언젠가 우연히 보게 될지도 모르지."',delta:1},{text:'조금 과한 것 같기도 해요.',response:'그가 상처받은 척 가슴에 손을 얹는다. "조금? 그 정도면 칭찬이야."',delta:0}
]}),
askScene({id:'lucifer-ask-hell-like',title:'지옥에서 좋아하는 것도 있어요?',narration:'당연히 불평부터 나올 거라 생각했는지, 루시퍼는 질문을 듣고 오히려 웃는다.',reaction:'"물론 있지. 음악도 있고, 기막히게 웃긴 인간들도 있고, 찰리도 있고. 지옥이라고 전부 최악일 필요는 없어."',topics:['hell','daily','optimism'],choices:[
{text:'생각보다 좋아하는 게 많네요.',response:'"내가 그렇게 비관적으로 보여? 상처인데."',delta:1},{text:'찰리를 제일 먼저 말할 줄 알았어요.',response:'"순서는 중요하지 않아. ...그래도 당연히 가장 중요하지."',delta:1},{text:'호텔도 포함이에요?',response:'"요즘은... 목록 어딘가엔 들어가."',delta:1}
]}),

askScene({id:'lucifer-ask-charlie-dream-low',title:'찰리의 꿈을 어떻게 생각해요?',min:0,max:39,narration:'찰리의 꿈이라는 말에 루시퍼는 비웃지 않는다. 오히려 한 박자 늦게 미소가 사라진다.',reaction:'"무모해 보일 수는 있어. 하지만 무모하다는 것과 가치 없다는 건 전혀 다른 말이야. 난 그 애가 해낼 수 있게 돕고 싶어."',topics:['charlie','dream','hotel','support'],type:'RELATIONSHIP',choices:[
{text:'진짜 성공했으면 좋겠어요.',response:'"그래. 나도. 그 애가 증명할 기회는 받아야지."',delta:1,setFlags:'lucifer.charlie_dream_supported'},
{text:'당신도 예전에 비슷했어요?',response:'그의 표정이 잠깐 멀어진다. "...조금. 그래서 더 겁나는 것도 있고."',delta:1,setFlags:'lucifer.charlie_dream_supported'},
{text:'솔직히 찰리는 너무 순진한 것 같아요.',response:'루시퍼의 표정이 바로 굳는다. "희망을 놓지 않는 걸 순진함 하나로 줄이지 마."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.charlie_dream_supported, lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-charlie-dream-high',title:'찰리의 꿈을 어떻게 생각해요?',min:40,max:100,narration:'찰리의 꿈을 묻자 루시퍼는 이번에는 망설이지 않고 대답한다.',reaction:'"난 그 꿈을 믿고 싶어. 아니, 믿는 쪽을 다시 선택하고 있다고 해야 맞겠지. 예전의 내가 보여서 무서울 때도 있지만, 그래서 혼자 두고 싶진 않아."',topics:['charlie','dream','hotel','support'],type:'RELATIONSHIP',choices:[
{text:'같이 도우면 되죠.',response:'그가 웃는다. "그래. 이번엔 그 단순한 답을 놓치지 않으려고."',delta:2,setFlags:'lucifer.charlie_dream_supported'},
{text:'찰리도 당신이 옆에 있는 걸 좋아할 거예요.',response:'"...그랬으면 좋겠네. 요즘은 조금 믿고 있어."',delta:2,setFlags:'lucifer.charlie_dream_supported'},
{text:'실패해도 다시 해보면 되고요.',response:'그가 아주 작게 고개를 끄덕인다. "그 말, 예전의 나한테도 들려주고 싶군."',delta:1,setFlags:'lucifer.charlie_dream_supported'}
]}),

askScene({id:'lucifer-ask-hotel-success-low',title:'호텔이 정말 성공할 것 같아요?',min:0,max:39,narration:'질문이 나오자 루시퍼는 호텔 천장을 한번 올려다본다. 대답은 장난보다 진지하다.',reaction:'"가능성은 있어. 쉽다는 뜻은 아니지만. 적어도 난 성공하지 못할 이유만 찾으러 여기 온 건 아니야."',topics:['hotel','dream','support'],type:'RELATIONSHIP',choices:[
{text:'그럼 도와줄 거죠?',response:'"그러려고 여기 있지. 방식은... 조율이 좀 필요하겠지만."',delta:1,setFlags:'lucifer.hotel_support_committed'},
{text:'천국 정보도 도움이 될 것 같아요.',response:'그가 잠깐 조용해진다. "그 부분은 내가 더 잘해야겠네."',delta:1,setFlags:'lucifer.hotel_support_committed'},
{text:'결국 안 될 것 같다는 뜻이네요.',response:'"아니. 어렵다는 말과 안 된다는 말은 다르지."',delta:-1,setFlags:'lucifer.hotel_support_committed'}
]}),
askScene({id:'lucifer-ask-hotel-success-high',title:'호텔이 정말 성공할 것 같아요?',min:40,max:100,narration:'이번에는 호텔의 성공 가능성을 묻는 말이 루시퍼를 방어적으로 만들지 않는다.',reaction:'"응. 가능하다고 생각해. 확신이 흔들릴 때가 있어도 그건 찰리를 못 믿어서가 아니라, 내가 실패가 얼마나 아픈지 알아서 그래."',topics:['hotel','dream','support'],type:'RELATIONSHIP',choices:[
{text:'그럼 같이 방법을 찾아봐요.',response:'"좋아. 그 말은 꽤 실용적이라 마음에 드네."',delta:2,setFlags:'lucifer.hotel_support_committed'},
{text:'찰리가 혼자가 아니라는 게 중요하죠.',response:'그가 천천히 웃는다. "그래. 그게 이번엔 가장 중요해."',delta:2,setFlags:'lucifer.hotel_support_committed'},
{text:'불안해도 믿을 수는 있네요.',response:'"정확해. 낙관은 두려움이 없는 상태가 아니더라고."',delta:1,setFlags:'lucifer.hotel_support_committed'}
]}),

askScene({id:'lucifer-ask-optimism-low',title:'당신도 낙관적인 편이에요?',min:0,max:49,narration:'낙관적이냐는 질문에 루시퍼는 잠깐 웃더니 손가락으로 책상을 두드린다.',reaction:'"놀랍겠지만, 꽤 그래. 한 번 크게 넘어졌다고 모든 가능성을 평생 미워할 필요는 없잖아."',topics:['optimism','past','personality'],type:'PERSONAL',choices:[
{text:'그렇게 안 보여서 의외예요.',response:'"상처가 많다고 희망이 자동으로 삭제되는 건 아니거든."',delta:1,setFlags:'lucifer.optimism_shared'},
{text:'그래서 찰리를 도와주는 거예요?',response:'"그것도 이유 중 하나지. 그 애가 혼자 가능성을 붙잡게 두고 싶지 않아."',delta:1,setFlags:'lucifer.optimism_shared'},
{text:'그럼 실패도 별로 안 무섭겠네요.',response:'그가 짧게 웃는다. "그건 전혀 다른 문제야. 무서워도 다시 하는 거지."',delta:0,setFlags:'lucifer.optimism_shared'}
]}),
askScene({id:'lucifer-ask-optimism-high',title:'당신도 낙관적인 편이에요?',min:50,max:100,narration:'당신이 그의 낙관을 직접 묻자 루시퍼는 장난으로 넘기지 않는다.',reaction:'"예전만큼 맹목적이진 않겠지. 그래도 가능성을 보고 손을 뻗는 쪽이 아직 내 쪽이야. 찰리를 보면 그걸 더 분명히 알겠더군."',topics:['optimism','past','personality'],type:'PERSONAL',choices:[
{text:'그 낙관을 잃지 않아서 다행이에요.',response:'"...나도 요즘은 그렇게 생각해."',delta:2,setFlags:'lucifer.optimism_shared'},
{text:'예전의 당신이 찰리한테 보여요?',response:'그가 천천히 고개를 끄덕인다. "많이. 그래서 자랑스럽고, 동시에 겁나."',delta:2,setFlags:'lucifer.optimism_shared'},
{text:'이번엔 결과가 다를 수도 있잖아요.',response:'"그래. 그 가능성을 믿어보는 중이야."',delta:2,setFlags:'lucifer.optimism_shared'}
]}),

askScene({id:'lucifer-ask-alastor-low',title:'알래스터를 왜 그렇게 싫어해요?',min:0,max:39,narration:'알래스터라는 이름이 나오자 루시퍼의 입꼬리가 아주 인위적으로 올라간다.',reaction:'"싫어한다니. 난 그 사슴의 지나치게 친근한 미소와 지나치게 큰 라디오와 지나치게 찰리 주변을 어슬렁거리는 습관이 조금 거슬릴 뿐이야."',topics:['alastor','rivalry','family'],type:'PERSONAL',choices:[
{text:'그건 거의 싫어한다는 뜻인데요.',response:'"단어 선택은 자유지만 난 품위 있게 표현한 거야."',delta:1,setFlags:'lucifer.alastor_annoyance_shared'},
{text:'찰리 옆에 있는 게 신경 쓰이는 거죠?',response:'"속내를 못 읽는 놈이 내 딸 주변에서 주도권 잡는 걸 좋아할 아버지가 어디 있어."',delta:1,setFlags:'lucifer.alastor_annoyance_shared'},
{text:'알래스터가 더 믿음직할 때도 있던데요.',response:'루시퍼가 정색한다. "...그 비교는 굳이 내 앞에서 해야 했나?"',delta:-1,moodChange:'ANNOYED',setFlags:'lucifer.alastor_annoyance_shared, lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-alastor-high',title:'알래스터를 왜 그렇게 싫어해요?',min:40,max:100,narration:'이제는 알래스터 이야기가 나오면 루시퍼가 과장된 질색부터 하지 않고 이유를 먼저 말한다.',reaction:'"그 녀석이 나한테 예의 없게 구는 건 참을 수 있어. 문제는 찰리 주변에서 속내를 숨긴 채 너무 많은 영향력을 쥐려는 태도야. 그리고... 그래, 개인적으로도 짜증나."',topics:['alastor','rivalry','family'],type:'PERSONAL',choices:[
{text:'찰리 걱정이 제일 크군요.',response:'"당연하지. 내 자존심보다 그게 먼저야."',delta:2,setFlags:'lucifer.alastor_annoyance_shared'},
{text:'둘이 아주 조금은 친해질 수 없어요?',response:'그가 당신을 빤히 본다. "왜 나한테 이런 시련을 주는 거야?"',delta:1,setFlags:'lucifer.alastor_annoyance_shared'},
{text:'그래도 알래스터가 호텔을 돕긴 하잖아요.',response:'"알아. 그래서 더 복잡한 거지. 도움이 된다는 사실과 신뢰한다는 건 다른 말이야."',delta:1,setFlags:'lucifer.alastor_annoyance_shared'}
]}),

askScene({id:'lucifer-ask-charlie-child-low',title:'찰리는 어릴 때 어땠어요?',min:0,max:39,narration:'찰리의 어린 시절을 묻자 루시퍼의 표정이 거의 즉시 부드러워진다.',reaction:'"질문이 많았고, 하고 싶은 것도 많았고, 내가 답을 끝내기도 전에 다음 계획을 세웠지. ...지금이랑 꽤 비슷하네."',topics:['charlie','family','childhood'],type:'PERSONAL',choices:[
{text:'귀여웠겠네요.',response:'"당연하지. 이건 객관적인 사실이야."',delta:1},{text:'어릴 때부터 꿈이 많았군요.',response:'"응. 그건 정말 안 변했어."',delta:1},{text:'그때가 그리워요?',response:'미소가 조금 느려진다. "가끔. 하지만 지금의 찰리도 좋아해."',delta:0}
]}),
askScene({id:'lucifer-ask-charlie-child-high',title:'찰리는 어릴 때 어땠어요?',min:40,max:100,narration:'이제는 찰리의 어린 시절 이야기를 꺼내도 루시퍼가 오래 망설이지 않는다.',reaction:'"작은 질문 폭풍이었지. 뭔가 가능하다고 믿으면 바로 달려갔고. 가끔 지금의 그 애를 보면... 그때 모습이랑 내 옛날이 한꺼번에 보여."',topics:['charlie','family','childhood'],type:'PERSONAL',choices:[
{text:'그래서 더 걱정돼요?',response:'"응. 하지만 걱정한다고 날개를 접게 만들 순 없잖아."',delta:2},{text:'그래도 자랑스럽죠?',response:'그가 바로 웃는다. "그건 질문할 필요도 없지."',delta:2},{text:'당신도 비슷했나 봐요.',response:'"지나치게. 그래서 그 애가 어디서 저러는지 부정도 못 해."',delta:1}
]}),

askScene({id:'lucifer-ask-hotel-reason-low',title:'요즘 호텔에 자주 오는 이유가 뭐예요?',min:0,max:29,narration:'너무 당연한 사실을 짚자 루시퍼는 어깨를 으쓱한다.',reaction:'"찰리가 여기 있으니까. 그 애가 하는 걸 도와주겠다고 했고. 약속했으면 최소한 얼굴은 보여야지."',topics:['hotel','charlie','present'],type:'PERSONAL',choices:[
{text:'찰리 때문이 제일 크네요.',response:'"그건 굳이 숨길 이유가 없지."',delta:1},{text:'호텔도 조금 마음에 들죠?',response:'"조금. 정말 조금."',delta:0},{text:'저 같은 손님도 신경 써줘요?',response:'그가 당신을 본다. "찰리가 받아들인 손님이면 최소한 무사한지는 보지."',delta:1}
]}),
askScene({id:'lucifer-ask-hotel-reason-high',title:'요즘 호텔에 자주 오는 이유가 뭐예요?',min:30,max:100,narration:'이제는 이 질문에 루시퍼가 답을 고르는 시간이 짧다.',reaction:'"찰리 때문이 가장 크고, 호텔을 돕겠다는 약속도 있고... 그리고 이 소란에 익숙해졌어. 네가 있는 것도 이제 꽤 자연스럽고."',topics:['hotel','charlie','present'],type:'PERSONAL',choices:[
{text:'제가 있는 것도 이유네요.',response:'"그래. 그렇게 만족스러운 얼굴 할 것까진 없고."',delta:2},{text:'호텔이 집처럼 느껴져요?',response:'그가 잠깐 주변을 본다. "...아직은 그 단어가 조금 크지만, 예전보단 가까워."',delta:1},{text:'계속 자주 와주세요.',response:'"찰리한테는 이미 그렇게 할 생각이야. 너한테도... 뭐, 알겠어."',delta:2}
]}),

askScene({id:'lucifer-ask-charlie-distance-early',title:'찰리와 왜 그렇게 오래 멀어져 있었어요?',min:0,max:39,narration:'질문이 끝나자 루시퍼의 표정이 조용해진다. 화가 난 것보다는 대답을 어디까지 할지 고르는 얼굴이다.',reaction:'"내 쪽 실수가 컸어. 가까이 있으면 더 망칠 거라고 스스로 납득하고 물러났지. 지금 생각하면... 좋은 선택은 아니었어."',topics:['charlie','family','fatherhood'],type:'PERSONAL',choices:[
{text:'더는 묻지 않을게요.',response:'그가 작게 고개를 끄덕인다. "고마워. 나중에 더 말할 수 있을지도 모르지."',delta:1},{text:'그래도 지금은 도우려고 하잖아요.',response:'"응. 이번엔 멀리서 걱정만 하는 걸로 끝내고 싶지 않아."',delta:1},{text:'찰리도 잘못한 게 있었던 거 아니에요?',response:'루시퍼의 시선이 날카로워진다. "그 얘기에서 책임을 그 애한테 돌릴 생각은 없어."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-charlie-distance-safe',title:'찰리와 왜 그렇게 오래 멀어져 있었어요?',min:40,max:100,narration:'같은 질문이지만 이제 루시퍼는 당신이 비난하려고 묻는 게 아니라는 걸 안다.',reaction:'"겁이 났어. 내가 가까이 있을수록 실수할 것 같았고, 결국 멀리 있는 걸 배려라고 착각했지. 그 시간은 후회해."',topics:['charlie','family','fatherhood'],type:'RELATIONSHIP',choices:[
{text:'그래도 다시 가까워졌잖아요.',response:'"응. 이번엔 그걸 놓치고 싶지 않아."',delta:2},{text:'찰리도 당신을 원했던 것 같아요.',response:'그가 눈을 내리깐다. "...알아. 그래서 더 미안하지."',delta:1},{text:'지금부터 잘하면 되죠.',response:'"단순하지만 맞는 말이야. 그래서 계속 하는 중이고."',delta:2}
]}),

askScene({id:'lucifer-ask-lilith-early',title:'릴리스와 무슨 일이 있었어요?',min:0,max:49,narration:'릴리스의 이름이 나오자 루시퍼는 짧게 굳는다. 바로 화를 내진 않지만 평소의 농담이 끊긴다.',reaction:'"그건 꽤 개인적인 이야기야. 질문하는 것 자체가 잘못은 아니지만, 지금은 자세히 말하고 싶진 않아."',topics:['lilith','family','boundary'],type:'PERSONAL',choices:[
{text:'알겠어요. 여기까지만 물을게요.',response:'"그래. 고마워."',delta:1},{text:'좋았던 기억 하나만은요?',response:'그가 잠시 생각한다. "...좋았던 건 많았어. 오늘은 그 정도만."',delta:0},{text:'대답하기 싫어서 피하는 거죠?',response:'그가 웃지 않는다. "방금 선을 말했는데 밀어붙이면 기분이 나빠지지."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-lilith-safe',title:'릴리스와 무슨 일이 있었어요?',min:50,max:100,narration:'릴리스의 이름이 나와도 이번에는 루시퍼가 대화를 바로 닫지 않는다.',reaction:'"좋았던 것도 많았고, 복잡해진 것도 많았어. 한 문장으로 정리할 관계는 아니야. 네가 궁금해하는 이유 정도는 이해해."',topics:['lilith','family','past'],type:'RELATIONSHIP',choices:[
{text:'좋았던 기억부터 듣고 싶어요.',response:'그의 표정이 조금 멀어진다. "언젠가 꽤 긴 이야기로 해주지."',delta:1},{text:'지금도 많이 생각나요?',response:'"생각하지 않는다고 하면 거짓말이겠지."',delta:0},{text:'말하고 싶은 만큼만 해요.',response:'루시퍼가 당신을 잠깐 바라본다. "...그래. 그 방식은 마음에 드네."',delta:2}
]}),

askScene({id:'lucifer-ask-heaven-early',title:'천국에서는 무슨 일이 있었어요?',min:0,max:59,narration:'천국이라는 단어를 꺼내는 순간 루시퍼의 표정이 조금 가라앉는다. 그렇다고 당신을 몰아붙이진 않는다.',reaction:'"긴 이야기야. 좋은 기억도 있고, 정말 형편없는 끝도 있고. 지금은 전부 꺼내놓을 만큼 가깝진 않지만 질문한 걸 화낼 생각은 없어."',topics:['heaven','past','boundary'],type:'SECRET',choices:[
{text:'알겠어요. 나중에 말해줘요.',response:'그가 짧게 고개를 끄덕인다. "그래. 그 정도면 좋아."',delta:1},{text:'좋았던 기억도 있긴 하군요.',response:'"당연하지. 그래서 더 오래 남는 거야."',delta:0},{text:'결국 당신이 일을 망친 거잖아요.',response:'루시퍼의 눈빛이 식는다. "책임은 알아. 그렇다고 네가 그 상처를 한 줄로 정리할 권리가 생기는 건 아니야."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-heaven-safe',title:'천국에서는 무슨 일이 있었어요?',min:60,max:100,narration:'같은 천국 이야기지만 이제 루시퍼는 당신 앞에서 그 단어를 피하지 않는다.',reaction:'"한때는 정말 많은 게 가능하다고 믿었어. 틀린 부분도 있었고, 대가도 컸지. 그래도 그때의 나까지 전부 부정하고 싶진 않아."',topics:['heaven','past','trust','optimism'],type:'SECRET',choices:[
{text:'좋았던 기억도 들려줘요.',response:'"그래. 나쁜 끝이 좋은 시작까지 지우는 건 아니니까."',delta:2},{text:'그때의 당신이 아직 남아 있어요?',response:'그가 조금 웃는다. "생각보다 많이. 찰리를 보면 특히 그렇고."',delta:2},{text:'힘들면 천천히 말해요.',response:'"...그래서 너한텐 계속 말할 수 있는 건지도 모르겠네."',delta:2}
]}),

askScene({id:'lucifer-ask-fatherhood-low',title:'좋은 아버지가 되고 싶어요?',min:0,max:39,narration:'아버지라는 단어에 루시퍼는 농담보다 먼저 대답한다.',reaction:'"당연하지. 꽤 오래 잘하지 못했다고 해서 이제 포기할 이유는 없잖아."',topics:['charlie','fatherhood','family'],type:'RELATIONSHIP',choices:[
{text:'지금도 충분히 노력하는 것 같아요.',response:'"평가가 너무 후하네. 그래도 고맙긴 하고."',delta:1},{text:'찰리 곁에 있어주면 되죠.',response:'"요즘은 그게 생각보다 큰 일이라는 걸 배우는 중이야."',delta:1},{text:'이제 와서 너무 늦은 거 아닌가요?',response:'그의 표정이 딱딱해진다. "늦었다고 가족을 포기하라는 말은 별로 듣고 싶지 않네."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-fatherhood-high',title:'좋은 아버지가 되고 싶어요?',min:40,max:100,narration:'이제 이 질문은 루시퍼에게 방어해야 할 질문이 아니라 스스로 생각해본 적 있는 질문이다.',reaction:'"응. 완벽한 아버지는 포기했어. 대신 필요할 때 곁에 있고, 틀리면 인정하고, 다시 하는 아버지는 되고 싶어."',topics:['charlie','fatherhood','regret'],type:'RELATIONSHIP',choices:[
{text:'그거면 충분히 좋은 시작이네요.',response:'"시작을 몇 번이나 다시 하는진 모르겠지만... 그래."',delta:2},{text:'찰리도 그걸 알아줄 거예요.',response:'그가 작게 웃는다. "이미 내가 생각하는 것보다 많이 알고 있을지도."',delta:2},{text:'실수해도 다시 하면 되죠.',response:'"...그 말은 꽤 마음에 드네."',delta:2}
]}),

askScene({id:'lucifer-ask-alone-low',title:'혼자 있고 싶을 때도 내가 오면 괜찮아요?',min:0,max:59,narration:'조금 이른 질문에 루시퍼가 눈을 깜빡인다. 불쾌하다기보다는 예상하지 못한 얼굴이다.',reaction:'"새 손님이 방문 규칙까지 확인해? 보통은 괜찮아. 싫은 날엔 내가 문을 안 열겠지."',topics:['relationship','boundary','comfort'],type:'PERSONAL',choices:[
{text:'그럼 문 열려 있을 때만 올게요.',response:'"아주 합리적이네. 드물게 듣는 종류의 말이야."',delta:1},{text:'방해되면 바로 말해주세요.',response:'"좋아. 너도 내가 너무 떠들면 말하고."',delta:1},{text:'사실 제가 오는 거 좋아하죠?',response:'그가 헛웃음을 친다. "아직은 자신감이 너무 앞서가는데?"',delta:0}
]}),
askScene({id:'lucifer-ask-alone-high',title:'혼자 있고 싶을 때도 내가 오면 괜찮아요?',min:60,max:100,narration:'이제는 같은 질문이 나와도 루시퍼가 왜 묻는지 안다는 듯 잠깐 웃는다.',reaction:'"대부분은 괜찮아. 오히려 네가 너무 오래 안 오면... 아니, 거기까지만."',topics:['relationship','trust','comfort'],type:'RELATIONSHIP',choices:[
{text:'그럼 앞으로도 올게요.',response:'"그래. 너무 당연하게 말해서 거절하기도 어렵네."',delta:2},{text:'싫은 날은 말해주세요.',response:'그가 고개를 끄덕인다. "그렇게 할게. 너도 그래."',delta:2},{text:'기다릴 때도 있죠?',response:'루시퍼가 시선을 피하며 웃는다. "관계가 좀 가까워졌다고 아주 대담해졌군."',delta:1}
]}),

askScene({id:'lucifer-ask-heaven-people-low',title:'천국 사람들을 다 싫어해요?',min:0,max:59,narration:'질문이 단순한 편견을 확인하려는 건지 살피듯 루시퍼가 눈썹을 든다.',reaction:'"다? 아니. 사람과 체계는 구분해야지. 내가 싫어하는 건 아주 구체적인 선택들과 아주 구체적인 위선이야."',topics:['heaven','people','past'],type:'PERSONAL',choices:[
{text:'그럼 좋은 기억의 사람도 있겠네요.',response:'"있었지. 세상이 그렇게 간단하면 오히려 편했을 거야."',delta:1},{text:'천국 자체가 싫은 건 아니군요.',response:'"장소보다 거기서 무슨 일이 있었는지가 문제야."',delta:0},{text:'그래도 천사들은 다 똑같아 보이는데요.',response:'"그렇게 묶는 건 내가 당한 방식이랑 별로 다르지 않지."',delta:-1}
]}),
askScene({id:'lucifer-ask-heaven-people-high',title:'천국 사람들을 다 싫어해요?',min:60,max:100,narration:'이제 루시퍼는 이 질문을 흑백으로 답하지 않아도 당신이 이해할 거라고 생각한다.',reaction:'"아니. 미워하는 사람도 있고, 그리운 사람도 있었고, 아직 판단하고 싶지 않은 이름도 있어. 오래 산다고 감정이 단순해지진 않더군."',topics:['heaven','people','past'],type:'SECRET',choices:[
{text:'그리운 사람도 있었군요.',response:'그가 잠깐 침묵한다. "응. 그건 부정할 이유가 없지."',delta:1},{text:'언젠가 그 사람들 얘기도 해줘요.',response:'"언젠가는."',delta:1},{text:'미워하는 것만 남지 않아서 다행이에요.',response:'루시퍼가 천천히 웃는다. "나도 그렇게 생각해."',delta:2}
]}),

askScene({id:'lucifer-ask-jokes-low',title:'왜 그렇게 농담을 많이 해요?',min:0,max:49,narration:'농담 자체를 질문받자 루시퍼는 잠깐 진지하게 고민하는 척한다.',reaction:'"내가 재미있으니까? 그리고 세상에 이미 심각한 게 너무 많아. 전부 진지하게 받으면 지루하잖아."',topics:['personality','joke','defense'],type:'PERSONAL',choices:[
{text:'재밌을 때가 많아요.',response:'"때가 많다? 완벽하다고 말해도 되는데."',delta:1},{text:'진지한 얘기 피할 때도 쓰죠?',response:'그가 눈썹을 올린다. "관찰력이 너무 빠른데."',delta:1},{text:'가끔은 너무 가벼워 보여요.',response:'"그럴 수도 있지. 하지만 가벼운 척과 가볍게 생각하는 건 다른 거야."',delta:0}
]}),
askScene({id:'lucifer-ask-jokes-high',title:'왜 그렇게 농담을 많이 해요?',min:50,max:100,narration:'이제는 당신이 농담 뒤를 본다는 걸 알아서인지 루시퍼가 웃으면서도 피하지 않는다.',reaction:'"재미있어서 하는 것도 맞고, 숨을 곳이 필요해서 하는 것도 맞아. 농담 하나면 대답을 몇 초 늦출 수 있거든."',topics:['personality','joke','defense'],type:'PERSONAL',choices:[
{text:'숨고 싶을 땐 그래도 돼요.',response:'그가 잠깐 말을 잃는다. "...그 허락은 좀 이상하게 고맙네."',delta:2},{text:'그래도 언젠간 말해줄 거죠?',response:'"너라면 조금씩은."',delta:2},{text:'농담하는 모습도 좋아요.',response:'루시퍼가 바로 웃는다. "봐. 역시 전략적으로 옳았어."',delta:2}
]}),

askScene({id:'lucifer-ask-lonely-low',title:'외롭다고 느낄 때도 있어요?',min:0,max:69,narration:'외롭냐는 질문에 루시퍼는 평소보다 조금 느리게 눈을 깜빡인다.',reaction:'"그 질문은 꽤 직선적이네. ...당연히 있지. 오래 산다고 외로움에 면역이 생기는 건 아니더라."',topics:['loneliness','relationship','past'],type:'PERSONAL',choices:[
{text:'그럴 땐 어떻게 해요?',response:'"뭔가 만들거나, 음악을 틀거나, 너무 오래 생각하지 않으려고 하지."',delta:1},{text:'찰리한테 가면 되잖아요.',response:'"찰리는 내 외로움을 해결하는 도구가 아니야. 그 애 삶도 있지."',delta:0},{text:'그럼 제가 와도 돼요?',response:'그가 당신을 잠깐 본다. "...가끔은. 지금처럼."',delta:1}
]}),
askScene({id:'lucifer-ask-lonely-high',title:'외롭다고 느낄 때도 있어요?',min:70,max:100,narration:'같은 질문이지만 이번에는 루시퍼가 웃음으로 시간을 벌지 않는다.',reaction:'"응. 가족이 있어도 외로운 순간은 있고, 과거가 길면 빈자리도 많아져. 요즘은 예전처럼 혼자 버티는 게 정답이라고 생각하진 않아."',topics:['loneliness','relationship','trust'],type:'RELATIONSHIP',choices:[
{text:'혼자 버티지 않아도 돼요.',response:'"...그래. 요즘 조금씩 배우는 중이야."',delta:2},{text:'그럴 땐 불러줘요.',response:'그가 작게 웃는다. "정말 부르면 놀라지 마."',delta:2},{text:'나도 비슷할 때 있어요.',response:'"그럼 서로 너무 오래 조용해지진 말자고."',delta:2}
]}),

askScene({id:'lucifer-ask-charlie-failure-low',title:'찰리가 실패하면 어떻게 할 거예요?',min:0,max:39,narration:'실패라는 단어에 루시퍼의 표정이 잠깐 굳지만 찰리를 탓하는 쪽으로 가지는 않는다.',reaction:'"옆에 있어야지. 실패가 그 애 꿈이 틀렸다는 뜻은 아니고, 한 번의 결과가 사람 전체를 정하는 것도 아니니까."',topics:['charlie','failure','support'],type:'RELATIONSHIP',choices:[
{text:'다시 하게 도와줄 거예요?',response:'"원한다면. 이번엔 혼자 일어나게 두는 게 배려라고 착각하고 싶진 않아."',delta:1},{text:'당신은 실패를 잘 아니까요.',response:'그가 씁쓸하게 웃는다. "경력만 보면 전문가 수준이지."',delta:0},{text:'그때는 포기하라고 해야죠.',response:'루시퍼의 표정이 단단해진다. "그건 찰리가 결정할 일이지 네가 대신 꺾을 일이 아니야."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-charlie-failure-high',title:'찰리가 실패하면 어떻게 할 거예요?',min:40,max:100,narration:'이 질문에 루시퍼는 오래 생각하지 않는다.',reaction:'"곁에 있을 거야. 다시 할지 쉬어갈지는 찰리가 고르게 하고, 필요하면 내가 할 수 있는 건 다 해볼 거고. 실패했다고 그 애를 혼자 두진 않아."',topics:['charlie','failure','support'],type:'RELATIONSHIP',choices:[
{text:'그게 찰리한테 제일 필요할 것 같아요.',response:'"나도 그렇게 생각해."',delta:2},{text:'당신도 같이 무너지진 마요.',response:'그가 잠깐 웃음을 멈춘다. "...노력해볼게."',delta:2},{text:'이번엔 결과가 다를 거예요.',response:'"그래. 그 가능성을 믿어보자고."',delta:2}
]}),

askScene({id:'lucifer-ask-family-boundary-low',title:'가족 얘기 건드리는 거 싫어해요?',min:0,max:49,narration:'가족이라는 단어에 루시퍼는 장난스럽게 웃으면서도 답은 분명하게 한다.',reaction:'"질문하는 건 괜찮아. 무례하게 깎아내리는 건 싫어하지. 나를 놀리는 건 받아쳐줄 수 있는데 가족은 다른 문제야."',topics:['family','boundary','rude'],type:'PERSONAL',choices:[
{text:'선을 지킬게요.',response:'"좋아. 그러면 나도 굳이 예민하게 굴 이유 없지."',delta:1,setFlags:'lucifer.family_boundary_shared'},
{text:'찰리 얘기는 특히 그렇겠네요.',response:'"당연하지. 그 애를 모욕하는 말까지 웃어넘길 생각은 없어."',delta:1,setFlags:'lucifer.family_boundary_shared'},
{text:'가족이면 비판도 못 해요?',response:'"비판이랑 모욕은 다르지. 그 차이만 알면 돼."',delta:0,setFlags:'lucifer.family_boundary_shared'}
]}),
askScene({id:'lucifer-ask-family-boundary-high',title:'가족 얘기 건드리는 거 싫어해요?',min:50,max:100,narration:'당신이 이미 여러 번 선을 지켜준 걸 알아서인지 루시퍼는 조금 더 솔직하게 말한다.',reaction:'"응. 내가 실패한 부분을 말하는 건 괜찮아. 찰리나 가족을 깎아내리면서 나를 자극하려는 건 못 참아. 그건 논쟁이 아니라 그냥 무례한 거니까."',topics:['family','boundary','rude'],type:'RELATIONSHIP',choices:[
{text:'그건 당연한 선이죠.',response:'"그래. 네가 그렇게 이해해서 편해."',delta:2,setFlags:'lucifer.family_boundary_shared'},
{text:'당신한테도 너무 심한 말은 안 할게요.',response:'그가 웃는다. "나는 조금 놀려도 돼. 재미는 있어야지."',delta:2,setFlags:'lucifer.family_boundary_shared'},
{text:'알래스터가 그 선을 잘 넘나 봐요.',response:'루시퍼가 즉시 인상을 쓴다. "그 이름을 아주 적절한 예시로 가져왔군."',delta:1,setFlags:'lucifer.family_boundary_shared'}
]}),

askScene({id:'lucifer-ask-dream-low',title:'당신은 지금도 꿈이 있어요?',min:0,max:59,narration:'자신의 꿈을 묻는 질문에 루시퍼는 예상보다 오래 조용해진다.',reaction:'"거창하게 이름 붙인 건 없어. 그래도 찰리가 하고 싶은 걸 끝까지 해볼 수 있는 세상은 보고 싶지."',topics:['dream','optimism','future'],type:'PERSONAL',choices:[
{text:'그것도 충분히 꿈 같아요.',response:'"그렇게 말하면... 그래, 그런가."',delta:1},{text:'당신 개인적인 꿈은요?',response:'"그건 아직 정리 중이야. 오래 미뤄둔 파일이라서."',delta:0},{text:'예전 꿈은 다 포기했어요?',response:'"전부는 아니야. 형태가 달라졌을 뿐이지."',delta:1}
]}),
askScene({id:'lucifer-ask-dream-high',title:'당신은 지금도 꿈이 있어요?',min:60,max:100,narration:'이제는 자신의 미래를 묻는 말에 루시퍼가 도망치듯 농담하지 않는다.',reaction:'"있어. 가족과 다시 멀어지지 않는 것. 찰리가 자기 꿈을 끝까지 시험해볼 수 있게 돕는 것. 그리고... 나도 다시 뭔가를 기대해보는 것."',topics:['dream','optimism','future'],type:'RELATIONSHIP',choices:[
{text:'다 이뤘으면 좋겠어요.',response:'"욕심이 많아 보이지만 나도 그래."',delta:2},{text:'나도 옆에서 볼게요.',response:'그가 당신을 잠깐 바라보다 웃는다. "그건 꽤 좋은 조건이네."',delta:2},{text:'다시 기대하는 게 제일 어렵겠네요.',response:'"응. 그래서 제일 해볼 만한지도 모르지."',delta:2}
]}),

askScene({id:'lucifer-ask-sinners-low',title:'죄인들이 정말 바뀔 수 있다고 생각해요?',min:0,max:39,narration:'호텔의 가장 근본적인 질문을 꺼내자 루시퍼는 가볍게 넘기지 않는다.',reaction:'"모두가 반드시 바뀐다고는 못 해. 하지만 누구도 바뀔 수 없다고 단정하는 것도 웃기지. 찰리는 그 가능성을 시험하려는 거고, 난 그 시험을 무시하고 싶진 않아."',topics:['hotel','redemption','optimism'],type:'RELATIONSHIP',choices:[
{text:'가능성은 있다고 보는군요.',response:'"응. 아주 작은 가능성이라도 존재하면 확인은 해볼 수 있지."',delta:1},{text:'찰리 생각이랑 비슷하네요.',response:'그가 웃는다. "그 애가 어디서 저런 성격을 물려받았겠어."',delta:1},{text:'다 소용없는 사람들도 있잖아요.',response:'"그럴 수도 있지. 그래도 시작도 전에 전부 같은 답을 붙일 필요는 없어."',delta:0}
]}),
askScene({id:'lucifer-ask-sinners-high',title:'죄인들이 정말 바뀔 수 있다고 생각해요?',min:40,max:100,narration:'이제 루시퍼는 찰리의 목표를 남의 실험처럼 말하지 않는다.',reaction:'"응. 적어도 일부는. 변화가 쉬운 것도 아니고 모두가 원한다는 것도 아니지만, 가능성이 실제로 있다면 그걸 증명할 기회는 있어야지. 그래서 호텔을 돕는 거고."',topics:['hotel','redemption','optimism'],type:'RELATIONSHIP',choices:[
{text:'찰리랑 꽤 닮았네요.',response:'"그 말 들으면 찰리가 좋아하겠군. ...나도 싫진 않고."',delta:2},{text:'당신도 다시 믿게 된 거네요.',response:'"조금씩. 아주 성가시게도."',delta:2},{text:'그 가능성을 같이 확인해봐요.',response:'그가 웃는다. "좋아. 그게 제일 낫네."',delta:2}
]}),

askScene({id:'lucifer-ask-charlie-similar-low',title:'찰리가 예전의 당신이랑 닮았어요?',min:0,max:49,narration:'질문에 루시퍼는 잠깐 시선을 내린다. 부정부터 하지는 않는다.',reaction:'"많이. 뭔가 더 나아질 수 있다고 너무 자연스럽게 믿는 얼굴이 특히. 그게 자랑스럽고... 가끔 무섭기도 해."',topics:['charlie','past','similarity'],type:'PERSONAL',choices:[
{text:'그래서 더 보호하고 싶어요?',response:'"응. 다만 보호가 막아서는 일이 되면 안 되겠지."',delta:1},{text:'좋은 점도 닮았잖아요.',response:'그가 웃는다. "그 표현은 마음에 드네."',delta:1},{text:'그럼 실패도 똑같이 하겠네요.',response:'루시퍼의 표정이 굳는다. "그 애 인생을 내 실패의 복사본처럼 말하지 마."',delta:-2,moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him'}
]}),
askScene({id:'lucifer-ask-charlie-similar-high',title:'찰리가 예전의 당신이랑 닮았어요?',min:50,max:100,narration:'이제는 이 질문이 루시퍼에게 상처만 건드리는 질문이 아니라 현재를 설명하는 질문이 된다.',reaction:'"응. 아주 많이. 그래서 예전엔 두려움이 먼저였는데, 요즘은 다르게 생각하려고 해. 닮았다고 같은 끝을 맞는 건 아니잖아."',topics:['charlie','past','similarity','optimism'],type:'RELATIONSHIP',choices:[
{text:'이번에는 곁에 있잖아요.',response:'"그래. 그 차이가 꽤 크길 바라."',delta:2},{text:'찰리는 찰리니까요.',response:'그가 즉시 고개를 끄덕인다. "맞아. 그걸 잊으면 안 되지."',delta:2},{text:'당신도 예전의 당신이랑 다르고요.',response:'루시퍼가 잠깐 웃음을 멈춘다. "...그 말은 생각보다 크게 들리네."',delta:2}
]}),

askScene({id:'lucifer-ask-player-impression-0',title:'나를 어떻게 생각해요?',min:0,max:19,narration:'당신 자신에 대한 평가를 묻자 루시퍼는 노골적으로 당신을 위아래로 훑어본다.',reaction:'"찰리가 데려온 새 손님. 생각보다 겁은 없고, 질문은 많고. 아직 판단 중이야."',topics:['player','relationship','impression'],type:'RELATIONSHIP',choices:[
{text:'좋은 쪽으로 판단해주세요.',response:'"그건 네가 앞으로 어떻게 구느냐에 달렸지."',delta:1,setFlags:'lucifer.player_impression_shared'},{text:'생각보다 괜찮죠?',response:'"자신감 하나는 확실하네."',delta:0,setFlags:'lucifer.player_impression_shared'},{text:'저 별로예요?',response:'"별로였으면 이렇게 오래 대화 안 했겠지."',delta:1,setFlags:'lucifer.player_impression_shared'}
]}),
askScene({id:'lucifer-ask-player-impression-20',title:'나를 어떻게 생각해요?',min:20,max:59,narration:'이제는 루시퍼가 당신을 단순히 새 손님이라고만 부르기엔 몇 번이나 말을 섞었다.',reaction:'"꽤 재밌는 손님. 눈치가 있을 때도 있고 없을 때도 있고, 그래도 다시 찾아오는 건 나쁘지 않아."',topics:['player','relationship','impression'],type:'RELATIONSHIP',choices:[
{text:'재밌는 손님이면 합격인가요?',response:'"내 기준에선 꽤 높은 점수지."',delta:1,setFlags:'lucifer.player_impression_shared'},{text:'다시 와도 괜찮다는 뜻이죠?',response:'"지금까지 쫓아내지 않았잖아."',delta:2,setFlags:'lucifer.player_impression_shared'},{text:'눈치 없는 건 취소해주세요.',response:'그가 웃는다. "검토는 해보지."',delta:1,setFlags:'lucifer.player_impression_shared'}
]}),
askScene({id:'lucifer-ask-player-impression-60',title:'나를 어떻게 생각해요?',min:60,max:89,narration:'질문을 듣자 루시퍼는 장난스러운 평가표를 만드는 대신 잠깐 진지해진다.',reaction:'"믿을 만한 사람. 적어도 내 앞에서 모르는 척만 하진 않고, 가족을 존중할 줄도 알아. 네가 오는 건 이제 꽤 편해."',topics:['player','relationship','trust'],type:'RELATIONSHIP',choices:[
{text:'나도 당신이 편해요.',response:'그가 작게 웃는다. "좋네. 일방적이면 조금 민망했을 테니까."',delta:2,setFlags:'lucifer.player_impression_shared'},{text:'믿어줘서 고마워요.',response:'"깨뜨리지 마. 꽤 공들여 만든 거니까."',delta:2,setFlags:'lucifer.player_impression_shared'},{text:'그 정도면 꽤 좋아하는 거 아닌가요?',response:'루시퍼가 헛웃음을 친다. "점점 대담해지는군."',delta:1,setFlags:'lucifer.player_impression_shared'}
]}),
askScene({id:'lucifer-ask-player-impression-90',title:'나를 어떻게 생각해요?',min:90,max:100,narration:'이번에는 질문을 던진 뒤 당신이 먼저 민망해질 만큼 루시퍼가 오래 바라본다.',reaction:'"내가 기다리는 사람. 가족 얘기든 시시한 얘기든 같이 하고 싶은 사람. ...이 정도면 충분히 직접적이지?"',topics:['player','relationship','trust'],type:'RELATIONSHIP',choices:[
{text:'충분해요. 나도 그래요.',response:'그가 아주 조용히 웃는다. "좋아."',delta:2,setFlags:'lucifer.player_impression_shared'},{text:'조금 더 말해도 되는데요.',response:'"욕심이 많네. 다음 질문으로 남겨둬."',delta:2,setFlags:'lucifer.player_impression_shared'},{text:'기다린다는 건 처음 듣네요.',response:'그가 시선을 피한다. "방금 들었으니 됐어."',delta:2,setFlags:'lucifer.player_impression_shared'}
]}),

askScene({id:'lucifer-ask-rude',title:'내가 무례하게 굴면 많이 화내요?',narration:'질문 자체가 조금 웃겼는지 루시퍼가 한쪽 눈썹을 올린다.',reaction:'"나한테 하는 가벼운 농담은 받아칠 수 있어. 가족을 깎아내리거나 일부러 상처를 후벼파는 건 전혀 다른 얘기고."',topics:['boundary','rude','family'],type:'CASUAL',choices:[
{text:'구분은 할게요.',response:'"좋아. 그럼 우리 둘 다 덜 피곤하지."',delta:1,setFlags:'lucifer.family_boundary_shared'},{text:'키 얘기는요?',response:'표정이 즉시 싸늘해진 척한다. "위험한 실험을 좋아하는군."',delta:0},{text:'알래스터 칭찬은요?',response:'"그건 무례함보다 취향 문제인데, 심각한 취향 문제지."',delta:0}
]})
];
for(const s of asks)upsertDialogue(s);

// Existing Lucifer ASK entries that predate the new grouped variants remain intact,
// but authored/default ones are reopened so the ASK menu never hard-locks a topic by Heart.
for(const scene of state.dialogues){if(scene?.characterId!==CID||upper(scene.kind)!=='ASK')continue;scene.repeatable=true;scene.used=false;if(!String(scene.id||'').startsWith('lucifer-ask-')){scene.requiredAffection=0;scene.maxAffection=100;scene.requiredStage='';scene.requiredMood='ANY'}}

const interactions=[
talkScene({id:'lucifer-v4-follow-charlie-dream',title:'찰리 계획표를 들여다보며',requiredFlags:'lucifer.charlie_dream_supported',topics:['charlie','dream','hotel','support'],type:'RELATIONSHIP',priority:24,opening:'테이블 위에 찰리가 두고 간 계획표가 펼쳐져 있다. 루시퍼는 붉은 펜으로 무언가를 고치다가 당신을 본다.',reaction:'"이 부분은 말이 안 되는데... 그래도 방향 자체는 좋아. 찰리한텐 내가 고쳤다고 말하지 마. 분명 전부 다시 꾸밀 테니까."',choices:[
{text:'같이 봐드릴까요?',response:'"좋아. 손님 시선도 필요하겠네. 실제로 불편한 걸 제일 먼저 보는 건 너희니까."',delta:1},{text:'생각보다 엄청 진지하게 돕네요.',response:'그가 코웃음을 친다. "도와준다고 했으면 제대로 해야지."',delta:1},{text:'찰리가 알아서 하게 두면 안 돼요?',response:'"알아서 하게 두는 것과 필요할 때 손을 안 빌려주는 건 다르지."',delta:0}
]}),
talkScene({id:'lucifer-v4-follow-alastor-radio',title:'라디오 잡음이 들린 순간',requiredFlags:'lucifer.alastor_annoyance_shared',topics:['alastor','hotel','daily'],type:'CASUAL',priority:18,opening:'복도 어딘가에서 낡은 라디오 같은 잡음이 잠깐 들린다. 루시퍼의 미소가 눈에 띄게 굳는다.',reaction:'"...저 소리. 꼭 본인이 안 보여도 존재감을 주장해야 하나?"',choices:[
{text:'알래스터 같네요.',response:'"이 호텔에서 저런 잡음에 저 정도 자의식이면 후보가 하나뿐이지."',delta:0},{text:'둘이 생각보다 잘 맞을지도 몰라요.',response:'그가 진심으로 황당한 얼굴을 한다. "내가 방금 무슨 모욕을 들은 거지?"',delta:-1},{text:'신경 끄고 다른 얘기 해요.',response:'"좋아. 아주 현명한 선택이야."',delta:1}
]}),
talkScene({id:'lucifer-v4-follow-optimism',title:'실패작을 버리지 않는 이유',requiredFlags:'lucifer.optimism_shared',topics:['optimism','duck','failure'],type:'PERSONAL',priority:20,opening:'루시퍼가 찌그러진 고무오리 하나를 쓰레기통 위까지 들었다가 다시 작업대에 내려놓는다.',reaction:'"이건 실패작이 맞아. 그래도 고칠 수 있는지 한 번은 봐야지. 버리는 건 그다음에도 할 수 있고."',choices:[
{text:'당신답네요.',response:'그가 웃는다. "칭찬으로 듣지."',delta:1},{text:'그래서 가능성을 쉽게 포기 안 하는군요.',response:'"모든 걸 붙잡는 건 아니야. 다만 끝났다고 단정하는 건 천천히 하지."',delta:1},{text:'제가 고쳐봐도 돼요?',response:'그가 도구 하나를 건넨다. "망치면 공동 실패작으로 승격되는 거야."',delta:1,type:'action'}
]}),
talkScene({id:'lucifer-v4-follow-hotel-help',title:'호텔 일을 실제로 돕는 오후',requiredFlags:'lucifer.hotel_support_committed',topics:['hotel','support','work'],type:'RELATIONSHIP',priority:22,opening:'루시퍼 앞에 호텔 운영 관련 서류와 메모가 뒤섞여 있다. 투덜대고는 있지만 치울 생각은 없어 보인다.',reaction:'"찰리가 부탁한 건 아니야. 내가 먼저 보는 거지. 문제 생긴 다음에 왕 노릇하는 것보다 미리 막는 편이 낫잖아."',choices:[
{text:'손님 입장에서 확인해볼게요.',response:'"좋아. 그건 내가 못 보는 부분이니까 도움이 되겠네."',delta:1},{text:'찰리가 좋아하겠어요.',response:'그가 펜을 멈춘다. "그랬으면 좋겠네. 티는 너무 내지 말고."',delta:1},{text:'역시 결국 도와주고 싶었던 거네요.',response:'루시퍼가 피식 웃는다. "결국이라니. 처음부터 그랬어. 내가 방식이 좀 복잡했을 뿐이지."',delta:1}
]})
];
for(const s of interactions)upsertDialogue(s);

const luciferBad={
duck:[['이런 걸 왜 만들어요? 좀 유치한데.','유치해? ...좋아, 방금 네 평론 점수는 바닥을 뚫었어.',-1,'ANNOYED'],['솔직히 별로 안 귀여워요.','...그 말은 취소할 기회를 주지.',-1,'ANNOYED'],['그냥 버리면 안 돼요?','내 작업대에서 그런 말 하면 안 된다는 규칙을 방금 만들었어.',-1,'ANNOYED']],
charlie:[['찰리 꿈은 너무 순진한 거 아닌가요?','그 순진함을 얕보진 마. 수없이 깨지고도 다시 선택하는 건 약함이 아니야.',-2,'ANNOYED'],['찰리는 혼자서도 잘하잖아요. 그냥 두면 되죠.','잘한다고 혼자 둬도 된다는 뜻은 아니야.',-1,'ANNOYED'],['실패하면 그냥 포기하게 두죠.','그건 찰리가 결정할 일이야. 네가 대신 꺾을 일이 아니고.',-2,'ANNOYED']],
family:[['좋은 가족은 아닌 것 같은데요.','...솔직함과 무례함은 다르지. 그 선은 기억해.',-2,'ANNOYED'],['가족 문제는 그냥 신경 끄면 되잖아요.','그게 가능한 사람이었으면 애초에 이렇게 고민하지도 않았어.',-1,'ANNOYED'],['찰리도 책임이 있잖아요.','내 실수 얘기에서 그 애를 끌어와 책임을 나눌 생각은 없어.',-2,'ANNOYED']],
alastor:[['알래스터가 더 믿음직한 것 같아요.','...그 비교는 굳이 내 앞에서 해야 했나?',-1,'ANNOYED'],['알래스터가 찰리한테 더 도움 되는 것 같던데요.','도움이 되는 순간이 있는 것과 내가 그 녀석을 신뢰하는 건 다른 얘기야.',-1,'ANNOYED'],['둘이 꽤 닮았어요.','그건 오늘 들은 말 중 가장 모욕적이군.',-1,'ANNOYED']],
default:[['그건 별로 중요하지 않은 것 같은데요.','...그렇게 잘라 말하면 대화할 맛이 안 나지.',-1,'ANNOYED'],['좀 과하게 생각하는 거 아닌가요?','그럴 수도 있지. 그래도 말투는 마음에 안 드는군.',-1,'ANNOYED'],['그냥 신경 안 쓰면 되잖아요.','그게 가능했으면 진작 했겠지.',-1,'ANNOYED']]
};
function sceneTags(scene){return new Set([...(scene.topics||[]),...(scene.followUpTopics||[]),String(scene.title||'')].map(x=>String(x).toLowerCase()))}
function badPool(scene){const s=sceneTags(scene),has=(...q)=>q.some(t=>[...s].some(x=>x.includes(t)));if(has('duck','오리'))return luciferBad.duck;if(has('alastor','알래스터'))return luciferBad.alastor;if(has('charlie','찰리'))return luciferBad.charlie;if(has('family','father','아버지','가족'))return luciferBad.family;return luciferBad.default}
function addBadChoice(scene,node,ni){const choices=Array.isArray(node.choices)?node.choices:(node.choices=[]);if(choices.length>=3)return;const [text,response,delta,mood]=badPool(scene)[ni%3];choices.push({id:`${scene.id}-${node.id||'node'}-awkward`,type:'speech',text,playerLine:text,response,affectionDelta:delta,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'lucifer.player_offended_him',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:mood,unlockItemId:'',nextNodeId:choices[0]?.nextNodeId||'',endConversation:!choices[0]?.nextNodeId})}
function shapeAffection(scene){if(String(scene?.id||'').startsWith('lucifer-v4-'))return;const nodes=scene.nodes||[];nodes.forEach((node,ni)=>{addBadChoice(scene,node,ni);const last=ni===nodes.length-1;(node.choices||[]).forEach((c,ci)=>{const d=Number(c.affectionDelta||0);if(d>0&&!last)c.affectionDelta=0;if(last&&ci<2){if(d<=0)c.affectionDelta=ci===0?1:2;else c.affectionDelta=Math.min(2,d)}if(upper(c.moodChange)==='ANNOYED')c.setFlags=join(c.setFlags,'lucifer.player_offended_him')})})}
function cleanNonTalkAwkward(scene){if(upper(scene?.kind)==='TALK')return;(scene.nodes||[]).forEach(n=>{if(Array.isArray(n.choices))n.choices=n.choices.filter(c=>!String(c?.id||'').endsWith('-awkward'))})}

const completion={
'lc-v1-lucifer-long-ducks':{event:'lucifer.duck_hobby_shared',memory:{title:'작업대 위의 오리',summary:'루시퍼에게 고무 오리를 만드는 일이 생각을 정리하고 작은 실패를 다시 고칠 수 있게 해주는 휴식이라는 말을 들었다.',tags:['lucifer','duck','hobby','lucifer_duck_hobby']}},
'lc-v1-lucifer-long-charlie':{event:'lucifer.charlie_concern_shared',memory:{title:'찰리를 걱정하는 방식',summary:'루시퍼는 찰리의 꿈을 깎아내리는 것이 아니라, 다치지 않도록 곁에서 돕는 방법을 배우고 있다고 말했다.',tags:['lucifer','charlie','family','fatherhood','lucifer_charlie_family']}},
'lc-v1-lucifer-long-fatherhood':{event:'lucifer.fatherhood_regret_shared',memory:{title:'좋은 아버지의 조건',summary:'루시퍼는 자신이 멀리 있는 편이 찰리에게 낫다고 믿었던 시간을 후회하며 이번에는 곁에 남으려 한다고 인정했다.',tags:['lucifer','charlie','fatherhood','regret','lucifer_fatherhood_regret']}},
'lc-v1-lucifer-long-heaven':{event:'lucifer.heaven_topic_opened',memory:{title:'천국이라는 단어',summary:'루시퍼는 천국의 좋은 기억과 상처를 모두 부정하지 않으며, 예전의 자신까지 전부 버리고 싶지는 않다고 말했다.',tags:['lucifer','heaven','past','trust','lucifer_heaven_past']}},
'lc-v1-lucifer-long-close':{event:'lucifer.deep_trust_reached',memory:{title:'남아 있는 사람',summary:'루시퍼는 플레이어가 찾아오는 일을 더 이상 우연처럼 여기지 않으며 곁에 있는 것이 편하다고 인정했다.',tags:['lucifer','trust','relationship','lucifer_deep_trust']}}
};
const flow={
'lc-v1-lucifer-long-ducks':{arcId:'lucifer.duck',arcOrder:1,followUpSceneIds:['lucifer-v1-followup-duck'],affectionCap:2},
'lucifer-v1-followup-duck':{arcId:'lucifer.duck',arcOrder:2,affectionCap:2},
'lc-v1-lucifer-long-charlie':{arcId:'lucifer.family',arcOrder:1,followUpSceneIds:['lc-v1-lucifer-long-fatherhood'],affectionCap:3},
'lc-v1-lucifer-long-fatherhood':{arcId:'lucifer.family',arcOrder:2,followUpSceneIds:['lucifer-v1-followup-charlie'],affectionCap:3},
'lucifer-v1-followup-charlie':{arcId:'lucifer.family',arcOrder:3,affectionCap:3},
'lc-v1-lucifer-long-heaven':{arcId:'lucifer.heaven',arcOrder:1,followUpSceneIds:['lucifer-v1-followup-heaven'],affectionCap:3},
'lucifer-v1-followup-heaven':{arcId:'lucifer.heaven',arcOrder:2,affectionCap:3},
'lc-v1-lucifer-long-close':{arcId:'lucifer.trust',arcOrder:1,affectionCap:3},
'lucifer-v1-annoyed-repair':{arcId:'lucifer.repair',arcOrder:1,affectionCap:0,priorityBoost:8}
};
for(const scene of state.dialogues){
 if(scene?.characterId!==CID)continue;
 cleanNonTalkAwkward(scene);
 if(upper(scene.kind)==='TALK')shapeAffection(scene);
 const meta=state.dialogueMeta[scene.id]||{};
 meta.sceneRole=meta.sceneRole||scene.sceneRole||(upper(scene.kind)==='TALK'?'CONVERSATION':upper(scene.kind));
 meta.conversationType=meta.conversationType||scene.conversationType||(scene.repeatable===false?'PERSONAL':'CASUAL');
 meta.topics=meta.topics||split(scene.topics);meta.followUpTopics=meta.followUpTopics||split(scene.followUpTopics||scene.topics);meta.choiceMeta=meta.choiceMeta||{};meta.choiceTopics=meta.choiceTopics||{};
 (scene.nodes||[]).forEach(n=>(n.choices||[]).forEach(c=>{if(c.nextTopics&&!meta.choiceTopics[c.id])meta.choiceTopics[c.id]=split(c.nextTopics);if(c.moodChange&&!meta.choiceMeta[c.id])meta.choiceMeta[c.id]={moodPersistence:'visit'}}));
 if(scene.openingType)meta.openingType=scene.openingType;
 if(flow[scene.id])Object.assign(meta,flow[scene.id]);
 if(completion[scene.id]){meta.completionEvents=[completion[scene.id].event];meta.completionMemory=completion[scene.id].memory;const nodes=scene.nodes||[],last=nodes[nodes.length-1];for(const c of last?.choices||[]){c.setFlags=removeToken(c.setFlags,completion[scene.id].event);if(String(c.addMemoryTitle||'')===completion[scene.id].memory.title){c.addMemoryTitle='';c.addMemorySummary='';c.addMemoryTags=''}}}
 state.dialogueMeta[scene.id]=meta;
}

try{localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(KEY,String(VERSION));window.__HELLAVERSE_LUCIFER_PILOT_OWNER__={version:VERSION};window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-content-v4'}}))}catch(e){console.warn('Could not seed Lucifer pilot owner',e)}
})();