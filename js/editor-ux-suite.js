(()=>{
if(window.__HELLAVERSE_EDITOR_UX_SUITE_V2__)return;
window.__HELLAVERSE_EDITOR_UX_SUITE_V2__=1;

const K='hellaverse_dialogue_state_v1';
let queued=false;
const $=(s,r=document)=>r.querySelector(s);
const byId=id=>document.getElementById(id);
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
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
  row=document.createElement('div');row.className='button-row hv-suite-actions';
  if(save)row.appendChild(save);if(fresh)row.appendChild(fresh);card.appendChild(row);return row;
}
function markSavedPanel(card){const next=card.nextElementSibling;if(next?.classList.contains('saved-panel'))next.classList.add('hv-suite-saved')}

function enhanceGift(){
  const card=byId('gName')?.closest('.editor-card');
  if(!card||card.dataset.hvSuiteGift==='1')return;
  card.dataset.hvSuiteGift='1';card.classList.add('hv-suite-card','hv-suite-gift');
  const form=$(':scope > .form-grid',card);
  const basic=section('BASIC','선물과 처음 보이는 반응');
  const bg=document.createElement('div');bg.className='hv-suite-grid';
  move(['gName','gType','gShort','gDelta','gOpen','gRes'],bg,['gShort','gOpen','gRes']);basic.appendChild(bg);
  const conditions=detailsBox('조건','호감도 · Stage · Event · Memory · 반복 여부');
  const cg=document.createElement('div');cg.className='hv-suite-grid';
  move(['gReq','gStage','gReqFlags','gBlocked','gReqMem','gRep','gOnce'],cg,['gReqFlags','gBlocked','gReqMem']);conditions.appendChild(cg);basic.appendChild(conditions);

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

  $(':scope > .label',card)?.remove();form?.remove();
  card.prepend(head('GIFT EDITOR','선물 반응 만들기','기본 반응만 먼저 작성하고 조건과 보상은 필요할 때 펼치세요.'),basic,choices,result);
  wrapActions(card,'[data-save-gift]','[data-new="gift"]');markSavedPanel(card);
}

function enhanceMemory(){
  const card=byId('mTitle')?.closest('.editor-card');
  if(!card||card.dataset.hvSuiteMemory==='1')return;
  card.dataset.hvSuiteMemory='1';card.classList.add('hv-suite-card','hv-suite-memory');
  const form=$(':scope > .form-grid',card);
  const basic=section('MEMORY','플레이 화면에 남길 내용');
  const bg=document.createElement('div');bg.className='hv-suite-grid';move(['mTitle','mSum'],bg,['mSum']);basic.appendChild(bg);
  const meta=detailsBox('분류 옵션','중요도 · Memory Tag');const mg=document.createElement('div');mg.className='hv-suite-grid';
  move(['mImp','mTags'],mg,['mTags']);if(form)for(const leftover of Array.from(form.children))mg.appendChild(leftover);meta.appendChild(mg);
  $(':scope > .label',card)?.remove();form?.remove();
  card.prepend(head('MEMORY EDITOR','기억 기록하기','제목과 요약만으로 저장할 수 있어요.'),basic,meta);
  wrapActions(card,'[data-save-mem]','[data-new="memory"]');markSavedPanel(card);
}

function enhanceEventModal(){
  const modal=$('.event-definition-modal');
  if(!modal||modal.dataset.hvSuiteEvent==='1')return;
  modal.dataset.hvSuiteEvent='1';modal.classList.add('hv-suite-event-modal');
  const name=labelFor('eventDefName'),id=labelFor('eventDefId'),type=labelFor('eventDefType'),desc=labelFor('eventDefDescription');
  const actions=$(':scope > .button-row',modal),oldLabel=$(':scope > .label',modal),oldTitle=$(':scope > h2',modal);
  const basic=section('BASIC','화면에서 알아보기 쉬운 이름과 설명');const bg=document.createElement('div');bg.className='hv-suite-grid';if(name)bg.appendChild(name);if(desc)bg.appendChild(desc);basic.appendChild(bg);
  const tech=detailsBox('ID & TYPE','대화 조건에서 사용하는 내부 값');const tg=document.createElement('div');tg.className='hv-suite-grid';if(id)tg.appendChild(id);if(type)tg.appendChild(type);tech.appendChild(tg);
  oldLabel?.remove();oldTitle?.remove();
  modal.prepend(head('EVENT EDITOR',oldTitle?.textContent||'Event','이름과 설명을 먼저 정하고 내부 ID는 필요할 때 조정하세요.'),basic,tech);
  if(actions){actions.classList.add('hv-suite-actions');modal.appendChild(actions)}
}

function sceneState(){
  const state=read(),errors=[],warnings=[];
  const add=(arr,msg,field)=>arr.push({msg,field});
  if(!byId('sTitle')?.value.trim())add(errors,'대화 제목을 입력해줘.','sTitle');
  const min=Number(byId('sReq')?.value||0),max=Number(byId('sMax')?.value||100);
  if(Number.isFinite(min)&&Number.isFinite(max)&&min>max)add(errors,'Required Heart가 Max Heart보다 클 수 없어.','sReq');

  let nodes=[];const raw=byId('sNodesJson')?.value.trim()||'';
  if(raw){try{const parsed=JSON.parse(raw);Array.isArray(parsed)?nodes=parsed:add(errors,'Node JSON은 배열이어야 해.','sNodesJson')}catch{add(errors,'Node JSON 형식이 깨져 있어.','sNodesJson')}}
  const nodeIds=nodes.map(n=>String(n?.id||'').trim()).filter(Boolean),nodeSet=new Set(nodeIds);
  if(nodeIds.length!==nodeSet.size)add(errors,'Node ID가 중복되어 있어.','sNodesJson');
  if(nodes.some(n=>!String(n?.id||'').trim()))add(errors,'ID가 없는 Node가 있어.','sNodesJson');

  for(let i=1;i<=3;i++){
    const text=byId(`c${i}text`)?.value.trim()||'',player=byId(`c${i}player`)?.value.trim()||'',response=byId(`c${i}res`)?.value.trim()||'',next=byId(`c${i}next`)?.value.trim()||'',end=byId(`c${i}end`)?.value;
    if(response&&!text&&!player)add(errors,`Choice ${i}는 반응은 있는데 선택지 문장이 비어 있어.`,`c${i}text`);
    if((text||player)&&!response)add(warnings,`Choice ${i}에 캐릭터 반응이 비어 있어.`,`c${i}res`);
    if(next&&nodes.length&&!nodeSet.has(next))add(errors,`Choice ${i}의 Next Node "${next}"를 찾을 수 없어.`,`c${i}next`);
    if(end==='false'&&!next)add(warnings,`Choice ${i}는 종료 안 함으로 되어 있지만 Next Node가 없어 실제로는 종료돼.`,`c${i}next`);
  }
  if(!byId('sOpen')?.value.trim()&&!String(nodes[0]?.text||'').trim())add(warnings,'첫 대사가 비어 있어.','sOpen');

  const eventIds=new Set([...(state.events||[]),...(state.eventCatalog||[])].map(e=>String(e?.id||'')).filter(Boolean));
  Object.keys(state.flags||{}).forEach(id=>eventIds.add(id));
  for(const field of ['sFlags','sBlocked','c1rflags','c1bflags','c1flags','c1remove','c2rflags','c2bflags','c2flags','c2remove','c3rflags','c3bflags','c3flags','c3remove']){
    for(const id of split(byId(field)?.value||''))if(!eventIds.has(id))add(warnings,`등록되지 않은 Event ID: ${id}`,field);
  }
  const itemIds=new Set((state.collectionItems||[]).map(x=>String(x?.id||'')).filter(Boolean));
  for(const id of split(byId('sItems')?.value||''))if(!itemIds.has(id))add(warnings,`존재하지 않는 Required Item: ${id}`,'sItems');
  for(let i=1;i<=3;i++){const id=byId(`c${i}item`)?.value.trim()||'';if(id&&!itemIds.has(id))add(warnings,`Choice ${i}의 Unlock Item을 찾을 수 없어: ${id}`,`c${i}item`)}
  return{errors,warnings};
}
function giftState(){
  const errors=[],warnings=[],add=(a,msg,field)=>a.push({msg,field});
  if(!byId('gName')?.value.trim())add(errors,'선물 이름을 입력해줘.','gName');
  for(const letter of ['A','B']){
    const choice=byId(`g${letter}`)?.value.trim()||'',response=byId(`g${letter}Res`)?.value.trim()||'',delta=Number(byId(`g${letter}Delta`)?.value||0),set=byId(`g${letter}Set`)?.value.trim()||'',remove=byId(`g${letter}Rem`)?.value.trim()||'';
    if(!choice&&(response||delta||set||remove))add(errors,`Choice ${letter}의 결과가 있는데 선택지 문장이 비어 있어.`,`g${letter}`);
    if(choice&&!response)add(warnings,`Choice ${letter}에 캐릭터 반응이 비어 있어.`,`g${letter}Res`);
  }
  const unlock=byId('gScene')?.value.trim()||'';
  if(unlock&&!new Set((read().dialogues||[]).map(x=>String(x?.id||''))).has(unlock))add(warnings,`Unlock Dialogue ID를 찾을 수 없어: ${unlock}`,'gScene');
  return{errors,warnings};
}
function memoryState(){
  const errors=[],warnings=[];
  if(!byId('mTitle')?.value.trim())errors.push({msg:'Memory 제목을 입력해줘.',field:'mTitle'});
  if(!byId('mSum')?.value.trim())warnings.push({msg:'Memory 요약이 비어 있어.',field:'mSum'});
  return{errors,warnings};
}
function ensureCheck(card){
  let box=$('.hv-editor-check',card);if(box)return box;
  box=document.createElement('div');box.className='hv-editor-check';
  const h=$('.hv-dialogue-editor-head,.hv-suite-head',card);h?h.after(box):card.prepend(box);return box;
}
function paintCheck(card,result){
  if(!card)return;
  const box=ensureCheck(card),items=[...result.errors.map(x=>'오류 · '+x.msg),...result.warnings.map(x=>'확인 · '+x.msg)];
  const sig=JSON.stringify([result.errors.map(x=>x.msg),result.warnings.map(x=>x.msg)]);
  if(box.dataset.sig===sig)return;
  box.dataset.sig=sig;box.className='hv-editor-check '+(result.errors.length?'is-error':result.warnings.length?'is-warning':'is-ok');
  box.innerHTML=`<strong>${result.errors.length?`저장 전 수정 ${result.errors.length}개`:result.warnings.length?`저장 가능 · 확인 ${result.warnings.length}개`:'저장 준비 완료'}</strong>${items.length?`<div>${items.slice(0,5).map(x=>`<span>${x}</span>`).join('')}</div>`:'<small>구조상 발견된 문제가 없습니다.</small>'}`;
}
function validateVisible(){
  if(byId('sKind'))paintCheck(byId('sKind').closest('.editor-card'),sceneState());
  if(byId('gName'))paintCheck(byId('gName').closest('.editor-card'),giftState());
  if(byId('mTitle'))paintCheck(byId('mTitle').closest('.editor-card'),memoryState());
}
function reveal(field){
  const el=byId(field);if(!el)return;
  let node=el.parentElement;while(node&&node!==document.body){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement}
  el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:'center'});
  const label=el.closest('label');label?.classList.add('hv-field-error');setTimeout(()=>label?.classList.remove('hv-field-error'),2200);
}
function stopInvalid(e,type){
  const result=type==='scene'?sceneState():type==='gift'?giftState():memoryState();
  if(!result.errors.length)return false;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  paintCheck(e.target.closest('.editor-card'),result);reveal(result.errors[0].field);return true;
}
function enhance(){enhanceGift();enhanceMemory();enhanceEventModal();validateVisible()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
  const target=e.target instanceof Element?e.target:null;if(!target)return;
  if(target.closest('[data-save-scene]')&&stopInvalid(e,'scene'))return;
  if(target.closest('[data-save-gift]')&&stopInvalid(e,'gift'))return;
  if(target.closest('[data-save-mem]')&&stopInvalid(e,'memory'))return;
},true);
document.addEventListener('input',e=>{if(e.target.closest('.editor-main,.event-definition-modal'))schedule()});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();