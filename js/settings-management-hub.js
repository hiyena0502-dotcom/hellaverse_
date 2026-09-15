(()=>{
'use strict';
if(window.__HELLAVERSE_SETTINGS_MANAGEMENT_HUB_V1__)return;
window.__HELLAVERSE_SETTINGS_MANAGEMENT_HUB_V1__=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;
function panel(){return `<section class="settings-panel settings-management-hub" data-settings-management-hub><p class="label">MANAGEMENT</p><h2>TOOLS</h2><p class="muted">편집과 데이터 관리는 여기서만 엽니다.</p><div class="settings-management-grid"><button type="button" data-item-manager-open><span>🎁</span><strong>ITEM MANAGER</strong><small>아이템 · 선물 반응</small></button><button type="button" data-page="editor"><span>✎</span><strong>EDITOR</strong><small>캐릭터 · 대화 · 관계</small></button><button type="button" data-export><span>↓</span><strong>BACKUP</strong><small>전체 데이터 내보내기</small></button><label class="settings-restore"><span>↑</span><strong>RESTORE</strong><small>백업 JSON 불러오기</small><input id="importFile" type="file" accept="application/json"></label></div></section>`}
function cleanOld(){for(const b of $$('[data-admin]'))b.remove();for(const m of $$('.admin-menu'))m.remove();for(const b of $$('.editor-sidebar [data-item-manager-open],.editor-sidebar [data-gm-open],.editor-sidebar [data-hvgift-manage]'))b.remove()}
function enhanceSettings(){const grid=$('.site-shell.page-settings .settings-grid');if(!grid)return;for(const sec of $$('.settings-panel',grid)){const label=String($('.label',sec)?.textContent||'').trim().toUpperCase();if(label==='DATA BACKUP'&&!sec.hasAttribute('data-settings-management-hub'))sec.remove()}if(!$('[data-settings-management-hub]',grid))grid.insertAdjacentHTML('afterbegin',panel())}
function enhance(){cleanOld();enhanceSettings()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hellaverse:state-updated',schedule);window.addEventListener('storage',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();