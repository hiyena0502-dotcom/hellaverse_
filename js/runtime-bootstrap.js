const ready=window.__HV_DEFAULT_CONTENT_READY__;
if(ready&&typeof ready.then==='function'){
  try{await ready}catch(error){console.warn('Default content readiness failed safely.',error)}
}

function absolute(src){return new URL(src,document.baseURI).href}
async function loadModule(src){try{await import(absolute(src));return true}catch(error){console.error(`Failed to load module: ${src}`,error);return false}}
function loadClassic(src){return new Promise(resolve=>{const script=document.createElement('script');script.src=src;script.async=false;script.onload=()=>resolve(true);script.onerror=(event)=>{console.error(`Failed to load script: ${src}`,event);resolve(false)};document.head.appendChild(script)})}

async function loadStableCore(){
  const src='js/hv-stable.js?v=63';
  try{
    const response=await fetch(absolute(src),{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
    let source=await response.text();
    const oldPick="pick=v=>{let a=lines(v);return a.length?a[Math.floor(Math.random()*a.length)]:''}";
    const newPick="pick=v=>{let raw=String(v??'');if(/\\[\\[(?:CHARACTER|NARRATION|PLAYER)\\]\\]/i.test(raw))return raw.trim();let a=lines(v);return a.length?a[Math.floor(Math.random()*a.length)]:''}";
    if(!source.includes(oldPick))throw new Error('hv-stable pick() signature changed');
    source=source.replace(oldPick,newPick);

    const oldStart="function startScene(sid){let s=S.dialogues.find(x=>x.id===sid),c=C(s.characterId)";
    const newStart="function startScene(sid){let s=S.dialogues.find(x=>x.id===sid);if(!s)return;let c=C(s.characterId)";
    if(!source.includes(oldStart))throw new Error('hv-stable startScene() signature changed');
    source=source.replace(oldStart,newStart);
    const oldSession="sess={type:'scene',sceneId:s.id,cid:c.id,nodeId:n?.id||'',messages:[],delta:0,start:new Date().toISOString(),done:false};";
    const newSession="sess={type:'scene',sceneId:s.id,cid:c.id,nodeId:n?.id||'',messages:[],delta:0,start:new Date().toISOString(),done:false,steps:1,visitedNodeIds:[n?.id||''].filter(Boolean)};";
    if(!source.includes(oldSession))throw new Error('hv-stable scene session signature changed');
    source=source.replace(oldSession,newSession);

    const oldChoose="function chooseOpt(chid){let s=S.dialogues.find(x=>x.id===sess.sceneId),c=C(sess.cid),n=s.nodes.find(x=>x.id===sess.nodeId),ch=n.choices.find(x=>x.id===chid);if(!ch)return;";
    const newChoose="function chooseOpt(chid){if(!sess||sess.done)return;let s=S.dialogues.find(x=>x.id===sess.sceneId);if(!s)return;let c=C(sess.cid),n=s.nodes.find(x=>x.id===sess.nodeId);if(!n)return;let ch=n.choices.find(x=>x.id===chid);if(!ch)return;";
    if(!source.includes(oldChoose))throw new Error('hv-stable chooseOpt() signature changed');
    source=source.replace(oldChoose,newChoose);

    const oldPlayerEcho="if(ch.playerLine||ch.text)sess.messages.push({speaker:ch.type==='action'?'':'YOU',text:ch.playerLine||ch.text,type:ch.type==='action'?'narration':'speech'});";
    const newPlayerEcho="if(ch.type==='action'&&(ch.playerLine||ch.text))sess.messages.push({speaker:'',text:ch.playerLine||ch.text,type:'narration'});";
    if(!source.includes(oldPlayerEcho))throw new Error('hv-stable player-choice signature changed');
    source=source.replace(oldPlayerEcho,newPlayerEcho);

    const oldNext="let next=ch.nextNodeId?s.nodes.find(x=>x.id===ch.nextNodeId):null;if(next){sess.nodeId=next.id;if(next.text)sess.messages.push({speaker:c.name.toUpperCase(),text:next.text,type:'speech'})}else finishScene(s,c);";
    const newNext="let next=ch.nextNodeId?s.nodes.find(x=>x.id===ch.nextNodeId):null,steps=Number(sess.steps||1),visited=Array.isArray(sess.visitedNodeIds)?sess.visitedNodeIds:[sess.nodeId].filter(Boolean);if(next&&steps<5&&!visited.includes(next.id)){sess.steps=steps+1;sess.nodeId=next.id;sess.visitedNodeIds=[...visited,next.id];if(next.text){let ns=String(next.speaker||'character').toLowerCase();sess.messages.push({speaker:ns==='player'?'YOU':ns==='narration'?'':c.name.toUpperCase(),text:next.text,type:ns==='narration'?'narration':'speech'})}}else finishScene(s,c);";
    if(!source.includes(oldNext))throw new Error('hv-stable next-node signature changed');
    source=source.replace(oldNext,newNext);
    const oldFinish="function finishScene(s,c){if(s.exitLine)";
    const newFinish="function finishScene(s,c){if(!s||!c||!sess||sess.done)return;if(s.exitLine)";
    if(!source.includes(oldFinish))throw new Error('hv-stable finishScene() signature changed');
    source=source.replace(oldFinish,newFinish);

    const oldEntry="let e=S.dialogues.filter(s=>s.characterId===cid&&s.kind==='ENTRY'&&okScene(s,cid).ok).sort((a,b)=>b.priority-a.priority)[0];";
    const newEntry="let entries=S.dialogues.filter(s=>s.characterId===cid&&s.kind==='ENTRY'&&okScene(s,cid).ok),maxEntry=entries.length?Math.max(...entries.map(x=>Number(x.priority||0))):-Infinity,entryPool=entries.filter(x=>Number(x.priority||0)>=maxEntry-1),e=entryPool[Math.floor(Math.random()*entryPool.length)]||entries[0];";
    if(source.includes(oldEntry))source=source.replace(oldEntry,newEntry);

    const blob=new Blob([source],{type:'text/javascript'}),url=URL.createObjectURL(blob);
    try{await import(url)}finally{URL.revokeObjectURL(url)}
    return true;
  }catch(error){
    console.error('Patched dialogue core failed; falling back to bundled core.',error);
    return loadModule(src);
  }
}

await loadClassic('js/dialogue-repair-rollback.js?v=2');
const repairReady=window.__HV_DIALOGUE_REPAIR_ROLLBACK_READY__;
if(repairReady&&typeof repairReady.then==='function'){
  try{await repairReady}catch(error){console.warn('Dialogue repair rollback readiness failed safely.',error)}
}

try{
  const stateKey='hellaverse_dialogue_state_v1',metaKey='hellaverse_dialogue_render_meta_v1';
  const state=JSON.parse(localStorage.getItem(stateKey)||'{}')||{};
  const canonical=state.dialogueMeta&&typeof state.dialogueMeta==='object'&&!Array.isArray(state.dialogueMeta)?state.dialogueMeta:{};
  const local=JSON.parse(localStorage.getItem(metaKey)||'{}')||{};
  for(const [id,value] of Object.entries(canonical)){
    if(!value||typeof value!=='object'||Array.isArray(value))continue;
    const old=local[id]&&typeof local[id]==='object'&&!Array.isArray(local[id])?local[id]:{};
    local[id]={...old,...value,nodes:{...(old.nodes||{}),...(value.nodes||{})},choiceTopics:{...(old.choiceTopics||{}),...(value.choiceTopics||{})},choiceMeta:{...(old.choiceMeta||{}),...(value.choiceMeta||{})}};
  }
  localStorage.setItem(metaKey,JSON.stringify(local));
}catch(error){console.warn('Dialogue metadata sync skipped safely.',error)}

await loadClassic('js/dialogue-five-role-cleanup.js?v=1');
await loadClassic('js/hazbin-major-dialogue-expansion-a.js?v=2');
await loadClassic('js/hazbin-major-dialogue-expansion-b.js?v=2');
await loadClassic('js/hazbin-major-dialogue-expansion-c.js?v=2');
await loadClassic('js/charlie-mega-content-pack.js?v=1');
await loadClassic('js/charlie-bright-guilt-duality-pack.js?v=1');
await loadClassic('js/affection-balance-v3.js?v=1');
await loadClassic('js/relationship-friction-dialogues.js?v=1');
await loadClassic('js/dialogue-runtime-temp-cleanup.js?v=2');

await loadClassic('js/dialogue-content-normalize-once-v1.js?v=5');
await loadClassic('js/dialogue-multistage-upgrader-v2.js?v=6');
await loadClassic('js/dialogue-player-line-normalizer.js?v=1');
await loadClassic('js/event-progression-pack-v1.js?v=1');

await loadClassic('js/dialogue-continuity-controller-v6.js?v=4');
await loadClassic('js/room-exit-transition.js?v=4');
await loadStableCore();
await loadClassic('js/event-progression-runtime-v1.js?v=2');
await loadClassic('js/character-ambient-100-runtime-v1.js?v=7');
await loadClassic('js/hazbin-fanon-dialogue-50-v1.js?v=4');

await loadClassic('js/dialogue-token-renderer.js?v=7');
await loadClassic('js/dialogue-single-beat-runtime-v23.js?v=3');
await loadClassic('js/dialogue-interaction-engine-v2.js?v=2');
await loadClassic('js/dialogue-room-controller-v3.js?v=6');

try{localStorage.setItem('hellaverse_dialogue_episode_common_migration_v1','1')}catch{}

const scripts=[
  ['module','js/event-manager.js?v=50'],
  ['module','js/thought-archive.js?v=56'],
  ['module','js/relationship-editor.js?v=51'],
  ['classic','js/relationship-render-bridge.js?v=1'],
  ['classic','js/item-inventory-migration.js?v=1'],
  ['classic','js/item-catalog-rebalance.js?v=2'],
  ['classic','js/charlie-collection-canon-repair-v1.js?v=1'],
  ['classic','js/lucifer-item-dialogue-pack-v1.js?v=1'],
  ['classic','js/satan-paperweight-delivery.js?v=1'],
  ['classic','js/item-gift-character-reactions-v1.js?v=6'],
  ['classic','js/item-system-v2.js?v=4'],
  ['classic','js/item-manager-v2.js?v=3'],
  ['classic','js/item-event-bridge-v2.js?v=1'],
  ['module','js/site-runtime.js?v=67'],
  ['module','js/gacha-collection-addon.js?v=64'],
  ['classic','js/gacha-item-copy-pack.js?v=1'],
  ['classic','js/player-game-loop.js?v=5'],
  ['classic','js/settings-management-hub.js?v=3'],
  ['classic','js/dialogue-file-editor.js?v=4'],
  ['classic','js/dialogue-episode-authoring.js?v=1'],
  ['classic','js/dialogue-episode-editor-v2.js?v=1'],
  ['classic','js/editor-ux-suite.js?v=5'],
  ['classic','js/collection-gacha-editor.js?v=4'],
  ['classic','js/collection-reveal-line-bridge.js?v=1'],
  ['classic','js/collection-emoji-corrections.js?v=2'],
  ['classic','js/ux/runtime-diagnostics.js?v=9'],
  ['classic','js/final-ux-cleanup.js?v=15'],
];

for(const [type,src] of scripts){if(type==='module')await loadModule(src);else await loadClassic(src)}
window.dispatchEvent(new CustomEvent('hellaverse:runtime-ready'));
