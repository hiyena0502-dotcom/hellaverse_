(()=>{
if(window.__HELLAVERSE_PLAYER_GAME_LOOP_STORY_FIX_V2__)return;
window.__HELLAVERSE_PLAYER_GAME_LOOP_STORY_FIX_V2__=1;

const K='hellaverse_dialogue_state_v1';
const LUCIFER='lucifer-morningstar';
let hotelMeetOpen=false;
let queued=false;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(state){try{localStorage.setItem(K,JSON.stringify(state));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'thought-archive',clearDirty:false}}));return true}catch{return false}}
function addFlags(state,v){state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};split(v).forEach(x=>state.flags[x]=true)}
function hasFlag(state,v){return !!state.flags?.[v]}
function originKey(state){return String(state.player?.origin||'').toUpperCase()}
function realmFor(origin){return origin==='ANGEL'||origin==='WINNER'?'heaven':'hell'}
function originName(origin){return({HELLBORN:'HELLBORN',SINNER:'SINNER',ANGEL:'ANGEL',WINNER:'WINNER'})[origin]||'UNKNOWN'}
function addMemory(state,{title,summary,tags,sourceId}){
  state.memories=Array.isArray(state.memories)?state.memories:[];
  if(state.memories.some(m=>m?.sourceType==='player-story'&&m?.sourceId===sourceId))return;
  state.memories.unshift({id:`story-${Date.now()}-${Math.random().toString(16).slice(2)}`,characterId:LUCIFER,type:'event',title,summary,tags:split(tags),sourceType:'player-story',sourceId,importance:'normal',createdAt:new Date().toISOString(),pinned:false,hidden:false});
}
function addAffection(state,delta){state.affection=state.affection||{};const now=Math.max(0,Math.min(100,Number(state.affection?.[LUCIFER]?.value||0)+Number(delta||0)));state.affection[LUCIFER]={...(state.affection[LUCIFER]||{}),value:now}}
function ensureCss(){if($('#hvStoryFixStyle'))return;const style=document.createElement('style');style.id='hvStoryFixStyle';style.textContent=`
.hv-day-guide{display:flex;align-items:center;justify-content:space-between;gap:14px;width:min(440px,100%);margin:10px 0 2px;padding:10px 12px;border:1px solid rgba(201,166,107,.18);background:rgba(10,8,9,.4)}
.hv-day-guide span{color:var(--muted);font-size:.72rem;line-height:1.45}.hv-day-guide b{color:var(--gold);font-weight:500}.hv-day-guide button{flex:0 0 auto;border:0;border-bottom:1px solid var(--gold);background:transparent;color:var(--gold);padding:7px 0;font-size:.68rem;letter-spacing:.13em}.hv-day-guide.ready{border-color:rgba(201,166,107,.5);background:rgba(167,45,72,.12)}
.hv-story-modal{position:fixed;inset:0;z-index:1390;display:grid;place-items:center;padding:20px;background:rgba(5,4,5,.88);backdrop-filter:blur(8px)}.hv-story-card{width:min(680px,94vw);max-height:86vh;overflow:auto;padding:clamp(24px,5vw,44px);border:1px solid rgba(201,166,107,.36);background:rgba(11,8,10,.99);box-shadow:0 28px 86px rgba(0,0,0,.62)}.hv-story-kicker{margin:0 0 9px;color:var(--gold);font-size:.66rem;letter-spacing:.18em}.hv-story-card h2{margin:0 0 18px;font-family:Georgia,serif;font-size:clamp(1.8rem,5vw,3rem);font-weight:500}.hv-story-narration{color:var(--muted);font-style:italic;line-height:1.7}.hv-story-line{margin:16px 0;padding:14px 0;border-top:1px solid rgba(243,236,232,.07);border-bottom:1px solid rgba(243,236,232,.07)}.hv-story-line strong{display:block;margin-bottom:8px;color:var(--gold);font-size:.68rem;letter-spacing:.14em}.hv-story-line p{margin:0;font-family:Georgia,serif;font-size:1.06rem;line-height:1.7}.hv-story-actions{display:grid;margin-top:22px;border-top:1px solid var(--line)}.hv-story-actions button{display:grid;grid-template-columns:40px 1fr;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--text);padding:13px 0;text-align:left}.hv-story-actions button b{color:var(--gold);font-weight:500}.hv-story-actions button:hover span{color:var(--gold)}.hv-story-continue{width:100%;margin-top:22px;border:1px solid rgba(201,166,107,.5);background:rgba(167,45,72,.12);color:var(--gold);padding:12px;letter-spacing:.14em}.hv-day-explain{margin:12px 0 0!important;color:var(--gold)!important;font-size:.76rem!important}
@media(max-width:700px){.hv-day-guide{align-items:flex-start;flex-direction:column}.hv-story-card{padding:24px 18px}}
`;document.head.appendChild(style)}

function hotelOpening(state){const name=state.player?.name||'당신',origin=originKey(state);const line={
 HELLBORN:`루시퍼가 당신을 한 번 훑어본다. “${name}. 지옥 토박이구나. 찰리 호텔에서 마주친 거면 설명할 것도 별로 없겠네. 그리고 그렇게 긴장하지 마. 지금은 공식 석상도 아니니까.”`,
 SINNER:`루시퍼가 잠깐 당신을 바라본다. “${name}. 죄인 쪽이네. 생전 이야기는 안 물을게. 찰리 호텔에 온 사람한테 과거부터 캐묻는 건 그 애도 싫어할 테니까.”`,
 ANGEL:`루시퍼의 시선이 아주 잠깐 멈춘다. “…천국 출신?” 곧 호텔 안을 둘러본 뒤 어깨를 으쓱한다. “뭐, 찰리 호텔이면 이런 만남도 가능하겠지. 고위직도 아니라니 널 천국 대표로 볼 생각은 없어.”`,
 WINNER:`루시퍼가 눈썹을 든다. “위너가 찰리 호텔에 있네. 세상 참 많이 변했군.” 잠깐 당신을 보던 그가 웃는다. “${name}, 걱정 마. 널 천국 대표처럼 취급할 생각은 없어.”`
}[origin]||`루시퍼가 당신을 바라본다. “${name}, 맞지? 찰리 호텔에서 마주쳤으니 일단 손님 취급은 해주지.”`;return line}
function showHotelMeeting(state){
 if(hotelMeetOpen||$('#hvHotelMeetModal')||$('#hvPlayerSetup'))return;
 hotelMeetOpen=true;
 const root=document.createElement('div');root.id='hvHotelMeetModal';root.className='hv-story-modal';
 root.innerHTML=`<section class="hv-story-card"><p class="hv-story-kicker">PROLOGUE · HAZBIN HOTEL</p><h2>처음 마주친 곳</h2><p class="hv-story-narration">찰리 모닝스타의 해즈빈 호텔. 출신이 어디든, 당신이 루시퍼 모닝스타를 처음 제대로 마주친 곳은 여기였다. 특별한 초대도 운명적인 임무도 아니다. 호텔을 드나들던 평범한 한 사람이 우연히 왕과 마주쳤을 뿐이다.</p><div class="hv-story-line"><strong>LUCIFER</strong><p>${esc(hotelOpening(state))}</p></div><button class="hv-story-continue" data-hv-hotel-meet-continue>CONTINUE</button></section>`;
 document.body.appendChild(root);
}
function finishHotelMeeting(){const state=read(),origin=originKey(state);addFlags(state,'player.met_lucifer_at_hotel, lucifer.player_origin_known, lucifer.player_origin_reacted');addMemory(state,{title:'찰리의 호텔에서 루시퍼를 처음 만남',summary:`찰리의 해즈빈 호텔에서 루시퍼와 처음 제대로 마주쳤다. 그는 플레이어가 ${originName(origin)} 출신이라는 걸 알게 되었다.`,tags:`lucifer:first-meeting-hotel, player-origin:${origin.toLowerCase()}, player-realm:${realmFor(origin)}`,sourceId:'lucifer-first-meeting-hotel'});write(state);$('#hvHotelMeetModal')?.remove();hotelMeetOpen=false;schedule()}

function letterIntro(root){root.dataset.storyEnhanced='letter';root.innerHTML=`<section class="hv-game-modal-card hv-letter-story"><p class="hv-game-kicker">TODAY'S EVENT · HAZBIN HOTEL</p><h2>찰리의 작은 부탁</h2><p class="hv-story-narration">호텔 로비를 지나가던 당신을 찰리가 급히 불러 세운다. 손에는 봉투 하나가 들려 있다.</p><div class="hv-story-line"><strong>CHARLIE</strong><p>“혹시 아빠 방 가는 길이면 이것 좀 전해줄래? 급한 건 아닌데, 지금 내가 손이 조금 모자라서!”</p></div><div class="hv-story-actions"><button data-hv-letter-next><b>01</b><span>[편지를 받는다]</span></button><button data-hv-letter-next><b>02</b><span>“제가요? …알겠어요.”</span></button></div></section>`}
function letterDoor(root){root.innerHTML=`<section class="hv-game-modal-card hv-letter-story"><p class="hv-game-kicker">TODAY'S EVENT · LUCIFER'S ROOM</p><h2>편지 전달</h2><p class="hv-story-narration">봉투를 들고 루시퍼의 방으로 향한다. 문을 두드리고 들어가자, 루시퍼가 당신 손에 든 봉투를 먼저 발견한다.</p><div class="hv-story-line"><strong>LUCIFER</strong><p>“응? 잠깐, 그거 찰리 글씨잖아. 설마 네가 전달하러 온 거야?”</p></div><div class="hv-story-actions"><button data-hv-letter-final="quiet"><b>01</b><span>[말없이 편지를 건넨다]</span></button><button data-hv-letter-final="royal"><b>02</b><span>“왕실 특급 배송입니다.”</span></button></div></section>`}
function resolveLetter(kind,root){const state=read();if(state.game?.currentEventResolved)return;state.game=state.game||{};state.game.actionsLeft=Math.max(0,Number(state.game.actionsLeft||0)-1);state.game.actionsToday=Array.isArray(state.game.actionsToday)?state.game.actionsToday:[];state.game.actionsToday.push({type:'TODAY',label:'찰리의 작은 부탁 · 편지 전달',at:new Date().toISOString()});state.game.currentEventResolved=true;state.game.currentEventResult=kind==='royal'?'왕실 특급 배송':'편지를 조용히 전달함';addAffection(state,1);addFlags(state,'lucifer.daily_errand_shared, player.helped_charlie_at_hotel');if(kind==='royal')addMemory(state,{title:'왕실 특급 배송',summary:'찰리의 부탁으로 루시퍼에게 편지를 전달하면서 왕실 특급 배송이라고 농담했다.',tags:'lucifer:daily-routine, lucifer:joke-shared, player:hotel-helper',sourceId:`day-${state.game.day||1}-hotel-letter`});else addMemory(state,{title:'찰리의 편지를 전해줌',summary:'찰리의 부탁으로 루시퍼의 방에 찾아가 편지를 직접 전달했다.',tags:'lucifer:daily-routine, player:hotel-helper, lucifer:charlie-care',sourceId:`day-${state.game.day||1}-hotel-letter`});write(state);const line=kind==='royal'?'루시퍼가 봉투를 받아들고 과장되게 자세를 고쳐 앉는다. “왕실 특급? 이런, 그럼 서명이라도 해야 하나?” 잠깐 웃은 뒤 봉투를 내려다본다. “좋아. 수고했어, 특급 배송원. 찰리한테 잘 받았다고 전해줘.”':'루시퍼가 봉투를 받아들고 찰리의 글씨를 확인한다. “오. 고마워.” 잠깐 봉투를 뒤집어보던 그가 당신을 본다. “찰리가 바쁜가 보네. 네가 대신 와준 거구나. 수고했어.”';root.innerHTML=`<section class="hv-game-modal-card hv-letter-story"><p class="hv-game-kicker">EVENT RESULT</p><h2>편지 전달 완료</h2><div class="hv-story-line"><strong>LUCIFER</strong><p>${esc(line)}</p></div><p>♥ +1 · MEMORY / EVENT UPDATED</p><button class="hv-story-continue" data-hv-modal-close>RETURN TO ROOM</button></section>`}
function enhanceLetterModal(state){const root=$('#hvGameModal');if(!root||root.dataset.storyEnhanced==='letter'||state.game?.currentEventId!=='hotel-errand'||state.game?.currentEventResolved)return;const kicker=$('.hv-game-kicker',root)?.textContent||'';if(!/TODAY'S EVENT/i.test(kicker))return;letterIntro(root)}

function dayGuideMarkup(state){const g=state.game||{},left=Math.max(0,Number(g.actionsLeft||0));if(g.ended)return`<div class="hv-day-guide ready"><span><b>DAY ${String(g.day||1).padStart(2,'0')} COMPLETE</b><br>결과를 확인하고 NEXT DAY를 누르면 행동 3회가 다시 생겨.</span><button data-hv-day-guide>VIEW RESULT</button></div>`;if(left<=0)return`<div class="hv-day-guide ready"><span><b>오늘 행동을 모두 사용했어.</b><br>END DAY → 하루 결과 확인 → NEXT DAY 순서로 다음 날로 넘어가.</span><button data-hv-day-guide>END DAY →</button></div>`;return`<div class="hv-day-guide"><span>오늘 행동 <b>${left}회 남음</b> · 원하면 일찍 하루를 끝내도 돼.</span><button data-hv-day-guide>END DAY</button></div>`}
function guideSignature(state){const g=state.game||{};return`${Number(g.day||1)}:${Number(g.actionsLeft||0)}:${g.ended?1:0}`}
function decorateDayGuide(state){if(!state.player?.profileSetup||!state.game)return;const sig=guideSignature(state);for(const chip of $$('.hv-today-chip')){let guide=chip.nextElementSibling?.classList?.contains('hv-day-guide')?chip.nextElementSibling:null;if(guide?.dataset.sig===sig)continue;if(guide)guide.remove();chip.insertAdjacentHTML('afterend',dayGuideMarkup(state));guide=chip.nextElementSibling?.classList?.contains('hv-day-guide')?chip.nextElementSibling:null;if(guide)guide.dataset.sig=sig}const modal=$('#hvGameModal .hv-game-modal-card');if(modal&&/DAY COMPLETE/i.test(modal.textContent||'')&&!$('.hv-day-explain',modal)){const actions=$('.hv-modal-actions',modal);actions?.insertAdjacentHTML('beforebegin','<p class="hv-day-explain">NEXT DAY를 누르면 다음 날로 넘어가고 행동 횟수가 3회로 회복돼.</p>')}}
function maybeHotelMeeting(state){if(!state.player?.profileSetup||state.page!=='life'||state.active!==LUCIFER||hasFlag(state,'player.met_lucifer_at_hotel'))return;showHotelMeeting(state)}
function decorate(){ensureCss();const state=read();enhanceLetterModal(state);decorateDayGuide(state);maybeHotelMeeting(state)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}

document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target:null;if(!t)return;if(t.closest('[data-hv-hotel-meet-continue]')){e.preventDefault();finishHotelMeeting();return}if(t.closest('[data-hv-letter-next]')){e.preventDefault();const root=$('#hvGameModal');if(root)letterDoor(root);return}const final=t.closest('[data-hv-letter-final]');if(final){e.preventDefault();const root=$('#hvGameModal');if(root)resolveLetter(final.dataset.hvLetterFinal,root);return}if(t.closest('[data-hv-day-guide]')){e.preventDefault();const original=$('[data-hv-end-day]');if(original){original.click();setTimeout(schedule,0);return}const nextDay=$('[data-hv-next-day]');nextDay?.click();return}},false);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hellaverse:state-updated',schedule);
window.addEventListener('load',schedule);
document.addEventListener('DOMContentLoaded',schedule);
schedule();
})();