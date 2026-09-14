(()=>{
if(window.__HELLAVERSE_PLAYER_GAME_LOOP_MIGRATE_V2__)return;
window.__HELLAVERSE_PLAYER_GAME_LOOP_MIGRATE_V2__=1;
const K='hellaverse_dialogue_state_v1';
let state={};try{state=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return}
const g=state.game||{};
const oldDone=state.player?.profileSetup&&Number(g.day||1)===1&&g.currentEventId==='hotel-errand'&&g.currentEventResolved===true;
const hasNew=(state.memories||[]).some(m=>m?.sourceType==='player-story'&&m?.sourceId==='day-1-hotel-letter');
if(!oldDone||hasNew)return;
g.currentEventResolved=false;g.currentEventResult='';g.actionsLeft=Math.min(3,Math.max(0,Number(g.actionsLeft||0))+1);
if(Array.isArray(g.actionsToday)){
  let removed=false;
  g.actionsToday=g.actionsToday.filter(a=>{if(!removed&&a?.type==='TODAY'&&/사소한 심부름|hotel-errand/i.test(String(a?.label||''))){removed=true;return false}return true});
}
state.memories=Array.isArray(state.memories)?state.memories.filter(m=>!(m?.sourceType==='player-game'&&m?.sourceId==='day-1-hotel-errand')):[];
state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};state.flags['player.story_letter_v2_migrated']=true;
try{localStorage.setItem(K,JSON.stringify(state));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'thought-archive',clearDirty:false}}))}catch{}
})();