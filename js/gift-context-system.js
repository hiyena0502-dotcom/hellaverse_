(()=>{
if(window.__HELLAVERSE_GIFT_CONTEXT_V3__)return;
window.__HELLAVERSE_GIFT_CONTEXT_V3__=1;

const K='hellaverse_dialogue_state_v1',LUCIFER='lucifer-morningstar';
const CONTEXTS={
  DIRECT:{label:'내가 직접 골랐어요',tag:'DIRECT',note:'직접 골라온 선물이라고 말한다.'},
  DELIVERY:{label:'전해달라고 했어요',tag:'DELIVERY',note:'다른 사람이 전해달라고 한 물건이라고 말한다.'},
  FOUND:{label:'주운 거예요',tag:'FOUND',note:'우연히 발견해서 가져왔다고 말한다.'},
  PRANK:{label:'장난으로 가져왔어요',tag:'PRANK',note:'반응이 궁금해서 장난으로 가져왔다고 말한다.'},
  JUNK:{label:'그냥 줘봤어요',tag:'JUNK',note:'딱히 쓸모는 없지만 그냥 건넨다고 말한다.'}
};
const ORDER=Object.keys(CONTEXTS);
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clamp=v=>Math.max(0,Math.min(100,Number(v||0)));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const list=v=>Array.isArray(v)?v.map(String):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s,source='gift-context'){
  localStorage.setItem(K,JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
}
function cfg(state,id){return{...((state.giftAffectionConfig||{})[id]||{}),...((state.giftContextConfig||{})[id]||{})}}
function tags(c){return new Set(list(c.tags).map(x=>String(x).toLowerCase()))}
function has(t,...q){return q.some(v=>[...t].some(x=>x===v||x.includes(v)))}
function heart(state,cid){return clamp(state.affection?.[cid]?.value||0)}
function pref(g,c,h){
  let tier=h<40?'low':h<80?'mid':'high',p=String(c.preferenceTiers?.[tier]||'').toUpperCase();
  if(c.useTierPreference&&p)return p;
  p=String(c.preference||'').toUpperCase();if(p)return p;
  let d=Number(g.affectionDelta||0);
  return d>=5?'LOVED':d>=3?'LIKED':d>0?'NEUTRAL':d<=-4?'HATED':d<0?'DISLIKED':'NEUTRAL';
}
function meta(state,g,c,kind){
  let h=heart(state,g.characterId),p=pref(g,c,h),t=tags(c),positive=['LOVED','LIKED'].includes(p),negative=['DISLIKED','HATED'].includes(p),sensitive=has(t,'family','charlie','heaven','exorcist','trigger','insult'),treasure=has(t,'duck','mechanical','rare','handmade','apple','music','vintage'),source=String(c.sourceType||'PERSONAL').toUpperCase(),delta=0,mood='';
  if(kind==='DIRECT'&&positive)delta=h>=80?2:h>=30?1:0;
  if(kind==='DELIVERY'){if(source==='CHARLIE'&&positive)delta=1;if(source==='ALASTOR'&&h<40)delta=-1}
  if(kind==='FOUND'){if(treasure&&!negative)delta=1;else if(source==='TRASH'||has(t,'trash','garbage'))delta=-1}
  if(kind==='PRANK'){delta=sensitive?-3:h<40?-2:h>=80&&!negative?0:-1;if(delta<=-2)mood='ANNOYED'}
  if(kind==='JUNK'){delta=treasure&&positive?-1:(source==='TRASH'||has(t,'trash','garbage','insult')?-3:-2);mood='ANNOYED'}
  let custom=c.contextDeltas?.[kind];if(custom!==''&&custom!=null&&Number.isFinite(Number(custom)))delta=Number(custom);
  return{h,p,t,sensitive,treasure,source,delta,mood};
}
function reaction(state,g,c,kind,m){
  let custom=c.contextLines?.[kind];if(String(custom||'').trim())return String(custom).trim();
  if(sourceRule(c).fixed===kind)return'';
  if(g.characterId!==LUCIFER)return{DIRECT:'직접 고른 선물이라는 말에 반응이 조금 누그러진다.',DELIVERY:'누가 보낸 물건인지 다시 확인한다.',FOUND:'주운 물건을 잠시 살펴본다.',PRANK:'장난이었다는 말에 표정이 굳는다.',JUNK:'왜 자신에게 이걸 주는지 이해하지 못한 표정이다.'}[kind]||'';
  let sender=String(c.sourceName||c.sourceType||'').toLowerCase();
  if(kind==='DIRECT')return m.h<30?'"네가 직접 골랐다고? ...그건 기억해둘게."':m.h<70?'"직접 골랐어? 취향 파악 속도가 제법인데."':'"네가 골랐다는 게 물건보다 더 신경 쓰이네."';
  if(kind==='DELIVERY'){
    if(sender.includes('alastor'))return'루시퍼의 표정이 미묘하게 굳는다. "그 사슴이 나한테? 먼저 의심부터 하게 만드는 재주가 있어."';
    if(sender.includes('charlie'))return'그가 바로 물건을 다시 본다. "...찰리가? 뭐라고 하면서 줬어?"';
    if(sender.includes('satan'))return'"사탄이? 직접 주긴 싫었나 보군. 아주 그답네."';
    if(sender.includes('beel')||sender.includes('bee'))return'"비가 보냈어? 상자를 열기 전부터 시끄러운 기분이 드는군."';
    if(sender.includes('mammon'))return'"맘몬이 보냈다고? 가격표부터 확인해야 하나."';
    return`"전달받은 거라고? ${c.sourceName?`${c.sourceName}한테서? `:''}좋아, 일단 보지."`;
  }
  if(kind==='FOUND')return m.treasure?'루시퍼가 물건을 이리저리 돌려본다. "주운 것치고는 꽤 괜찮은데? 이런 건 발견이라고 부르는 거야."':'"길에서 주운 걸 나한테 가져온 거야? 이유는 독특하군."';
  if(kind==='PRANK')return m.sensitive?'웃음기가 사라진다. "그걸 장난이라고 고른 거면, 기준부터 다시 정해야겠는데."':m.h>=70?'그가 당신을 보다가 헛웃음을 친다. "내 반응 보려고? 가까워졌다고 아주 대담해졌군."':'"장난이라고? 지금 웃어야 하는 부분을 조금 더 설명해봐."';
  return m.treasure?'"쓸모없는 거라서 가져왔다고? 잠깐, 이건 아직 쓸 데가 있어."':'루시퍼가 물건과 당신을 번갈아 본다. "...나를 쓰레기통으로 정한 과정이 궁금하군."';
}

let activeGift='',bypassGift='',overlay=null,executing=false,returnBypass=false,resumeTimer=0;
function removeReaction(){document.querySelectorAll('.gift-context-reaction').forEach(x=>x.remove())}
function clearActive(){activeGift='';removeReaction()}
function close(){overlay?.remove();overlay=null}
function sourceRule(c={}){
  const type=String(c.sourceType||'PERSONAL').toUpperCase(),name=String(c.sourceName||'').trim().toLowerCase();
  if(type==='FOUND')return{fixed:'FOUND',allowed:['FOUND']};
  if(type==='TRASH'||name==='you'||name==='player')return{fixed:'',allowed:['DIRECT','PRANK','JUNK']};
  if(['SEVEN_SINS','ALASTOR','CHARLIE','HOTEL','HEAVEN'].includes(type)||(name&&!['you','player','personal'].includes(name)))return{fixed:'DELIVERY',allowed:['DELIVERY']};
  return{fixed:'',allowed:ORDER.slice()};
}
function allowed(state,id){
  const rule=sourceRule(cfg(state,id)),custom=(state.giftContextConfig||{})[id]?.allowed;
  if(!Array.isArray(custom)||!custom.length)return rule.allowed;
  const valid=custom.filter(x=>CONTEXTS[x]&&rule.allowed.includes(x));
  return valid.length?valid:rule.allowed;
}
function clearStalePending(){
  let s=read(),p=s.giftContextPending;
  if(!p)return;
  const age=Date.now()-Date.parse(p.selectedAt||0);
  if(!Number.isFinite(age)||age>120000){delete s.giftContextPending;write(s,'gift-context-cleanup')}
}
function showPicker(button,id){
  let s=read(),g=(s.gifts||[]).find(x=>x.id===id);if(!g)return;
  let c=cfg(s,id);
  if((s.giftContextConfig||{})[id]?.enabled===false){bypassGift=id;activeGift=id;button.click();bypassGift='';return}
  const modes=allowed(s,id);
  if(modes.length===1){choose(modes[0],id,button);return}
  close();removeReaction();
  overlay=document.createElement('div');overlay.className='gift-context-backdrop';overlay.__button=button;
  let src=c.sourceName?`FROM ${c.sourceName}`:String(c.sourceType||'PERSONAL').replace(/_/g,' ');
  overlay.innerHTML=`<section class="gift-context-card"><button type="button" class="gift-context-close" data-gift-context-back aria-label="Back to gifts">×</button><p class="label">HOW WILL YOU GIVE IT?</p><h2>${esc(g.name||'Gift')}</h2><p class="gift-context-source">${esc(src)}${c.category?` · ${esc(c.category)}`:''}</p><p class="muted">하나를 고르면 바로 선물을 건넵니다. 선택 문구는 대화창에 남지 않습니다.</p><div class="gift-context-options">${modes.map((k,i)=>`<button type="button" data-gift-context="${k}" data-gift-id="${esc(id)}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${esc(CONTEXTS[k].label)}</strong><small>${esc(CONTEXTS[k].note)}</small></span></button>`).join('')}</div><button type="button" class="gift-context-back" data-gift-context-back>‹ BACK TO GIFT LIST</button></section>`;
  document.body.appendChild(overlay);
}
function choose(kind,id,buttonOverride=null){
  if(executing||!CONTEXTS[kind])return;
  let s=read(),g=(s.gifts||[]).find(x=>x.id===id);if(!g)return;
  const modes=allowed(s,id);if(!modes.includes(kind))kind=modes[0];if(!kind)return;
  let c=cfg(s,id),m=meta(s,g,c,kind),token=`giftctx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  s.giftContextPending={token,giftId:id,characterId:g.characterId,kind,preHeart:heart(s,g.characterId),sourceName:c.sourceName||'',sourceType:c.sourceType||'PERSONAL',note:CONTEXTS[kind].note,reaction:reaction(s,g,c,kind,m),contextDelta:m.delta,selectedAt:new Date().toISOString()};
  localStorage.setItem(K,JSON.stringify(s));
  activeGift=id;
  let button=buttonOverride||overlay?.__button;
  close();removeReaction();
  if(!button||!button.isConnected){delete s.giftContextPending;write(s,'gift-context-cancelled');activeGift='';return}
  executing=true;bypassGift=id;
  try{button.click()}finally{
    queueMicrotask(()=>{if(bypassGift===id)bypassGift='';executing=false});
    setTimeout(()=>{if(bypassGift===id)bypassGift='';executing=false},60);
  }
}
function finalize(){
  let s=read(),p=s.giftContextPending;if(!p||s.lastGiftResult?.giftId!==p.giftId)return;
  let g=(s.gifts||[]).find(x=>x.id===p.giftId);if(!g){delete s.giftContextPending;write(s);return}
  let c=cfg(s,p.giftId),m=meta(s,g,c,p.kind),before=heart(s,p.characterId),after=clamp(before+m.delta);
  s.affection=s.affection||{};s.affection[p.characterId]={...(s.affection[p.characterId]||{}),value:after};
  s.moods=s.moods||{};if(m.mood)s.moods[p.characterId]=m.mood;
  let use=(s.giftUseHistory||[]).find(x=>x.giftId===p.giftId&&x.characterId===p.characterId&&!x.contextKind);
  if(use){use.contextKind=p.kind;use.contextDelta=m.delta;use.delta=Number(use.delta||0)+m.delta;use.heartAfter=after}
  if(s.lastGiftResult){s.lastGiftResult.contextKind=p.kind;s.lastGiftResult.contextDelta=m.delta;s.lastGiftResult.delta=Number(s.lastGiftResult.delta||0)+m.delta}
  s.giftContextHistory=Array.isArray(s.giftContextHistory)?s.giftContextHistory:[];
  s.giftContextHistory.unshift({id:p.token,giftId:p.giftId,characterId:p.characterId,kind:p.kind,sourceName:p.sourceName,delta:m.delta,heartAfter:after,at:new Date().toISOString()});
  s.giftContextHistory=s.giftContextHistory.slice(0,150);
  let tr=(s.conversationHistory||[]).find(x=>x.characterId===p.characterId&&x.sceneId===p.giftId);
  if(tr){
    tr.messages=Array.isArray(tr.messages)?tr.messages:[];
    if(!tr.messages.some(x=>x.contextToken===p.token)){
      tr.messages.push({speaker:'YOU',text:p.note,type:'narration',contextToken:p.token});
      let ch=(s.characters||[]).find(x=>x.id===p.characterId);
      if(p.reaction)tr.messages.push({speaker:String(ch?.name||'CHARACTER').toUpperCase(),text:p.reaction,type:'speech',contextToken:p.token});
    }
  }
  s.lastGiftContext={...p,contextDelta:m.delta,heartAfter:after,appliedAt:new Date().toISOString()};
  delete s.giftContextPending;write(s);
}
function decorateReaction(){
  if(!activeGift)return;
  let s=read(),p=s.giftContextPending||s.lastGiftContext;
  if(!p||p.giftId!==activeGift||!String(p.reaction||'').trim())return;
  $$('.character-room .dialogue-box').forEach(box=>{
    if(box.querySelector(`[data-gift-context-token="${CSS.escape(p.token)}"]`))return;
    if(box.querySelector('[data-gift]'))return;
    let host=box.querySelector('.dialogue-page-text,.dialogue-lines');if(!host)return;
    let ch=(s.characters||[]).find(x=>x.id===p.characterId);
    host.insertAdjacentHTML('beforeend',`<article class="dialogue-line character gift-context-reaction" data-gift-context-token="${esc(p.token)}"><strong>${esc(ch?.name||'CHARACTER')}</strong><p>${esc(p.reaction)}</p></article>`);
  });
}
function isGiftMenu(box){
  if(!box)return false;
  return !!box.querySelector('[data-gift]')||/SELECT A GIFT|Nothing to give|There is nothing to give yet|GIVE A GIFT/i.test(String(box.textContent||''));
}
function normalizeBackLabels(){
  $$('.character-room .dialogue-box').forEach(box=>{
    if(!isGiftMenu(box))return;
    let b=box.querySelector('[data-end]');if(b&&!b.dataset.giftBackLabel){b.dataset.giftBackLabel='1';b.textContent='BACK TO CONVERSATION'}
  });
}
function scheduleResumeFallback(){
  clearTimeout(resumeTimer);
  resumeTimer=setTimeout(()=>{
    const room=$('.character-room');if(!room)return;
    if(room.querySelector('.dialogue-box'))return;
    const talk=room.querySelector('[data-action="TALK"]');if(talk)talk.click();
  },120);
}
function forceGiftBack(button){
  const room=button.closest('.character-room')||$('.character-room');if(!room)return;
  clearActive();close();
  const hidden=document.createElement('button');hidden.type='button';hidden.hidden=true;hidden.setAttribute('data-end','');room.appendChild(hidden);
  returnBypass=true;
  try{hidden.click()}finally{returnBypass=false;hidden.remove()}
  scheduleResumeFallback();
}

function click(e){
  let t=e.target;if(!(t instanceof Element))return;
  let c=t.closest('[data-gift-context]');
  if(c){e.preventDefault();e.stopImmediatePropagation();choose(c.dataset.giftContext,c.dataset.giftId);return}
  if(t.closest('[data-gift-context-back]')||t.classList.contains('gift-context-backdrop')){
    e.preventDefault();e.stopImmediatePropagation();close();return;
  }
  let vnNext=t.closest('[data-vn-next]');
  if(vnNext&&/BACK TO CONVERSATION/i.test(String(vnNext.textContent||''))){clearActive();scheduleResumeFallback();return}
  let end=t.closest('[data-end]');
  if(end&&!returnBypass){
    let box=end.closest('.dialogue-box');
    if(isGiftMenu(box)||activeGift){e.preventDefault();e.stopImmediatePropagation();forceGiftBack(end);return}
  }
  let leave=t.closest('[data-vn-leave]');if(leave){clearActive();close();return}
  let g=t.closest('[data-gift]');
  if(g){
    let id=String(g.dataset.gift||'');
    if(bypassGift===id){bypassGift='';activeGift=id;return}
    let s=read();
    if((s.gifts||[]).some(x=>x.id===id)){e.preventDefault();e.stopImmediatePropagation();showPicker(g,id);return}
  }
}

let q=false;
function schedule(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;normalizeBackLabels();decorateReaction()})}
function observe(){let app=$('#app');if(app&&!app.dataset.giftContextV2){app.dataset.giftContextV2='1';new MutationObserver(schedule).observe(app,{childList:true,subtree:true})}}

document.addEventListener('click',click,true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay){e.preventDefault();close()}});
window.addEventListener('hellaverse:state-updated',e=>{if(e.detail?.source==='gift-system')setTimeout(finalize,0);schedule()});
document.addEventListener('DOMContentLoaded',()=>{clearStalePending();observe();schedule()});
window.addEventListener('load',()=>{observe();schedule()});
setTimeout(()=>{clearStalePending();observe();schedule()},180);
})();