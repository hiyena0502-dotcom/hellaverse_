(()=>{
'use strict';
if(window.__HELLAVERSE_FINAL_UX_CLEANUP_V15__)return;
window.__HELLAVERSE_FINAL_UX_CLEANUP_V15__=1;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false,observer=null;
const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

function cleanNav(){
  for(const nav of $$('.main-nav')){
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
function run(){cleanNav();cleanRoomHud();cleanRoomPreview();ensureGachaGlobalNav();cleanInventory();cleanGiftResult()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
function boot(){const app=$('#app');if(app&&!observer){observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true})}schedule()}
window.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t)return;
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