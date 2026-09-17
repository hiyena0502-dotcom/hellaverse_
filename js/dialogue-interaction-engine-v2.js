(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_INTERACTION_ENGINE_V2__)return;
window.__HELLAVERSE_DIALOGUE_INTERACTION_ENGINE_V2__=1;

const K='hellaverse_dialogue_state_v1',META='hellaverse_dialogue_render_meta_v1',PREFIX='hv-runtime-v2-';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const up=v=>String(v||'').trim().toUpperCase();
let bridge=false,lastReaction=new Map();

function read(key=K,f={}){try{return JSON.parse(localStorage.getItem(key)||'')||f}catch{return f}}
function publish(s,source='dialogue-interaction-v2'){
  const value=JSON.stringify(s);localStorage.setItem(K,value);
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:value,storageArea:localStorage,url:location.href}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
}
function state(){return read(K,{})}
function meta(){return read(META,{})}
function cid(){return String(state().active||'')}
function character(){const s=state(),id=String(s.active||'');return (s.characters||[]).find(c=>c?.id===id)||null}
function role(sc,s=state(),m=meta()){
  const explicit=up(s.dialogueFileMap?.[sc?.id]);if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const r=up(m?.[sc?.id]?.sceneRole||sc?.sceneRole||'');if(r)return r==='QUESTION'?'ASK':r;
  const k=up(sc?.kind||'TALK');return k==='ASK'?'ASK':k==='TALK'?'CONVERSATION':k;
}
function syntheticScene(id){
  const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
  b.type='button';b.hidden=true;b.dataset.scene=String(id);b.dataset.hvInteractionBridge='2';host.appendChild(b);
  bridge=true;try{b.click()}finally{bridge=false;if(b.isConnected)b.remove()}
}
function cleanRuntime(s){
  const now=Date.now();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
  s.dialogues=s.dialogues.filter(sc=>!(sc?._hvRuntimeV2&&now-Number(sc._hvRuntimeAt||0)>15*60*1000));
  const keep=new Set(s.dialogues.map(sc=>String(sc?.id||'')));
  if(s.dialogueFileMap&&typeof s.dialogueFileMap==='object')for(const id of Object.keys(s.dialogueFileMap))if(id.startsWith(PREFIX)&&!keep.has(id))delete s.dialogueFileMap[id];
  return s;
}
function runtimeId(kind){return `${PREFIX}${kind}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function register(scene,fileRole){
  const s=cleanRuntime(state());s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
  s.dialogues.push(scene);s.dialogueFileMap[scene.id]=fileRole;publish(s);return scene;
}
function cloneUnlocked(source){
  const sc=JSON.parse(JSON.stringify(source));sc.id=runtimeId('ask');sc._hvRuntimeV2=true;sc._hvRuntimeAt=Date.now();sc._hvSourceId=source.id;
  sc.repeatable=true;sc.used=false;sc.requiredAffection=0;sc.maxAffection=100;sc.requiredStage='';sc.requiredStageOverride='';sc.requiredMood='ANY';sc.requiredFlags='';sc.blockedFlags='';sc.requiredMemoryTags='';sc.blockedMemoryTags='';sc.requiredItemIds='';
  for(const n of sc.nodes||[])for(const ch of n.choices||[]){ch.requiredAffection=0;ch.requiredStage='';ch.requiredMood='ANY';ch.requiredFlags='';ch.blockedFlags='';ch.requiredMemoryTags='';ch.lockDisplay='disabled'}
  return sc;
}
function questionById(id){const s=state(),m=meta(),c=String(s.active||'');return (s.dialogues||[]).find(sc=>sc?.characterId===c&&role(sc,s,m)==='ASK'&&String(sc.id)===String(id))||null}
function startQuestion(source){if(!source)return;closeAction();const sc=register(cloneUnlocked(source),'QUESTION');syntheticScene(sc.id)}

const ACTIONS=[
 ['call-name','이름을 부른다','별다른 이유 없이 이름을 불러본다.','당신은 조용히 상대의 이름을 부른다.',
  ['하던 일을 멈추고 바로 당신을 본다.\n“응? 불렀어?”','눈썹을 살짝 올린다.\n“그렇게 부르면 뭔가 할 말이 있는 것처럼 들리는데.”','잠깐 당신을 바라보다 작게 웃는다.\n“여기 있어. 무슨 일이야?”']],
 ['cry','운다','갑자기 눈물이 난다.','당신은 말없이 고개를 숙이고 눈물을 흘린다.',
  ['깜짝 놀라 표정이 굳는다.\n“잠깐, 왜 울어? 무슨 일 있었어?”','당황해서 주변을 한 번 둘러본다.\n“이럴 때 뭘 먼저 해야 하지… 휴지? 물?”','어쩔 줄 몰라 하다가 조심스럽게 목소리를 낮춘다.\n“급하게 말 안 해도 돼. 일단 여기 있어.”','잠시 망설이다 등을 천천히 토닥인다.\n“괜찮아. 울고 나서 얘기해도 돼.”']],
 ['laugh','웃는다','갑자기 웃어본다.','당신은 별안간 웃음을 터뜨린다.',
  ['당신을 의심스럽게 본다.\n“왜 웃어? 나도 좀 알자.”','얼떨결에 따라 웃다가 고개를 갸웃한다.\n“잠깐, 뭐가 웃긴 거였지?”','자기 옷과 얼굴을 확인한다.\n“내가 지금 뭔가 웃겨?”']],
 ['stare','빤히 바라본다','아무 말 없이 계속 바라본다.','당신은 아무 말 없이 상대를 빤히 바라본다.',
  ['몇 초 뒤 똑같이 당신을 바라본다.\n“좋아. 누가 먼저 시선 피하나 해보자.”','얼굴을 한 번 만져본다.\n“뭐 묻었어?”','시선을 피하지 않고 기다린다.\n“말하고 싶어질 때 말해.”']],
 ['wave','손을 흔든다','바로 앞에서 인사하듯 손을 흔든다.','당신은 바로 앞에서 가볍게 손을 흔든다.',
  ['잠깐 멈춘 뒤 똑같이 손을 흔든다.\n“응, 안녕.”','조금 과장되게 손을 흔들어준다.\n“이 정도면 제대로 인사한 거지?”','피식 웃으며 손끝만 까딱한다.\n“잘 보여.”']],
 ['run','갑자기 달린다','아무 설명 없이 방 안을 달린다.','당신은 갑자기 방 한쪽으로 달리기 시작한다.',
  ['깜짝 놀라 몸을 일으킨다.\n“뭐야?! 무슨 일 있어?”','당신을 눈으로 따라가며 멍하니 말한다.\n“…설명은 없는 거야?”','길을 비켜주며 고개를 끄덕인다.\n“좋아. 이유는 모르겠지만 열정은 인정.”']],
 ['jump','갑자기 뛴다','제자리에서 갑자기 폴짝 뛴다.','당신은 아무 예고 없이 제자리에서 폴짝 뛴다.',
  ['눈을 한 번 깜빡인다.\n“…방금 뭐였어?”','당신의 발밑을 확인한다.\n“뭐 밟은 줄 알았잖아.”','조금 웃으며 고개를 젓는다.\n“오늘 에너지가 넘치네.”']],
 ['sit-close','가까이 앉는다','평소보다 가까운 자리에 앉는다.','당신은 상대와 조금 가까운 자리에 조용히 앉는다.',
  ['옆자리를 힐끗 보지만 굳이 움직이지 않는다.\n“거기가 편하면 있어.”','몸을 조금 옆으로 옮겨 자리를 내준다.\n“그래, 앉아.”','당신을 한 번 보고 하던 일을 이어간다.\n“…편한 대로 해.”']],
 ['hand','손을 내민다','말없이 손을 내민다.','당신은 아무 설명 없이 손을 내민다.',
  ['당신의 손과 얼굴을 번갈아 본다.\n“이건… 악수?”','잠시 고민하다 손을 잡는다.\n“일단 잡긴 했는데, 다음 설명 부탁해.”','자연스럽게 손을 맞댄다.\n“응. 여기.”']],
 ['silent','말없이 있는다','아무 말도 하지 않고 옆에 있는다.','당신은 한동안 아무 말 없이 그 자리에 머문다.',
  ['침묵을 굳이 깨지 않고 자기 일을 이어간다.','한참 뒤 조용히 묻는다.\n“그냥 같이 있고 싶은 날도 있지?”','당신을 힐끗 보고 편한 자세로 다시 앉는다.\n“말 안 해도 괜찮아.”']],
 ['hide-face','얼굴을 가린다','두 손으로 얼굴을 가린다.','당신은 갑자기 두 손으로 얼굴을 가린다.',
  ['몸을 조금 숙여 당신을 살핀다.\n“왜, 무슨 일인데?”','잠깐 기다렸다가 장난스럽게 말한다.\n“내가 사라질 때까지 그러고 있을 거야?”','목소리를 낮춘다.\n“보기 싫은 게 있으면 말해.”']],
 ['touch-frame','액자를 건드린다','근처 액자의 각도를 살짝 바꾼다.','당신은 근처 액자의 각도를 손끝으로 살짝 바꾼다.',
  ['시선이 즉시 액자로 향한다.\n“방금 각도 바꿨지?”','모른 척하려다 결국 직접 바로잡는다.\n“이런 건 정확해야 해.”','당신과 액자를 번갈아 본다.\n“지금 반응 보려고 일부러 그런 거야?”']],
 ['pick-object','근처 물건을 집는다','눈앞의 작은 물건 하나를 들어본다.','당신은 가까이에 놓인 작은 물건 하나를 집어 든다.',
  ['당신 손을 따라 시선을 옮긴다.\n“그거 궁금했어?”','조금 긴장한 표정으로 지켜본다.\n“조심해서 봐.”','별일 아니라는 듯 어깨를 으쓱한다.\n“마음에 들면 조금 더 봐도 돼.”']],
 ['tidy','주변을 정리한다','흐트러진 것들을 조용히 정리한다.','당신은 주변의 흐트러진 물건을 하나씩 정리하기 시작한다.',
  ['처음엔 지켜보다가 슬쩍 같이 손을 댄다.\n“둘이 하면 빨리 끝나겠네.”','당황한 듯 주변을 확인한다.\n“내가 그렇게 어질러놨어?”','조금 고마운 표정으로 말한다.\n“굳이 안 해도 되는데… 고마워.”']],
 ['hum','콧노래를 부른다','작게 콧노래를 흥얼거린다.','당신은 아주 작게 콧노래를 흥얼거리기 시작한다.',
  ['잠시 듣다가 리듬에 맞춰 손가락을 움직인다.','고개를 기울여 멜로디를 듣는다.\n“그 노래 뭐야?”','조금 뒤 같은 음을 따라 흥얼거린다.']],
 ['ask-help','도와달라고 한다','작은 일을 하나 도와달라고 한다.','당신은 사소한 일을 하나 도와달라고 부탁한다.',
  ['바로 손을 내민다.\n“뭘 하면 돼?”','잠시 상황을 보고 고개를 끄덕인다.\n“좋아. 같이 해보자.”','조금 생색내듯 웃는다.\n“자, 이럴 때 내가 필요한 거지.”']],
 ['compliment','칭찬한다','갑자기 진심으로 칭찬한다.','당신은 갑자기 상대에게 짧게 칭찬을 건넨다.',
  ['예상하지 못한 듯 잠깐 말을 잃는다.\n“…갑자기?”','괜히 태연한 척하지만 표정이 조금 풀린다.\n“뭐, 틀린 말은 아니네.”','작게 웃는다.\n“고마워. 그건 기분 좋네.”']],
 ['tease','가볍게 장난친다','선을 넘지 않는 가벼운 장난을 건다.','당신은 상대에게 아주 가벼운 장난을 건다.',
  ['잠시 멈췄다가 바로 받아친다.\n“오, 지금 승부 걸었어?”','어이없다는 듯 웃는다.\n“그걸 진짜 한다고?”','눈을 가늘게 뜨지만 입꼬리는 올라가 있다.\n“기억해둔다.”']]
];
const LUCIFER_EXTRA=[
 ['duck','고무 오리를 집는다','작업대 위 고무 오리를 집어 든다.','당신은 작업대 위의 고무 오리 하나를 조심스럽게 집어 든다.',['루시퍼의 시선이 즉시 당신 손으로 따라온다.\n“조심해. 그 애는 아직 도색 덜 말랐어.”','루시퍼가 기다렸다는 듯 몸을 앞으로 숙인다.\n“어때? 균형감 완벽하지?”','루시퍼가 진지한 표정을 짓는다.\n“선택받았네. 이제 이름도 지어줘야 해.”']],
 ['piano','피아노 건반을 누른다','가까운 건반 하나를 눌러본다.','당신은 피아노 건반 하나를 조심스럽게 눌러본다.',['루시퍼가 소리를 듣자마자 고개를 든다.\n“한 음만 누르고 끝낼 거야?”','그가 옆 건반을 이어서 눌러 짧은 화음을 만든다.\n“이제 네 차례.”','피식 웃으며 자리를 조금 비켜준다.\n“쳐보고 싶으면 앉아.”']],
 ['hat','모자를 건드린다','루시퍼의 모자를 살짝 건드려본다.','당신은 장난스럽게 루시퍼의 모자 끝을 살짝 건드린다.',['루시퍼가 즉시 모자를 붙잡는다.\n“오, 왕관급 중요 물품이야.”','그가 당신 손을 피해 고개를 뒤로 뺀다.\n“안 돼. 이건 이미지 관리의 핵심이라고.”','잠시 당신을 보다가 모자를 벗어 보여준다.\n“궁금했으면 그냥 말하지 그랬어.”']]
];
function actionDefs(){const c=character();return c?.id==='lucifer-morningstar'?[...ACTIONS,...LUCIFER_EXTRA]:ACTIONS}
function actionRows(){
  const s=state(),m=meta(),id=String(s.active||'');
  const custom=(s.dialogues||[]).filter(sc=>sc?.characterId===id&&role(sc,s,m)==='ACTION').map(sc=>({type:'scene',id:sc.id,label:sc.title||'ACTION',hint:String(sc.opening||'').replace(/\[\[[^\]]+\]\]/g,'').slice(0,90)}));
  const generated=actionDefs().map(a=>({type:'generated',id:a[0],label:a[1],hint:a[2]}));
  const seen=new Set();return [...generated,...custom].filter(row=>{const k=row.label.trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true})
}
function actionHtml(){const rows=actionRows();return `<section class="hv-action-panel" data-hv-action-panel><header><div><small>ACTION</small><h2>무엇을 할까?</h2><p>행동은 직접 고르고, 캐릭터의 반응은 여러 반응 중 하나가 나옵니다.</p></div><button type="button" data-hv-action-close aria-label="닫기">×</button></header><div class="hv-action-list">${rows.map((r,i)=>`<button type="button" data-hv-action-choice="${esc(r.id)}" data-hv-action-type="${r.type}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${esc(r.label)}</strong><small>${esc(r.hint)}</small></span></button>`).join('')}</div></section>`}
function openAction(){const box=$('.character-room .dialogue-box');if(!box)return;closeAction();box.classList.add('hv-action-open');box.insertAdjacentHTML('beforeend',actionHtml())}
function closeAction(){$$('[data-hv-action-panel]').forEach(x=>x.remove());$$('.dialogue-box.hv-action-open').forEach(x=>x.classList.remove('hv-action-open'))}
function pickReaction(action){
  const list=action[4]||[],key=`${cid()}:${action[0]}`;if(!list.length)return'';let pool=list.map((x,i)=>({x,i}));const last=lastReaction.get(key);if(pool.length>1)pool=pool.filter(r=>r.i!==last);const row=pool[Math.floor(Math.random()*pool.length)]||pool[0];lastReaction.set(key,row.i);return row.x
}
function generatedScene(action){
  const c=character(),raw=String(pickReaction(action)||'');
  const parts=raw.split('\n'),reactionNarration=parts.shift()||'',spoken=parts.join('\n').trim();
  const beats=[`[[NARRATION]] ${action[3]}`];
  if(reactionNarration)beats.push(`[[NARRATION]] ${reactionNarration}`);
  if(spoken)beats.push(`[[CHARACTER]] ${spoken}`);
  const opening=beats.join('\n');
  return{id:runtimeId('action'),characterId:c?.id||'',title:action[1],kind:'TALK',sceneRole:'ACTION',repeatable:true,requiredAffection:0,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:0,probability:100,opening,exitLine:'',after:'',used:false,_hvRuntimeV2:true,_hvRuntimeAt:Date.now(),nodes:[{id:'start',speaker:'character',text:opening,choices:[]}],openingNodeId:'start'}
}
function startAction(id,type){closeAction();if(type==='scene'){const sc=(state().dialogues||[]).find(x=>String(x?.id||'')===String(id));if(sc)syntheticScene(sc.id);return}const action=actionDefs().find(a=>a[0]===id);if(!action)return;const sc=register(generatedScene(action),'ACTION');syntheticScene(sc.id)}

window.addEventListener('click',e=>{
  if(bridge)return;const t=e.target instanceof Element?e.target:null;if(!t)return;
  const command=t.closest('[data-hv-room-command]')?.dataset.hvRoomCommand;
  if(command==='ACTION'){e.preventDefault();e.stopImmediatePropagation();$$('[data-hv-ask-panel]').forEach(x=>x.remove());openAction();return}
  const action=t.closest('[data-hv-action-choice]');if(action){e.preventDefault();e.stopImmediatePropagation();startAction(action.dataset.hvActionChoice||'',action.dataset.hvActionType||'generated');return}
  if(t.closest('[data-hv-action-close]')){e.preventDefault();e.stopImmediatePropagation();closeAction();return}
  const ask=t.closest('[data-hv-ask-scene]');if(ask){const source=questionById(ask.dataset.hvAskScene||'');if(source){e.preventDefault();e.stopImmediatePropagation();startQuestion(source);return}}
  if(t.closest('[data-page="characters"],[data-vn-leave],[data-runtime-leave]'))closeAction();
},true);
})();
