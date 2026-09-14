(()=>{
if(window.__HELLAVERSE_LUCIFER_MEMORY_EVENT_BRIDGE_V1__)return;
window.__HELLAVERSE_LUCIFER_MEMORY_EVENT_BRIDGE_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_lucifer_memory_event_bridge_v1',CID='lucifer-morningstar';
let done=0;try{done=Number(localStorage.getItem(VK)||0)||0}catch{}if(done>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const merge=(a,b)=>[...new Set([...split(a),...split(b)])].join(', ');
const remove=(v,x)=>split(v).filter(k=>k!==x).join(', ');
const state=read();state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
const scene=id=>state.dialogues.find(s=>s?.id===id);
function patchChoice(id,index,p={}){const c=scene(id)?.nodes?.[0]?.choices?.[index];if(!c)return;if(p.setFlags)c.setFlags=merge(c.setFlags,p.setFlags);if(p.memoryTitle)c.addMemoryTitle=p.memoryTitle;if(p.memorySummary)c.addMemorySummary=p.memorySummary;if(p.memoryTags)c.addMemoryTags=merge(c.addMemoryTags,p.memoryTags)}
function all(id,p={}){const s=scene(id);(s?.nodes?.[0]?.choices||[]).forEach((_,i)=>patchChoice(id,i,p))}

// The optimism conversation itself must stay reachable; it becomes the source for later optimism-gated dialogue.
const optimism=scene('lucifer-room-talk-20');
if(optimism){optimism.requiredFlags=remove(optimism.requiredFlags,'lucifer.optimism_shared');optimism.requiredMemoryTags=remove(optimism.requiredMemoryTags,'lucifer:craft-shared')}

// Existing questions now create the memories/events that later scenes can genuinely remember.
all('lucifer-s12-heaven-20',{setFlags:'lucifer.heaven_topic_opened',memoryTitle:'천국 이야기를 조심스럽게 시작함',memorySummary:'루시퍼가 천국에 좋은 시작과 나쁜 끝이 모두 있었다고 조금 이야기했다.',memoryTags:'lucifer:heaven-open'});
all('lucifer-s12-heaven-40',{setFlags:'lucifer.heaven_topic_opened',memoryTitle:'천국의 과거를 조금 더 들음',memorySummary:'루시퍼가 과거의 믿음과 천국 시절을 단순한 상처 구경이 아닌 이야기로 조금 더 허락했다.',memoryTags:'lucifer:heaven-open, lucifer:past-trust'});
all('lucifer-ask-dream-low',{setFlags:'lucifer.optimism_shared',memoryTitle:'루시퍼에게 아직 남은 꿈을 들음',memorySummary:'루시퍼가 찰리의 꿈을 돕고 다시 무언가를 기대해보고 싶다는 마음을 드러냈다.',memoryTags:'lucifer:optimism'});
all('lucifer-ask-charlie-failure-low',{setFlags:'lucifer.charlie_concern_shared',memoryTitle:'찰리가 실패해도 곁에 있겠다는 말을 들음',memorySummary:'루시퍼가 찰리가 실패하더라도 혼자 두지 않고 선택을 존중하겠다고 말했다.',memoryTags:'lucifer:charlie-care, lucifer:fatherhood'});

// A few ordinary interactions now also have conditional player choices, so the memory system affects the conversation itself.
const work=scene('lucifer-room-talk-17');
if(work?.nodes?.[0]?.choices?.[2]){work.nodes[0].choices[2].requiredFlags=merge(work.nodes[0].choices[2].requiredFlags,'lucifer.player_helped_with_work');work.nodes[0].choices[2].requiredMemoryTags=merge(work.nodes[0].choices[2].requiredMemoryTags,'lucifer:work-help')}
const music=scene('lucifer-room-mono-caught-06');
if(music?.nodes?.[0]?.choices?.[2]){music.nodes[0].choices[2].requiredFlags=merge(music.nodes[0].choices[2].requiredFlags,'lucifer.music_shared');music.nodes[0].choices[2].requiredMemoryTags=merge(music.nodes[0].choices[2].requiredMemoryTags,'lucifer:music-shared')}
const family=scene('lucifer-room-mono-caught-07');
if(family?.nodes?.[0]?.choices?.[2]){family.nodes[0].choices[2].requiredFlags=merge(family.nodes[0].choices[2].requiredFlags,'lucifer.charlie_concern_shared');family.nodes[0].choices[2].requiredMemoryTags=merge(family.nodes[0].choices[2].requiredMemoryTags,'lucifer:charlie-care')}
const room=scene('lucifer-room-talk-23');
if(room?.nodes?.[0]?.choices?.[0]){room.nodes[0].choices[0].requiredFlags=merge(room.nodes[0].choices[0].requiredFlags,'lucifer.deep_trust_reached');room.nodes[0].choices[0].requiredMemoryTags=merge(room.nodes[0].choices[0].requiredMemoryTags,'lucifer:deep-trust')}

if(write(state)){try{localStorage.setItem(VK,'1')}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-memory-event-bridge'}}))}
})();