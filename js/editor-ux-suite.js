(()=>{
'use strict';
if(window.__HELLAVERSE_EDITOR_UX_SUITE_V3__)return;
window.__HELLAVERSE_EDITOR_UX_SUITE_V3__=1;

let queued=false;
const $=(s,r=document)=>r.querySelector(s);
const byId=id=>document.getElementById(id);
const labelFor=id=>byId(id)?.closest('label')||null;

function move(ids,root,wide=[]){
  const wideSet=new Set(wide);
  for(const id of ids){
    const el=labelFor(id);
    if(!el)continue;
    if(wideSet.has(id))el.classList.add('full','hv-wide');
    root.appendChild(el);
  }
}
function sectionTitle(text,help=''){
  const el=document.createElement('div');
  el.className='hv-suite-title';
  el.innerHTML=`<strong>${text}</strong>${help?`<small>${help}</small>`:''}`;
  return el;
}
function section(name,help=''){
  const el=document.createElement('section');
  el.className='hv-suite-section';
  el.appendChild(sectionTitle(name,help));
  return el;
}
function detailsBox(name,help=''){
  const el=document.createElement('details');
  el.className='hv-suite-details';
  const summary=document.createElement('summary');
  summary.innerHTML=`<span>${name}</span>${help?`<small>${help}</small>`:''}`;
  el.appendChild(summary);
  return el;
}
function head(kicker,title,copy=''){
  const el=document.createElement('div');
  el.className='hv-suite-head';
  el.innerHTML=`<div><p class="label">${kicker}</p><h2>${title}</h2>${copy?`<p>${copy}</p>`:''}</div><span class="hv-suite-badge">SIMPLE</span>`;
  return el;
}
function wrapActions(card,saveSelector,newSelector){
  let row=$('.hv-suite-actions',card);
  if(row)return row;
  const save=$(saveSelector,card),fresh=$(newSelector,card);
  if(!save&&!fresh)return null;
  row=document.createElement('div');
  row.className='button-row hv-suite-actions';
  if(save)row.appendChild(save);
  if(fresh)row.appendChild(fresh);
  card.appendChild(row);
  return row;
}
function markSavedPanel(card){
  const next=card.nextElementSibling;
  if(next?.classList.contains('saved-panel'))next.classList.add('hv-suite-saved');
}

function enhanceGift(){
  const card=byId('gName')?.closest('.editor-card');
  if(!card||card.dataset.hvSuiteGift==='1')return;
  card.dataset.hvSuiteGift='1';
  card.classList.add('hv-suite-card','hv-suite-gift');
  const form=$(':scope > .form-grid',card);
  const basic=section('BASIC','선물과 처음 보이는 반응');
  const bg=document.createElement('div');bg.className='hv-suite-grid';
  move(['gName','gType','gShort','gDelta','gOpen','gRes'],bg,['gShort','gOpen','gRes']);
  basic.appendChild(bg);
  const conditions=detailsBox('조건','호감도 · Stage · Event · Memory · 반복 여부');
  const cg=document.createElement('div');cg.className='hv-suite-grid';
  move(['gReq','gStage','gReqFlags','gBlocked','gReqMem','gRep','gOnce'],cg,['gReqFlags','gBlocked','gReqMem']);
  conditions.appendChild(cg);basic.appendChild(conditions);

  const choices=section('CHOICES','선물을 받은 뒤 선택할 반응');
  const stack=document.createElement('div');stack.className='hv-suite-choice-stack';
  for(const letter of ['A','B']){
    const choice=detailsBox(`CHOICE ${letter}`);choice.classList.add('hv-suite-choice');if(letter==='A')choice.open=true;
    const core=document.createElement('div');core.className='hv-suite-grid';
    move([`g${letter}`,`g${letter}Res`,`g${letter}Delta`],core,[`g${letter}Res`]);choice.appendChild(core);
    const result=detailsBox('선택 결과','Event 설정 / 해제');result.classList.add('hv-suite-inner');
    const rg=document.createElement('div');rg.className='hv-suite-grid';
    move([`g${letter}Set`,`g${letter}Rem`],rg,[`g${letter}Set`,`g${letter}Rem`]);result.appendChild(rg);choice.appendChild(result);stack.appendChild(choice);
  }
  choices.appendChild(stack);

  const result=detailsBox('전체 결과','Mood · Event · Memory · Unlock');
  const resultGrid=document.createElement('div');resultGrid.className='hv-suite-grid';
  move(['gMood','gSet','gRemove','gMT','gMS','gTags','gImp','gItem','gScene'],resultGrid,['gSet','gRemove','gMT','gMS','gTags']);
  if(form)for(const leftover of Array.from(form.children))resultGrid.appendChild(leftover);
  result.appendChild(resultGrid);

  $(':scope > .label',card)?.remove();
  form?.remove();
  card.prepend(head('GIFT EDITOR','선물 반응 만들기','기본 반응만 먼저 작성하고 조건과 보상은 필요할 때 펼치세요.'),basic,choices,result);
  wrapActions(card,'[data-save-gift]','[data-new="gift"]');
  markSavedPanel(card);
}

function enhanceEventModal(){
  const modal=$('.event-definition-modal');
  if(!modal||modal.dataset.hvSuiteEvent==='1')return;
  modal.dataset.hvSuiteEvent='1';
  modal.classList.add('hv-suite-event-modal');
  const name=labelFor('eventDefName'),id=labelFor('eventDefId'),type=labelFor('eventDefType'),desc=labelFor('eventDefDescription');
  const actions=$(':scope > .button-row',modal),oldLabel=$(':scope > .label',modal),oldTitle=$(':scope > h2',modal);
  const title=oldTitle?.textContent||'Event';
  const basic=section('BASIC','화면에서 알아보기 쉬운 이름과 설명');
  const bg=document.createElement('div');bg.className='hv-suite-grid';if(name)bg.appendChild(name);if(desc)bg.appendChild(desc);basic.appendChild(bg);
  const tech=detailsBox('ID & TYPE','대화 조건에서 사용하는 내부 값');
  const tg=document.createElement('div');tg.className='hv-suite-grid';if(id)tg.appendChild(id);if(type)tg.appendChild(type);tech.appendChild(tg);
  oldLabel?.remove();oldTitle?.remove();
  modal.prepend(head('EVENT EDITOR',title,'이름과 설명을 먼저 정하고 내부 ID는 필요할 때 조정하세요.'),basic,tech);
  if(actions){actions.classList.add('hv-suite-actions');modal.appendChild(actions)}
}

function cleanRemovedValidationUI(){
  document.querySelectorAll('.hv-editor-check,[data-hv-health-check],[data-hv-health-backdrop]').forEach(el=>el.remove());
}
function enhance(){
  cleanRemovedValidationUI();
  enhanceGift();
  enhanceEventModal();
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;enhance()});
}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();