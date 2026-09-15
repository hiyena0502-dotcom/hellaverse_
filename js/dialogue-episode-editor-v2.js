(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_EPISODE_EDITOR_V2__)return;
window.__HELLAVERSE_DIALOGUE_EPISODE_EDITOR_V2__=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let queued=false;
function decode(raw,fallback='CHARACTER'){
 raw=String(raw||'').trim();if(!raw)return[];
 if(!/\[\[(?:CHARACTER|NARRATION)\]\]/.test(raw))return[{kind:fallback,text:raw}];
 return raw.split(/\n(?=\[\[(?:CHARACTER|NARRATION)\]\])/g).map(part=>{const m=part.match(/^\[\[(CHARACTER|NARRATION)\]\]\s*([\s\S]*)$/);return m?{kind:m[1],text:m[2].trim()}:{kind:fallback,text:part.trim()}}).filter(x=>x.text);
}
function encode(rows){return rows.filter(x=>String(x.text||'').trim()).map(x=>`[[${x.kind==='NARRATION'?'NARRATION':'CHARACTER'}]] ${String(x.text||'').trim()}`).join('\n')}
function rowMarkup(b={kind:'CHARACTER',text:''}){return`<div class="episode-beat-editor" data-episode-inline-row><select data-inline-kind><option value="CHARACTER" ${b.kind!=='NARRATION'?'selected':''}>CHARACTER</option><option value="NARRATION" ${b.kind==='NARRATION'?'selected':''}>NARRATION</option></select><textarea data-inline-text rows="2" placeholder="이어지는 대사 또는 나레이션">${esc(b.text)}</textarea><button type="button" data-inline-remove>REMOVE</button></div>`}
function rows(host){return $$('[data-episode-inline-row]',host).map(r=>({kind:$('[data-inline-kind]',r)?.value==='NARRATION'?'NARRATION':'CHARACTER',text:$('[data-inline-text]',r)?.value||''})).filter(x=>x.text.trim())}
function sync(host){const ta=host?.previousElementSibling;if(!(ta instanceof HTMLTextAreaElement))return;const value=encode(rows(host));if(ta.value===value)return;ta.value=value;ta.dispatchEvent(new Event('input',{bubbles:true}))}
function enhanceTextarea(ta,type){
 if(!(ta instanceof HTMLTextAreaElement)||ta.dataset.episodeBeats==='1')return;ta.dataset.episodeBeats='1';ta.classList.add('episode-core-hidden');
 const label=ta.closest('label');if(!label)return;
 const host=document.createElement('div');host.className='episode-inline-editor';host.dataset.episodeInline=type;
 const isBranch=type==='branch';host.innerHTML=`<div class="episode-flow-head"><div><strong>${isBranch?'BRANCH RESPONSE':'CONTINUATION BEATS'}</strong><small>${isBranch?'이 Choice에서만 달라지는 반응입니다. 모든 Choice 뒤에 같은 대사가 이어지면 COMMON CONTINUATION을 사용하세요.':'Choice 뒤에 이어지는 캐릭터 대사와 나레이션을 순서대로 추가합니다.'}</small></div></div><div class="episode-beat-list" data-inline-list></div><div class="episode-beat-actions"><button type="button" data-inline-add="CHARACTER">+ CHARACTER LINE</button><button type="button" data-inline-add="NARRATION">+ NARRATION</button></div>`;
 const list=$('[data-inline-list]',host),fallback='CHARACTER';decode(ta.value,fallback).forEach(b=>list.insertAdjacentHTML('beforeend',rowMarkup(b)));ta.insertAdjacentElement('afterend',host);
 if(isBranch){for(const n of Array.from(label.childNodes)){if(n.nodeType===Node.TEXT_NODE&&String(n.textContent||'').trim().toUpperCase()==='RESPONSE')n.textContent=''}}
}
function enhance(){
 for(let n=1;n<=3;n++){const ta=$(`#c${n}res`);if(ta)enhanceTextarea(ta,'branch')}
 for(const ta of $$('[data-dfe-nested-response]'))enhanceTextarea(ta,'branch');
 for(const ta of $$('[data-dfe-flow-text]'))enhanceTextarea(ta,'flow');
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;const add=t.closest('[data-inline-add]');if(add){e.preventDefault();const host=add.closest('[data-episode-inline]'),list=$('[data-inline-list]',host);if(list){list.insertAdjacentHTML('beforeend',rowMarkup({kind:add.dataset.inlineAdd==='NARRATION'?'NARRATION':'CHARACTER',text:''}));setTimeout(()=>$('[data-inline-text]',list.lastElementChild)?.focus(),0)}return}const rem=t.closest('[data-inline-remove]');if(rem){e.preventDefault();const host=rem.closest('[data-episode-inline]');rem.closest('[data-episode-inline-row]')?.remove();sync(host);return}},true);
document.addEventListener('input',e=>{const t=e.target;if(t instanceof Element&&t.matches('[data-inline-text]'))sync(t.closest('[data-episode-inline]'))},true);
document.addEventListener('change',e=>{const t=e.target;if(t instanceof Element&&t.matches('[data-inline-kind]'))sync(t.closest('[data-episode-inline]'))},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);window.addEventListener('hellaverse:state-updated',schedule);if(document.readyState!=='loading')schedule();
})();
