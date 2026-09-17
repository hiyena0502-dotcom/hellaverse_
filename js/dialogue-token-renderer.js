(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_TOKEN_RENDERER_V1__)return;
window.__HELLAVERSE_DIALOGUE_TOKEN_RENDERER_V1__=1;

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
  if(segment.kind==='NARRATION'){
    const p=document.createElement('p');p.className='narration dialogue-narration';p.textContent=segment.text;return p;
  }
  const article=document.createElement('article');article.className=`dialogue-line ${segment.kind==='PLAYER'?'you':'character'}`;
  const strong=document.createElement('strong');strong.textContent=segment.kind==='PLAYER'?'YOU':charName;
  const p=document.createElement('p');p.textContent=segment.text;
  article.append(strong,p);return article;
}
function normalizeBeat(el){
  if(!(el instanceof Element)||el.dataset.hvTokenNormalized==='1')return false;
  const raw=sourceText(el);if(!/\[\[(?:CHARACTER|NARRATION|PLAYER)\]\]/i.test(raw)){el.dataset.hvTokenNormalized='1';return false}
  const parts=parseTagged(raw,kindOf(el));
  if(!parts.length){el.remove();return true}
  const name=speakerFor(el),frag=document.createDocumentFragment();
  for(const part of parts){if(clean(part.text))frag.appendChild(makeBeat(part,name))}
  el.replaceWith(frag);return true;
}
function beatKey(el){
  if(!(el instanceof Element))return'';
  const kind=el.matches('p.narration,.dialogue-narration')?'N':el.matches('.dialogue-line.you')?'P':'C';
  const speaker=kind==='N'?'':clean($('strong',el)?.textContent||'');
  const text=el.matches('article.dialogue-line')?clean($('p',el)?.textContent||''):clean(el.textContent||'');
  return`${kind}|${speaker}|${text}`;
}
function dedupe(container){
  const rows=Array.from(container.children).filter(el=>el.matches?.('article.dialogue-line,p.narration,p.dialogue-current'));
  let previous='';
  for(const row of rows){
    const key=beatKey(row);
    if(key&&key===previous){row.remove();continue}
    if(key)previous=key;
  }
}
function normalizeContainer(container){
  if(!(container instanceof Element))return;
  let changed=false;
  for(const el of Array.from(container.children))if(el.matches?.('article.dialogue-line,p.narration,p.dialogue-current'))changed=normalizeBeat(el)||changed;
  // A tagged element can expand into several beats, so normalize once more only for
  // untouched children and remove accidental consecutive duplicate responses.
  if(changed){for(const el of Array.from(container.children))if(el.matches?.('article.dialogue-line,p.narration,p.dialogue-current'))normalizeBeat(el)}
  dedupe(container);
}
function run(){
  for(const container of $$('.character-room .dialogue-page-text,.character-room .dialogue-lines'))normalizeContainer(container);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('hellaverse:runtime-ready',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
if(document.readyState!=='loading')schedule();
})();
