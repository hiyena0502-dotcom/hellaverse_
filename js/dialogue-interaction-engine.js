(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_INTERACTION_ENGINE_V1__)return;
window.__HELLAVERSE_DIALOGUE_INTERACTION_ENGINE_V1__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const META_KEY='hellaverse_dialogue_render_meta_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const up=v=>String(v||'').trim().toUpperCase();
const runtimePrefix='hv-runtime-interaction-';
let bridge=false,lastReaction=new Map();

function read(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function writeState(s){try{localStorage.setItem(STATE_KEY,JSON.stringify(s));return true}catch{return false}}
function state(){return read(STATE_KEY,{})}
function meta(){return read(META_KEY,{})}
function role(scene,s=state(),m=meta()){
  const mm=m?.[scene?.id]||{},explicit=up(s?.dialogueFileMap?.[scene?.id]);
  if(explicit)return explicit==='QUESTION'?'ASK':explicit;
  const r=up(mm.sceneRole||scene?.sceneRole||'');if(r)return r==='QUESTION'?'ASK':r;
  const k=up(scene?.kind||'TALK');return k==='TALK'?'CONVERSATION':k;
}
function cid(){return String(state().active||'')}
function heart(){const s=state(),id=cid();return Math.max(0,Math.min(100,Number(s.affection?.[id]?.value||0)))}
function characterName(){const s=state(),id=cid();return (s.characters||[]).find(c=>c?.id===id)?.name||'CHARACTER'}
function syntheticScene(id){
  const host=$('.character-room')||$('#app')||document.body,b=document.createElement('button');
  b.type='button';b.hidden=true;b.dataset.scene=String(id);b.dataset.hvInteractionBridge='1';host.appendChild(b);
  bridge=true;try{b.click()}finally{bridge=false;b.remove()}
}
function closePanels(){$$('[data-hv-action-panel]').forEach(el=>el.remove());$$('.dialogue-box.hv-action-open').forEach(el=>el.classList.remove('hv-action-open'))}
function pruneRuntimeScenes(s){
  const now=Date.now();
  s.dialogues=Array.isArray(s.dialogues)?s.dialogues.filter(sc=>!(sc?._hvRuntimeTemp&&now-Number(sc._hvRuntimeTempCreatedAt||0)>10*60*1000)):[];
  const keep=new Set(s.dialogues.map(sc=>String(sc?.id||'')));
  if(s.dialogueFileMap&&typeof s.dialogueFileMap==='object')for(const key of Object.keys(s.dialogueFileMap))if(key.startsWith(runtimePrefix)&&!keep.has(key))delete s.dialogueFileMap[key];
  return s;
}
function registerRuntimeScene(scene,fileRole){
  const s=pruneRuntimeScenes(state());
  s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
  s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
  s.dialogues.push(scene);s.dialogueFileMap[scene.id]=fileRole;writeState(s);return scene;
}
function tempId(kind){return `${runtimePrefix}${kind}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function clearRequirements(scene){
  const clone=JSON.parse(JSON.stringify(scene));
  clone.id=tempId('ask');clone._hvRuntimeTemp=true;clone._hvRuntimeTempCreatedAt=Date.now();clone._hvSourceSceneId=scene.id;
  clone.repeatable=true;clone.used=false;clone.requiredAffection=0;clone.maxAffection=100;clone.requiredStage='';clone.requiredStageOverride='';clone.requiredMood='ANY';clone.requiredFlags='';clone.blockedFlags='';clone.requiredMemoryTags='';clone.blockedMemoryTags='';clone.requiredItemIds='';
  for(const node of clone.nodes||[])for(const choice of node.choices||[]){choice.requiredAffection=0;choice.requiredStage='';choice.requiredMood='ANY';choice.requiredFlags='';choice.blockedFlags='';choice.requiredMemoryTags='';choice.requiredItemIds='';choice.lockDisplay='enabled'}
  return clone;
}
function startUnlockedQuestion(source){
  if(!source)return;
  closePanels();
  const clone=clearRequirements(source);registerRuntimeScene(clone,'QUESTION');syntheticScene(clone.id);
}

const LUCIFER_ACTIONS=[
  {id:'call-name',label:'이름을 부른다',hint:'그냥 “루시퍼”라고 불러본다.',action:'당신은 별다른 이유 없이 루시퍼의 이름을 부른다.',responses:[
    {n:'루시퍼가 하던 일을 멈추고 고개를 든다.',l:'“응? 불렀어?”'},
    {n:'그가 눈썹을 살짝 올린 채 당신을 본다.',l:'“그렇게 진지하게 부르면 뭔가 큰일 난 줄 알잖아.”'},
    {n:'루시퍼가 대답 대신 손가락으로 자기 가슴을 가리킨다.',l:'“나? 지옥에 루시퍼가 둘이라도 있어?”'},
    {n:'그가 바로 시선을 맞추며 조금 부드럽게 웃는다.',l:'“응. 여기 있어.”',min:25}
  ]},
  {id:'touch-frame',label:'액자를 건드린다',hint:'벽의 액자 각도를 살짝 바꾼다.',action:'당신은 벽에 걸린 액자를 손끝으로 살짝 건드린다.',responses:[
    {n:'루시퍼의 시선이 즉시 액자로 꽂힌다.',l:'“잠깐. 방금 각도 바꿨지?”'},
    {n:'그는 몇 초 동안 모른 척하다가 결국 자리에서 일어난다.',l:'“안 돼. 저건 정확히 맞아야 해.”'},
    {n:'루시퍼가 당신과 액자를 번갈아 본다.',l:'“지금 내 인내심을 실험하는 거야?”'},
    {n:'그가 피식 웃으며 직접 액자를 바로잡는다.',l:'“이런 장난 좋아하는 타입이구나. 기억해둘게.”',min:20}
  ]},
  {id:'run',label:'갑자기 달린다',hint:'아무 설명 없이 방 안을 달려본다.',action:'당신은 갑자기 방 한쪽으로 달리기 시작한다.',responses:[
    {n:'루시퍼가 깜짝 놀라 몸을 반쯤 일으킨다.',l:'“뭐야?! 불났어?”'},
    {n:'그가 당신이 달리는 방향을 따라 고개만 돌린다.',l:'“…설명은? 설명 같은 건 없는 거야?”'},
    {n:'루시퍼가 두 손을 들어 보이며 길을 비켜준다.',l:'“좋아, 그래. 유산소 운동은 중요하지.”'},
    {n:'그가 웃음을 참지 못하고 짧게 박수를 친다.',l:'“목적은 모르겠지만 열정은 높이 평가할게.”'}
  ]},
  {id:'cry',label:'운다',hint:'갑자기 눈물이 난다.',action:'당신은 갑자기 고개를 숙이고 눈물을 흘린다.',responses:[
    {n:'루시퍼가 눈을 크게 뜨고 그대로 굳는다.',l:'“어— 잠깐. 왜 울어? 무슨 일 있었어?”'},
    {n:'그가 당황한 얼굴로 당신을 한참 바라본다.',l:'“이럴 때… 뭘 먼저 해야 하지. 물? 휴지? 사람?”'},
    {n:'루시퍼가 문 쪽을 힐끗 보다가 다시 당신을 본다.',l:'“찰리 부를까? 걔가 이런 건 나보다 훨씬— 아니, 잠깐. 내가 해볼게.”'},
    {n:'그가 서툴게 가까이 와서 목소리를 낮춘다.',l:'“괜찮아. 급하게 말 안 해도 돼. 울고 나서 말해도 돼.”',min:15},
    {n:'루시퍼가 거의 습관처럼 등을 천천히 두어 번 토닥인다. 본인도 그 행동을 하고 나서 잠깐 멈춘다.',l:'“…찰리 어릴 때 하던 버릇이 아직 남아 있었네. 아무튼, 여기 있어.”',min:30}
  ]},
  {id:'laugh',label:'웃는다',hint:'이유 없이 웃어본다.',action:'당신은 갑자기 웃음을 터뜨린다.',responses:[
    {n:'루시퍼가 의심스럽게 당신을 본다.',l:'“왜 웃어? 나도 웃을 수 있게 공유 좀 해.”'},
    {n:'그도 따라 웃다가 뒤늦게 묻는다.',l:'“잠깐, 우리 지금 뭐가 웃긴 거였지?”'},
    {n:'루시퍼가 괜히 옷깃을 확인한다.',l:'“내 얼굴에 뭐 묻었어?”'},
    {n:'그가 당신의 웃음을 보고 자연스럽게 입꼬리를 올린다.',l:'“뭐, 이유 없어도 괜찮지. 분위기는 좋아졌네.”'}
  ]},
  {id:'stare',label:'빤히 바라본다',hint:'아무 말 없이 계속 본다.',action:'당신은 아무 말 없이 루시퍼를 빤히 바라본다.',responses:[
    {n:'몇 초 뒤 루시퍼도 똑같이 당신을 바라보기 시작한다.',l:'“좋아. 누가 먼저 눈 피하나 해보자.”'},
    {n:'그가 자기 얼굴을 손으로 훑는다.',l:'“뭐 묻었어? 아니면 내가 오늘 특별히 잘생겼나?”'},
    {n:'루시퍼가 눈을 가늘게 뜬다.',l:'“그 시선은 질문이 있는 시선인데.”'},
    {n:'그가 시선을 피하지 않고 조용히 기다린다.',l:'“말하고 싶어질 때 말해.”',min:25}
  ]},
  {id:'wave',label:'손을 흔든다',hint:'바로 앞에서 인사하듯 손을 흔든다.',action:'당신은 바로 앞에 있는 루시퍼에게 손을 흔든다.',responses:[
    {n:'루시퍼가 잠깐 멈췄다가 똑같이 손을 흔든다.',l:'“안녕. 우리 방금 전부터 같이 있었지만.”'},
    {n:'그가 아주 과장되게 양손으로 인사한다.',l:'“오, 반가워! 처음 보는 사람처럼 해볼까?”'},
    {n:'루시퍼가 작게 웃는다.',l:'“이런 건 이유가 없어도 귀엽네.”',min:20},
    {n:'그가 손끝만 까딱한다.',l:'“응. 잘 보여.”'}
  ]},
  {id:'sit-close',label:'가까이 앉는다',hint:'조금 더 가까운 자리에 앉는다.',action:'당신은 루시퍼와 조금 가까운 자리에 조용히 앉는다.',responses:[
    {n:'루시퍼가 옆자리를 힐끗 보지만 굳이 움직이지 않는다.',l:'“자리 넓은데 굳이 거기구나.”'},
    {n:'그가 몸을 아주 조금 옆으로 옮겨 공간을 만들어준다.',l:'“그래. 앉아.”'},
    {n:'루시퍼가 당신을 한 번 보고 다시 하던 일을 이어간다.',l:'“…편한 대로 해.”',min:15},
    {n:'그가 자연스럽게 당신 쪽으로 몸을 조금 기울인다.',l:'“이제 뭔가 비밀 얘기라도 해야 할 것 같은 거리네.”',min:35}
  ]},
  {id:'pick-duck',label:'고무 오리를 집는다',hint:'작업대 위 오리 하나를 들어본다.',action:'당신은 작업대 위의 고무 오리 하나를 조심스럽게 집어 든다.',responses:[
    {n:'루시퍼의 시선이 즉시 당신 손으로 따라온다.',l:'“조심해. 그 애는 아직 도색 덜 말랐어.”'},
    {n:'그가 기다렸다는 듯 몸을 앞으로 숙인다.',l:'“어때? 균형감 완벽하지?”'},
    {n:'루시퍼가 괜히 진지한 표정을 짓는다.',l:'“선택받았네. 이제 이름도 지어줘야 해.”'},
    {n:'그가 만족스러운 얼굴로 웃는다.',l:'“좋은 걸 골랐네. 나도 그 디자인 꽤 마음에 들어.”'}
  ]},
  {id:'piano',label:'건반을 누른다',hint:'피아노 건반 하나를 눌러본다.',action:'당신은 피아노의 건반 하나를 가볍게 누른다.',responses:[
    {n:'맑은 음 하나가 울리자 루시퍼가 고개를 돌린다.',l:'“그 한 음으로 시작할 거야?”'},
    {n:'그가 곧바로 옆 건반을 눌러 화음을 붙인다.',l:'“자, 이제 두 음. 다음은 네 차례.”'},
    {n:'루시퍼가 일부러 장엄한 화음을 이어 붙인다.',l:'“축하해. 방금 네가 새 교향곡을 시작했어.”'},
    {n:'그가 당신 손을 보며 미소 짓는다.',l:'“원하면 간단한 거 하나 가르쳐줄게.”',min:25}
  ]},
  {id:'papers',label:'서류를 정리한다',hint:'흩어진 서류를 가지런히 모은다.',action:'당신은 책상 위에 흩어진 서류를 가지런히 모으기 시작한다.',responses:[
    {n:'루시퍼가 거의 감동한 얼굴로 당신을 본다.',l:'“세상에. 자발적으로 행정 업무를 돕는 존재가 실제로 있었어.”'},
    {n:'그가 서류 한 장을 급히 빼낸다.',l:'“잠깐, 그건 버릴 거 아니야. 아마도.”'},
    {n:'루시퍼가 손을 턱에 괴고 지켜본다.',l:'“계속해봐. 아주 훌륭한 광경이야.”'},
    {n:'그가 당신이 나눈 더미를 확인하고 진지하게 고개를 끄덕인다.',l:'“나보다 훨씬 낫네. 이건 조금 자존심 상하는데.”'}
  ]},
  {id:'hand',label:'손을 내민다',hint:'말없이 손을 내민다.',action:'당신은 아무 말 없이 루시퍼에게 손을 내민다.',responses:[
    {n:'루시퍼가 당신 손과 얼굴을 번갈아 본다.',l:'“악수? 도움? 아니면 지금부터 맞혀야 하는 게임?”'},
    {n:'그가 잠깐 망설이다가 손끝을 얹는다.',l:'“이게 맞는 답이길 바라.”',min:15},
    {n:'루시퍼가 장난스럽게 당신 손바닥 위에 작은 고무 오리를 올려놓는다.',l:'“자. 완벽한 답.”'},
    {n:'그가 자연스럽게 손을 잡아준다.',l:'“응.”',min:40}
  ]},
  {id:'cover-face',label:'얼굴을 가린다',hint:'두 손으로 얼굴을 가린다.',action:'당신은 갑자기 두 손으로 얼굴을 가린다.',responses:[
    {n:'루시퍼가 바로 몸을 앞으로 기울인다.',l:'“왜? 무슨 일인데?”'},
    {n:'그가 옆으로 고개를 기울여 당신 표정을 보려 한다.',l:'“숨는다고 안 보이는 건 아닌데.”'},
    {n:'루시퍼가 잠시 기다리다가 목소리를 낮춘다.',l:'“말하기 싫으면 고개만 끄덕여도 돼.”',min:20},
    {n:'그가 자기 얼굴도 두 손으로 가린다.',l:'“좋아. 나도 참여. 이제 아무도 아무것도 못 봐.”'}
  ]},
  {id:'jump',label:'갑자기 뛴다',hint:'제자리에서 폴짝 뛴다.',action:'당신은 갑자기 제자리에서 폴짝 뛴다.',responses:[
    {n:'루시퍼가 반사적으로 위를 올려다본다.',l:'“뭐가 떨어지는 줄 알았잖아.”'},
    {n:'그가 당신을 보고 한 박자 늦게 따라 뛴다.',l:'“이건 이유 없이 하는 거지? 좋아.”'},
    {n:'루시퍼가 손뼉을 한 번 친다.',l:'“높이는 나쁘지 않았어. 착지는 조금 아쉽고.”'},
    {n:'그가 웃으면서 고개를 젓는다.',l:'“너 가끔 예측이 전혀 안 된다.”'}
  ]},
  {id:'hat',label:'모자를 건드린다',hint:'왕관 모자의 장식을 살짝 건드려본다.',action:'당신은 루시퍼의 모자 장식 쪽으로 조심스럽게 손을 뻗는다.',responses:[
    {n:'루시퍼가 모자를 재빨리 한 손으로 잡는다.',l:'“오, 왕관 구역은 허가가 필요해.”'},
    {n:'그가 모자를 벗어 당신 손에서 멀리 든다.',l:'“손 빠르네. 하지만 내가 더 빠르지.”'},
    {n:'루시퍼가 잠깐 당신 손을 보다가 그대로 있게 둔다.',l:'“한 번만. 장식 망가뜨리면 네가 고쳐.”',min:25},
    {n:'그가 모자를 살짝 숙여 장식을 더 가까이 보여준다.',l:'“궁금하면 그냥 물어봐도 되는데.”',min:40}
  ]},
  {id:'silence',label:'말없이 있는다',hint:'아무 말도 하지 않고 함께 있는다.',action:'당신은 아무 말도 하지 않고 그 자리에 가만히 있는다.',responses:[
    {n:'잠깐의 침묵이 흐르지만 루시퍼는 굳이 깨지 않는다.',l:'“…이것도 나쁘진 않네.”'},
    {n:'그가 몇 번 당신을 힐끗 보다가 다시 하던 일로 돌아간다.',l:'“말 안 해도 돼. 그냥 있어.”',min:20},
    {n:'루시퍼가 괜히 펜을 굴리며 먼저 말을 꺼낸다.',l:'“침묵 게임이면 내가 질 것 같은데.”'},
    {n:'그가 조용히 숨을 내쉬며 어깨의 힘을 푼다.',l:'“이상하게 편하네.”',min:35}
  ]}
];

function actionRows(){
  if(cid()==='lucifer-morningstar')return LUCIFER_ACTIONS.map(x=>({type:'generated',...x}));
  const s=state(),m=meta(),id=cid();
  return (s.dialogues||[]).filter(sc=>sc?.characterId===id&&role(sc,s,m)==='ACTION').map(sc=>({type:'scene',id:sc.id,label:sc.title||'ACTION',hint:sc.opening||''}));
}
function actionPanelHtml(){
  const rows=actionRows();
  return `<section class="hv-action-panel" data-hv-action-panel><header><div><small>ACTION</small><h2>무엇을 할까?</h2><p>행동을 고르면 캐릭터의 반응은 매번 달라질 수 있습니다.</p></div><button type="button" data-hv-action-close aria-label="닫기">×</button></header><div class="hv-action-list">${rows.length?rows.map((row,i)=>`<button type="button" data-hv-action-choice="${esc(row.id)}" data-hv-action-type="${esc(row.type)}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${esc(row.label)}</strong><small>${esc(row.hint||'')}</small></span></button>`).join(''):'<p class="empty-state">등록된 행동이 없습니다.</p>'}</div></section>`;
}
function openAction(){
  const box=$('.character-room .dialogue-box');if(!box)return;
  closePanels();box.classList.add('hv-action-open');box.insertAdjacentHTML('beforeend',actionPanelHtml());
}
function pickResponse(action){
  const h=heart();let pool=(action.responses||[]).filter(r=>h>=Number(r.min||0)&&(r.max==null||h<=Number(r.max)));
  if(!pool.length)pool=action.responses||[];if(!pool.length)return null;
  const last=lastReaction.get(action.id);let indexes=pool.map((_,i)=>i);if(pool.length>1&&last!=null)indexes=indexes.filter(i=>i!==last);
  const idx=indexes[Math.floor(Math.random()*indexes.length)]??0;lastReaction.set(action.id,idx);return pool[idx];
}
function encodedResponse(resp){
  const parts=[];if(resp?.n)parts.push(`[[NARRATION]] ${resp.n}`);if(resp?.l)parts.push(`[[CHARACTER]] ${resp.l}`);return parts.join('\n');
}
function generatedActionScene(action){
  const response=pickResponse(action)||{n:'상대가 잠시 당신을 바라본다.',l:'“…응?”'};
  const id=tempId('action');
  return {id,characterId:cid(),title:action.label,kind:'TALK',sceneRole:'ACTION',repeatable:true,requiredAffection:0,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:1,probability:100,opening:action.action,openingType:'narration',openingSpeaker:'narration',exitLine:'',after:'',used:false,_hvRuntimeTemp:true,_hvRuntimeTempCreatedAt:Date.now(),_hvActionId:action.id,nodes:[{id:'start',speaker:'character',text:encodedResponse(response),choices:[]}],openingNodeId:'start'};
}
function startActionChoice(id,type){
  const rows=actionRows(),row=rows.find(x=>String(x.id)===String(id));if(!row)return;
  closePanels();
  if(type==='scene'){syntheticScene(row.id);return}
  const scene=generatedActionScene(row);registerRuntimeScene(scene,'ACTION');syntheticScene(scene.id);
}

function questionById(id){
  const s=state(),m=meta(),c=cid();return (s.dialogues||[]).find(sc=>sc?.characterId===c&&role(sc,s,m)==='ASK'&&String(sc.id)===String(id))||null;
}

window.addEventListener('click',event=>{
  if(bridge)return;const target=event.target instanceof Element?event.target:null;if(!target)return;

  const command=target.closest('[data-hv-room-command]')?.dataset.hvRoomCommand;
  if(command==='ACTION'){
    event.preventDefault();event.stopImmediatePropagation();
    $$('[data-hv-ask-panel]').forEach(el=>el.remove());openAction();return;
  }
  if(command&&command!=='ACTION')closePanels();

  const actionChoice=target.closest('[data-hv-action-choice]');
  if(actionChoice){
    event.preventDefault();event.stopImmediatePropagation();
    startActionChoice(actionChoice.dataset.hvActionChoice||'',actionChoice.dataset.hvActionType||'generated');return;
  }
  if(target.closest('[data-hv-action-close]')){event.preventDefault();event.stopImmediatePropagation();closePanels();return}

  const askScene=target.closest('[data-hv-ask-scene]');
  if(askScene){
    const source=questionById(askScene.dataset.hvAskScene||'');
    if(source){event.preventDefault();event.stopImmediatePropagation();startUnlockedQuestion(source);return}
  }

  if(target.closest('[data-vn-leave],[data-runtime-leave],[data-page="characters"],[data-back]'))closePanels();
},true);

try{const s=pruneRuntimeScenes(state());writeState(s)}catch{}
})();
