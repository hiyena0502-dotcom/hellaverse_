(()=>{
'use strict';
if(window.__HELLAVERSE_SETTINGS_MANAGEMENT_HUB_V2__)return;
window.__HELLAVERSE_SETTINGS_MANAGEMENT_HUB_V2__=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;
function panel(){return `<section class="settings-panel settings-management-hub" data-settings-management-hub><p class="label">MANAGEMENT</p><h2>TOOLS</h2><p class="muted">편집과 데이터 관리는 여기서만 엽니다.</p><div class="settings-management-grid"><button type="button" data-item-manager-open><span>🎁</span><strong>ITEM MANAGER</strong><small>아이템 · 선물 반응</small></button><button type="button" data-page="editor"><span>✎</span><strong>EDITOR</strong><small>캐릭터 · 대화 · 관계</small></button><button type="button" data-export><span>↓</span><strong>BACKUP</strong><small>전체 데이터 내보내기</small></button><label class="settings-restore"><span>↑</span><strong>RESTORE</strong><small>백업 JSON 불러오기</small><input id="importFile" type="file" accept="application/json"></label></div></section>`}
function cleanOld(){for(const b of $$('[data-admin]'))b.remove();for(const m of $$('.admin-menu'))m.remove();for(const b of $$('.editor-sidebar [data-item-manager-open],.editor-sidebar [data-gm-open],.editor-sidebar [data-hvgift-manage]'))b.remove()}
function panelByLabel(grid,label){return $$('.settings-panel',grid).find(sec=>String($('.label',sec)?.textContent||'').trim().toUpperCase()===label)||null}
function ensureColumns(grid){
 let columns=$('[data-settings-columns]',grid);
 if(!columns){
  columns=document.createElement('div');columns.className='settings-columns';columns.dataset.settingsColumns='1';
  columns.innerHTML='<div class="settings-column settings-column-left" data-settings-column="left"></div><div class="settings-column settings-column-right" data-settings-column="right"></div>';
 }
 const player=$('#playerSettingsPanel',grid),hub=$('[data-settings-management-hub]',grid);
 const anchor=player?.nextSibling||hub?.nextSibling||grid.firstChild;
 if(columns.parentElement!==grid)grid.insertBefore(columns,anchor);
 else if(player&&columns.previousElementSibling!==player)grid.insertBefore(columns,player.nextSibling);
 const left=$('[data-settings-column="left"]',columns),right=$('[data-settings-column="right"]',columns);
 if(!left||!right)return;
 const appearance=$$('.settings-panel',grid).find(sec=>!!$('#setGold',sec));
 const danger=$('.danger-zone',grid)||panelByLabel(grid,'DANGER ZONE');
 const thought=$('.thought-settings-card',grid)||$('[data-thought-settings]',grid);
 const diagnostics=$('[data-hv-diagnostics]',grid);
 if(appearance&&appearance.parentElement!==left)left.appendChild(appearance);
 if(danger&&danger.parentElement!==left)left.appendChild(danger);
 if(thought&&thought.parentElement!==right)right.appendChild(thought);
 if(diagnostics&&diagnostics.parentElement!==right)right.appendChild(diagnostics);
}
function enhanceSettings(){
 const grid=$('.site-shell.page-settings .settings-grid');if(!grid)return;
 for(const sec of $$('.settings-panel',grid)){const label=String($('.label',sec)?.textContent||'').trim().toUpperCase();if(label==='DATA BACKUP'&&!sec.hasAttribute('data-settings-management-hub'))sec.remove()}
 if(!$('[data-settings-management-hub]',grid))grid.insertAdjacentHTML('afterbegin',panel());
 ensureColumns(grid);
}
function enhance(){cleanOld();enhanceSettings()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);window.addEventListener('storage',schedule);document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);if(document.readyState!=='loading')schedule();
})();