(()=>{
if(window.__HELLAVERSE_EDITOR_UX_SUITE_V1__)return;
window.__HELLAVERSE_EDITOR_UX_SUITE_V1__=1;

const K='hellaverse_dialogue_state_v1';
let queued=false;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const byId=id=>document.getElementById(id);
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);

function labelFor(id){return byId(id)?.closest('label')||null}
function move(ids,root,wide=[]){
  const ws=new Set(wide);
  for(const id of ids){
    const el=labelFor(id);
    if(!el)continue;
    if(ws.has(id))el.classList.add('full','hv-wide');
    root.appendChild(el);
  }
}
function title(text,help=''){
  const el=document.createElement('div');
  el.className='hv-suite-title';
  el.innerHTML=`<strong>${text}</strong>${help?`<small>${help}</small>`:''}`;
  return el;
}
function detailsBox(name,help=''){
  const d=document.createElement('details');
  d.className='hv-suite-details';
  const s=document.createElement('summary');
  s.innerHTML=`<span>${name}</span>${help?`<small>${help}</small>`:''}`;
  d.appendChild(s);
  return d;
}
function section(name,help=''){
  const s=document.createElement('section');
  s.className='hv-suite-section';
  s.appendChild(title(name,help));
  return s;
}
function cardHead(kicker,heading,copy){
  const h=document.createElement('div');
  h.className='hv-suite-head';
  h.innerHTML=`<div><p class="label">${kicker}</p><h2>${heading}</h2>${copy?`<p>${copy}</p>`:''}</div><span>SIMPLE</span>`;
  return h;
}
function actionsOf(card){return $(':scope > .button-row',card)}
function savedAfter(card){let n=card.nextElementSibling;return n?.classList.contains('saved-panel')?n:null}

function enhanceGift(){
  const anchor=byId('gName');
  const card=anchor?.closest('.editor-card');
  if(!card||card.dataset.hvSuiteGift==='1')return;
  card.dataset.hvSuiteGift='1';card.classList.add('hv-suite-card','hv-suite-gift');
  const form=$(':scope > .form-grid',card),actions=actionsOf(card);
  const head=cardHead('GIFT EDITOR','선물 반응 만들기','자주 쓰는 반응만 먼저 보고, 조건과 결과는 필요할 때 펼치세요.');
  const basic=section('BASIC','선물 이름과 처음 보이는 반응');
  const grid=document.createElement('div');grid.className='hv-suite-grid';
  move(['gName','gType','gShort','gDelta','gOpen','gRes'],grid,['gShort','gOpen','gRes']);basic.appendChild(grid);

  const cond=detailsBox('조건','호감도 · Stage · Event · Memory');
  const cg=document.createElement('div');cg.className='hv-suite-grid';
  move(['gReq','gStage','gReqFlags','gBlocked','gReqMem','gRep','gOnce'],cg,['gReqFlags','gBlocked','gReqMem']);cond.appendChild(cg);basic.appendChild(cond);

  const choices=section('CHOICES','선물을 받은 뒤 플레이어가 고르는 반응');
  const stack=document.createElement('div');stack.className='hv-suite-choice-stack';
  for(const [letter,label] of [['A','CHOICE A'],['B','CHOICE B']]){
    const d=detailsBox(label);d.classList.add('hv-suite-choice');if(letter==='A')d.open=true;
    const core=document.createElement('div');core.className='hv-suite-grid';
    move([`g${letter}`,`g${letter}Res`,`g${letter}Delta`],core,[`g${letter}Res`]);d.appendChild(core);
    const adv=detailsBox('선택 결과','Event 설정/해제');adv.classList.add('hv-suite-inner');
    const ag=document.createElement('div');ag.className='hv-suite-grid';
    move([`g${letter}Set`,`g${letter}Rem`],ag,[`g${letter}Set`,`g${letter}Rem`]);adv.appendChild(ag);d.appendChild(adv);stack.appendChild(d);
  }
  choices.appendChild(stack);

  const result=detailsBox('전체 결과','Mood · Event · Memory · Unlock');
  const rg=document.createElement('div');rg.className='hv-suite-grid';
  move(['gMood','gSet','gRemove','gMT','gMS','gTags','gImp','gItem','gScene'],rg,['gSet','gRemove','gMT','gMS','gTags']);
  if(form){for(const left of Array.from(form.children))rg.appendChild(left)}
  result.appendChild(rg);

  const oldLabel=$(':scope > .label',card);if(oldLabel)oldLabel.remove();if(form)form.remove();
  card.prepend(head,basic,choices,result);if(actions){actions.classList.add('hv-suite-actions');card.appendChild(actions)}
  savedAfter(card)?.classList.add('hv-suite-saved');
}

function enhanceMemory(){
  const anchor=byId('mTitle');
  const card=anchor?.closest('.editor-card');
  if(!card||card.dataset.hvSuiteMemory==='1')return;
  card.dataset.hvSuiteMemory='1';card.classList.add('hv-suite-card','hv-suite-memory');
  const form=$(':scope > .form-grid',card),actions=actionsOf(card);
  const head=cardHead('MEMORY EDITOR','기억 기록하기','제목과 요약만으로 저장할 수 있고, 분류는 필요할 때만 설정하세요.');
  const basic=section('MEMORY','실제로 보여줄 내용');
  const grid=document.createElement('div');grid.className='hv-suite-grid';move(['mTitle','mSum'],grid,['mSum']);basic.appendChild(grid);
  const meta=detailsBox('분류 옵션','중요도 · Memory Tag');
  const mg=document.createElement('div');mg.className='hv-suite-grid';move(['mImp','mTags'],mg,['mTags']);if(form){for(const left of Array.from(form.children))mg.appendChild(left)}meta.appendChild(mg);
  const oldLabel=$(':scope > .label',card);if(oldLabel)oldLabel.remove();if(form)form.remove();
  card.prepend(head,basic,meta);if(actions){actions.classList.add('hv-suite-actions');card.appendChild(actions)}
  savedAfter(card)?.classList.add('hv-suite-saved');
}

function enhanceEventModal(){
  const modal=$('.event-definition-modal');
  if(!modal||modal.dataset.hvSuiteEvent==='1')return;
  modal.dataset.hvSuiteEvent='1';modal.classList.add('hv-suite-event-modal');
  const name=labelFor('eventDefName'),id=labelFor('eventDefId'),type=labelFor('eventDefType'),desc=labelFor('eventDefDescription');
  const actions=$('.button-row',modal);const kicker=$(':scope > .label',modal);const h2=$(':scope > h2',modal);
  const head=document.createElement('div');head.className='hv-suite-modal-head';
  head.innerHTML=`<p class="label">EVENT EDITOR</p><h2>${h2?.textContent||'Event'}</h2><p>이름과 설명만 먼저 작성하고, ID와 종류는 필요할 때 조정하세요.</p>`;
  const basic=section('BASIC','게임에서 알아보기 쉬운 이름과 설명');const bg=document.createElement('div');bg.className='hv-suite-grid';if(name)bg.appendChild(name);if(desc)bg.appendChild(desc);basic.appendChild(bg);
  const technical=detailsBox('ID & TYPE','대화 조건에서 사용하는 내부 값');const tg=document.createElement('div');tg.className='hv-suite-grid';if(id)tg.appendChild(id);if(type)tg.appendChild(type);technical.appendChild(tg);
  if(kicker)kicker.remove();if(h2)h2.remove();modal.prepend(head,basic,technical);if(actions){actions.classList.add('hv-suite-actions');modal.appendChild(actions)}
}

function sceneState(){
  const state=read();
  const errors=[],warnings=[];
  const add=(arr,msg,field)=>arr.push({msg,field});
  const title=byId('sTitle')?.value.trim()||'';
  if(!title)add(errors,'대화 제목을 입력해줘.','sTitle');
  const min=Number(byId('sReq')?.value||0),max=Number(byId('sMax')?.value||100);
  if(Number.isFinite(min)&&Number.isFinite(max)&&min>max)add(errors,'Required Heart가 Max Heart보다 클 수 없어.','sReq');

  let nodes=[];const raw=byId('sNodesJson')?.value.trim()||'';
  if(raw){
    try{const parsed=JSON.parse(raw);if(!Array.isArray(parsed))add(errors,'Node JSON은 배열이어야 해.','sNodesJson');else nodes=parsed}
    catch{add(errors,'Node JSON 형식이 깨져 있어.','sNodesJson')}
  }
  const ids=nodes.map(n=>String(n?.id||'').trim()).filter(Boolean),set=new Set(ids);
  if(ids.length!==set.size)add(errors,'Node ID가 중복되어 있어.','sNodesJson');
  if(nodes.some(n=>!String(n?.id||'').trim()))add(errors,'ID가 없는 Node가 있어.','sNodesJson');
  for(let i=1;i<=3;i++){
    const text=byId(`c${i}text`)?.value.trim()||'',player=byId(`c${i}player`)?.value.trim()||'',res=byId(`c${i}res`)?.value.trim()||'',next=byId(`c${i}next`)?.value.trim()||'',end=byId(`c${i}end`)?.value;
    if(res&&!text&&!player)add(errors,`Choice ${i}는 반응은 있는데 선택지 문장이 비어 있어.`,`c${i}text`);
    if((text||player)&&!res)add(warnings,`Choice ${i}에 캐릭터 반응이 비어 있어.`,`c${i}res`);
    if(next&&nodes.length&&!set.has(next))add(errors,`Choice ${i}의 Next Node "${next}"를 찾을 수 없어.`,`c${i}next`);
    if(end==='false'&&!next)add(warnings,`Choice ${i}는 Conversation End=false지만 Next Node가 없어 실제로는 종료돼.`,`c${i}next`);
  }
  const opening=byId('sOpen')?.value.trim()||'';
  if(!opening&&!String(nodes[0]?.text||'').trim())add(warnings,'첫 대사가 비어 있어.','sOpen');

  const eventIds=new Set([...(state.events||[]),...(state.eventCatalog||[])].map(e=>String(e?.id||'')).filter(Boolean));
  Object.keys(state.flags||{}).forEach(x=>eventIds.add(x));
  const eventFields=['sFlags','sBlocked','c1rflags','c1bflags','c1flags','c1remove','c2rflags','c2bflags','c2flags','c2remove','c3rflags','c3bflags','c3flags','c3remove'];
  for(const fid of eventFields)for(const token of split(byId(fid)?.value||''))if(!eventIds.has(token))add(warnings,`등록되지 않은 Event ID: ${token}`,fid);
  const itemIds=new Set((state.collectionItems||[]).map(i=>String(i?.id||'')).filter(Boolean));
  for(const token of split(byId('sItems')?.value||''))if(!itemIds.has(token))add(warnings,`존재하지 않는 Required Item: ${token}`,'sItems');
  for(let i=1;i<=3;i++){const item=byId(`c${i}item`)?.value.trim()||'';if(item&&!itemIds.has(item))add(warnings,`Choice ${i}의 Unlock Item을 찾을 수 없어: ${item}`,`c${i}item`)}
  return{errors,warnings};
}
function giftState(){
  const errors=[],warnings=[];const add=(a,msg,field)=>a.push({msg,field});
  if(!byId('gName')?.value.trim())add(errors,'선물 이름을 입력해줘.','gName');
  for(const l of ['A','B']){
    const choice=byId(`g${l}`)?.value.trim()||'',res=byId(`g${l}Res`)?.value.trim()||'',delta=Number(byId(`g${l}Delta`)?.value||0),set=byId(`g${l}Set`)?.value.trim()||'',rem=byId(`g${l}Rem`)?.value.trim()||'';
    if(!choice&&(res||delta||set||rem))add(errors,`Choice ${l}의 결과가 있는데 선택지 문장이 비어 있어.`,`g${l}`);
    if(choice&&!res)add(warnings,`Choice ${l}에 캐릭터 반응이 비어 있어.`,`g${l}Res`);
  }
  const unlock=byId('gScene')?.value.trim()||'';if(unlock){const ids=new Set((read().dialogues||[]).map(s=>String(s?.id||'')));if(!ids.has(unlock))add(warnings,`Unlock Dialogue ID를 찾을 수 없어: ${unlock}`,'gScene')}
  return{errors,warnings};
}
function memoryState(){
  const errors=[],warnings=[];if(!byId('mTitle')?.value.trim())errors.push({msg:'Memory 제목을 입력해줘.',field:'mTitle'});if(!byId('mSum')?.value.trim())warnings.push({msg:'Memory 요약이 비어 있어.',field:'mSum'});return{errors,warnings};
}
function ensureCheckPanel(card){
  let box=$('.hv-editor-check',card);if(box)return box;
  box=document.createElement('div');box.className='hv-editor-check';
  const head=$('.hv-dialogue-editor-head,.hv-suite-head',card);head?head.after(box):card.prepend(box);return box;
}
function paintCheck(card,result){
  if(!card)return;const box=ensureCheckPanel(card);const {errors,warnings}=result;
  box.className='hv-editor-check '+(errors.length?'is-error':warnings.length?'is-warning':'is-ok');
  const list=[...errors.map(x=>'오류 · '+x.msg),...warnings.map(x=>'확인 · '+x.msg)];
  box.innerHTML=`<strong>${errors.length?`저장 전 수정 ${errors.length}개`:warnings.length?`저장 가능 · 확인 ${warnings.length}개`:'저장 준비 완료'}</strong>${list.length?`<div>${list.slice(0,5).map(x=>`<span>${x}</span>`).join('')}</div>`:'<small>구조상 발견된 문제가 없습니다.</small>'}`;
}
function validateVisible(){
  if(byId('sKind'))paintCheck(byId('sKind').closest('.editor-card'),sceneState());
  if(byId('gName'))paintCheck(byId('gName').closest('.editor-card'),giftState());
  if(byId('mTitle'))paintCheck(byId('mTitle').closest('.editor-card'),memoryState());
}
function reveal(field){const el=byId(field);if(!el)return;let p=el.parentElement;while(p&&p!==document.body){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:'center'});el.closest('label')?.classList.add('hv-field-error');setTimeout(()=>el.closest('label')?.classList.remove('hv-field-error'),2200)}
function blockIfInvalid(e,type){
  const result=type==='scene'?sceneState():type==='gift'?giftState():memoryState();
  if(!result.errors.length)return false;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const card=e.target.closest('.editor-card');paintCheck(card,result);reveal(result.errors[0].field);return true;
}
function enhance(){enhanceGift();enhanceMemory();enhanceEventModal();validateVisible()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-save-scene]')){if(blockIfInvalid(e,'scene'))return}
  if(t.closest('[data-save-gift]')){if(blockIfInvalid(e,'gift'))return}
  if(t.closest('[data-save-mem]')){if(blockIfInvalid(e,'memory'))return}
},true);
document.addEventListener('input',e=>{if(e.target.closest('.editor-main,.event-definition-modal'))schedule()});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();