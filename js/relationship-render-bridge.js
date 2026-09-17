(()=>{
'use strict';
if(window.__HELLAVERSE_RELATIONSHIP_RENDER_BRIDGE_V1__)return;
window.__HELLAVERSE_RELATIONSHIP_RENDER_BRIDGE_V1__=1;

const K='hellaverse_dialogue_state_v1';
const MOODS=[['GOOD','행복'],['NORMAL','보통'],['TIRED','피곤함'],['ANNOYED','화남 / 짜증'],['SAD','슬픔'],['EXCITED','신남']];
const DEFAULT_STAGES=[
 {min:0,max:9,name:'STRANGER',description:'아직 거의 모르는 관계'},
 {min:10,max:19,name:'DISTANT',description:'조금 익숙해졌지만 아직 거리가 있는 관계'},
 {min:20,max:29,name:'ACQUAINTANCE',description:'서로 어느 정도 알고 있는 관계'},
 {min:30,max:39,name:'FAMILIAR',description:'상대에게 제법 익숙해진 관계'},
 {min:40,max:49,name:'COMFORTABLE',description:'함께 있어도 어색하지 않은 관계'},
 {min:50,max:59,name:'FRIENDLY',description:'상대에게 호의적인 관계'},
 {min:60,max:69,name:'CLOSE',description:'가까운 관계'},
 {min:70,max:79,name:'TRUSTED',description:'서로 신뢰하기 시작한 관계'},
 {min:80,max:89,name:'BONDED',description:'깊은 유대가 생긴 관계'},
 {min:90,max:99,name:'DEVOTED',description:'매우 특별하고 깊은 관계'},
 {min:100,max:100,name:'SPECIAL',description:'최고 단계의 특별한 관계'}
];
const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clamp=v=>Math.max(0,Math.min(100,Number(v||0)));
let queued=false;

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function parseStageLine(line){const m=String(line||'').match(/^\s*(\d+)\s*[-–~]\s*(\d+)\s*[:=]?\s*(.+?)\s*$/);return m?{min:Number(m[1]),max:Number(m[2]),name:String(m[3]).trim(),description:''}:null}
function stages(a={}){
 if(Array.isArray(a.stageTable)&&a.stageTable.length)return a.stageTable.map(x=>({min:Number(x.min),max:Number(x.max),name:String(x.name||''),description:String(x.description||'')})).filter(x=>Number.isFinite(x.min)&&Number.isFinite(x.max)&&x.name);
 if(Array.isArray(a.stages)&&a.stages.length&&typeof a.stages[0]==='object')return a.stages.map(x=>({min:Number(x.min),max:Number(x.max),name:String(x.name||''),description:String(x.description||'')})).filter(x=>Number.isFinite(x.min)&&Number.isFinite(x.max)&&x.name);
 const rows=(Array.isArray(a.stages)?a.stages:String(a.stages||'').split('\n')).map(parseStageLine).filter(Boolean);
 return rows.length?rows:DEFAULT_STAGES.map(x=>({...x}));
}
function stageRow(row){return `<div class="relationship-stage-row" data-stage-row><label><span>Min Heart</span><input data-stage-min type="number" min="0" max="100" value="${esc(row.min)}"></label><label><span>Max Heart</span><input data-stage-max type="number" min="0" max="100" value="${esc(row.max)}"></label><label><span>Stage Name</span><input data-stage-name value="${esc(row.name)}"></label><label class="relationship-stage-description"><span>Description</span><input data-stage-description value="${esc(row.description||'')}"></label><div class="relationship-stage-actions"><button type="button" class="ghost-button compact" data-stage-up>↑</button><button type="button" class="ghost-button compact" data-stage-down>↓</button><button type="button" class="text-link danger" data-stage-delete>DELETE</button></div></div>`}
function markup(state,cid){
 const a=state.affection?.[cid]||{},heart=clamp(a.value),rows=stages(a),mood=String(state.moods?.[cid]||'NORMAL').toUpperCase(),current=rows.find(r=>heart>=r.min&&heart<=r.max),name=state.characters?.find(c=>c.id===cid)?.name||'Character';
 return `<article class="editor-card relationship-editor-v44" data-relationship-v44 data-character-name="${esc(name)}"><p class="label">RELATIONSHIP</p><section class="relationship-current"><span class="relationship-current-label">CURRENT RELATIONSHIP</span><strong>♥ <b data-current-heart>${heart}</b></strong><h2 data-current-stage>${esc(current?.name||'NO STAGE')}</h2><p data-current-description>${esc(current?.description||'현재 Heart를 포함하는 Stage가 없습니다.')}</p></section><section class="relationship-basic-section"><h3>AFFECTION</h3><label class="relationship-heart-field"><span>Heart</span><input id="rAffV44" type="number" min="0" max="100" value="${heart}"></label><button type="button" class="ghost-button danger relationship-reset-affection" data-reset-affection>RESET AFFECTION</button></section><section class="relationship-basic-section"><h3>MOOD</h3><p class="relationship-help">현재 캐릭터의 감정 상태입니다. 일부 Dialogue, Choice, Thought는 특정 Mood에서만 나타납니다.</p><label class="relationship-mood-field"><span>Current Mood</span><select id="rMoodV44">${MOODS.map(([id,label])=>`<option value="${id}" ${mood===id?'selected':''}>${id} — ${label}</option>`).join('')}</select></label><p class="relationship-mood-note" data-mood-note><strong>${esc(mood)} — ${esc(MOODS.find(x=>x[0]===mood)?.[1]||'보통')}</strong></p></section><section class="relationship-basic-section relationship-stages-section"><div class="relationship-section-head"><span><h3>RELATIONSHIP STAGES</h3><p class="relationship-help">Heart 범위에 따라 현재 Relationship Stage가 결정됩니다. 각 Heart 값은 하나의 Stage에만 포함될 수 있습니다.</p></span><button type="button" class="ghost-button" data-stage-add>+ ADD STAGE</button></div><div class="relationship-stage-head" aria-hidden="true"><span>Min Heart</span><span>Max Heart</span><span>Stage Name</span><span>Description</span><span></span></div><div class="relationship-stage-table" data-stage-table>${rows.map(stageRow).join('')}</div><p class="relationship-validation is-hidden" data-stage-validation></p><button type="button" class="text-link" data-restore-default-stages>RESTORE DEFAULT STAGES</button></section><div class="button-row"><button type="button" class="gold-button" data-save-rel-v44>SAVE RELATIONSHIP</button></div></article>`;
}
function baseCard(){
 return $('#rStages')?.closest('.editor-card')||$('#rAff')?.closest('.editor-card')||$('[data-save-rel]')?.closest('.editor-card')||Array.from(document.querySelectorAll('.editor-main .editor-card')).find(card=>String($('.label',card)?.textContent||'').trim().toUpperCase()==='RELATIONSHIP')||null;
}
function mount(){
 const state=read();if(state.page!=='editor'||state.section!=='relationship')return;
 if($('[data-relationship-v44]'))return;
 const card=baseCard(),cid=String(state.active||'');if(!card||!cid)return;
 card.outerHTML=markup(state,cid);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('storage',e=>{if(!e.key||e.key===K)schedule()});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
