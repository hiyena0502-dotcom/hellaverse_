(()=>{
if(window.__HELLAVERSE_DIALOGUE_FOUNDATION_V2__)return;
window.__HELLAVERSE_DIALOGUE_FOUNDATION_V2__=1;
const K='hellaverse_dialogue_state_v1';
let queued=false,lastAction='',lastAt=0;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function scan(){
  const s=read(),errors=[],warnings=[];
  const err=(where,msg)=>errors.push({where,msg}),warn=(where,msg)=>warnings.push({where,msg});
  const scenes=Array.isArray(s.dialogues)?s.dialogues:[],sceneIds=new Set(),dupes=new Set();
  for(const sc of scenes){const id=String(sc?.id||'').trim();if(!id)err(sc?.title||'Dialogue','Scene ID가 없음');else if(sceneIds.has(id))dupes.add(id);else sceneIds.add(id)}
  dupes.forEach(id=>err(id,'Scene ID 중복'));
  const itemIds=new Set((s.collectionItems||[]).map(x=>String(x?.id||'')).filter(Boolean));
  const eventIds=new Set([...(s.events||[]),...(s.eventCatalog||[])].map(e=>String(e?.id||'')).filter(Boolean));Object.keys(s.flags||{}).forEach(x=>eventIds.add(x));
  for(const sc of scenes){
    const where=sc?.title||sc?.id||'Dialogue',nodes=Array.isArray(sc?.nodes)?sc.nodes:[];
    if(!String(sc?.title||'').trim())err(where,'제목이 비어 있음');
    if(Number(sc?.requiredAffection||0)>Number(sc?.maxAffection??100))err(where,'Required Heart > Max Heart');
    if(!nodes.length)err(where,'Node가 하나도 없음');
    const ids=nodes.map(n=>String(n?.id||'').trim()).filter(Boolean),set=new Set(ids);
    if(ids.length!==set.size)err(where,'Node ID 중복');
    if(nodes.some(n=>!String(n?.id||'').trim()))err(where,'ID 없는 Node 존재');
    if(sc?.openingNodeId&&!set.has(String(sc.openingNodeId)))err(where,`Opening Node를 찾을 수 없음: ${sc.openingNodeId}`);
    for(const n of nodes){
      for(const ch of Array.isArray(n?.choices)?n.choices:[]){
        if(ch?.response&&!String(ch?.text||ch?.playerLine||'').trim())err(where,'반응은 있지만 문장이 빈 Choice 존재');
        if(ch?.nextNodeId&&!set.has(String(ch.nextNodeId)))err(where,`없는 Next Node 참조: ${ch.nextNodeId}`);
        if(ch?.endConversation===false&&!ch?.nextNodeId)warn(where,'Conversation End=false인데 Next Node 없음');
        for(const f of ['requiredFlags','blockedFlags','setFlags','removeFlags'])for(const id of split(ch?.[f]))if(!eventIds.has(id))warn(where,`미등록 Event: ${id}`);
        if(ch?.unlockItemId&&!itemIds.has(String(ch.unlockItemId)))warn(where,`없는 Unlock Item: ${ch.unlockItemId}`);
      }
    }
    for(const f of ['requiredFlags','blockedFlags'])for(const id of split(sc?.[f]))if(!eventIds.has(id))warn(where,`미등록 Event: ${id}`);
    for(const id of split(sc?.requiredItemIds))if(!itemIds.has(id))warn(where,`없는 Required Item: ${id}`);
  }
  for(const g of Array.isArray(s.gifts)?s.gifts:[]){
    const where=`Gift · ${g?.name||g?.id||'Untitled'}`;
    if(!String(g?.name||'').trim())err(where,'이름이 비어 있음');
    if(!g?.choiceA&&(g?.choiceAResponse||Number(g?.choiceADelta||0)||g?.choiceASetFlags||g?.choiceARemoveFlags))err(where,'Choice A 문장 없이 결과만 존재');
    if(!g?.choiceB&&(g?.choiceBResponse||Number(g?.choiceBDelta||0)||g?.choiceBSetFlags||g?.choiceBRemoveFlags))err(where,'Choice B 문장 없이 결과만 존재');
    if(g?.unlockSceneId&&!sceneIds.has(String(g.unlockSceneId)))warn(where,`없는 Unlock Dialogue: ${g.unlockSceneId}`);
  }
  for(const m of Array.isArray(s.memories)?s.memories:[])if(!String(m?.title||'').trim())err(`Memory · ${m?.id||'unknown'}`,'제목이 비어 있음');
  return{errors,warnings};
}
function report(){
  const result=scan(),root=$('#modalRoot')||document.body,total=result.errors.length+result.warnings.length;
  const rows=(list,cls)=>list.slice(0,80).map(x=>`<article class="hv-health-row ${cls}"><strong>${esc(x.where)}</strong><span>${esc(x.msg)}</span></article>`).join('');
  root.innerHTML=`<div class="modal-backdrop" data-hv-health-backdrop><section class="modal-card hv-health-modal"><p class="label">DIALOGUE HEALTH CHECK</p><h2>${result.errors.length?'수정이 필요한 항목이 있어.':result.warnings.length?'큰 오류는 없고 확인할 항목이 있어.':'ALL CLEAR'}</h2><div class="hv-health-summary"><span><b>${result.errors.length}</b> ERRORS</span><span><b>${result.warnings.length}</b> WARNINGS</span><span><b>${total}</b> TOTAL</span></div>${total?`<div class="hv-health-list">${rows(result.errors,'error')}${rows(result.warnings,'warning')}</div>`:'<p class="hv-health-clear">대화/분기/선물/Memory 구조에서 발견된 문제가 없습니다.</p>'}<button class="gold-button" data-hv-health-close>CLOSE</button></section></div>`;
}
function injectCheckButton(){
  const head=$('.hv-dialogue-editor-head');if(!head||$('[data-hv-health-check]',head))return;
  const button=document.createElement('button');button.type='button';button.className='ghost-button hv-health-button';button.dataset.hvHealthCheck='1';button.textContent='CHECK ALL';head.appendChild(button);
}
function runtimeUX(){
  const stage=$('.dialogue-stage');if(!stage)return;
  const lines=$('.dialogue-lines',stage);if(lines){lines.setAttribute('aria-live','polite');lines.setAttribute('aria-relevant','additions text');requestAnimationFrame(()=>{lines.scrollTop=lines.scrollHeight})}
  for(const button of $$('.choice-option',stage)){
    button.type='button';const span=$('span',button);if(span&&!span.textContent.trim())span.textContent='CONTINUE';
    if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',span?.textContent.trim()||'Continue dialogue');
  }
}
function enhance(){injectCheckButton();runtimeUX()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-hv-health-check]')){e.preventDefault();e.stopImmediatePropagation();report();return}
  if(t.closest('[data-hv-health-close]')){e.preventDefault();e.stopImmediatePropagation();const root=$('#modalRoot');if(root)root.innerHTML='';return}
  if(t.matches('.modal-backdrop[data-hv-health-backdrop]')){e.preventDefault();e.stopImmediatePropagation();const root=$('#modalRoot');if(root)root.innerHTML='';return}
  const action=t.closest('[data-choice],[data-scene],[data-gift],[data-gc],[data-finish],[data-end]');
  if(action){const key=[action.dataset.choice,action.dataset.scene,action.dataset.gift,action.dataset.gc,action.hasAttribute('data-finish')?'finish':'',action.hasAttribute('data-end')?'end':''].join('|'),now=performance.now();if(key===lastAction&&now-lastAt<220){e.preventDefault();e.stopImmediatePropagation();return}lastAction=key;lastAt=now}
},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hellaverse:state-updated',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();