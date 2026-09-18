(()=>{
'use strict';
if(window.__HELLAVERSE_RUNTIME_DIAGNOSTICS_V9__)return;
window.__HELLAVERSE_RUNTIME_DIAGNOSTICS_V9__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const ERROR_KEY='hellaverse_runtime_errors_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));

function parse(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function errorSig(x={}){return [String(x.type||'error'),String(x.message||'Unknown error'),String(x.source||''),Number(x.line||0)].join('|')}
function normalizeErrors(rows){
  const map=new Map();
  for(const raw of Array.isArray(rows)?rows:[]){
    const row={...raw,type:String(raw?.type||'error'),message:String(raw?.message||'Unknown error'),source:String(raw?.source||''),line:Number(raw?.line||0),col:Number(raw?.col||0),stack:String(raw?.stack||''),time:String(raw?.time||new Date().toISOString()),firstTime:String(raw?.firstTime||raw?.time||new Date().toISOString()),count:Math.max(1,Number(raw?.count||1))};
    const key=errorSig(row),old=map.get(key);
    if(old){old.count+=row.count;if(row.time>old.time){old.time=row.time;old.col=row.col;old.stack=row.stack}if(row.firstTime<old.firstTime)old.firstTime=row.firstTime}
    else map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>String(b.time).localeCompare(String(a.time))).slice(0,30);
}
function saveErrors(rows){try{localStorage.setItem(ERROR_KEY,JSON.stringify(normalizeErrors(rows)))}catch{}}
function errorRows(){return normalizeErrors(parse(ERROR_KEY,[]))}
function recordError(type,message,source,line,col,stack){
  const row={type,message:String(message||'Unknown error'),source:String(source||''),line:Number(line||0),col:Number(col||0),stack:String(stack||''),time:new Date().toISOString(),firstTime:new Date().toISOString(),count:1};
  const rows=errorRows(),key=errorSig(row),old=rows.find(x=>errorSig(x)===key);
  if(old){old.count=Math.max(1,Number(old.count||1))+1;old.time=row.time;old.col=row.col;old.stack=row.stack}
  else rows.unshift(row);
  saveErrors(rows);schedule();
}
window.addEventListener('error',e=>recordError('error',e.message,e.filename,e.lineno,e.colno,e.error?.stack));
window.addEventListener('unhandledrejection',e=>recordError('promise',e.reason?.message||e.reason,'',0,0,e.reason?.stack));

function duplicateIds(list){const seen=new Set(),dups=[];for(const row of Array.isArray(list)?list:[]){const id=String(row?.id||'').trim();if(!id)continue;if(seen.has(id))dups.push(id);else seen.add(id)}return[...new Set(dups)]}
function scan(){
  let state={};try{state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{ok:false,issues:['STATE JSON 파싱 실패'],warnings:[],stats:{},errors:errorRows()}}
  const issues=[],warnings=[],chars=Array.isArray(state.characters)?state.characters:[],charIds=new Set(chars.map(c=>String(c?.id||'')).filter(Boolean));
  const buckets=[['characters',chars],['dialogues',state.dialogues],['collectionItems',state.collectionItems],['rewards',state.rewards],['thoughts',state.thoughts],['memories',state.memories]];
  for(const [name,list] of buckets){const d=duplicateIds(list);if(d.length)issues.push(`${name}: 중복 ID ${d.join(', ')}`)}
  for(const [name,list] of buckets.slice(1))for(const row of Array.isArray(list)?list:[]){const cid=String(row?.characterId||'');if(cid&&!charIds.has(cid))warnings.push(`${name}: 없는 characterId ${cid}`)}
  const items=Array.isArray(state.collectionItems)?state.collectionItems:[],itemIds=new Set(items.map(i=>String(i?.id||'')).filter(Boolean));
  const giftConfigs=state.giftInventoryConfig?.items&&typeof state.giftInventoryConfig.items==='object'?state.giftInventoryConfig.items:{};
  const activeGiftConfigs=Object.entries(giftConfigs).filter(([,row])=>row?.enabled===true),dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
  for(const [id,row] of activeGiftConfigs){
    if(!itemIds.has(id)){issues.push(`giftInventoryConfig: 없는 collection item ${id}`);continue}
    if(!charIds.has(String(row.sourceCharacterId||'')))issues.push(`giftInventoryConfig: 없는 획득 캐릭터 ${row.sourceCharacterId||'(empty)'}`);
    if(!charIds.has(String(row.targetCharacterId||'')))issues.push(`giftInventoryConfig: 없는 전달 대상 ${row.targetCharacterId||'(empty)'}`);
    const scene=dialogues.find(scene=>String(scene?.id||'')===String(row.sceneId||''));
    if(!scene)issues.push(`giftInventoryConfig: 없는 획득 대화 ${row.sceneId||'(empty)'}`);
    else if(!scene.nodes?.some(node=>(node.choices||[]).some(choice=>String(choice?.id||'')===String(row.choiceId||'')&&String(choice?.unlockItemId||'')===id)))issues.push(`giftInventoryConfig: 선택지 연결 누락 ${row.choiceId||'(empty)'} → ${id}`);
  }
  for(const id of Object.keys(state.collectionTransferConfig||{}))if(!itemIds.has(id))warnings.push(`collectionTransferConfig: orphan ${id}`);
  for(const id of Object.keys(state.gachaProfiles||{}))if(!charIds.has(id))warnings.push(`gachaProfiles: 없는 캐릭터 ${id}`);
  for(const item of items){if(!String(item?.symbol||'').trim())warnings.push(`collection item 아이콘 없음: ${item?.id||item?.name||'unknown'}`);if(item?.gachaEnabled!==false&&Number(item?.gachaWeight)<0)issues.push(`음수 gachaWeight: ${item?.id||item?.name||'unknown'}`)}
  for(const key of ['dialogues','gifts','collectionItems','rewards','thoughts','memories','ownedItems'])if(state[key]!=null&&!Array.isArray(state[key]))issues.push(`${key}가 배열이 아님`);
  const errors=errorRows(),runtimeErrorHits=errors.reduce((n,x)=>n+Math.max(1,Number(x.count||1)),0);
  const reactionRules=state.inventoryV2?.giftRules&&typeof state.inventoryV2.giftRules==='object'?state.inventoryV2.giftRules:{};
  const giftReactionRules=Object.values(reactionRules).reduce((n,row)=>n+(row&&typeof row==='object'?Object.keys(row).length:0),0);
  return{ok:issues.length===0&&errors.length===0,issues,warnings:[...new Set(warnings)].slice(0,40),stats:{characters:chars.length,dialogues:(state.dialogues||[]).length,legacyGifts:(state.gifts||[]).length,giftAcquisitionRules:activeGiftConfigs.length,giftReactionRules,collectionItems:items.length,owned:(state.ownedItems||[]).length,rewards:(state.rewards||[]).length,runtimeErrors:errors.length,runtimeErrorHits},errors};
}
function reportText(r=scan()){
  const s=r.stats||{};
  return['HELLAVERSE RUNTIME REPORT',`time: ${new Date().toLocaleString('ko-KR')}`,`status: ${r.ok?'OK':'CHECK NEEDED'}`,`characters: ${s.characters||0}`,`dialogues: ${s.dialogues||0}`,`legacyGifts: ${s.legacyGifts||0}`,
    `giftAcquisitionRules: ${s.giftAcquisitionRules||0}`,
    `giftReactionRules: ${s.giftReactionRules||0}`,`collectionItems: ${s.collectionItems||0}`,`owned: ${s.owned||0}`,`rewards: ${s.rewards||0}`,`runtimeErrorTypes: ${s.runtimeErrors||0}`,`runtimeErrorHits: ${s.runtimeErrorHits||0}`,'','[ISSUES]',...(r.issues.length?r.issues:['none']),'','[WARNINGS]',...(r.warnings.length?r.warnings:['none']),'','[RECENT ERRORS]',...(r.errors.length?r.errors.slice(0,10).map(x=>`${x.time} | x${Math.max(1,Number(x.count||1))} | ${x.type} | ${x.message} | ${x.source}:${x.line||''}`):['none'])].join('\n');
}
function signature(r){return JSON.stringify({ok:r.ok,issues:r.issues,warnings:r.warnings,stats:r.stats})}
function panelMarkup(r,sig){
  const status=r.ok?'OK':'CHECK';
  return `<section class="hv-diagnostics settings-panel" data-hv-diagnostics data-hv-sig="${esc(sig)}"><div class="hv-diag-head"><div><p class="label">RUNTIME DIAGNOSTICS</p><h3>${status}</h3><p class="muted">파일이 늘어날수록 생기기 쉬운 중복 ID, 잘못된 캐릭터 연결, 가챠/컬렉션 참조 오류와 브라우저 런타임 오류를 빠르게 확인합니다.</p></div><span class="hv-diag-badge ${r.ok?'ok':'warn'}">${r.ok?'NO CRITICAL ISSUE':'CHECK NEEDED'}</span></div><div class="hv-diag-stats"><span>CHAR ${r.stats.characters||0}</span><span>DIALOGUE ${r.stats.dialogues||0}</span><span>GIFT REACTIONS ${r.stats.giftReactionRules||0}</span><span>LEGACY GIFT ${r.stats.legacyGifts||0}</span><span>COLLECTION ${r.stats.collectionItems||0}</span><span>ERROR TYPES ${r.stats.runtimeErrors||0}</span><span>HITS ${r.stats.runtimeErrorHits||0}</span></div>${r.issues.length?`<details open><summary>Issues (${r.issues.length})</summary><ul>${r.issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:'<p class="hv-diag-good">현재 구조 검사에서 치명적인 문제는 발견되지 않았습니다.</p>'}${r.warnings.length?`<details><summary>Warnings (${r.warnings.length})</summary><ul>${r.warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}${r.errors.length?`<details open class="hv-diag-errors"><summary>Runtime errors (${r.errors.length} types / ${r.stats.runtimeErrorHits||0} hits)</summary><ul>${r.errors.slice(0,10).map(x=>`<li><strong>x${Math.max(1,Number(x.count||1))}</strong> ${esc(x.message)}<small>${esc(x.source||'unknown source')}${x.line?`:${x.line}`:''}</small></li>`).join('')}</ul></details>`:''}<div class="button-row" data-hv-diag-actions><button class="ghost-button" type="button" data-hv-diag-run>RUN CHECK</button><button class="ghost-button" type="button" data-hv-diag-copy>COPY REPORT</button><button class="ghost-button danger" type="button" data-hv-diag-clear>CLEAR ERROR LOG</button></div></section>`;
}
function settingsPage(){const shell=$('.site-shell');if(!shell||!shell.classList.contains('page-settings'))return null;const page=$('.page.active',shell)||$('.page',shell);if(!page||$('.thought-page,.mystery-page',page))return null;return page}
function removeOutsideSettings(){if(settingsPage())return;for(const panel of $$('[data-hv-diagnostics]'))panel.remove()}
function mount(force=false){
  const page=settingsPage();if(!page){removeOutsideSettings();return null}
  const r=scan(),sig=signature(r),old=$('[data-hv-diagnostics]',page);if(old&&old.dataset.hvSig===sig&&!force)return old;
  const wrap=document.createElement('div');wrap.innerHTML=panelMarkup(r,sig);const next=wrap.firstElementChild;
  if(old)old.replaceWith(next);else page.appendChild(next);return next;
}
function flash(text){const old=$('.hv-diag-toast');if(old)old.remove();const n=document.createElement('div');n.className='hv-diag-toast';n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),1400)}
async function copyReport(){const text=reportText();try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');ta.remove()}flash('REPORT COPIED')}
function clearErrors(){try{localStorage.removeItem(ERROR_KEY);localStorage.setItem(ERROR_KEY,'[]')}catch{}mount(true);flash('ERROR LOG CLEARED')}
function runCheck(){const r=scan();mount(true);flash(r.ok?'CHECK COMPLETE · OK':'CHECK COMPLETE · REVIEW ISSUES');return r}
function actionFromTarget(target){if(!(target instanceof Element))return'';if(target.closest('[data-hv-diag-run]'))return'run';if(target.closest('[data-hv-diag-copy]'))return'copy';if(target.closest('[data-hv-diag-clear]'))return'clear';return''}
let lastAction='',lastActionAt=0;
function handleActionEvent(e){
  const action=actionFromTarget(e.target);if(!action)return false;
  e.preventDefault();e.stopImmediatePropagation();
  const now=performance.now();if(action===lastAction&&now-lastActionAt<350)return true;lastAction=action;lastActionAt=now;
  if(action==='run')runCheck();else if(action==='copy')copyReport();else clearErrors();
  return true;
}

let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount(false)})}

// Diagnostics owns its controls at the earliest capture stage so Settings/Gacha/Thought
// document-level handlers cannot swallow these clicks before they reach the panel.
window.addEventListener('pointerdown',handleActionEvent,true);
window.addEventListener('click',handleActionEvent,true);
window.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&actionFromTarget(e.target))handleActionEvent(e)},true);
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('storage',e=>{if(e.key===STATE_KEY||e.key===ERROR_KEY)schedule()});
function boot(){saveErrors(parse(ERROR_KEY,[]));schedule();const host=$('#app')||document.body;new MutationObserver(mutations=>{if(mutations.every(m=>m.target.closest?.('[data-hv-diagnostics]')))return;schedule()}).observe(host,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.HVDiagnostics={scan,reportText,recordError,runCheck,clearErrors,copyReport};
})();