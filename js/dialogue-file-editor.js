(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_FILE_EDITOR_V2__)return;
window.__HELLAVERSE_DIALOGUE_FILE_EDITOR_V2__=1;

const K='hellaverse_dialogue_state_v1';
const FKEY='hellaverse_dialogue_editor_file_v1';
const RKEY='hellaverse_dialogue_runtime_file_v1';
const FILES=[
 {id:'CONVERSATION',icon:'💬',label:'CONVERSATION',kind:'TALK',help:'일상 대화와 주제별 대화'},
 {id:'QUESTION',icon:'❔',label:'QUESTION',kind:'ASK',help:'플레이어가 먼저 묻는 질문'},
 {id:'ACTION',icon:'✦',label:'ACTION',kind:'TALK',help:'말보다 행동을 고르는 장면'},
 {id:'ENTRY',icon:'🚪',label:'ENTRY',kind:'ENTRY',help:'방에 들어왔을 때'},
 {id:'EXIT',icon:'↩',label:'EXIT',kind:'EXIT',help:'방을 나가거나 마칠 때'},
 {id:'IDLE',icon:'…',label:'IDLE',kind:'IDLE',help:'잠시 기다렸을 때'},
 {id:'HOME',icon:'⌂',label:'HOME',kind:'HOME',help:'홈 화면에서 보이는 대사'}
];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=p=>`${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const browserSigs=new WeakMap();
let queued=false,pendingSaveFile='';

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s,source='dialogue-file-editor'){
 const v=JSON.stringify(s);
 localStorage.setItem(K,v);
 try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:v}))}catch{}
 window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
}
function selected(){const v=sessionStorage.getItem(FKEY)||'CONVERSATION';return FILES.some(f=>f.id===v)?v:'CONVERSATION'}
function setSelected(v){if(FILES.some(f=>f.id===v))sessionStorage.setItem(FKEY,v)}
function fileDef(id){return FILES.find(f=>f.id===id)||FILES[0]}
function choicesOf(sc){return (sc?.nodes||[]).flatMap(n=>Array.isArray(n?.choices)?n.choices:[])}
function fileOf(sc,s){
 const explicit=String(s?.dialogueFileMap?.[sc?.id]||'').toUpperCase();
 if(FILES.some(f=>f.id===explicit))return explicit;
 const k=String(sc?.kind||'TALK').toUpperCase();
 if(k==='ASK')return'QUESTION';
 if(['ENTRY','EXIT','IDLE','HOME'].includes(k))return k;
 if(k==='TALK'){
  const ch=choicesOf(sc);
  if(ch.length&&ch.filter(c=>c?.type==='action').length>ch.length/2)return'ACTION';
  return'CONVERSATION';
 }
 return'CONVERSATION';
}
function coreKind(file){return fileDef(file).kind}
function activeChar(s){return String(s.active||'')}
function folderScenes(s,file=selected()){return (s.dialogues||[]).filter(sc=>String(sc?.characterId||'')===activeChar(s)&&fileOf(sc,s)===file)}
function currentDraft(s){const id=String(s?.draft?.scene||'');return (s.dialogues||[]).find(x=>String(x?.id||'')===id)||null}
function field(id){return document.getElementById(id)?.closest('label')||null}
function move(ids,root,wide=[]){
 const w=new Set(wide);
 for(const id of ids){
  const l=field(id); if(!l)continue;
  if(w.has(id))l.classList.add('full');
  root.appendChild(l);
 }
}
function nodes(){const el=$('#sNodesJson');if(!el)return[];try{const v=JSON.parse(el.value||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function saveNodes(list){const el=$('#sNodesJson');if(!el)return;el.value=JSON.stringify(list,null,2);el.dispatchEvent(new Event('input',{bubbles:true}))}
function refs(list,id){let n=0;for(const node of list)for(const ch of node.choices||[])if(String(ch?.nextNodeId||'')===String(id))n++;return n}

function nextChoiceMarkup(c={},i=0){
 return`<article class="dfe-nested-choice" data-dfe-nested-choice="${i}"><div class="dfe-nested-head"><strong>NEXT CHOICE ${i+1}</strong><button type="button" data-dfe-remove-nested="${i}">REMOVE</button></div><div class="dfe-grid"><label>TYPE<select data-dfe-nested-type><option value="speech" ${c.type!=='action'?'selected':''}>SPEECH</option><option value="action" ${c.type==='action'?'selected':''}>ACTION</option></select></label><label>HEART<input data-dfe-nested-delta type="number" value="${esc(c.affectionDelta||0)}"></label><label class="full">CHOICE TEXT<input data-dfe-nested-text value="${esc(c.text||'')}"></label><label class="full">PLAYER LINE / ACTION<input data-dfe-nested-player value="${esc(c.playerLine||'')}"></label><label class="full">CHARACTER RESPONSE<textarea data-dfe-nested-response rows="2">${esc(c.response||'')}</textarea></label></div></article>`;
}
function flowMarkup(n){
 const next=$(`#c${n}next`),list=nodes(),node=list.find(x=>String(x?.id||'')===String(next?.value||''));
 if(!node)return`<button type="button" class="dfe-flow-add" data-dfe-add-flow="${n}">+ CONTINUE AFTER RESPONSE</button>`;
 const ch=Array.isArray(node.choices)?node.choices:[];
 return`<div data-dfe-flow-active="${n}"><div class="dfe-flow-head"><strong>AFTER RESPONSE</strong><button type="button" data-dfe-remove-flow="${n}">REMOVE</button></div><div class="dfe-grid"><label>SPEAKER<select data-dfe-flow-speaker="${n}"><option value="character" ${node.speaker!=='narration'?'selected':''}>CHARACTER</option><option value="narration" ${node.speaker==='narration'?'selected':''}>NARRATION</option></select></label><label class="full">NEXT LINE<textarea data-dfe-flow-text="${n}" rows="3">${esc(node.text||'')}</textarea></label></div><div class="dfe-nested">${ch.map(nextChoiceMarkup).join('')}${ch.length?'<div></div>':'<p class="muted">다음 선택지가 없으면 이 대사에서 장면이 끝납니다.</p>'}<button type="button" class="dfe-flow-add" data-dfe-add-nested="${n}" ${ch.length>=3?'disabled':''}>+ ADD NEXT CHOICE</button></div></div>`;
}
function renderFlow(n,host){if(host)host.innerHTML=flowMarkup(n)}
function getFlowNode(n,list=nodes()){const id=String($(`#c${n}next`)?.value||'');return list.find(x=>String(x?.id||'')===id)||null}
function nestedFromRow(row,old={}){
 return{...old,id:old.id||uid('choice'),type:$('[data-dfe-nested-type]',row)?.value==='action'?'action':'speech',text:$('[data-dfe-nested-text]',row)?.value||'',playerLine:$('[data-dfe-nested-player]',row)?.value||'',response:$('[data-dfe-nested-response]',row)?.value||'',affectionDelta:Number($('[data-dfe-nested-delta]',row)?.value||0),requiredAffection:Number(old.requiredAffection||0),requiredStage:old.requiredStage||'',requiredMood:old.requiredMood||'ANY',requiredFlags:old.requiredFlags||'',blockedFlags:old.blockedFlags||'',requiredMemoryTags:old.requiredMemoryTags||'',lockDisplay:old.lockDisplay||'disabled',setFlags:old.setFlags||'',removeFlags:old.removeFlags||'',addMemoryTitle:old.addMemoryTitle||'',addMemorySummary:old.addMemorySummary||'',addMemoryTags:old.addMemoryTags||'',moodChange:old.moodChange||'',unlockItemId:old.unlockItemId||'',nextNodeId:old.nextNodeId||'',endConversation:old.endConversation!==false};
}
function updateFlow(n){
 const list=nodes(),node=getFlowNode(n,list);if(!node)return;
 node.text=$(`[data-dfe-flow-text="${n}"]`)?.value||'';
 node.speaker=$(`[data-dfe-flow-speaker="${n}"]`)?.value==='narration'?'narration':'character';
 const host=$(`[data-dfe-flow-host="${n}"]`),rows=host?$$('[data-dfe-nested-choice]',host):[],old=Array.isArray(node.choices)?node.choices:[];
 node.choices=rows.map((r,i)=>nestedFromRow(r,old[i]||{}));
 saveNodes(list);
}
function addFlow(n){
 const next=$(`#c${n}next`),end=$(`#c${n}end`);if(!next)return;
 let list=nodes(),id=String(next.value||'').trim()||uid(`followup-${n}`),node=list.find(x=>String(x.id)===id);
 if(!node){node={id,speaker:'character',text:'',choices:[]};list.push(node)}
 next.value=id;next.dispatchEvent(new Event('input',{bubbles:true}));
 if(end){end.value='false';end.dispatchEvent(new Event('change',{bubbles:true}))}
 saveNodes(list);renderFlow(n,$(`[data-dfe-flow-host="${n}"]`));
 setTimeout(()=>$(`[data-dfe-flow-text="${n}"]`)?.focus(),0);
}
function removeFlow(n){
 updateFlow(n);
 const next=$(`#c${n}next`),end=$(`#c${n}end`);if(!next)return;
 let list=nodes(),id=String(next.value||'');
 next.value='';next.dispatchEvent(new Event('input',{bubbles:true}));
 if(end){end.value='true';end.dispatchEvent(new Event('change',{bubbles:true}))}
 if(id&&refs(list,id)<=1)list=list.filter(x=>String(x.id)!==id);
 saveNodes(list);renderFlow(n,$(`[data-dfe-flow-host="${n}"]`));
}
function addNested(n){
 updateFlow(n);const list=nodes(),node=getFlowNode(n,list);if(!node)return;
 node.choices=Array.isArray(node.choices)?node.choices:[];
 if(node.choices.length>=3)return;
 node.choices.push(nestedFromRow(document.createElement('div'),{}));
 saveNodes(list);renderFlow(n,$(`[data-dfe-flow-host="${n}"]`));
 const rows=$$('[data-dfe-nested-choice]',$(`[data-dfe-flow-host="${n}"]`));
 setTimeout(()=>$('[data-dfe-nested-text]',rows.at(-1))?.focus(),0);
}
function removeNested(n,i){
 updateFlow(n);const list=nodes(),node=getFlowNode(n,list);if(!node)return;
 node.choices=Array.isArray(node.choices)?node.choices:[];
 node.choices.splice(i,1);saveNodes(list);renderFlow(n,$(`[data-dfe-flow-host="${n}"]`));
}
function preview(n){return $(`#c${n}text`)?.value.trim()||$(`#c${n}player`)?.value.trim()||'새 선택지'}
function buildChoice(n,old){
 const box=document.createElement('details');box.className='dfe-choice';if(n===1)box.open=true;
 box.innerHTML=`<summary><b>${n}</b><span><strong>CHOICE ${n}</strong><small data-dfe-choice-preview="${n}">${esc(preview(n))}</small></span></summary>`;
 const body=document.createElement('div');body.className='dfe-choice-body';
 const core=document.createElement('div');core.className='dfe-grid';
 move([`c${n}type`,`c${n}text`,`c${n}player`,`c${n}res`,`c${n}delta`],core,[`c${n}text`,`c${n}player`,`c${n}res`]);
 body.appendChild(core);
 const flow=document.createElement('section');flow.className='dfe-flow';flow.dataset.dfeFlowHost=String(n);flow.innerHTML=flowMarkup(n);body.appendChild(flow);
 const adv=document.createElement('details');adv.className='dfe-choice-advanced';adv.innerHTML='<summary>조건 · 이벤트 · 아이템 · 고급 분기</summary>';
 const grid=document.createElement('div');grid.className='dfe-grid';
 move([`c${n}req`,`c${n}stage`,`c${n}rmood`,`c${n}lock`,`c${n}mood`,`c${n}rflags`,`c${n}bflags`,`c${n}rmem`,`c${n}flags`,`c${n}remove`,`c${n}mt`,`c${n}ms`,`c${n}tags`,`c${n}item`,`c${n}next`,`c${n}end`],grid,[`c${n}rflags`,`c${n}bflags`,`c${n}rmem`,`c${n}flags`,`c${n}remove`,`c${n}mt`,`c${n}ms`,`c${n}tags`]);
 if(old){const g=$('.form-grid',old);if(g)for(const child of Array.from(g.children))grid.appendChild(child)}
 adv.appendChild(grid);body.appendChild(adv);box.appendChild(body);old?.remove();return box;
}

function fileButtons(s){return FILES.map(f=>`<button type="button" class="dfe-file ${selected()===f.id?'active':''}" data-dfe-file="${f.id}"><span>${f.icon}</span><strong>${f.label}</strong><em>${folderScenes(s,f.id).length}</em></button>`).join('')}
function sceneList(s){
 const file=selected(),rows=folderScenes(s,file),draft=String(s?.draft?.scene||'');
 return rows.length?rows.map(sc=>`<button type="button" class="dfe-scene ${String(sc.id)===draft?'current':''}" data-edit-type="scene" data-edit-id="${esc(sc.id)}"><span><strong>${esc(sc.title||'Untitled')}</strong><small>${Number(sc.requiredAffection||0)?`♥ ${Number(sc.requiredAffection||0)} · `:''}${esc((sc.nodes?.[0]?.text||sc.opening||'').slice(0,80))}</small></span><em>EDIT</em></button>`).join(''):'<div class="dfe-empty">이 파일에는 아직 장면이 없습니다.</div>';
}
function browserMarkup(s){
 const f=fileDef(selected());
 return`<nav class="dfe-files">${fileButtons(s)}</nav><section class="dfe-file-note"><div><strong>${f.icon} ${f.label}</strong><p>${f.help}</p></div><button type="button" class="gold-button" data-dfe-new>+ NEW ${f.label}</button></section><section class="dfe-index"><div class="dfe-index-head"><strong>FILE INDEX</strong><small>${folderScenes(s).length} scenes</small></div><div class="dfe-scene-list">${sceneList(s)}</div></section>`;
}
function refreshBrowser(browser,s){
 if(!browser)return;
 const html=browserMarkup(s);
 if(browserSigs.get(browser)===html)return;
 browserSigs.set(browser,html);
 browser.innerHTML=html;
}
function applyKind(){
 const k=$('#sKind');if(!k)return;
 k.value=coreKind(selected());
 const label=k.closest('label');if(label)label.classList.add('dfe-hidden-kind');
}
function enhanceEditor(){
 const kind=$('#sKind'),card=kind?.closest('.editor-card');
 if(!card||!card.closest('.editor-main'))return;
 const s=read(),draft=currentDraft(s);
 if(draft&&!pendingSaveFile)setSelected(fileOf(draft,s));
 if(card.dataset.dfe==='1'){
  applyKind();
  refreshBrowser($('[data-dfe-browser]',card),s);
  if(!card.classList.contains('dfe-ready'))card.classList.add('dfe-ready');
  return;
 }
 card.dataset.dfe='1';
 applyKind();

 const originalLabel=$(':scope > .label',card),originalHelp=$(':scope > .muted',card),form=$(':scope > .form-grid',card),details=$$(':scope > details.sub-editor',card),nodeDetails=details.find(d=>d.querySelector('#sNodesJson')),choiceDetails=[1,2,3].map(n=>details.find(d=>d.querySelector(`#c${n}text`))).filter(Boolean),actions=$(':scope > .button-row',card);
 const head=document.createElement('div');head.className='dfe-head hv-dialogue-editor-head';head.innerHTML='<div><p class="label">DIALOGUE FILES</p><h2>대화 파일</h2><p>종류를 고르고 만드는 대신, 먼저 파일을 연 다음 그 안에서 장면을 작성합니다.</p></div><span class="dfe-badge">FILE SYSTEM</span>';
 const browser=document.createElement('div');browser.dataset.dfeBrowser='1';refreshBrowser(browser,s);

 const basic=document.createElement('section');basic.className='dfe-section';basic.innerHTML='<div class="dfe-section-title"><strong>SCENE</strong><small>화면에 바로 보이는 내용</small></div>';
 const bg=document.createElement('div');bg.className='dfe-grid';move(['sTitle','sOpen','sExit','sAfter','sRep'],bg,['sOpen','sExit','sAfter']);basic.appendChild(bg);
 const cond=document.createElement('details');cond.className='dfe-conditions';cond.innerHTML='<summary>장면 조건 펼치기</summary>';
 const cg=document.createElement('div');cg.className='dfe-grid';move(['sReq','sMax','sMood','sFlags','sBlocked','sMem','sItems'],cg,['sFlags','sBlocked','sMem','sItems']);
 if(form)for(const child of Array.from(form.children)){if(child.contains(kind)){child.classList.add('dfe-hidden-kind');card.appendChild(child)}else cg.appendChild(child)}
 cond.appendChild(cg);basic.appendChild(cond);

 const choices=document.createElement('section');choices.className='dfe-section';choices.innerHTML='<div class="dfe-section-title"><strong>CHOICES & FLOW</strong><small>선택 → 반응 → 이어지는 대사 → 다음 선택</small></div>';
 const stack=document.createElement('div');stack.className='dfe-choice-stack';choiceDetails.forEach((d,i)=>stack.appendChild(buildChoice(i+1,d)));choices.appendChild(stack);

 originalLabel?.remove();originalHelp?.remove();form?.remove();card.prepend(head,browser,basic,choices);
 if(nodeDetails){nodeDetails.classList.remove('sub-editor');nodeDetails.classList.add('dfe-node-json');const sm=$('summary',nodeDetails);if(sm)sm.textContent='ADVANCED · RAW NODE DATA';card.appendChild(nodeDetails)}
 if(actions){actions.classList.add('dfe-actions');card.appendChild(actions)}
 const saved=card.nextElementSibling;if(saved?.classList.contains('saved-panel'))saved.style.display='none';

 card.classList.add('dfe-card','dfe-ready');
}
function commitPending(){
 if(!pendingSaveFile)return;
 const s=read(),id=String(s?.draft?.scene||'');
 if(!id||!(s.dialogues||[]).some(x=>String(x.id)===id))return;
 s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
 s.dialogueFileMap[id]=pendingSaveFile;write(s,'dialogue-file-map');pendingSaveFile='';
}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function patchRuntime(){
 const menu=$('.character-room .action-menu');
 if(menu){
  const talk=$('[data-action="TALK"]',menu),ask=$('[data-action="ASK"]',menu);
  if(talk){talk.dataset.dialogueFileRuntime='CONVERSATION';setText($('span',talk),'CONVERSATION')}
  if(ask){ask.dataset.dialogueFileRuntime='QUESTION';setText($('span',ask),'QUESTION')}
  if(!$('[data-dialogue-file-runtime="ACTION"]',menu)){
   const b=document.createElement('button');b.type='button';b.dataset.action='TALK';b.dataset.dialogueFileRuntime='ACTION';b.innerHTML='<b>03</b><span>ACTION</span>';
   const inv=$('[data-inventory-open]',menu);inv?menu.insertBefore(b,inv):menu.appendChild(b);
  }
  const inv=$('[data-inventory-open]',menu);if(inv)setText($('b',inv),'04');
 }
 const sceneButtons=$$('[data-scene]');
 if(!sceneButtons.length)return;
 const wanted=sessionStorage.getItem(RKEY)||'';
 if(!wanted||!FILES.some(f=>f.id===wanted))return;
 const s=read();let shown=0;
 for(const b of sceneButtons){
  const sc=(s.dialogues||[]).find(x=>String(x.id)===String(b.dataset.scene));
  const ok=!!(sc&&fileOf(sc,s)===wanted);
  if(b.hidden===ok)b.hidden=!ok;
  if(ok)shown++;
 }
 const stage=sceneButtons[0]?.closest('.dialogue-stage,.dialogue-panel,.dialogue-page')||sceneButtons[0]?.parentElement;
 if(!stage)return;
 let badge=$('.dfe-runtime-file',stage);
 if(!badge){badge=document.createElement('div');badge.className='dfe-runtime-file';stage.prepend(badge)}
 setText(badge,`${fileDef(wanted).icon} ${fileDef(wanted).label}`);
 let empty=$('.dfe-runtime-empty',stage);
 if(!shown&&!empty){empty=document.createElement('div');empty.className='dfe-runtime-empty';empty.textContent='이 파일에서 지금 열 수 있는 장면이 없습니다.';sceneButtons[0]?.parentElement?.appendChild(empty)}
 if(shown&&empty)empty.remove();
}
function enhance(){commitPending();enhanceEditor();patchRuntime()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const file=t.closest('[data-dfe-file]');
 if(file){e.preventDefault();e.stopImmediatePropagation();setSelected(file.dataset.dfeFile);const n=$('[data-new="scene"]');if(n)setTimeout(()=>n.click(),0);else schedule();return}
 if(t.closest('[data-dfe-new]')){e.preventDefault();e.stopImmediatePropagation();const n=$('[data-new="scene"]');if(n)n.click();return}
 const runtime=t.closest('[data-dialogue-file-runtime]');if(runtime)sessionStorage.setItem(RKEY,runtime.dataset.dialogueFileRuntime);
 if(t.closest('[data-save-scene]')){applyKind();pendingSaveFile=selected();for(let n=1;n<=3;n++)if($(`[data-dfe-flow-active="${n}"]`))updateFlow(n)}
 const add=t.closest('[data-dfe-add-flow]');if(add){e.preventDefault();addFlow(Number(add.dataset.dfeAddFlow));return}
 const rem=t.closest('[data-dfe-remove-flow]');if(rem){e.preventDefault();removeFlow(Number(rem.dataset.dfeRemoveFlow));return}
 const addN=t.closest('[data-dfe-add-nested]');if(addN){e.preventDefault();addNested(Number(addN.dataset.dfeAddNested));return}
 const remN=t.closest('[data-dfe-remove-nested]');if(remN){e.preventDefault();const host=remN.closest('[data-dfe-flow-host]');removeNested(Number(host?.dataset.dfeFlowHost||0),Number(remN.dataset.dfeRemoveNested));return}
},true);

document.addEventListener('input',e=>{
 const t=e.target;
 if(t.matches?.('[id^="c"][id$="text"],[id^="c"][id$="player"]')){
  const m=t.id.match(/^c([1-3])/);if(m){const p=$(`[data-dfe-choice-preview="${m[1]}"]`);if(p)p.textContent=preview(Number(m[1]))}
 }
 if(t.matches?.('[data-dfe-flow-text],[data-dfe-nested-text],[data-dfe-nested-player],[data-dfe-nested-response],[data-dfe-nested-delta]')){
  const host=t.closest('[data-dfe-flow-host]');if(host)updateFlow(Number(host.dataset.dfeFlowHost));
 }
},true);
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.matches?.('[data-dfe-flow-speaker],[data-dfe-nested-type]')){
  const host=t.closest('[data-dfe-flow-host]');if(host)updateFlow(Number(host.dataset.dfeFlowHost));
 }
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('storage',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();