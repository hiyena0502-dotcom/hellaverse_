const ready=window.__HV_DEFAULT_CONTENT_READY__;
if(ready&&typeof ready.then==='function'){
  try{await ready}catch(error){console.warn('Default content readiness failed safely.',error)}
}

function absolute(src){return new URL(src,document.baseURI).href}
async function loadModule(src){try{await import(absolute(src));return true}catch(error){console.error(`Failed to load module: ${src}`,error);return false}}
function loadClassic(src){return new Promise(resolve=>{const script=document.createElement('script');script.src=src;script.async=false;script.onload=()=>resolve(true);script.onerror=()=>{console.error(`Failed to load script: ${src}`);resolve(false)};document.head.appendChild(script)})}

async function loadStableCore(){
  const src='js/hv-stable.js?v=56';
  try{
    const response=await fetch(absolute(src),{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
    let source=await response.text();
    const oldPick="pick=v=>{let a=lines(v);return a.length?a[Math.floor(Math.random()*a.length)]:''}";
    const newPick="pick=v=>{let raw=String(v??'');if(/\\[\\[(?:CHARACTER|NARRATION|PLAYER)\\]\\]/i.test(raw))return raw.trim();let a=lines(v);return a.length?a[Math.floor(Math.random()*a.length)]:''}";
    if(!source.includes(oldPick))throw new Error('hv-stable pick() signature changed');
    source=source.replace(oldPick,newPick);
    const oldStart="function startScene(sid){let s=S.dialogues.find(x=>x.id===sid),c=C(s.characterId)";
    const newStart="function startScene(sid){let s=S.dialogues.find(x=>x.id===sid);if(!s)return;let c=C(s.characterId)";
    if(source.includes(oldStart))source=source.replace(oldStart,newStart);
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

await loadClassic('js/dialogue-episode-upgrade-all.js?v=4');

await loadClassic('js/dialogue-continuity-controller.js?v=5');
await loadClassic('js/room-exit-transition.js?v=2');
await loadStableCore();

const scripts=[
  ['classic','js/dialogue-token-renderer.js?v=2'],
  ['module','js/event-manager.js?v=50'],
  ['module','js/thought-archive.js?v=51'],
  ['module','js/relationship-editor.js?v=51'],
  ['classic','js/relationship-render-bridge.js?v=1'],

  ['classic','js/item-inventory-migration.js?v=1'],
  ['classic','js/item-catalog-rebalance.js?v=2'],
  ['classic','js/satan-paperweight-delivery.js?v=1'],
  ['classic','js/item-system-v2.js?v=1'],
  ['classic','js/item-manager-v2.js?v=2'],
  ['classic','js/item-event-bridge-v2.js?v=1'],

  ['module','js/site-runtime.js?v=67'],
  ['module','js/gacha-collection-addon.js?v=64'],
  ['classic','js/gacha-item-copy-pack.js?v=1'],
  ['classic','js/player-game-loop.js?v=5'],
  ['classic','js/settings-management-hub.js?v=3'],

  ['classic','js/dialogue-file-editor.js?v=2'],
  ['classic','js/dialogue-episode-flow.js?v=2'],
  ['classic','js/dialogue-episode-editor-v2.js?v=1'],
  ['classic','js/dialogue-single-beat-runtime-v22.js?v=1'],
  ['classic','js/editor-ux-suite.js?v=5'],
  ['classic','js/dialogue-foundation-safety.js?v=4'],

  ['classic','js/thought-render-bridge.js?v=2'],
  ['classic','js/collection-gacha-editor.js?v=4'],
  ['classic','js/collection-reveal-line-bridge.js?v=1'],
  ['classic','js/collection-emoji-corrections.js?v=2'],
  ['classic','js/ux/runtime-diagnostics.js?v=6'],
  ['classic','js/final-ux-cleanup.js?v=14'],

  ['classic','js/dialogue-interaction-engine-v2.js?v=1'],
  ['classic','js/dialogue-room-controller-v3.js?v=1']
];

for(const [type,src] of scripts){if(type==='module')await loadModule(src);else await loadClassic(src)}
window.dispatchEvent(new CustomEvent('hellaverse:runtime-ready'));
