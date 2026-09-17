(()=>{
'use strict';
if(window.__HELLAVERSE_THOUGHT_RENDER_BRIDGE_V1__)return;
window.__HELLAVERSE_THOUGHT_RENDER_BRIDGE_V1__=1;

const $=(s,r=document)=>r.querySelector(s);
let queued=false,nudging=false,lastNudge=0;

function needsArchivePatch(){
  const legacy=$('#tCat');
  if(!legacy)return false;
  const card=legacy.closest('.editor-card');
  return !!card&&!card.querySelector('[data-save-thought-v35]');
}

function nudgeArchive(){
  const app=$('#app');
  if(!app||nudging||Date.now()-lastNudge<40)return;
  nudging=true;lastNudge=Date.now();
  const marker=document.createElement('span');
  marker.hidden=true;marker.dataset.thoughtRenderBridge='1';
  app.appendChild(marker);
  queueMicrotask(()=>{marker.remove();nudging=false});
}

function promoteFrequency(){
  const input=$('#tFreq');if(!input)return;
  const card=input.closest('.editor-card');if(!card)return;
  const label=input.closest('label');
  const grid=$('.basic-block .form-grid',card);
  if(label&&grid&&!label.closest('.basic-block')){
    label.classList.add('full','thought-frequency-primary');
    const text=$('#tText',card)?.closest('label');
    grid.insertBefore(label,text||null);
  }
  const advanced=$('.thought-advanced',card);
  if(advanced&&advanced.querySelector('.condition-picker, #tMoods'))advanced.open=true;
}

function ensureThoughtNav(){
  if(!window.__HELLAVERSE_THOUGHT_ARCHIVE_V42__)return;
  const nav=$('.main-nav');if(!nav||$('[data-open-thoughts]',nav))return;
  const button=document.createElement('button');
  button.type='button';button.className='nav-button';button.dataset.openThoughts='';button.textContent='THOUGHTS';
  const anchor=$('[data-hv-missions],[data-page="settings"],[data-hv-settings-rescue]',nav);
  anchor?nav.insertBefore(button,anchor):nav.appendChild(button);
}

function run(){
  if(needsArchivePatch())nudgeArchive();
  promoteFrequency();
  ensureThoughtNav();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:runtime-ready',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
setTimeout(schedule,80);setTimeout(schedule,300);setTimeout(schedule,900);
if(document.readyState!=='loading')schedule();
})();
