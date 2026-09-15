(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_EPISODE_FLOW_V1__)return;
window.__HELLAVERSE_DIALOGUE_EPISODE_FLOW_V1__=1;

const K='hellaverse_dialogue_state_v1';
const MIG='hellaverse_dialogue_episode_common_migration_v1';
const COMMON_ID='episode-common-after-choice';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let queued=false;

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s,source='dialogue-episode-flow'){
 const v=JSON.stringify(s);localStorage.setItem(K,v);
 try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:v}))}catch{}
 window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
}
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function encode(beats){
 return beats.filter(b=>String(b.text||'').trim()).map(b=>`[[${b.kind==='NARRATION'?'NARRATION':'CHARACTER'}]] ${String(b.text||'').trim()}`).join('\n');
}
function decode(raw,fallback='CHARACTER'){
 raw=String(raw||'').trim();if(!raw)return[];
 const parts=raw.split(/\n(?=\[\[(?:CHARACTER|NARRATION)\]\])/g),out=[];
 for(const part of parts){const m=part.match(/^\[\[(CHARACTER|NARRATION)\]\]\s*([\s\S]*)$/);if(m)out.push({kind:m[1],text:m[2].trim()});else out.push({kind:fallback,text:part.trim()})}
 return out.filter(b=>b.text);
}
function nodes(){const el=$('#sNodesJson');if(!el)return[];try{const v=JSON.parse(el.value||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function saveNodes(list){const el=$('#sNodesJson');if(!el)return;const value=JSON.stringify(list,null,2);if(el.value===value)return;el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}
function commonNode(list=nodes()){return list.find(n=>String(n?.id||'')===COMMON_ID)||null}
function choiceHasContent(n){return !!($(`#c${n}text`)?.value.trim()||$(`#c${n}player`)?.value.trim()||$(`#c${n}res`)?.value.trim())}

function migrateDuplicateResponses(){
 try{if(localStorage.getItem(MIG)==='1')return}catch{}
 const s=read();let changed=false;
 for(const sc of Array.isArray(s.dialogues)?s.dialogues:[]){
  const first=Array.isArray(sc?.nodes)?sc.nodes[0]:null,chs=Array.isArray(first?.choices)?first.choices:[];
  const active=chs.filter(ch=>clean(ch?.text||ch?.playerLine||''));
  if(active.length<2)continue;
  if(active.some(ch=>String(ch?.nextNodeId||'').trim()))continue;
  const responses=active.map(ch=>clean(ch?.response||''));
  if(!responses[0]||!responses.every(r=>r===responses[0]))continue;
  if((sc.nodes||[]).some(n=>String(n?.id||'')===COMMON_ID))continue;
  sc.nodes.push({id:COMMON_ID,speaker:'character',text:encode([{kind:'CHARACTER',text:active[0].response}]),choices:[]});
  active.forEach(ch=>{ch.response='';ch.nextNodeId=COMMON_ID;ch.endConversation=false});
  changed=true;
 }
 if(changed)write(s,'dialogue-episode-migration');
 try{localStorage.setItem(MIG,'1')}catch{}
}

function beatRow(beat={kind:'CHARACTER',text:''}){
 const row=document.createElement('div');row.className='episode-beat-editor';
 row.innerHTML=`<select data-episode-kind><option value="CHARACTER" ${beat.kind!=='NARRATION'?'selected':''}>CHARACTER</option><option value="NARRATION" ${beat.kind==='NARRATION'?'selected':''}>NARRATION</option></select><textarea data-episode-text rows="2" placeholder="이어지는 대사 또는 나레이션">${esc(beat.text||'')}</textarea><button type="button" data-episode-remove>REMOVE</button>`;
 return row;
}
function listBeats(host){return $$(':scope > .episode-beat-editor',host).map(row=>({kind:$('[data-episode-kind]',row)?.value==='NARRATION'?'NARRATION':'CHARACTER',text:$('[data-episode-text]',row)?.value||''})).filter(b=>b.text.trim())}
function addBeat(host,kind){host.appendChild(beatRow({kind,text:''}));setTimeout(()=>$('[data-episode-text]',host.lastElementChild)?.focus(),0)}
function beatBlock(title,help,beats,kind){
 const wrap=document.createElement('div');wrap.dataset.episodeBlock=kind;wrap.innerHTML=`<div class="episode-flow-head"><div><strong>${title}</strong><small>${help}</small></div></div><div class="episode-beat-list" data-episode-list="${kind}"></div><div class="episode-beat-actions"><button type="button" data-episode-add="${kind}:CHARACTER">+ CHARACTER LINE</button><button type="button" data-episode-add="${kind}:NARRATION">+ NARRATION</button></div>`;
 const list=$('[data-episode-list]',wrap);beats.forEach(b=>list.appendChild(beatRow(b)));return wrap;
}
function syncOpening(card){const list=$('[data-episode-list="opening"]',card),open=$('#sOpen');if(!list||!open)return;open.value=encode(listBeats(list));open.dispatchEvent(new Event('input',{bubbles:true}))}
function syncCommon(card){
 const list=$('[data-episode-list="common"]',card);if(!list)return;
 const beats=listBeats(list),all=nodes();let node=commonNode(all);
 if(beats.length){
  if(!node){node={id:COMMON_ID,speaker:'character',text:'',choices:[]};all.push(node)}
  node.text=encode(beats);node.speaker='character';node.choices=Array.isArray(node.choices)?node.choices:[];
  for(let n=1;n<=3;n++)if(choiceHasContent(n)){
   const next=$(`#c${n}next`),end=$(`#c${n}end`);if(next){next.value=COMMON_ID;next.dispatchEvent(new Event('input',{bubbles:true}))}if(end){end.value='false';end.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  card.classList.add('has-common-continuation');
 }else{
  if(node){const idx=all.indexOf(node);if(idx>=0)all.splice(idx,1)}
  for(let n=1;n<=3;n++){const next=$(`#c${n}next`),end=$(`#c${n}end`);if(next?.value===COMMON_ID){next.value='';next.dispatchEvent(new Event('input',{bubbles:true}));if(end){end.value='true';end.dispatchEvent(new Event('change',{bubbles:true}))}}
  }
  card.classList.remove('has-common-continuation');
 }
 saveNodes(all);
}
function enhanceEditor(){
 const card=$('.dfe-card');if(!card||!$('#sOpen',card))return;
 const open=$('#sOpen',card),openLabel=open.closest('label');openLabel?.classList.add('episode-core-hidden');
 if(card.dataset.episodeFlow==='1'){
  const common=$('[data-episode-list="common"]',card);card.classList.toggle('has-common-continuation',!!common&&listBeats(common).length>0);return;
 }
 card.dataset.episodeFlow='1';
 const all=nodes(),shared=commonNode(all),openingBeats=decode(open.value,'CHARACTER'),commonBeats=decode(shared?.text||'','CHARACTER');
 const section=document.createElement('section');section.className='episode-flow';
 section.appendChild(beatBlock('EPISODE OPENING','선택지가 나오기 전에 루시퍼 대사와 나레이션을 원하는 만큼 이어 붙입니다.',openingBeats,'opening'));
 const details=document.createElement('details');details.className='episode-common';if(commonBeats.length)details.open=true;
 details.innerHTML='<summary>COMMON CONTINUATION · 어떤 Choice를 골라도 이어지는 장면</summary><p>세 Choice에 같은 Response를 복사하지 말고 여기에 한 번만 적으세요. 선택 뒤 이 흐름으로 합쳐집니다.</p>';
 details.appendChild(beatBlock('AFTER ANY CHOICE','선택지별 고유 반응 뒤에 공통으로 이어지는 루시퍼 대사/나레이션입니다.',commonBeats,'common'));
 section.appendChild(details);
 const choices=$('.dfe-choice-stack',card)?.closest('.dfe-section');choices?card.insertBefore(section,choices):card.appendChild(section);
 card.classList.toggle('has-common-continuation',commonBeats.length>0);
}

function parsedRenderBeats(text){return decode(text,'CHARACTER')}
function replaceMarked(el){
 if(!el||el.dataset.episodeParsed==='1')return;
 const p=el.matches('article.dialogue-line')?$('p',el):el,text=p?.textContent||'';if(!/\[\[(?:CHARACTER|NARRATION)\]\]/.test(text))return;
 const beats=parsedRenderBeats(text);if(!beats.length)return;
 const speaker=el.matches('article.dialogue-line')?($('strong',el)?.textContent||'CHARACTER'):'CHARACTER',frag=document.createDocumentFragment();
 for(const b of beats){
  if(b.kind==='NARRATION'){const n=document.createElement('p');n.className='narration dialogue-narration episode-beat-render';n.textContent=b.text;frag.appendChild(n)}
  else{const a=document.createElement('article');a.className='dialogue-line character episode-beat-render';const st=document.createElement('strong');st.textContent=speaker;const tx=document.createElement('p');tx.textContent=b.text;a.append(st,tx);frag.appendChild(a)}
 }
 el.dataset.episodeParsed='1';el.replaceWith(frag);
}
function renderMarkers(){for(const el of $$('.dialogue-page-text article.dialogue-line,.dialogue-page-text>p.narration,.dialogue-lines article.dialogue-line,.dialogue-lines>p.narration'))replaceMarked(el)}
function run(){enhanceEditor();renderMarkers()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}

document.addEventListener('click',e=>{
 const t=e.target instanceof Element?e.target:null;if(!t)return;
 const add=t.closest('[data-episode-add]');if(add){e.preventDefault();const [which,kind]=String(add.dataset.episodeAdd||'').split(':'),host=$(`[data-episode-list="${which}"]`);if(host){addBeat(host,kind==='NARRATION'?'NARRATION':'CHARACTER');const card=host.closest('.dfe-card');which==='opening'?syncOpening(card):syncCommon(card)}return}
 const rem=t.closest('[data-episode-remove]');if(rem){e.preventDefault();const row=rem.closest('.episode-beat-editor'),host=row?.parentElement,which=host?.dataset.episodeList;row?.remove();const card=host?.closest('.dfe-card');if(card)(which==='opening'?syncOpening(card):syncCommon(card));return}
 if(t.closest('[data-save-scene]')){const card=t.closest('.dfe-card')||$('.dfe-card');if(card){syncOpening(card);syncCommon(card)}}
},true);
document.addEventListener('input',e=>{const t=e.target;if(!(t instanceof Element)||!t.matches('[data-episode-text]'))return;const host=t.closest('[data-episode-list]'),card=host?.closest('.dfe-card');if(card)(host.dataset.episodeList==='opening'?syncOpening(card):syncCommon(card))},true);
document.addEventListener('change',e=>{const t=e.target;if(!(t instanceof Element)||!t.matches('[data-episode-kind]'))return;const host=t.closest('[data-episode-list]'),card=host?.closest('.dfe-card');if(card)(host.dataset.episodeList==='opening'?syncOpening(card):syncCommon(card))},true);

migrateDuplicateResponses();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule);window.addEventListener('load',schedule);window.addEventListener('hellaverse:state-updated',schedule);if(document.readyState!=='loading')schedule();
})();
