(()=>{
if(window.__HELLAVERSE_PLAYER_LINE_NORMALIZER_V1__)return;
window.__HELLAVERSE_PLAYER_LINE_NORMALIZER_V1__=1;
const K='hellaverse_dialogue_state_v1';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
try{
  const raw=localStorage.getItem(K);if(!raw)return;
  const state=JSON.parse(raw)||{};
  let changed=0;
  for(const scene of Array.isArray(state.dialogues)?state.dialogues:[]){
    for(const node of Array.isArray(scene?.nodes)?scene.nodes:[]){
      for(const choice of Array.isArray(node?.choices)?node.choices:[]){
        if(!choice||typeof choice!=='object')continue;
        const text=clean(choice.text),player=clean(choice.playerLine);
        if(player&&text&&player===text){
          choice.playerLine='';
          changed++;
        }
      }
    }
  }
  if(changed){
    localStorage.setItem(K,JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'player-line-normalizer',changed}}));
  }
  window.__HELLAVERSE_PLAYER_LINE_NORMALIZER_RESULT__={changed};
}catch(error){
  console.warn('Player Line normalization skipped safely.',error);
}
})();