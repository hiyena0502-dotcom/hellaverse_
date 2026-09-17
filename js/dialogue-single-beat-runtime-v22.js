(()=>{
'use strict';
if(window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V22__)return;
window.__HELLAVERSE_SINGLE_BEAT_RUNTIME_V22__=1;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const STATE_KEY='hellaverse_dialogue_state_v1';
let queued=false,bridge=false;
let flow={sceneId:'',start:0,index:0,pending:null,pendingFinish:null};

const isBeat=el=>el instanceof Element&&(el.matches('article.dialogue-line')||el.matches('p.narration')||el.matches('p.dialogue-current'));
const isPlayer=el=>el instanceof Element&&(el.matches('.dialogue-line.you')||String($('strong',el)?.textContent||'').trim().toUpperCase()==='YOU');
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const hide=el=>{if(el){el.hidden=true;el.style.display='none'}};
const show=el=>{if(el){el.hidden=false;el.style.removeProperty('display')}};

function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}}
function textRoot(host){return $('.dialogue-page-text',host)||$('.dialogue-lines',host)}
function allBeats(host){return Array.from(textRoot(host)?.children||[]).filter(isBeat)}
function choiceList(host){return $('.choice-list',host)}
function choiceButtons(host){const list=choiceList(host);return list?$$('[data-choice],[data-gc]',list).filter(b=>!b.disabled):[]}
function rawFinish(host){return $('[data-finish],[data-vn-finish]',host)}
function rawEnd(host){return $('[data-end]',host)}
function rawNext(host){return $('[data-vn-next]',host)}
function hasRawTokens(host){return allBeats(host).some(el=>/\[\[(?:CHARACTER|NARRATION|PLAYER)\]\]/i.test(String(el.textContent||'')))}
function hideCore(host){hide(rawFinish(host));hide(rawEnd(host));hide(rawNext(host))}
function hideChoices(host){hide(choiceList(host))}
function showChoices(host){const list=choiceList(host);if(list)show(list);choiceButtons(host).forEach(show);hideCore(host)}
function ensureNext(host){let b=$('[data-single-beat-next]',host);if(!b){b=document.createElement('button');b.type='button';b.className='dialogue-next single-beat-next hv-next-control';b.dataset.singleBeatNext='1';host.appendChild(b)}return b}
function setNext(b,mode){b.dataset.singleBeatMode=mode;b.innerHTML='NEXT <span>›</span>';show(b)}
function reset(sceneId=''){flow={sceneId:String(sceneId||''),start:0,index:0,pending:null,pendingFinish:null}}
function lookupChoice(id){
  if(!id)return null;const s=readState();
  for(const scene of s.dialogues||[])for(const node of scene?.nodes||[]){const c=(node?.choices||[]).find(x=>String(x?.id||'')===String(id));if(c)return c}
  return null;
}
function removeSpeechEcho(host,pending){
  if(!pending?.suppressEcho)return;
  const beats=allBeats(host);const row=beats[pending.oldCount];
  if(!row||!isPlayer(row))return;
  const text=clean($('p',row)?.textContent||row.textContent||'');
  if(!pending.echo||text===pending.echo)row.remove();
}
function applyPending(host){
  if(flow.pending){
    removeSpeechEcho(host,flow.pending);
    const total=allBeats(host).length;
    if(total<flow.pending.oldCount)return false;
    if(total===flow.pending.oldCount){
      if(performance.now()-flow.pending.at<1600)return false;
      flow.pending=null;
    }else{
      flow.start=Math.min(flow.pending.oldCount,total-1);flow.index=flow.start;flow.pending=null;
    }
  }
  if(flow.pendingFinish){
    const total=allBeats(host).length,old=flow.pendingFinish.oldCount;
    if(total>old){flow.start=old;flow.index=old;flow.pendingFinish=null}
    else if(rawEnd(host)){
      const end=rawEnd(host);flow.pendingFinish=null;requestAnimationFrame(()=>clickHidden(end));return false;
    }else if(performance.now()-flow.pendingFinish.at>1200)flow.pendingFinish=null;
  }
  return true;
}
function render(host){
  if(!host)return;
  if(hasRawTokens(host)){setTimeout(schedule,0);return}
  if(!applyPending(host))return;
  const beats=allBeats(host),total=beats.length;
  const local=ensureNext(host);
  hideChoices(host);hideCore(host);
  if(!total){hide(local);return}
  flow.start=Math.max(0,Math.min(flow.start,total-1));
  flow.index=Math.max(flow.start,Math.min(flow.index,total-1));
  beats.forEach((b,i)=>i===flow.index?show(b):hide(b));
  if(flow.index<total-1){setNext(local,'beat');return}
  if(choiceButtons(host).length){hide(local);showChoices(host);return}
  if(rawNext(host)){setNext(local,'core-next');return}
  if(rawFinish(host)){setNext(local,'finish');return}
  if(rawEnd(host)){setNext(local,'end');return}
  hide(local);
}
function currentHost(){return $('.character-room .dialogue-box')}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{queued=false;render(currentHost())}))}
function clickHidden(target){if(!target||bridge)return false;bridge=true;const h=target.hidden,d=target.style.display;target.hidden=false;target.style.removeProperty('display');try{target.click()}finally{target.hidden=h;target.style.display=d;bridge=false}return true}
function commitChoice(target){
  const host=target.closest('.dialogue-box');if(!host)return;
  const oldCount=allBeats(host).length;
  const choice=target.matches('[data-choice]')?lookupChoice(target.dataset.choice||''):null;
  const echo=clean(choice?.playerLine||choice?.text||target.querySelector('span')?.textContent||'');
  flow.pending={oldCount,echo,suppressEcho:!!choice&&choice.type!=='action',at:performance.now()};
  hideChoices(host);allBeats(host).forEach(hide);hide($('[data-single-beat-next]',host));hideCore(host);
}

window.addEventListener('click',e=>{
  if(bridge)return;const t=e.target instanceof Element?e.target:null;if(!t)return;
  const scene=t.closest('[data-scene]');if(scene){reset(scene.dataset.scene||'');return}
  const choice=t.closest('.character-room .dialogue-box [data-choice],.character-room .dialogue-box [data-gc]');if(choice){commitChoice(choice);return}
  if(t.closest('[data-page="characters"],[data-vn-leave],[data-runtime-leave]'))reset('');
},true);

document.addEventListener('click',e=>{
  if(bridge)return;const t=e.target instanceof Element?e.target:null;if(!t)return;const b=t.closest('[data-single-beat-next]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();const host=b.closest('.dialogue-box');if(!host)return;
  const mode=b.dataset.singleBeatMode||'beat';
  if(mode==='beat'){flow.index++;render(host);return}
  if(mode==='core-next'){clickHidden(rawNext(host));setTimeout(schedule,0);return}
  if(mode==='finish'){
    flow.pendingFinish={oldCount:allBeats(host).length,at:performance.now()};clickHidden(rawFinish(host));setTimeout(schedule,0);return;
  }
  if(mode==='end'){clickHidden(rawEnd(host));setTimeout(schedule,0)}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
