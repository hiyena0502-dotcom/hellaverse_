(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_TOKEN_RENDERER_V4__)return;
window.__HELLAVERSE_DIALOGUE_TOKEN_RENDERER_V4__=1;

const KEY='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const TOKEN=/\[\[(CHARACTER|NARRATION|PLAYER)\]\]/ig;
let queued=false;

function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function activeCharacterName(){
  const state=read(),cid=state.active||'';
  return (state.characters||[]).find(c=>c?.id===cid)?.name||'CHARACTER';
}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function looksNarration(v){
  const t=clean(v);if(!t||/^[“"「『]/.test(t))return false;
  if(/^(?:그는|그가|그녀는|그녀가|당신은|당신이|상대는|상대가)\s/.test(t))return true;
  if(/^(?:방 안|침대 위|책상|벽에|문 쪽|작업대|복도|피아노|창가|테이블|바닥|서랍|액자|의자|왕좌|엘리베이터|호텔)\S*\s/.test(t)&&/다\.$/.test(t))return true;
  const subject=t.match(/^([가-힣A-Za-z·.' -]{2,24})(은|는|이|가)\s/);
  return !!(subject&&!/^(?:나|내|너|네|우리|그것|이것|저것|사람들?)$/.test(subject[1].trim())&&/다\.$/.test(t));
}
function upper(v){return clean(v).toUpperCase()}
function kindOf(el){
  if(el?.matches?.('p.narration,.dialogue-narration'))return'NARRATION';
  if(el?.matches?.('.dialogue-line.you'))return'PLAYER';
  return'CHARACTER';
}
function speakerFor(el){return clean($('strong',el)?.textContent)||activeCharacterName()}
function sourceText(el){return el?.matches?.('article.dialogue-line')?String($('p',el)?.textContent||''):String(el?.textContent||'')}
function parseTagged(text,initialKind){
  text=String(text||'');TOKEN.lastIndex=0;
  const out=[];let kind=initialKind||'CHARACTER',last=0,match;
  while((match=TOKEN.exec(text))){
    const before=text.slice(last,match.index).trim();if(before)out.push({kind,text:before});
    kind=String(match[1]||'CHARACTER').toUpperCase();last=TOKEN.lastIndex;
  }
  const tail=text.slice(last).trim();if(tail)out.push({kind,text:tail});
  return out;
}
function makeBeat(segment,charName){
  if(segment.kind==='CHARACTER'&&looksNarration(segment.text))segment={...segment,kind:'NARRATION'};
  if(segment.kind==='NARRATION'){
    const p=document.createElement('p');p.className='narration dialogue-narration';p.dataset.hvTokenNormalized='1';p.textContent=segment.text;return p;
  }
  const article=document.createElement('article');article.className=`dialogue-line ${segment.kind==='PLAYER'?'you':'character'}`;article.dataset.hvTokenNormalized='1';
  const strong=document.createElement('strong');strong.textContent=segment.kind==='PLAYER'?'YOU':charName;
  const p=document.createElement('p');p.textContent=segment.text;
  article.append(strong,p);return article;
}
function normalizeBeat(el){
  if(!(el instanceof Element)||el.dataset.hvTokenNormalized==='1')return false;
  const raw=sourceText(el);if(!/\[\[(?:CHARACTER|NARRATION|PLAYER)\]\]/i.test(raw)){if(kindOf(el)==='CHARACTER'&&looksNarration(raw)){const p=document.createElement('p');p.className='narration dialogue-narration';p.dataset.hvTokenNormalized='1';p.textContent=raw;el.replaceWith(p);return true}el.dataset.hvTokenNormalized='1';return false}
  const parts=parseTagged(raw,kindOf(el));
  if(!parts.length){el.remove();return true}
  const name=speakerFor(el),frag=document.createDocumentFragment();
  for(const part of parts){if(clean(part.text))frag.appendChild(makeBeat(part,name))}
  el.replaceWith(frag);return true;
}
function syncSpeaker(box){
  if(!(box instanceof Element))return;
  const header=Array.from(box.children).find(el=>el.matches?.('.speaker'))||null;
  if(!header)return;
  const charName=upper(activeCharacterName()),headerName=upper(header.textContent);
  const isCharacterHeader=headerName===charName||headerName==='YOU';
  const isScenePlayback=!!box.querySelector(':scope > .dialogue-lines');
  header.classList.toggle('is-redundant-speaker',isScenePlayback&&isCharacterHeader);
}
function normalizeContainer(container){
  if(!(container instanceof Element))return;
  for(const el of Array.from(container.children))if(el.matches?.('article.dialogue-line,p.narration,p.dialogue-current'))normalizeBeat(el);
}
function run(){
  for(const container of $$('.character-room .dialogue-page-text,.character-room .dialogue-lines'))normalizeContainer(container);
  for(const box of $$('.character-room .dialogue-box'))syncSpeaker(box);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('hellaverse:runtime-ready',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
if(document.readyState!=='loading')schedule();
})();