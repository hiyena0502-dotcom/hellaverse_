(()=>{
'use strict';
if(window.__HELLAVERSE_FINAL_UX_CLEANUP_V6__)return;
window.__HELLAVERSE_FINAL_UX_CLEANUP_V6__=1;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,observer=null;
const NAV_KEY='hellaverse_current_main_nav_v1';
const STATE_KEY='hellaverse_dialogue_state_v1';
const PLAYER_ORIGINS={HELLBORN:'HELL',SINNER:'HELL',ANGEL:'HEAVEN',WINNER:'HEAVEN'};
const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}};

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
    else if(!nav.closest('#hellaverseGachaRoot'))saveGoodNav(nav);
    for(const b of $$('button,a',nav)){
      const t=txt(b).toUpperCase();
      if(t.includes('GACHA')){b.classList.add('hvg-nav-button');if(t!=='GACHA')b.textContent='GACHA'}
      if(t.includes('SETTINGS'))b.classList.add('ux-settings-last');
    }
  }
}
function cleanRoomHud(){
  for(const hud of $$('.room-hud'))for(const el of $$('button,a',hud)){
    const t=txt(el).toUpperCase();if(t==='INVENTORY'||t.includes('SETTINGS'))el.remove();
  }
}
function cleanRoomPreview(){
  for(const q of $$('.room-caption blockquote'))q.remove();
  for(const el of $$('.quote-line,.room-caption p,.room-caption strong'))if(/\[\[(?:CHARACTER|NARRATION)\]\]/.test(el.textContent||''))el.textContent=String(el.textContent||'').replace(/\[\[(?:CHARACTER|NARRATION)\]\]\s*/g,'');
}
function playerSettingsMarkup(){
  const s=readState(),origin=String(s.player?.origin||'').toUpperCase(),name=s.player?.name||'';
  return `<details open data-player-settings-restored><summary>PLAYER</summary><div class="hvg-settings-fields hv-player-restored" id="playerSettingsPanel" data-origin="${esc(origin)}"><label>Name<input id="playerSettingsName" maxlength="30" value="${esc(name)}"></label><div class="hv-player-settings-origins">${Object.entries(PLAYER_ORIGINS).map(([key,realm])=>`<button type="button" class="${origin===key?'active':''}" data-player-settings-origin="${key}"><strong>${key}</strong><small>${realm}</small></button>`).join('')}</div><p class="muted">ROLE · EXTRA / LOW PROFILE</p><button class="gold-button" data-save-player-settings>SAVE PLAYER</button></div></details>`;
}
function ensurePlayerSettings(accordion){if(accordion&&!$('#playerSettingsPanel',accordion))accordion.insertAdjacentHTML('afterbegin',playerSettingsMarkup())}
function cleanSettings(){
  const grid=$('.site-shell.page-settings .settings-grid')||$('.page-settings .settings-grid')||$('.settings-grid');if(!grid)return;
  grid.classList.add('ux-settings-clean');
  for(const details of $$('details',grid)){const summary=$(':scope > summary',details);if(summary&&txt(summary).toUpperCase()==='GACHA SETTINGS')details.remove()}
  const accordion=$('.hvg-settings-accordion',grid);if(accordion)ensurePlayerSettings(accordion);
  const page=grid.closest('.page-settings')||grid.closest('.page')||$('#app'),diag=$('[data-hv-diagnostics]',page||document);
  if(diag&&accordion&&diag.parentElement!==accordion){
    const dataPanel=$$('details',accordion).find(el=>{const summary=$(':scope > summary',el),t=txt(summary).toUpperCase();return t==='DATA / BACKUP'||t==='DATA BACKUP'});
    dataPanel?accordion.insertBefore(diag,dataPanel):accordion.appendChild(diag);
  }
}
function ensureGachaGlobalNav(){
  const root=$('#hellaverseGachaRoot'),backdrop=root&&$('.hvg-backdrop',root);if(!root||!backdrop||$('.hvg-global-hud',root))return;
  const source=$('#app .game-hud');if(!source)return;
  const clone=source.cloneNode(true);clone.classList.add('hvg-global-hud');
  $$('.hud-tools,[data-admin],.admin-menu',clone).forEach(el=>el.remove());
  $$('.main-nav .nav-button, .brand-mark',clone).forEach(el=>el.classList.remove('active'));
  const gacha=$('[data-hvg-open]',clone);if(gacha)gacha.classList.add('active');backdrop.insertBefore(clone,backdrop.firstChild);
}
function cleanInventory(){for(const p of $$('.iv2-gift-preview>p'))p.remove()}
function cleanGiftResult(){
  for(const result of $$('.iv2-result')){
    for(const p of $$('.iv2-player',result))p.remove();
    for(const n of $$('.iv2-narration',result)){const t=txt(n);if(/건넨다|내민다|전해준다|준다[.!]?$/i.test(t))n.remove()}
    for(const b of $$('blockquote',result)){const t=txt(b);if(/가\s*[「“\"]?.+[」”\"]?을\s*받아\s*든다[.!]?/i.test(t)||/전용 반응 없음|특수 반응 없음/i.test(t))b.remove()}
  }
}
function run(){cleanNav();cleanRoomHud();cleanRoomPreview();cleanSettings();ensureGachaGlobalNav();cleanInventory();cleanGiftResult()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
function boot(){const app=$('#app');if(app&&!observer){observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true})}schedule()}
window.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  if(t.closest('[data-open-thoughts]')&&!t.closest('#hellaverseGachaRoot'))saveGoodNav($('.main-nav'));
  const gachaNav=t.closest('#hellaverseGachaRoot .hvg-global-hud');
  if(gachaNav){if(t.closest('[data-hvg-open]')){e.preventDefault();e.stopPropagation();return}document.body.classList.remove('hvg-open');$('#hellaverseGachaRoot')?.remove()}
  if(t.closest('[data-hvg-open]')||t.closest('#hellaverseGachaRoot'))setTimeout(schedule,0);
},true);
document.addEventListener('DOMContentLoaded',boot,{once:true});
window.addEventListener('load',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('hellaverse:gacha-updated',schedule);
window.addEventListener('storage',schedule);
if(document.readyState!=='loading')boot();
})();
