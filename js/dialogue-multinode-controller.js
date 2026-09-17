(()=>{
'use strict';
if(window.__HELLAVERSE_MULTINODE_CONTROLLER_V1__)return;
window.__HELLAVERSE_MULTINODE_CONTROLLER_V1__=1;

const KEY='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
let pending=null,queued=false;

function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function list(v){return Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean)}
function sceneAndChoice(choiceId,state=read()){
  for(const scene of state.dialogues||[]){
    for(const node of scene?.nodes||[]){
      const choice=(node?.choices||[]).find(ch=>String(ch?.id||'')===String(choiceId||''));
      if(choice)return{scene,node,choice};
    }
  }
  return null;
}
function nodeById(scene,id){return(scene?.nodes||[]).find(n=>String(n?.id||'')===String(id||''))||null}
function heart(state,cid){return Math.max(0,Math.min(100,Number(state.affection?.[cid]?.value||0)))}
function mood(state,cid){return String(state.moods?.[cid]||'NORMAL').trim().toUpperCase()}
function stage(state,cid){
  const h=heart(state,cid),a=state.affection?.[cid]||{};
  if(Array.isArray(a.stageTable)){
    const row=a.stageTable.find(r=>h>=Number(r?.min)&&h<=Number(r?.max));
    if(row?.name)return String(row.name);
  }
  const names=['STRANGER','DISTANT','ACQUAINTANCE','FAMILIAR','COMFORTABLE','FRIENDLY','CLOSE','TRUSTED','BONDED','DEVOTED','SPECIAL'];
  return names[Math.min(10,Math.floor(h/10))]||'STRANGER';
}
function memoryTags(state,cid){return new Set((state.memories||[]).filter(m=>m?.characterId===cid&&!m.hidden).flatMap(m=>list(m.tags)))}
function allowed(choice,state,cid){
  const h=heart(state,cid),min=Number(choice?.requiredAffection||0);
  if(h<min)return{ok:false,reason:`heart ${min}`};
  const reqStage=String(choice?.requiredStage||'').trim();
  if(reqStage&&reqStage.toUpperCase()!==stage(state,cid).toUpperCase())return{ok:false,reason:`stage ${reqStage}`};
  const reqMood=String(choice?.requiredMood||'ANY').trim().toUpperCase();
  if(reqMood&&reqMood!=='ANY'&&reqMood!==mood(state,cid))return{ok:false,reason:`mood ${reqMood}`};
  const flags=state.flags||{};
  if(list(choice?.requiredFlags).some(f=>!flags[f]))return{ok:false,reason:'event'};
  if(list(choice?.blockedFlags).some(f=>!!flags[f]))return{ok:false,reason:'blocked'};
  const tags=memoryTags(state,cid);
  if(list(choice?.requiredMemoryTags).some(t=>!tags.has(t)))return{ok:false,reason:'memory'};
  return{ok:true,reason:''};
}
function makeChoiceButton(choice,index,state,cid){
  const gate=allowed(choice,state,cid),button=document.createElement('button');
  button.type='button';
  button.className=`choice-option${gate.ok?'':' locked'}${choice?.type==='action'?' action-choice':''}`;
  if(gate.ok)button.dataset.choice=String(choice.id||'');else button.disabled=true;
  const num=document.createElement('b');num.textContent=String(index+1).padStart(2,'0');
  const text=document.createElement('span');
  const label=String(choice?.text||choice?.playerLine||'선택');
  text.textContent=!gate.ok&&choice?.lockDisplay==='questionMarks'?'???':choice?.type==='action'?`[${label}]`:label;
  button.append(num,text);
  if(!gate.ok){
    const small=document.createElement('small');small.textContent=`LOCKED · ${gate.reason}`;button.appendChild(small);
    if(choice?.lockDisplay==='hidden')button.hidden=true;
  }
  return button;
}
function buildActions(scene,node,state){
  const choices=Array.isArray(node?.choices)?node.choices:[];
  if(choices.length){
    const listEl=document.createElement('div');listEl.className='choice-list';listEl.dataset.hvNodeChoices=String(node.id||'');
    choices.forEach((choice,i)=>listEl.appendChild(makeChoiceButton(choice,i,state,scene.characterId)));
    return listEl;
  }
  const next=document.createElement('button');
  next.type='button';next.className='dialogue-next hv-next-control';next.dataset.vnFinish='1';
  next.innerHTML='NEXT <span>›</span>';
  return next;
}
function currentText(box){return clean(($('.dialogue-page-text',box)||$('.dialogue-lines',box))?.textContent||'')}
function actionHost(box){return $('.dialogue-page[data-vn-page]',box)||box}
function replaceActions(box,scene,node,state){
  const host=actionHost(box);if(!host)return false;
  // Remove stale choices/progress controls copied from the previous node.
  $$('.choice-list,[data-vn-finish],[data-finish]',host).forEach(el=>el.remove());
  const local=$('[data-single-beat-next]',host);if(local)local.remove();
  host.appendChild(buildActions(scene,node,state));
  host.dataset.hvMultinodeNode=String(node.id||'');
  host.dataset.singleBeatSig='';
  host.dataset.singleBeatIndex='0';
  host.dataset.singleBeatPhase='beat';
  window.dispatchEvent(new CustomEvent('hellaverse:multinode-ready',{detail:{sceneId:scene.id,nodeId:node.id}}));
  return true;
}
function tryApply(){
  if(!pending)return;
  if(performance.now()-pending.at>6000){pending=null;return}
  const state=read(),scene=(state.dialogues||[]).find(s=>String(s?.id||'')===pending.sceneId),node=scene&&nodeById(scene,pending.nodeId);
  if(!scene||!node){pending=null;return}
  const box=$('.character-room .dialogue-box');if(!box)return;
  const text=currentText(box),nodeText=clean(node.text||'');
  // dialogue-ui intentionally shows the chosen response first. Only replace actions
  // when the player has advanced to the actual next node text.
  if(nodeText&&!text.includes(nodeText))return;
  const expected=(node.choices||[]).map(ch=>String(ch.id||'')).filter(Boolean);
  const shown=$$('[data-choice]',box).map(b=>String(b.dataset.choice||''));
  const correct=expected.length===shown.length&&expected.every((id,i)=>id===shown[i]);
  if(correct&&actionHost(box)?.dataset.hvMultinodeNode===String(node.id||'')){pending=null;return}
  if(replaceActions(box,scene,node,state))pending=null;
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;tryApply()})}

// Capture before dialogue-ui/hv-stable mutate the DOM. We only remember the intended
// next node; the existing engine still owns affection, flags, memories and history.
window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target.closest('[data-choice]'):null;
  if(!target)return;
  const found=sceneAndChoice(target.dataset.choice||'');
  const nextId=String(found?.choice?.nextNodeId||'').trim();
  if(!found||!nextId){pending=null;return}
  pending={sceneId:String(found.scene.id||''),nodeId:nextId,choiceId:String(found.choice.id||''),at:performance.now()};
  setTimeout(schedule,0);setTimeout(schedule,70);setTimeout(schedule,180);
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:runtime-ready',schedule);
})();
