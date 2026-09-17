(()=>{
'use strict';
if(window.__HELLAVERSE_COLLECTION_REVEAL_LINE_BRIDGE_V1__)return;
window.__HELLAVERSE_COLLECTION_REVEAL_LINE_BRIDGE_V1__=1;

const K='hellaverse_dialogue_state_v1';
const $=(s,r=document)=>r.querySelector(s);
let queued=false,lastDetailId='';

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lineOf(item){return String(item?.gachaLine||item?.drawLine||item?.revealLine||'').trim()}
function itemById(state,id){return (state.collectionItems||[]).find(item=>String(item?.id)===String(id))||null}
function owned(state,id){return (state.ownedItems||state.owned||[]).map(String).includes(String(id))}
function installStyle(){
  if($('#hvgRevealLineBridgeStyle'))return;
  const style=document.createElement('style');style.id='hvgRevealLineBridgeStyle';style.textContent=`
  .hvg-reveal-line{margin:18px 0 16px;padding:14px 16px;border-left:2px solid var(--gold,#c9a66b);background:rgba(201,166,107,.07);border-radius:0 10px 10px 0}
  .hvg-reveal-line small{display:block;margin:0 0 7px;color:var(--gold,#c9a66b);font-size:.62rem;letter-spacing:.18em}
  .hvg-reveal-line p{margin:0!important;color:#f4eee8!important;opacity:1!important;font-size:.98rem;line-height:1.7;font-style:italic}
  .hvg-detail-reveal{grid-column:1/-1;margin-top:4px;padding:13px 15px;border:1px solid rgba(201,166,107,.18);border-radius:11px;background:rgba(201,166,107,.055)}
  .hvg-detail-reveal dt{margin-bottom:6px;color:var(--gold,#c9a66b);font-size:.62rem;letter-spacing:.16em}
  .hvg-detail-reveal dd{margin:0;color:#f4eee8;line-height:1.65;font-style:italic}
  `;document.head.appendChild(style);
}
function mountDrawResult(){
  const result=$('#hellaverseGachaRoot .hvg-result-card');if(!result)return;
  const button=$('[data-hvg-view]',result),id=button?.dataset.hvgView;if(!id)return;
  const state=read(),item=itemById(state,id),line=lineOf(item);if(!line){$('.hvg-reveal-line',result)?.remove();return}
  let box=$('.hvg-reveal-line',result);if(!box){box=document.createElement('blockquote');box.className='hvg-reveal-line';const copy=$('.hvg-result-copy',result);const desc=copy?.querySelector('p');if(desc)desc.insertAdjacentElement('afterend',box);else copy?.appendChild(box)}
  if(box)box.innerHTML=`<small>REVEAL LINE</small><p>${esc(line)}</p>`;
}
function inferDetailId(root,state){
  if(lastDetailId&&itemById(state,lastDetailId))return lastDetailId;
  const title=$('.hvg-detail h2',root)?.textContent?.trim();if(!title||title==='???')return'';
  const matches=(state.collectionItems||[]).filter(item=>String(item?.name||item?.title||'').trim()===title);return matches.length===1?String(matches[0].id||''):'';
}
function mountCollectionDetail(){
  const root=$('#hvgDetailRoot');if(!root)return;
  const state=read(),id=inferDetailId(root,state);if(!id)return;
  const item=itemById(state,id),line=lineOf(item);if(!item||!line||!owned(state,id)){$('.hvg-detail-reveal',root)?.remove();return}
  let box=$('.hvg-detail-reveal',root);if(!box){box=document.createElement('div');box.className='hvg-detail-reveal';const dl=$('.hvg-detail dl',root);if(dl)dl.appendChild(box);else $('.hvg-detail>div:last-child',root)?.appendChild(box)}
  if(box)box.innerHTML=`<dt>REVEAL LINE</dt><dd>${esc(line)}</dd>`;
}
function run(){installStyle();mountDrawResult();mountCollectionDetail()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const detail=target.closest('[data-hvg-detail]');if(detail?.dataset.hvgDetail)lastDetailId=String(detail.dataset.hvgDetail);
  if(target.closest('[data-hvg-detail-close]'))lastDetailId='';
  setTimeout(schedule,0);
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:gacha-updated',schedule);
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('storage',event=>{if(!event.key||event.key===K)schedule()});
document.addEventListener('DOMContentLoaded',schedule);
window.addEventListener('load',schedule);
if(document.readyState!=='loading')schedule();
})();
