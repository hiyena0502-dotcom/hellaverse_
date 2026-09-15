(()=>{
if(window.__HELLAVERSE_SIMPLE_CHARACTER_PROFILE_V1__)return;
window.__HELLAVERSE_SIMPLE_CHARACTER_PROFILE_V1__=1;

const K='hellaverse_dialogue_state_v1';
let queued=false;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(state){
  try{
    localStorage.setItem(K,JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'thought-archive',clearDirty:false}}));
  }catch(error){console.warn('Could not save character description',error)}
}
function ensureStyle(){
  if($('#hvSimpleProfileStyle'))return;
  const style=document.createElement('style');
  style.id='hvSimpleProfileStyle';
  style.textContent=`
    .hv-simple-description-section{border-top:1px solid var(--line);padding-top:18px}
    .hv-simple-description-section h3{margin:0 0 10px;color:var(--gold);font-size:.78rem;letter-spacing:.18em}
    .hv-simple-description-section p{margin:0;max-width:58ch;white-space:normal!important;line-height:1.72}
    .hv-simple-description-input small{color:var(--muted);font-size:.76rem;line-height:1.45}
  `;
  document.head.appendChild(style);
}
function characterFromProfile(state,root){
  const cid=root.querySelector('[data-room]')?.dataset.room||state.profile||'';
  return (state.characters||[]).find(c=>c?.id===cid)||null;
}
function simplifyPublicProfile(state){
  $$('.character-file').forEach(root=>{
    const c=characterFromProfile(state,root);
    const sections=$('.file-sections',root);
    if(!c||!sections)return;
    const description=String(c.description||'').trim();
    const key=`${c.id}|${description}`;
    if(sections.dataset.simpleProfileKey===key)return;
    sections.dataset.simpleProfileKey=key;
    sections.innerHTML=`<section class="hv-simple-description-section"><h3>ABOUT</h3><p>${description?esc(description):'<span class="empty-state">아직 한 줄 설명이 없습니다.</span>'}</p></section>`;
  });
}
function hideLegacyProfileFields(){
  const editor=$('.editor-main');
  if(!editor||!$('#pName',editor))return;
  const ids=['pStatus','ppersonality','pspeech','pstory','pfeatures','prelations','pSample','pTags'];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    const label=el?.closest('label');
    if(label)label.style.display='none';
  });
}
function addDescriptionEditor(state){
  const editor=$('.editor-main');
  if(!editor||!$('#pName',editor))return;
  const grid=$('.form-grid',editor);
  if(!grid)return;
  const cid=$('#edChar')?.value||state.active||'';
  const c=(state.characters||[]).find(x=>x?.id===cid);
  if(!c)return;
  let label=$('.hv-simple-description-input',grid);
  if(!label){
    label=document.createElement('label');
    label.className='full hv-simple-description-input';
    const hiddenAnchor=document.getElementById('pStatus')?.closest('label');
    if(hiddenAnchor)hiddenAnchor.before(label);else grid.appendChild(label);
  }
  const value=String(c.description||'');
  if(label.dataset.cid!==cid){
    label.dataset.cid=cid;
    label.innerHTML=`CHARACTER DESCRIPTION<input id="hvCharacterDescription" maxlength="180" placeholder="캐릭터를 한 줄로 설명하세요" value="${esc(value)}"><small>프로필에는 이 한 줄 설명만 표시됩니다.</small>`;
  }
}
function simplifyEditor(state){
  hideLegacyProfileFields();
  addDescriptionEditor(state);
}
function decorate(){
  ensureStyle();
  const state=read();
  simplifyPublicProfile(state);
  simplifyEditor(state);
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;decorate()});
}

document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;
  if(!target?.closest('[data-save-profile]'))return;
  const input=$('#hvCharacterDescription');
  if(!input)return;
  const state=read();
  const cid=$('#edChar')?.value||state.active||'';
  const c=(state.characters||[]).find(x=>x?.id===cid);
  if(!c)return;
  c.description=input.value.trim();
  write(state);
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
