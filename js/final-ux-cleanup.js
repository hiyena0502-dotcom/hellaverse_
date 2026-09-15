(()=>{
'use strict';
if(window.__HELLAVERSE_FINAL_UX_CLEANUP_V4__)return;
window.__HELLAVERSE_FINAL_UX_CLEANUP_V4__=1;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,observer=null;
const NAV_KEY='hellaverse_current_main_nav_v1';
const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

function saveGoodNav(nav){
  if(!nav)return;
  const hasSettings=!!nav.querySelector('[data-page="settings"],[data-hv-settings-rescue]');
  const hasThoughts=!!nav.querySelector('[data-open-thoughts]');
  const hasCurrentExtras=!!nav.querySelector('[data-hvg-open],[data-hv-missions]');
  if(hasSettings&&hasThoughts&&hasCurrentExtras){
    try{sessionStorage.setItem(NAV_KEY,nav.innerHTML)}catch{}
  }
}

function restoreThoughtNav(nav){
  if(!nav||!$('.thought-page'))return;
  const broken=!nav.querySelector('[data-page="settings"],[data-hv-settings-rescue]')||!nav.querySelector('[data-hvg-open]')||!nav.querySelector('[data-hv-missions]');
  if(!broken)return;
  let saved='';
  try{saved=sessionStorage.getItem(NAV_KEY)||''}catch{}
  if(saved&&nav.innerHTML!==saved)nav.innerHTML=saved;
}

function cleanNav(){
  for(const nav of $$('.main-nav')){
    if($('.thought-page'))restoreThoughtNav(nav);
    else saveGoodNav(nav);
    for(const b of $$('button,a',nav)){
      const t=txt(b).toUpperCase();
      if(t.includes('GACHA')){
        b.classList.add('hvg-nav-button');
        if(t!=='GACHA')b.textContent='GACHA';
      }
      if(t.includes('SETTINGS'))b.classList.add('ux-settings-last');
    }
  }
}

function cleanRoomHud(){
  for(const hud of $$('.room-hud')){
    for(const el of $$('button,a',hud)){
      const t=txt(el).toUpperCase();
      if(t==='INVENTORY'||t.includes('SETTINGS'))el.remove();
    }
  }
}

function cleanRoomPreview(){
  for(const q of $$('.room-caption blockquote'))q.remove();
  for(const el of $$('.quote-line,.room-caption p,.room-caption strong')){
    if(/\[\[(?:CHARACTER|NARRATION)\]\]/.test(el.textContent||''))el.textContent=String(el.textContent||'').replace(/\[\[(?:CHARACTER|NARRATION)\]\]\s*/g,'');
  }
}

function cleanSettings(){
  const grid=$('.site-shell.page-settings .settings-grid')||$('.page-settings .settings-grid')||$('.settings-grid');
  if(!grid)return;
  grid.classList.add('ux-settings-clean');

  // Gacha settings is intentionally not part of the Settings page anymore.
  for(const details of $$('details',grid)){
    const summary=$(':scope > summary',details);
    if(summary&&txt(summary).toUpperCase()==='GACHA SETTINGS')details.remove();
  }

  // Runtime Diagnostics stays beside Appearance / Data Backup / Danger Zone.
  const page=grid.closest('.page-settings')||grid.closest('.page')||$('#app');
  const diag=$('[data-hv-diagnostics]',page||document);
  const accordion=$('.hvg-settings-accordion',grid);
  if(diag&&accordion&&diag.parentElement!==accordion){
    const sections=$$('details',accordion);
    const dataPanel=sections.find(el=>{
      const summary=$(':scope > summary',el);
      const t=txt(summary).toUpperCase();
      return t==='DATA / BACKUP'||t==='DATA BACKUP';
    });
    if(dataPanel)accordion.insertBefore(diag,dataPanel);
    else accordion.appendChild(diag);
  }
}

function cleanInventory(){for(const p of $$('.iv2-gift-preview>p'))p.remove()}

function cleanGiftResult(){
  for(const result of $$('.iv2-result')){
    for(const p of $$('.iv2-player',result))p.remove();
    for(const n of $$('.iv2-narration',result)){
      const t=txt(n);
      if(/건넨다|내민다|전해준다|준다[.!]?$/i.test(t))n.remove();
    }
    for(const b of $$('blockquote',result)){
      const t=txt(b);
      if(/가\s*[「“\"]?.+[」”\"]?을\s*받아\s*든다[.!]?/i.test(t)||/전용 반응 없음|특수 반응 없음/i.test(t))b.remove();
    }
  }
}

function cleanChoiceNextCollision(){
  for(const host of $$('.dialogue-page,.dialogue-box')){
    const list=$('.choice-list',host);if(!list||list.hidden||getComputedStyle(list).display==='none')continue;
    const usable=$$('button:not(:disabled)',list).length;if(!usable)continue;
    for(const n of $$('[data-vn-next],[data-vn-finish],.dialogue-next',host))if(!n.matches('[data-single-beat-next]'))n.style.display='none';
    const local=$('[data-single-beat-next]',host);if(local)local.style.display='none';
  }
}

function run(){cleanNav();cleanRoomHud();cleanRoomPreview();cleanSettings();cleanInventory();cleanGiftResult();cleanChoiceNextCollision()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
function boot(){
  const app=$('#app');
  if(app&&!observer){observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true})}
  schedule();
}

// Capture the current full nav before the legacy Thoughts handler replaces it.
window.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-open-thoughts]'))saveGoodNav($('.main-nav'));
},true);

document.addEventListener('DOMContentLoaded',boot,{once:true});
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('storage',schedule);
if(document.readyState!=='loading')boot();
})();