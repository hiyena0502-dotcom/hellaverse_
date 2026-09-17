const ready=window.__HV_DEFAULT_CONTENT_READY__;
if(ready&&typeof ready.then==='function'){
  try{await ready}catch(error){console.warn('Default content readiness failed safely.',error)}
}

// dialogue-ui reads its authoring metadata from a dedicated render-meta key.
// Keep that view synchronized with canonical state before any dialogue renderer starts.
try{
  const stateKey='hellaverse_dialogue_state_v1';
  const metaKey='hellaverse_dialogue_render_meta_v1';
  const state=JSON.parse(localStorage.getItem(stateKey)||'{}')||{};
  const canonical=state.dialogueMeta&&typeof state.dialogueMeta==='object'&&!Array.isArray(state.dialogueMeta)?state.dialogueMeta:{};
  const local=JSON.parse(localStorage.getItem(metaKey)||'{}')||{};
  for(const [id,value] of Object.entries(canonical)){
    if(!value||typeof value!=='object'||Array.isArray(value))continue;
    const old=local[id]&&typeof local[id]==='object'&&!Array.isArray(local[id])?local[id]:{};
    local[id]={
      ...old,
      ...value,
      nodes:{...(old.nodes||{}),...(value.nodes||{})},
      choiceTopics:{...(old.choiceTopics||{}),...(value.choiceTopics||{})},
      choiceMeta:{...(old.choiceMeta||{}),...(value.choiceMeta||{})}
    };
  }
  localStorage.setItem(metaKey,JSON.stringify(local));
}catch(error){console.warn('Dialogue metadata sync skipped safely.',error)}

const scripts=[
  // Canonical dialogue data must be normalized after the default-content merge, before any renderer reads it.
  ['classic','js/dialogue-episode-upgrade-all.js?v=4'],

  // Dialogue ownership: dialogue-ui is the only runtime that advances conversation state.
  ['module','js/dialogue-ui.js?v=55'],
  ['module','js/hv-stable.js?v=56'],
  ['module','js/event-manager.js?v=50'],
  ['module','js/thought-archive.js?v=51'],
  ['module','js/relationship-editor.js?v=50'],

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

  // Editor-only dialogue helpers. These do not own NEXT / END / room navigation.
  ['classic','js/dialogue-file-editor.js?v=2'],
  ['classic','js/dialogue-episode-flow.js?v=2'],
  ['classic','js/dialogue-episode-editor-v2.js?v=1'],
  ['classic','js/editor-ux-suite.js?v=5'],
  ['classic','js/dialogue-foundation-safety.js?v=4'],

  // Stable SPA bridges and lightweight unified editors.
  ['classic','js/thought-render-bridge.js?v=1'],
  ['classic','js/dialogue-action-control.js?v=1'],
  ['classic','js/collection-gacha-editor.js?v=2'],

  ['classic','js/collection-emoji-corrections.js?v=2'],
  ['classic','js/ux/runtime-diagnostics.js?v=6'],
  ['classic','js/final-ux-cleanup.js?v=14']
];

function absolute(src){return new URL(src,document.baseURI).href}
async function loadModule(src){
  try{await import(absolute(src))}
  catch(error){console.error(`Failed to load module: ${src}`,error)}
}
function loadClassic(src){
  return new Promise(resolve=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.onload=()=>resolve(true);
    script.onerror=()=>{console.error(`Failed to load script: ${src}`);resolve(false)};
    document.head.appendChild(script);
  });
}

for(const [type,src] of scripts){
  if(type==='module')await loadModule(src);
  else await loadClassic(src);
}

window.dispatchEvent(new CustomEvent('hellaverse:runtime-ready'));
