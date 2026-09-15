(()=>{
'use strict';
if(window.__HELLAVERSE_FINAL_UX_CLEANUP_V1__)return;
window.__HELLAVERSE_FINAL_UX_CLEANUP_V1__=1;

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;
const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

function cleanNav(){
  for(const nav of $$('.main-nav')){
    let settings=null;
    for(const b of $$('button,a',nav)){
      const t=txt(b).toUpperCase();
      if(t.includes('GACHA')){
        b.classList.add('hvg-nav-button');
        if(t!=='GACHA')b.textContent='GACHA';
      }
      if(t.includes('SETTINGS'))settings=b;
    }
    if(settings){
      settings.classList.add('ux-settings-last');
      if(nav.lastElementChild!==settings)nav.appendChild(settings);
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

function settingsPanelLabel(el){
  const l=$('.label',el);return String(l?.textContent||$('summary',el)?.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
}
function removeSettingsByTitle(grid,title){
  for(const el of $$(':scope > .settings-panel,:scope > details,:scope > section',grid)){
    const label=settingsPanelLabel(el),whole=txt(el).toUpperCase();
    if(label===title||whole.startsWith(title))el.remove();
  }
}
function cleanSettings(){
  const grid=$('.settings-grid');if(!grid)return;
  grid.classList.add('ux-settings-clean');
  removeSettingsByTitle(grid,'GACHA SETTINGS');
  removeSettingsByTitle(grid,'DATA BACKUP');
  removeSettingsByTitle(grid,'DATA / BACKUP');
  for(const el of $$('[data-runtime-diagnostics],.runtime-diagnostics,.runtime-diagnostics-panel'))el.remove();
  for(const el of $$('section,article,div',grid.parentElement||document)){
    if(/^RUNTIME DIAGNOSTICS\b/i.test(txt(el))){
      const panel=el.closest('section,article,.settings-panel')||el;panel.remove();break;
    }
  }
}

function cleanInventory(){for(const p of $$('.iv2-gift-preview>p'))p.remove()}

function cleanGiftResult(){
  for(const result of $$('.iv2-result')){
    for(const p of $$('.iv2-player',result))p.remove();
    for(const n of $$('.iv2-narration',result)){
      const t=txt(n);
      if(/건넨다|내민다|전해준다|준다[.!]?$/i.test(t)){n.classList.add('ux-hide-gift-repeat');n.remove()}
    }
    for(const b of $$('blockquote',result)){
      const t=txt(b).replace(/^[^\n]+\s+/,'');
      if(/가\s*[「“\"]?.+[」”\"]?을\s*받아\s*든다[.!]?$/i.test(t)||/전용 반응 없음|특수 반응 없음/i.test(t)){
        b.classList.add('ux-generic-gift-response');b.remove();
      }
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
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);window.addEventListener('hellaverse:state-updated',schedule);window.addEventListener('storage',schedule);if(document.readyState!=='loading')schedule();
})();