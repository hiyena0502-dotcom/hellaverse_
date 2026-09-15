(()=>{
if(window.__HELLAVERSE_DIALOGUE_EDITOR_SIMPLE_V1__)return;
window.__HELLAVERSE_DIALOGUE_EDITOR_SIMPLE_V1__=1;

let queued=false;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function field(id){return document.getElementById(id)?.closest('label')||null}
function moveFields(ids,root,wide=[]){
  const wideSet=new Set(wide);
  for(const id of ids){
    const el=field(id);
    if(!el)continue;
    if(wideSet.has(id))el.classList.add('full','hv-wide');
    root.appendChild(el);
  }
}
function sectionTitle(title,help=''){
  const row=document.createElement('div');
  row.className='hv-section-title';
  row.innerHTML=`<strong>${title}</strong>${help?`<small>${help}</small>`:''}`;
  return row;
}
function previewText(n){
  const text=document.getElementById(`c${n}text`)?.value.trim()||document.getElementById(`c${n}player`)?.value.trim()||'';
  return text||'선택지 내용을 입력하세요';
}
function updateChoicePreview(n,details){
  const preview=$('.hv-choice-preview',details);
  if(preview)preview.textContent=previewText(n);
}
function simplifyChoice(details,n){
  if(!details||details.dataset.hvSimpleChoice==='1')return details;
  details.dataset.hvSimpleChoice='1';
  details.classList.remove('sub-editor');
  details.classList.add('hv-choice-card');
  if(n===1)details.open=true;

  let summary=$(':scope > summary',details);
  if(!summary){summary=document.createElement('summary');details.prepend(summary)}
  summary.innerHTML=`<span class="hv-choice-number">${n}</span><span class="hv-choice-title">CHOICE ${n}<small class="hv-choice-preview"></small></span>`;

  const oldGrid=$(':scope > .form-grid',details);
  const body=document.createElement('div');
  body.className='hv-choice-body';
  const core=document.createElement('div');
  core.className='hv-choice-core';
  moveFields([`c${n}type`,`c${n}text`,`c${n}player`,`c${n}res`,`c${n}delta`],core,[`c${n}player`,`c${n}res`]);

  const more=document.createElement('details');
  more.className='hv-choice-more';
  const moreSummary=document.createElement('summary');
  moreSummary.textContent='조건 & 결과';
  const moreGrid=document.createElement('div');
  moreGrid.className='hv-choice-more-grid';
  moveFields([
    `c${n}req`,`c${n}stage`,`c${n}rmood`,`c${n}lock`,`c${n}mood`,
    `c${n}rflags`,`c${n}bflags`,`c${n}rmem`,`c${n}flags`,`c${n}remove`,
    `c${n}mt`,`c${n}ms`,`c${n}tags`,`c${n}item`,`c${n}next`,`c${n}end`
  ],moreGrid,[`c${n}rflags`,`c${n}bflags`,`c${n}rmem`,`c${n}flags`,`c${n}remove`,`c${n}mt`,`c${n}ms`,`c${n}tags`]);

  if(oldGrid){
    for(const leftover of Array.from(oldGrid.children))moreGrid.appendChild(leftover);
    oldGrid.remove();
  }
  more.append(moreSummary,moreGrid);
  body.append(core,more);
  details.appendChild(body);
  updateChoicePreview(n,details);
  [`c${n}text`,`c${n}player`].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>updateChoicePreview(n,details)));
  return details;
}
function simplifySavedPanel(card){
  let node=card?.nextElementSibling;
  while(node&&node.classList.contains('editor-card'))node=node.nextElementSibling;
  if(node?.classList.contains('saved-panel'))node.classList.add('hv-dialogue-saved-simple');
}
function enhance(){
  const kind=document.getElementById('sKind');
  const card=kind?.closest('.editor-card');
  if(!card||!card.closest('.editor-main'))return;
  if(card.dataset.hvSimpleDialogue==='1'){
    simplifySavedPanel(card);
    return;
  }
  card.dataset.hvSimpleDialogue='1';
  card.classList.add('hv-dialogue-editor-simple');

  const originalLabel=$(':scope > .label',card);
  const originalHelp=$(':scope > .muted',card);
  const form=$(':scope > .form-grid',card);
  const originalDetails=$$(':scope > details.sub-editor',card);
  const choiceDetails=originalDetails.filter(d=>d.querySelector('[id^="c1"],[id^="c2"],[id^="c3"]'));
  const nodeDetails=originalDetails.find(d=>d.querySelector('#sNodesJson'));
  const actions=$(':scope > .button-row',card);

  const head=document.createElement('div');
  head.className='hv-dialogue-editor-head';
  head.innerHTML=`<div><p class="label">DIALOGUE EDITOR</p><h2>대화 만들기</h2><p>대사와 선택지는 바로 편집하고, 조건과 이벤트는 필요할 때만 펼쳐보세요.</p></div><span class="hv-simple-badge">SIMPLE UI</span>`;

  const basic=document.createElement('section');
  basic.className='hv-dialogue-section';
  basic.appendChild(sectionTitle('BASIC','장면에서 바로 보이는 내용'));
  const basicGrid=document.createElement('div');
  basicGrid.className='hv-basic-grid';
  moveFields(['sKind','sTitle','sOpen','sExit','sAfter','sRep'],basicGrid,['sOpen','sExit','sAfter']);
  basic.appendChild(basicGrid);

  const conditions=document.createElement('details');
  conditions.className='hv-advanced-box';
  const conditionsSummary=document.createElement('summary');
  conditionsSummary.textContent='장면 조건';
  const conditionsGrid=document.createElement('div');
  conditionsGrid.className='hv-advanced-grid';
  moveFields(['sReq','sMax','sMood','sFlags','sBlocked','sMem','sItems'],conditionsGrid,['sFlags','sBlocked','sMem','sItems']);
  if(form){for(const leftover of Array.from(form.children))conditionsGrid.appendChild(leftover)}
  conditions.append(conditionsSummary,conditionsGrid);
  basic.appendChild(conditions);

  const choices=document.createElement('section');
  choices.className='hv-dialogue-section';
  choices.appendChild(sectionTitle('CHOICES','선택지별 대사와 결과'));
  const stack=document.createElement('div');
  stack.className='hv-choice-stack';
  choiceDetails.forEach((detail,index)=>stack.appendChild(simplifyChoice(detail,index+1)));
  choices.appendChild(stack);

  if(originalLabel)originalLabel.remove();
  if(originalHelp)originalHelp.remove();
  if(form)form.remove();
  card.prepend(head,basic,choices);

  if(nodeDetails){
    nodeDetails.classList.add('hv-node-json');
    const sum=$(':scope > summary',nodeDetails);
    if(sum)sum.textContent='ADVANCED · NODE JSON';
    card.appendChild(nodeDetails);
  }
  if(actions){actions.classList.add('hv-actions');card.appendChild(actions)}
  simplifySavedPanel(card);
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;enhance()});
}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
if(document.readyState!=='loading')schedule();
})();
