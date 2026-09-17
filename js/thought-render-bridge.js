(()=>{
'use strict';
if(window.__HELLAVERSE_THOUGHT_RENDER_BRIDGE_V2__)return;
window.__HELLAVERSE_THOUGHT_RENDER_BRIDGE_V2__=1;

const $=(s,r=document)=>r.querySelector(s);
let queued=false,nudging=false,retryTimer=null,retryCount=0;

function thoughtEditorState(){
  const legacy=$('#tCat');
  if(!legacy)return{visible:false,patched:false,card:null};
  const card=legacy.closest('.editor-card');
  return{visible:!!card,patched:!!card?.querySelector('[data-save-thought-v35]'),card};
}
function rootNudge(){
  const app=$('#app');if(!app||nudging)return;
  nudging=true;
  const marker=document.createElement('span');marker.hidden=true;marker.dataset.thoughtRenderBridge='1';
  app.appendChild(marker);
  queueMicrotask(()=>{marker.remove();nudging=false});
}
function ensurePatched(){
  const st=thoughtEditorState();
  if(!st.visible){retryCount=0;return}
  if(st.patched){retryCount=0;promoteFrequency();return}
  rootNudge();
  if(retryCount<8){
    retryCount++;
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>{rootNudge();schedule()},Math.min(360,35*retryCount));
  }
}
function promoteFrequency(){
  const input=$('#tFreq');if(!input)return;
  const card=input.closest('.editor-card');if(!card)return;
  const label=input.closest('label');
  const grid=$('.basic-block .form-grid',card)||$('.form-grid',card);
  if(label&&grid&&!label.classList.contains('thought-frequency-primary')){
    label.classList.add('full','thought-frequency-primary');
    const text=$('#tText',card)?.closest('label');
    grid.insertBefore(label,text||null);
  }
}
function ensureThoughtNav(){
  if(!window.__HELLAVERSE_THOUGHT_ARCHIVE_V42__)return;
  const nav=$('.main-nav');if(!nav||$('[data-open-thoughts]',nav))return;
  const button=document.createElement('button');
  button.type='button';button.className='nav-button';button.dataset.openThoughts='';button.textContent='THOUGHTS';
  const anchor=$('[data-hv-missions],[data-page="settings"],[data-hv-settings-rescue]',nav);
  anchor?nav.insertBefore(button,anchor):nav.appendChild(button);
}
function run(){ensurePatched();promoteFrequency();ensureThoughtNav()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

window.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-ext="thoughts"],[data-sec="extras"],[data-page="editor"],[data-open-thoughts]')){
    retryCount=0;setTimeout(schedule,0);setTimeout(schedule,40);setTimeout(schedule,120);setTimeout(schedule,280);
  }
},true);

const appObserver=()=>{
  const app=$('#app');if(!app)return false;
  new MutationObserver(()=>schedule()).observe(app,{childList:true,subtree:true});return true;
};
if(!appObserver())new MutationObserver((_,obs)=>{if(appObserver())obs.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:runtime-ready',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
setTimeout(schedule,60);setTimeout(schedule,180);setTimeout(schedule,500);setTimeout(schedule,1000);
if(document.readyState!=='loading')schedule();
})();
