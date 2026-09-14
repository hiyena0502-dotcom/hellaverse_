(()=>{
if(window.__HELLAVERSE_LUCIFER_MEMORY_EVENT_WEAVE_V1__)return;
window.__HELLAVERSE_LUCIFER_MEMORY_EVENT_WEAVE_V1__=1;

const K='hellaverse_dialogue_state_v1';
const VK='hellaverse_lucifer_memory_event_weave_v1';
const CID='lucifer-morningstar';
let done=0;try{done=Number(localStorage.getItem(VK)||0)||0}catch{}if(done>=1)return;

const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const merge=(a,b)=>[...new Set([...split(a),...split(b)])].join(', ');
const now=()=>new Date().toISOString();

const state=read();
state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
state.events=Array.isArray(state.events)?state.events:[];
state.eventCatalog=Array.isArray(state.eventCatalog)?state.eventCatalog:[];
state.memories=Array.isArray(state.memories)?state.memories:[];
state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};

const eventDefs=[
 ['lucifer.player_helped_with_work','업무를 같이 도와줌','플레이어가 루시퍼의 서류나 왕실 업무를 실제로 거들겠다고 나섰다.','MILESTONE'],
 ['lucifer.music_shared','음악 이야기를 함께 나눔','루시퍼가 플레이어 앞에서 음악과 오래된 멜로디에 대한 이야기를 허락했다.','MILESTONE'],
 ['lucifer.apple_tart_shared','사과 타르트를 함께 나눔','루시퍼가 플레이어와 사과 타르트를 나누며 사소한 일상을 공유했다.','MILESTONE'],
 ['lucifer.wings_topic_shared','날개 이야기를 허락함','루시퍼가 자신의 날개와 관리에 관한 개인적인 이야기를 플레이어에게 허락했다.','MILESTONE'],
 ['lucifer.royalty_burden_shared','왕이라는 역할의 부담을 말함','루시퍼가 왕이라는 호칭과 업무가 때때로 부담스럽다는 속내를 드러냈다.','MILESTONE'],
 ['lucifer.stars_past_shared','오래된 별 이야기를 나눔','루시퍼가 오래된 별 지도와 과거의 기억을 플레이어에게 조금 보여주었다.','MILESTONE'],
 ['lucifer.hotel_attachment_shared','호텔에 정이 들었다고 인정함','루시퍼가 찰리의 호텔과 그 안의 소란을 이제는 싫어하지 않는다고 인정했다.','MILESTONE'],
 ['lucifer.player_room_place','방 안에 플레이어의 자리가 생김','루시퍼가 자신의 방에 플레이어가 자연스럽게 머물 자리를 남겨두기 시작했다.','MILESTONE'],
 ['lucifer.private_monologue_caught','혼잣말을 들킴','루시퍼가 혼자 있을 때의 모습을 플레이어에게 들켰고, 완전히 내쫓지는 않았다.','MILESTONE'],
 ['lucifer.family_memory_shared','가족의 오래된 기억을 보여줌','루시퍼가 가족사진과 찰리의 어린 시절에 관한 사적인 기억을 플레이어와 나눴다.','MILESTONE']
];
function upsertEvent(target,def){const [id,name,description,type]=def;const i=target.findIndex(x=>x?.id===id);const next={...(i>=0?target[i]:{}),id,name,description,type,characterId:CID,namespace:'lucifer'};if(i>=0)target[i]=next;else target.push(next)}
for(const def of eventDefs){upsertEvent(state.events,def);upsertEvent(state.eventCatalog,def)}

const scene=id=>state.dialogues.find(s=>s?.id===id);
function gate(id,{events='',memory=''}){const s=scene(id);if(!s)return;s.requiredFlags=merge(s.requiredFlags,events);s.requiredMemoryTags=merge(s.requiredMemoryTags,memory)}
function patchChoice(id,index,patch={}){const s=scene(id),c=s?.nodes?.[0]?.choices?.[index];if(!c)return;if(patch.setFlags)c.setFlags=merge(c.setFlags,patch.setFlags);if(patch.requiredFlags)c.requiredFlags=merge(c.requiredFlags,patch.requiredFlags);if(patch.requiredMemoryTags)c.requiredMemoryTags=merge(c.requiredMemoryTags,patch.requiredMemoryTags);if(patch.memoryTitle)c.addMemoryTitle=patch.memoryTitle;if(patch.memorySummary)c.addMemorySummary=patch.memorySummary;if(patch.memoryTags)c.addMemoryTags=merge(c.addMemoryTags,patch.memoryTags)}
function patchAllChoices(id,patch={}){const s=scene(id);(s?.nodes?.[0]?.choices||[]).forEach((_,i)=>patchChoice(id,i,patch))}
function addMemory(title,summary,tags,sourceId){if(state.memories.some(m=>m.characterId===CID&&m.sourceType==='dialogue-weave'&&m.sourceId===sourceId))return;state.memories.unshift({id:`mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,characterId:CID,type:'event',title,summary,tags:split(tags),sourceType:'dialogue-weave',sourceId,importance:'normal',createdAt:now(),pinned:false,hidden:false})}

// --- Memory/event creation: ordinary room interactions ---
patchAllChoices('lucifer-room-talk-01',{setFlags:'lucifer.duck_hobby_shared',memoryTitle:'오리 설계 이야기를 나눔',memorySummary:'루시퍼가 오리 설계와 만드는 취미를 숨기지 않고 보여주었다.',memoryTags:'lucifer:duck-hobby, lucifer:craft-shared'});
patchChoice('lucifer-room-talk-04',1,{setFlags:'lucifer.player_helped_with_work',memoryTitle:'왕실 서류를 도와주기로 함',memorySummary:'플레이어가 루시퍼의 쌓인 서류를 분류하는 일을 도와주겠다고 했다.',memoryTags:'lucifer:work-help, lucifer:royalty-work'});
patchAllChoices('lucifer-room-talk-05',{setFlags:'lucifer.charlie_concern_shared',memoryTitle:'찰리의 일정표를 함께 봄',memorySummary:'루시퍼가 찰리의 무리한 일정을 걱정하며 돌보고 싶어 하는 모습을 보였다.',memoryTags:'lucifer:charlie-care, lucifer:fatherhood'});
patchChoice('lucifer-room-talk-07',0,{setFlags:'lucifer.apple_tart_shared',memoryTitle:'사과 타르트를 나눠 먹음',memorySummary:'루시퍼가 남겨둔 사과 타르트 한 조각을 플레이어에게 건넸다.',memoryTags:'lucifer:apple-tart, lucifer:daily-comfort'});
patchChoice('lucifer-room-talk-07',1,{setFlags:'lucifer.apple_tart_shared',memoryTitle:'사과 타르트를 나눠 먹음',memorySummary:'루시퍼가 플레이어 몫으로 타르트를 남겨둔 사실을 어설프게 인정했다.',memoryTags:'lucifer:apple-tart, lucifer:daily-comfort'});
patchAllChoices('lucifer-room-talk-08',{setFlags:'lucifer.music_shared',memoryTitle:'피아노 앞에서 음악을 나눔',memorySummary:'루시퍼와 기억나지 않는 멜로디를 두고 이야기를 나눴다.',memoryTags:'lucifer:music-shared, lucifer:melody'});
patchAllChoices('lucifer-room-talk-09',{setFlags:'lucifer.wings_topic_shared',memoryTitle:'날개 이야기를 들음',memorySummary:'루시퍼가 여섯 장의 날개를 관리하는 일에 대해 가볍게 이야기했다.',memoryTags:'lucifer:wings, lucifer:angel-body'});
patchAllChoices('lucifer-room-talk-12',{setFlags:'lucifer.royalty_burden_shared',memoryTitle:'왕이라는 호칭에 대해 들음',memorySummary:'루시퍼가 KING OF HELL이라는 역할이 멋있기만 한 것은 아니라고 말했다.',memoryTags:'lucifer:royalty-burden, lucifer:identity'});
patchAllChoices('lucifer-room-talk-13',{setFlags:'lucifer.alastor_annoyance_shared',memoryTitle:'알래스터에 대한 불평을 들음',memorySummary:'루시퍼가 알래스터를 얼마나 적극적으로 못마땅해하는지 숨기지 않았다.',memoryTags:'lucifer:alastor-annoyance'});
patchChoice('lucifer-room-talk-14',0,{setFlags:'lucifer.charlie_concern_shared',memoryTitle:'찰리에게 줄 선물을 봄',memorySummary:'루시퍼가 찰리를 위해 직접 만든 작은 선물을 보여주었다.',memoryTags:'lucifer:charlie-care, lucifer:charlie-gift'});
patchChoice('lucifer-room-talk-14',2,{setFlags:'lucifer.charlie_concern_shared, lucifer.fatherhood_regret_shared',memoryTitle:'이번에는 직접 전하기로 함',memorySummary:'루시퍼가 찰리에게 줄 선물을 이번에는 직접 건네겠다고 말했다.',memoryTags:'lucifer:charlie-care, lucifer:fatherhood, lucifer:charlie-gift'});
patchChoice('lucifer-room-talk-16',1,{setFlags:'lucifer.stars_past_shared',memoryTitle:'오래된 별 지도를 함께 봄',memorySummary:'루시퍼가 오래된 별 지도를 보며 과거가 생각보다 자주 떠오른다고 인정했다.',memoryTags:'lucifer:stars-past, lucifer:old-map'});
patchAllChoices('lucifer-room-talk-19',{setFlags:'lucifer.hotel_attachment_shared, lucifer.hotel_support_committed',memoryTitle:'호텔에 정이 든 걸 들음',memorySummary:'루시퍼가 호텔의 소란과 찰리가 그 안에 있는 풍경을 이제는 꽤 좋아한다고 인정했다.',memoryTags:'lucifer:hotel-home, lucifer:charlie-care'});
patchAllChoices('lucifer-room-talk-20',{setFlags:'lucifer.optimism_shared',memoryTitle:'다시 기대하는 법을 봄',memorySummary:'루시퍼가 실패한 뒤에도 다시 만들고 다시 기대하는 자신을 인정했다.',memoryTags:'lucifer:optimism, lucifer:craft-shared'});
patchAllChoices('lucifer-room-talk-21',{setFlags:'lucifer.charlie_concern_shared',memoryTitle:'찰리와 닮은 점을 이야기함',memorySummary:'루시퍼가 찰리가 자신을 닮았다는 사실을 농담하면서도 신경 쓰고 있었다.',memoryTags:'lucifer:charlie-care, lucifer:family-similarity'});
patchAllChoices('lucifer-room-talk-23',{setFlags:'lucifer.player_room_place, lucifer.deep_trust_reached',memoryTitle:'루시퍼의 방에 내 자리가 생김',memorySummary:'루시퍼가 플레이어가 자주 앉는 의자를 비워 두기로 했다.',memoryTags:'lucifer:room-place, lucifer:deep-trust'});
patchAllChoices('lucifer-room-talk-24',{setFlags:'lucifer.duck_hobby_shared',memoryTitle:'다음 발명 아이디어를 함께 고름',memorySummary:'루시퍼가 다음에 무엇을 만들지 플레이어의 의견을 물었다.',memoryTags:'lucifer:duck-hobby, lucifer:craft-shared'});

// --- Memory/event creation: caught monologues ---
patchAllChoices('lucifer-room-mono-caught-01',{setFlags:'lucifer.private_monologue_caught',memoryTitle:'인사 연습을 들켜버림',memorySummary:'루시퍼가 플레이어를 어떻게 맞을지 혼자 연습하다 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:embarrassed'});
patchAllChoices('lucifer-room-mono-caught-02',{setFlags:'lucifer.private_monologue_caught, lucifer.alastor_annoyance_shared',memoryTitle:'알래스터 험담을 들음',memorySummary:'루시퍼가 혼자 알래스터를 욕하다가 플레이어에게 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:alastor-annoyance'});
patchAllChoices('lucifer-room-mono-caught-03',{setFlags:'lucifer.private_monologue_caught, lucifer.charlie_concern_shared',memoryTitle:'찰리 칭찬을 연습하는 걸 들음',memorySummary:'루시퍼가 찰리에게 자랑스럽다고 말하는 연습을 혼자 하다 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:charlie-care, lucifer:fatherhood'});
patchChoice('lucifer-room-mono-caught-03',0,{setFlags:'lucifer.fatherhood_regret_shared'});
patchAllChoices('lucifer-room-mono-caught-04',{setFlags:'lucifer.private_monologue_caught, lucifer.duck_hobby_shared',memoryTitle:'오리와 싸우는 걸 들킴',memorySummary:'루시퍼가 작업대 위 오리와 진지하게 실랑이하다 플레이어에게 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:duck-hobby'});
patchAllChoices('lucifer-room-mono-caught-05',{setFlags:'lucifer.private_monologue_caught, lucifer.royalty_burden_shared',memoryTitle:'혼자 업무를 앞두고 마음을 다잡는 걸 봄',memorySummary:'루시퍼가 왕의 업무를 앞두고 혼자 자신을 격려하다 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:royalty-burden'});
patchAllChoices('lucifer-room-mono-caught-06',{setFlags:'lucifer.private_monologue_caught, lucifer.music_shared',memoryTitle:'오래된 노래를 들음',memorySummary:'루시퍼가 아주 오래된 노래를 흥얼거리다 플레이어에게 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:music-shared, lucifer:old-song'});
patchAllChoices('lucifer-room-mono-caught-07',{setFlags:'lucifer.private_monologue_caught, lucifer.family_memory_shared',memoryTitle:'가족사진 이야기를 들음',memorySummary:'루시퍼가 오래된 가족사진을 보며 어린 찰리 이야기를 들려주었다.',memoryTags:'lucifer:private-monologue, lucifer:family-photo, lucifer:charlie-care'});
patchAllChoices('lucifer-room-mono-caught-08',{setFlags:'lucifer.private_monologue_caught, lucifer.heaven_topic_opened',memoryTitle:'천국 시절 장식핀 이야기를 들음',memorySummary:'루시퍼가 천국 시절 물건을 들여다보다 들켰고, 플레이어가 그 이야기를 억지로 캐묻지 않았다.',memoryTags:'lucifer:private-monologue, lucifer:heaven-open, lucifer:heaven-object'});
patchAllChoices('lucifer-room-mono-caught-09',{setFlags:'lucifer.private_monologue_caught, lucifer.charlie_concern_shared',memoryTitle:'찰리 깜짝 선물 계획을 알게 됨',memorySummary:'루시퍼가 찰리를 위한 깜짝 선물을 계획하고 있다는 걸 우연히 알게 되었다.',memoryTags:'lucifer:private-monologue, lucifer:charlie-care, lucifer:charlie-gift'});
patchAllChoices('lucifer-room-mono-caught-10',{setFlags:'lucifer.private_monologue_caught, lucifer.deep_trust_reached',memoryTitle:'이름을 부르다 멈춘 순간',memorySummary:'루시퍼가 과거의 누군가를 떠올리던 사적인 순간에 플레이어가 곁에 남았다.',memoryTags:'lucifer:private-monologue, lucifer:loss-respected, lucifer:deep-trust'});
patchAllChoices('lucifer-room-mono-caught-11',{setFlags:'lucifer.private_monologue_caught, lucifer.deep_trust_reached, lucifer.player_room_place',memoryTitle:'루시퍼가 내 방문을 기다린다는 걸 들음',memorySummary:'루시퍼가 플레이어가 언제 다시 올지 혼잣말하다 딱 들켰다.',memoryTags:'lucifer:private-monologue, lucifer:room-place, lucifer:deep-trust'});

// --- Later dialogue becomes available because earlier conversations happened ---
gate('lucifer-room-talk-20',{events:'lucifer.optimism_shared',memory:'lucifer:craft-shared'});
gate('lucifer-room-talk-21',{events:'lucifer.charlie_concern_shared',memory:'lucifer:charlie-care'});
gate('lucifer-room-talk-24',{events:'lucifer.duck_hobby_shared',memory:'lucifer:duck-hobby'});

gate('lucifer-room-mono-quiet-01',{events:'lucifer.duck_hobby_shared',memory:'lucifer:duck-hobby'});
gate('lucifer-room-mono-quiet-02',{events:'lucifer.charlie_concern_shared',memory:'lucifer:charlie-care'});
gate('lucifer-room-mono-quiet-03',{events:'lucifer.royalty_burden_shared',memory:'lucifer:royalty-burden'});
gate('lucifer-room-mono-quiet-04',{events:'lucifer.music_shared',memory:'lucifer:music-shared'});
gate('lucifer-room-mono-quiet-05',{events:'lucifer.stars_past_shared',memory:'lucifer:stars-past'});
gate('lucifer-room-mono-quiet-06',{events:'lucifer.charlie_concern_shared',memory:'lucifer:charlie-care'});
gate('lucifer-room-mono-quiet-08',{events:'lucifer.family_memory_shared',memory:'lucifer:family-photo'});
gate('lucifer-room-mono-quiet-09',{events:'lucifer.heaven_topic_opened',memory:'lucifer:heaven-open'});
gate('lucifer-room-mono-quiet-11',{events:'lucifer.family_memory_shared',memory:'lucifer:family-photo'});
gate('lucifer-room-mono-quiet-12',{events:'lucifer.fatherhood_regret_shared',memory:'lucifer:fatherhood'});

gate('lucifer-room-mono-caught-06',{events:'lucifer.music_shared',memory:'lucifer:music-shared'});
gate('lucifer-room-mono-caught-07',{events:'lucifer.charlie_concern_shared',memory:'lucifer:charlie-care'});
gate('lucifer-room-mono-caught-08',{events:'lucifer.heaven_topic_opened',memory:'lucifer:heaven-open'});
gate('lucifer-room-mono-caught-09',{events:'lucifer.charlie_concern_shared',memory:'lucifer:charlie-care'});
gate('lucifer-room-mono-caught-10',{events:'lucifer.private_monologue_caught',memory:'lucifer:private-monologue'});
gate('lucifer-room-mono-caught-11',{events:'lucifer.deep_trust_reached, lucifer.player_room_place',memory:'lucifer:room-place'});

gate('lucifer-room-entry-11',{events:'lucifer.private_monologue_caught',memory:'lucifer:private-monologue'});
gate('lucifer-room-entry-17',{events:'lucifer.deep_trust_reached, lucifer.player_room_place',memory:'lucifer:room-place'});
gate('lucifer-room-entry-18',{events:'lucifer.deep_trust_reached, lucifer.player_room_place',memory:'lucifer:room-place'});
gate('lucifer-room-exit-12',{events:'lucifer.deep_trust_reached',memory:'lucifer:room-place'});
gate('lucifer-room-exit-13',{events:'lucifer.deep_trust_reached',memory:'lucifer:room-place'});
gate('lucifer-room-exit-14',{events:'lucifer.deep_trust_reached',memory:'lucifer:room-place'});

// Existing ASK conversations also remember what has already been shared.
gate('lucifer-ask-heaven-people-high',{events:'lucifer.heaven_topic_opened',memory:'lucifer:heaven-open'});
gate('lucifer-ask-lonely-high',{events:'lucifer.deep_trust_reached',memory:'lucifer:deep-trust'});
gate('lucifer-ask-charlie-failure-high',{events:'lucifer.charlie_concern_shared',memory:'lucifer:charlie-care'});
gate('lucifer-ask-dream-high',{events:'lucifer.optimism_shared',memory:'lucifer:optimism'});

// Backfill broad memories/events for players who already saw these scenes before this patch.
const seen=new Set((state.conversationHistory||[]).map(x=>String(x?.sceneId||'')).filter(Boolean));
const backfills=[
 {ids:['lucifer-room-talk-01','lucifer-room-mono-caught-04'],flag:'lucifer.duck_hobby_shared',title:'오리 취미를 함께 봄',summary:'루시퍼의 오리 제작 취미를 이미 본 적이 있다.',tags:'lucifer:duck-hobby, lucifer:craft-shared',source:'backfill-duck'},
 {ids:['lucifer-room-talk-05','lucifer-room-talk-14','lucifer-room-talk-21','lucifer-room-mono-caught-03','lucifer-room-mono-caught-09'],flag:'lucifer.charlie_concern_shared',title:'찰리를 신경 쓰는 모습을 봄',summary:'루시퍼가 찰리를 걱정하고 챙기는 모습을 이미 본 적이 있다.',tags:'lucifer:charlie-care, lucifer:fatherhood',source:'backfill-charlie'},
 {ids:['lucifer-room-talk-08','lucifer-room-mono-caught-06'],flag:'lucifer.music_shared',title:'루시퍼와 음악을 나눔',summary:'루시퍼가 음악이나 오래된 노래에 관한 이야기를 이미 들려준 적이 있다.',tags:'lucifer:music-shared',source:'backfill-music'},
 {ids:['lucifer-room-talk-12','lucifer-room-mono-caught-05'],flag:'lucifer.royalty_burden_shared',title:'왕의 역할에 대한 속내를 들음',summary:'루시퍼가 왕이라는 역할과 업무의 부담을 이미 드러낸 적이 있다.',tags:'lucifer:royalty-burden',source:'backfill-royalty'},
 {ids:['lucifer-room-talk-13','lucifer-room-mono-caught-02'],flag:'lucifer.alastor_annoyance_shared',title:'알래스터에 대한 불평을 들음',summary:'루시퍼가 알래스터를 못마땅해한다는 걸 이미 알고 있다.',tags:'lucifer:alastor-annoyance',source:'backfill-alastor'},
 {ids:['lucifer-room-talk-19'],flag:'lucifer.hotel_attachment_shared',title:'호텔에 정이 든 걸 들음',summary:'루시퍼가 호텔과 그 안의 소란에 정이 들었다는 걸 이미 들었다.',tags:'lucifer:hotel-home, lucifer:charlie-care',source:'backfill-hotel'},
 {ids:['lucifer-room-talk-20'],flag:'lucifer.optimism_shared',title:'다시 기대하는 모습을 봄',summary:'루시퍼가 실패 뒤에도 다시 시도하는 모습을 이미 봤다.',tags:'lucifer:optimism, lucifer:craft-shared',source:'backfill-optimism'},
 {ids:['lucifer-room-talk-23','lucifer-room-mono-caught-11'],flag:'lucifer.player_room_place',title:'루시퍼의 방에 내 자리가 생김',summary:'루시퍼가 플레이어의 방문을 자연스러운 일로 받아들이기 시작했다.',tags:'lucifer:room-place, lucifer:deep-trust',source:'backfill-room'},
 {ids:['lucifer-room-mono-caught-01','lucifer-room-mono-caught-02','lucifer-room-mono-caught-03','lucifer-room-mono-caught-04','lucifer-room-mono-caught-05','lucifer-room-mono-caught-06','lucifer-room-mono-caught-07','lucifer-room-mono-caught-08','lucifer-room-mono-caught-09','lucifer-room-mono-caught-10','lucifer-room-mono-caught-11'],flag:'lucifer.private_monologue_caught',title:'루시퍼의 혼잣말을 들은 적이 있음',summary:'루시퍼가 혼자 있을 때의 모습을 우연히 본 적이 있다.',tags:'lucifer:private-monologue',source:'backfill-monologue'},
 {ids:['lucifer-room-mono-caught-07'],flag:'lucifer.family_memory_shared',title:'가족사진 이야기를 들음',summary:'루시퍼가 가족사진을 보여주며 오래된 가족 이야기를 들려준 적이 있다.',tags:'lucifer:family-photo, lucifer:charlie-care',source:'backfill-family'},
 {ids:['lucifer-room-mono-caught-08','lucifer-room-mono-quiet-09'],flag:'lucifer.heaven_topic_opened',title:'천국 시절 이야기를 조금 들음',summary:'루시퍼가 천국 시절의 물건이나 기억을 완전히 숨기지는 않게 되었다.',tags:'lucifer:heaven-open',source:'backfill-heaven'}
];
for(const b of backfills){if(b.ids.some(id=>seen.has(id))||state.flags[b.flag]){state.flags[b.flag]=true;addMemory(b.title,b.summary,b.tags,b.source)}}
if(state.flags['lucifer.deep_trust_reached'])addMemory('루시퍼의 깊은 신뢰를 얻음','루시퍼가 플레이어의 존재를 편안함과 연결하기 시작했다.','lucifer:deep-trust','backfill-deep-trust');
if(state.flags['lucifer.fatherhood_regret_shared'])addMemory('아버지로서의 후회를 들음','루시퍼가 찰리에게서 멀어졌던 시간을 후회한다고 인정했다.','lucifer:fatherhood','backfill-fatherhood');
if(state.flags['lucifer.optimism_shared'])addMemory('다시 기대하는 마음을 들음','루시퍼가 가능성을 완전히 포기하지 않았다고 말했다.','lucifer:optimism','backfill-optimism-flag');

if(write(state)){
 try{localStorage.setItem(VK,'1')}catch{}
 window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-memory-event-weave'}}));
}
})();