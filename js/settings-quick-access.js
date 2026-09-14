(()=>{
if(window.__HELLAVERSE_SETTINGS_QUICK_ACCESS_V1__)return;
window.__HELLAVERSE_SETTINGS_QUICK_ACCESS_V1__=1;

let queued=false;
const $=(s,r=document)=>r.querySelector(s);

function ensureStyle(){
  if($('#hvSettingsQuickStyle'))return;
  const style=document.createElement('style');
  style.id='hvSettingsQuickStyle';
  style.textContent=`
    .hv-settings-nav{display:inline-flex;align-items:center;justify-content:center;gap:6px}
    .hv-settings-nav:before{content:'⚙';font-size:.85em;opacity:.72}
    .room-hud .hv-settings-nav{margin-left:4px;border:0;background:transparent;color:var(--muted);font-size:.68rem;letter-spacing:.12em}
    .room-hud .hv-settings-nav:hover,.main-nav .hv-settings-nav:hover{color:var(--gold)}
    @media(max-width:700px){.main-nav .hv-settings-nav:before{display:none}.room-hud .hv-settings-nav{font-size:0}.room-hud .hv-settings-nav:before{display:block;font-size:.9rem}}
  `;
  document.head.appendChild(style);
}

function decorate(){
  ensureStyle();
  const mainNav=$('.game-hud .main-nav');
  if(mainNav&&!mainNav.querySelector('[data-hv-settings-quick]')){
    const btn=document.createElement('button');
    btn.className='nav-button hv-settings-nav';
    btn.dataset.page='settings';
    btn.dataset.hvSettingsQuick='1';
    btn.textContent='SETTINGS';
    mainNav.appendChild(btn);
  }
  const roomHud=$('.room-hud');
  if(roomHud&&!roomHud.querySelector('[data-hv-settings-quick]')){
    const btn=document.createElement('button');
    btn.className='hv-settings-nav';
    btn.dataset.page='settings';
    btn.dataset.hvSettingsQuick='1';
    btn.textContent='SETTINGS';
    roomHud.appendChild(btn);
  }
}

function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;decorate()});
}

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
