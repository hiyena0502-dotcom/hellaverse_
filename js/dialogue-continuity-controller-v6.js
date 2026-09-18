(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_CONTINUITY_V7__)return;
window.__HELLAVERSE_DIALOGUE_CONTINUITY_V7__=1;

const K='hellaverse_dialogue_state_v1',META='hellaverse_dialogue_render_meta_v1',CHAIN='hv-conversation-chain',CHAIN_TRANSITION='hv-dialogue-chain-transition';
const $=(s,r=document)=>r.querySelector(s);
const up=v=>String(v||'').trim().toUpperCase();
const list=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const clean=v=>String(v||'').replace(/\[\[(?:CHARACTER|NARRATION|PLAYER)\]\]/ig,'').replace(/\s+/g,' ').trim().toLowerCase();
let bridge=false,starting=false,continuing=false,chainCid='',lastStarted='';
let playedIds=new Set(),playedSignatures=new Set();

function read(key=K,f={}){try{return JSON.parse(localStorage.getItem(key)||'')||f}catch{return f}}
function state(){return read(K,{})}
function meta(){return read(META,{})}
function role(sc,s,m){
  const explicit=up(s.dialogueFileMap?.[sc?.id]);if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const r=up(m?.[sc?.id]?.sceneRole||sc?.sceneRole||'');if(r)return r==='QUESTION'?'ASK':r;
  const k=up(sc?.kind||'TALK');return k==='TALK'?'CONVERSATION':k;
}
function sceneMeta(sc,m){return m?.[sc?.id]||{}}
function topics(sc,m){return list(sceneMeta(sc,m).topics||sc?.topics||[])}
function followTopics(sc,m){return list(sceneMeta(sc,m).followUpTopics||sc?.followUpTopics||topics(sc,m))}
function followIds(sc,m){return list(sceneMeta(sc,m).followUpSceneIds||sc?.followUpSceneIds||[])}
function signature(sc){
  const bits=[];if(sc?.opening)bits.push(clean(sc.opening));
  for(const n of sc?.nodes||[]){if(n?.text)bits.push(clean(n.text));for(const c of n?.choices||[]){if(c?.response)bits.push(clean(c.response))}}
  return bits.filter(Boolean).join('|')||`id:${String(sc?.id||'')}`;
}
function stage(s,cid){
  const h=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0))),a=s.affection?.[cid]||{};
  if(Array.isArray(a.stageTable)){const r=a.stageTable.find(x=>h>=Number(x?.min)&&h<=Number(x?.max));if(r?.name)return String(r.name)}
  const names=['STRANGER','DISTANT','ACQUAINTANCE','FAMILIAR','COMFORTABLE','FRIENDLY','CLOSE','TRUSTED','BONDED','DEVOTED','SPECIAL'];return names[Math.min(10,Math.floor(h/10))]||'STRANGER';
}
function memoryTags(s,cid){return new Set((s.memories||[]).filter(x=>x?.characterId===cid&&!x.hidden).flatMap(x=>list(x.tags)))}
function eligible(sc,s,m,cid){
  if(!sc||sc.characterId!==cid||role(sc,s,m)!=='CONVERSATION')return false;
  const h=Math.max(0,Math.min(100,Number(s.affection?.[cid]?.value||0))),min=Number(sc.requiredAffection||0),max=Number(sc.maxAffection==null?100:sc.maxAffection);if(h<min||h>max)return false;
  const reqStage=String(sceneMeta(sc,m).requiredStage||sc.requiredStageOverride||sc.requiredStage||'').trim();if(reqStage&&up(reqStage)!==up(stage(s,cid)))return false;
  const mood=up(s.moods?.[cid]||'NORMAL'),reqMood=up(sc.requiredMood||'ANY');if(reqMood&&reqMood!=='ANY'&&reqMood!==mood)return false;
  const flags=s.flags||{};if(list(sc.requiredFlags).some(f=>!flags[f]))return false;if(list(sc.blockedFlags).some(f=>!!flags[f]))return false;
  const tags=memoryTags(s,cid);if(list(sc.requiredMemoryTags).some(t=>!tags.has(t)))return false;if(list(sc.blockedMemoryTags).some(t=>tags.has(t)))return false;
  const owned=new Set([...(s.ownedItems||[]),...(s.owned||[])]);if(list(sc.requiredItemIds).some(i=>!owned.has(i)))return false;
  if(sc.repeatable===false&&sc.used)return false;return true;
}
function resetSession(cid=''){chainCid=String(cid||'');lastStarted='';playedIds=new Set();playedSignatures=new Set()}
function remember(sc){if(!sc)return;playedIds.add(String(sc.id||''));playedSignatures.add(signature(sc));lastStarted=String(sc.id||'')}
function already(sc){return playedIds.has(String(sc?.id||''))||playedSignatures.has(signature(sc))}
function historyIds(s,cid){return (s.conversationHistory||[]).filter(x=>x?.characterId===cid).map(x=>String(x.sceneId||'')).filter(Boolean)}
function pickConversation(){
  const s=state(),m=meta(),cid=String(s.active||'');if(!cid)return null;if(chainCid&&chainCid!==cid)resetSession(cid);
  let rows=(s.dialogues||[]).filter(sc=>eligible(sc,s,m,cid)&&!already(sc));if(!rows.length)return null;
  const history=historyIds(s,cid),seen=new Set(history),recent=new Set(history.slice(0,8));
  const previous=(s.dialogues||[]).find(sc=>String(sc?.id||'')===lastStarted)||null;
  if(previous){
    const explicit=new Set(followIds(previous,m)),forced=rows.filter(sc=>explicit.has(String(sc.id||'')));if(forced.length)rows=forced;
    else{const wanted=new Set(followTopics(previous,m));if(wanted.size){const topical=rows.filter(sc=>topics(sc,m).some(t=>wanted.has(t)));if(topical.length)rows=topical}}
  }
  const unseen=rows.filter(sc=>!seen.has(String(sc.id||''))&&!sc.used);if(unseen.length)rows=unseen;else{const fresh=rows.filter(sc=>!recent.has(String(sc.id||'')));if(fresh.length)rows=fresh}
  let total=0;const weighted=rows.map(sc=>{let w=Math.max(.1,Number(sc.probability==null?100:sc.probability)/100)*Math.max(.25,1+Number(sc.priority||0));if(!seen.has(String(sc.id||'')))w*=3;total+=w;return{sc,w}});
  let n=Math.random()*Math.max(total,.001);for(const row of weighted){n-=row.w;if(n<=0)return row.sc}return weighted.at(-1)?.sc||rows[0]||null;
}
function sceneById(id){const s=state();return(s.dialogues||[]).find(x=>String(x?.id||'')===String(id))||null}
function roleForId(id){const s=state(),sc=(s.dialogues||[]).find(x=>String(x?.id||'')===String(id));return sc?role(sc,s,meta()):''}
function syntheticScene(sc){
  if(!sc||starting)return false;const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.scene=String(sc.id);b.dataset.hvContinuityBridge='7';host.appendChild(b);
  starting=true;bridge=true;document.body.classList.add(CHAIN);remember(sc);try{b.click()}finally{bridge=false;if(b.isConnected)b.remove();setTimeout(()=>{starting=false},120)}
  requestAnimationFrame(()=>{if($('.character-room .dialogue-box'))document.body.classList.remove(CHAIN_TRANSITION)});
  return true;
}
function startConversation({fresh=false}={}){if(starting||continuing)return false;const cid=String(state().active||'');if(fresh||!chainCid)resetSession(cid);const sc=pickConversation();return sc?syntheticScene(sc):false}
function stopChain(clear=true){try{document.body.classList.remove(CHAIN,CHAIN_TRANSITION)}catch{}starting=false;continuing=false;if(clear)resetSession('')}
function syntheticEnd(){const host=$('.character-room')||$('#app');if(!host)return;const b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.end='';b.dataset.hvContinuityBridge='7';host.appendChild(b);bridge=true;try{b.click()}finally{bridge=false;if(b.isConnected)b.remove()}}
function exhaust(){stopChain();setTimeout(syntheticEnd,0)}
function finishAndContinue(button){
  if(continuing)return;continuing=true;const startedAt=performance.now();
  document.body.classList.add(CHAIN_TRANSITION);
  setTimeout(()=>{
    if(button?.isConnected){bridge=true;try{button.click()}finally{bridge=false}}
    const wait=()=>{
      if(!$('.character-room')){stopChain();return}
      if($('.character-room .dialogue-box')){
        if(performance.now()-startedAt>1800){continuing=false;stopChain(false);return}
        setTimeout(wait,20);return
      }
      continuing=false;
      if(!startConversation())exhaust();
      else requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if($('.character-room .dialogue-box'))document.body.classList.remove(CHAIN_TRANSITION);
      }));
    };
    setTimeout(wait,0);
  },0);
}
function normalizeEnds(){if(!document.body.classList.contains(CHAIN))return;for(const b of document.querySelectorAll('.character-room .dialogue-box [data-end]')){b.dataset.hvContinuityEnd='7';if(String(b.textContent||'').trim().toUpperCase()==='RETURN')b.textContent='NEXT'}}
function schedule(){requestAnimationFrame(normalizeEnds)}

window.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;if(t.closest('[data-vn-leave],[data-runtime-leave],[data-page="characters"],.room-back,[data-room]'))stopChain()},true);
document.addEventListener('click',e=>{
  if(bridge)return;const t=e.target instanceof Element?e.target:null;if(!t)return;
  const sceneButton=t.closest('[data-scene]');
  if(sceneButton){
    const id=String(sceneButton.dataset.scene||''),sceneRole=roleForId(id),sc=sceneById(id);
    if(sceneRole==='EXIT'){stopChain();return}
    if(sceneRole==='CONVERSATION'){
      const chain=document.body.classList.contains(CHAIN);
      if(chain&&already(sc)){e.preventDefault();e.stopImmediatePropagation();setTimeout(()=>{if(!startConversation())exhaust()},0);return}
      if(!chain){resetSession(String(state().active||''));document.body.classList.add(CHAIN)}
      remember(sc)
    }
  }
  const talk=t.closest('.character-room [data-action="TALK"]');if(talk){e.preventDefault();e.stopImmediatePropagation();if(!startConversation({fresh:true}))stopChain();return}
  const end=t.closest('.character-room .dialogue-box [data-end]');if(end&&document.body.classList.contains(CHAIN)){e.preventDefault();e.stopImmediatePropagation();finishAndContinue(end)}
},true);

window.__HV_START_CONVERSATION__=(o={})=>startConversation({fresh:o?.fresh!==false});
window.__HV_STOP_CONVERSATION_CHAIN__=()=>stopChain();
window.__HV_CONVERSATION_CHAIN_ACTIVE__=()=>document.body.classList.contains(CHAIN);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();
