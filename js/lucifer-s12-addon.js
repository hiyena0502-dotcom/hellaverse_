(()=>{
if(window.__HELLAVERSE_LUCIFER_S12_ADDON_V1__)return;
window.__HELLAVERSE_LUCIFER_S12_ADDON_V1__=1;

const STATE_KEY='hellaverse_dialogue_state_v1';
const VERSION_KEY='hellaverse_lucifer_s12_addon_version';
const VERSION=1;
const CID='lucifer-morningstar';

const split=v=>Array.isArray(v)?[...new Set(v.map(String).map(x=>x.trim()).filter(Boolean))]:[...new Set(String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean))];
const clamp=v=>Math.max(0,Math.min(100,Number(v||0)));
function read(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}}
function write(state){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));return true}catch{return false}}
function choice(id,text,response,delta=0,opts={}){return{id,type:opts.type==='action'?'action':'speech',text,playerLine:opts.playerLine||text,response,affectionDelta:Number(delta||0),requiredAffection:Number(opts.requiredAffection||0),requiredStage:opts.requiredStage||'',requiredMood:opts.requiredMood||'ANY',requiredFlags:opts.requiredFlags||'',blockedFlags:opts.blockedFlags||'',requiredMemoryTags:opts.requiredMemoryTags||'',lockDisplay:opts.lockDisplay||'disabled',setFlags:opts.setFlags||'',removeFlags:opts.removeFlags||'',addMemoryTitle:opts.addMemoryTitle||'',addMemorySummary:opts.addMemorySummary||'',addMemoryTags:opts.addMemoryTags||'',moodChange:opts.moodChange||'',unlockItemId:opts.unlockItemId||'',nextNodeId:opts.nextNodeId||'',endConversation:opts.endConversation!==false}}
function scene({id,title,kind='ASK',min=0,max=100,opening='',reaction='',choices=[],topics=[],conversationType='CASUAL',repeatable=true,priority=10}){return{id,characterId:CID,title,kind,repeatable,requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'narration',sceneRole:kind==='ASK'?'ASK':'CONVERSATION',conversationType,topics,followUpTopics:topics,exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:reaction,choices:choices.map((c,i)=>choice(`${id}-c${i+1}`,c.text,c.response,c.delta||0,c))}],openingNodeId:'start',_s12Addon:true}}
function upsert(state,s){const i=state.dialogues.findIndex(x=>x?.id===s.id);if(i>=0)state.dialogues[i]={...state.dialogues[i],...s};else state.dialogues.push(s)}

const rudeEffects={
  'lucifer-s12-charlie-distance-0':{delta:-3,mood:'ANNOYED'},
  'lucifer-s12-charlie-distance-20':{delta:-2,mood:'ANNOYED'},
  'lucifer-s12-lilith-0':{delta:-4,mood:'ANNOYED'},
  'lucifer-s12-lilith-20':{delta:-2,mood:'ANNOYED'},
  'lucifer-s12-heaven-0':{delta:-3,mood:'ANNOYED'},
  'lucifer-s12-heaven-20':{delta:-2,mood:'ANNOYED'},
  'lucifer-s12-heaven-40':{delta:-1,mood:'ANNOYED'},
  'lucifer-s12-rude-father-0':{delta:-4,mood:'ANNOYED'},
  'lucifer-s12-rude-father-30':{delta:-2,mood:'ANNOYED'},
  'lucifer-s12-rude-father-60':{delta:-1,mood:'ANNOYED'}
};
let lastPenaltyKey='',lastPenaltyAt=0;
function showPenalty(effect){setTimeout(()=>{const root=document.getElementById('toastRoot')||document.body;let toast=document.createElement('div');toast.className='toast';toast.dataset.rudePenalty='1';toast.textContent=`♥ ${effect.delta} · ${effect.mood}`;root.appendChild(toast);setTimeout(()=>toast.remove(),1800)},80)}
document.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const id=t.closest('[data-scene]')?.dataset.scene||'';
  const effect=rudeEffects[id];if(!effect)return;
  const stamp=Date.now(),key=`${id}:${stamp>>8}`;if(lastPenaltyKey===key&&stamp-lastPenaltyAt<350)return;lastPenaltyKey=key;lastPenaltyAt=stamp;
  const state=read();if(state.active!==CID)return;
  state.affection=state.affection&&typeof state.affection==='object'?state.affection:{};
  const before=clamp(state.affection?.[CID]?.value||0),after=clamp(before+effect.delta);
  state.affection[CID]={...(state.affection[CID]||{}),value:after};
  state.moods=state.moods&&typeof state.moods==='object'?state.moods:{};state.moods[CID]=effect.mood;
  state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};state.flags['lucifer.player_offended_him']=true;
  write(state);
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'thought-archive',clearDirty:false}}));
  showPenalty(effect);
},true);

let current=0;try{current=Number(localStorage.getItem(VERSION_KEY)||0)||0}catch{}
if(current>=VERSION)return;

const state=read();
state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
state.affection=state.affection&&typeof state.affection==='object'?state.affection:{};
state.moods=state.moods&&typeof state.moods==='object'?state.moods:{};
state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};

// Replace the three old one-size-fits-all sensitive-question variants with finer Heart bands.
const retired=new Set(['lucifer-ask-charlie-distance-early','lucifer-ask-lilith-early','lucifer-ask-heaven-early']);
state.dialogues=state.dialogues.filter(s=>!retired.has(String(s?.id||'')));

const added=[
scene({id:'lucifer-s12-charlie-distance-0',title:'찰리와 왜 그렇게 오래 멀어져 있었어요?',min:0,max:19,opening:'아직 서로를 거의 모르는 때에 너무 깊은 가족사를 곧장 묻자 루시퍼의 미소가 눈에 띄게 얇아진다.',reaction:'"처음 만난 사람한테 그걸 그렇게 바로 묻는 건 꽤 무례한데. 내 실수가 컸다는 것만 알아둬. 그 이상은 지금 네가 들을 이야기가 아니야."',topics:['charlie','family','fatherhood','rude'],conversationType:'PERSONAL',choices:[
{text:'미안해요. 너무 깊게 물었네요.',response:'그가 잠시 당신을 보다가 시선을 거둔다. "그래. 그걸 알면 됐어."',delta:0},{text:'찰리 탓은 아니라는 거죠?',response:'"그 애한테 책임을 떠넘길 생각은 없어."',delta:0},{text:'나중에 더 친해지면 말해줄래요?',response:'"그때 네가 여전히 궁금해한다면 생각해보지."',delta:0},{text:'그럼 지금은 여기까지만 할게요.',response:'"좋은 선택이야."',delta:0},{text:'그래도 후회는 해요?',response:'루시퍼가 짧게 숨을 내쉰다. "그건 굳이 숨길 필요도 없겠네. 해."',delta:0}
]}),
scene({id:'lucifer-s12-charlie-distance-20',title:'찰리와 왜 그렇게 오래 멀어져 있었어요?',min:20,max:39,opening:'질문은 여전히 민감하지만, 몇 번 대화를 나눈 덕인지 루시퍼는 곧장 대화를 닫지는 않는다.',reaction:'"좋은 선택은 아니었어. 가까이 있으면 더 망칠 거라고 혼자 결론내리고 물러났지. 다만 그걸 캐묻듯 묻는 건 아직 별로 마음에 안 들어."',topics:['charlie','family','fatherhood','rude'],conversationType:'PERSONAL',choices:[
{text:'말하고 싶은 만큼만 말해요.',response:'"그 정도 선은 마음에 드네."',delta:1},{text:'그래도 지금은 다시 곁에 있잖아요.',response:'"응. 이번엔 멀리서 걱정만 하는 걸로 끝내고 싶지 않아."',delta:1},{text:'찰리는 그 시간을 많이 서운해했겠죠.',response:'그가 입을 다문다. "...그랬겠지. 그래서 더 미안하고."',delta:0},{text:'후회하는 건 알겠어요.',response:'"그걸 알아준다면 이 질문은 여기까지만 해도 충분해."',delta:1},{text:'다시 가까워진 게 다행이네요.',response:'루시퍼의 표정이 조금 누그러진다. "나도 그렇게 생각해."',delta:1}
]}),
scene({id:'lucifer-s12-lilith-0',title:'릴리스와 무슨 일이 있었어요?',min:0,max:19,opening:'릴리스의 이름이 나오자 루시퍼의 표정에서 농담기가 완전히 사라진다.',reaction:'"그건 가족 이야기고, 넌 아직 그걸 캐물을 만큼 나를 알지 못해. 호기심이 있다고 경계선이 없어지는 건 아니거든."',topics:['lilith','family','boundary','rude'],conversationType:'PERSONAL',choices:[
{text:'알겠어요. 미안해요.',response:'"좋아. 그럼 여기서 끝내자."',delta:0},{text:'좋았던 기억도 있었다는 것만 알아둘게요.',response:'그가 잠깐 눈을 내린다. "...그건 맞아."',delta:0},{text:'다시는 안 물을게요.',response:'"영원히 금지한 건 아니야. 지금은 아니라는 거지."',delta:0},{text:'선 넘었네요.',response:'"응. 그래도 바로 알아차린 건 다행이고."',delta:0},{text:'다른 얘기로 바꿀까요?',response:'"아주 훌륭한 생각이군."',delta:0}
]}),
scene({id:'lucifer-s12-lilith-20',title:'릴리스와 무슨 일이 있었어요?',min:20,max:49,opening:'릴리스의 이름에 루시퍼가 굳지만, 예전처럼 대답 자체를 끊지는 않는다.',reaction:'"좋았던 것도 많고 복잡해진 것도 많아. 아직 네가 전부 들을 단계는 아니고, 밀어붙이면 기분 나빠질 거야. 그 정도면 답이 됐지?"',topics:['lilith','family','past','boundary','rude'],conversationType:'PERSONAL',choices:[
{text:'응. 말하고 싶은 만큼만 해요.',response:'"그 방식은 괜찮네."',delta:1},{text:'좋았던 기억 하나만 듣고 싶어요.',response:'그가 잠시 생각한다. "...많았어. 오늘은 그 정도로 하자."',delta:0},{text:'지금도 생각나요?',response:'"생각하지 않는다고 하면 거짓말이겠지."',delta:0},{text:'그럼 나중에 더 편할 때 물을게요.',response:'"그래. 그게 낫겠어."',delta:1},{text:'가족 이야기는 조심할게요.',response:'루시퍼가 작게 고개를 끄덕인다. "고마워."',delta:1}
]}),
scene({id:'lucifer-s12-heaven-0',title:'천국에서는 무슨 일이 있었어요?',min:0,max:19,opening:'천국을 너무 직접적으로 꺼내자 루시퍼가 잠깐 말없이 당신을 바라본다.',reaction:'"그 질문은 상처를 구경하겠다는 사람처럼 들릴 수도 있어. 우린 아직 그 얘기를 나눌 사이가 아니야."',topics:['heaven','past','boundary','rude'],conversationType:'SECRET',choices:[
{text:'미안해요. 너무 빨랐네요.',response:'"응. 그걸 이해하면 됐어."',delta:0},{text:'그럼 좋은 기억이 있었다는 것만 기억할게요.',response:'"...좋은 기억도 있었지."',delta:0},{text:'나중에 말해주고 싶을 때 말해요.',response:'"그게 훨씬 나은 질문 방식이군."',delta:0},{text:'더는 캐묻지 않을게요.',response:'그가 고개를 끄덕인다. "좋아."',delta:0},{text:'다른 주제로 바꾸죠.',response:'"찬성."',delta:0}
]}),
scene({id:'lucifer-s12-heaven-20',title:'천국에서는 무슨 일이 있었어요?',min:20,max:39,opening:'천국이라는 단어에 루시퍼의 시선이 잠깐 멀어진다. 경계는 여전하지만 대답할 여지는 남겨둔다.',reaction:'"긴 이야기야. 좋은 시작도 있었고 아주 나쁜 끝도 있었어. 아직은 자세히 꺼내고 싶지 않아. 그걸 존중해주면 좋겠네."',topics:['heaven','past','boundary','rude'],conversationType:'SECRET',choices:[
{text:'알겠어요. 여기까지만 들을게요.',response:'"그래. 고마워."',delta:1},{text:'좋은 시작도 있었다는 게 의외네요.',response:'"나쁜 끝이 앞의 모든 걸 지우진 않으니까."',delta:0},{text:'그때의 당신도 지금과 비슷했어요?',response:'그가 아주 조금 웃는다. "생각보다 많이."',delta:0},{text:'나중에 준비되면 이어서 말해줘요.',response:'"그때가 오면."',delta:1},{text:'천국 얘기는 조심할게요.',response:'"그 말은 기억해두지."',delta:1}
]}),
scene({id:'lucifer-s12-heaven-40',title:'천국에서는 무슨 일이 있었어요?',min:40,max:59,opening:'이제는 천국 이야기를 꺼내도 루시퍼가 곧바로 벽을 세우지는 않지만, 질문의 무게는 분명히 느낀다.',reaction:'"한때는 정말 많은 게 가능하다고 믿었어. 틀린 것도 있었고, 대가도 컸지. 아직 전부 말할 정도는 아니지만, 네가 단순히 구경하려고 묻는 건 아니라는 건 알아."',topics:['heaven','past','trust','boundary','rude'],conversationType:'SECRET',choices:[
{text:'좋았던 기억부터 천천히 들려줘요.',response:'"그건 언젠가 해볼 만하겠네."',delta:1},{text:'그때의 믿음을 전부 버린 건 아니죠?',response:'"아니. 그래서 찰리를 보면 복잡한 거고."',delta:1},{text:'힘들면 멈춰도 돼요.',response:'그가 잠깐 당신을 본다. "...그 말은 꽤 괜찮네."',delta:1},{text:'지금 말할 수 있는 만큼이면 충분해요.',response:'"그래. 그 정도 거리감은 마음에 들어."',delta:1},{text:'좋은 끝을 다시 만들 수도 있잖아요.',response:'루시퍼가 아주 작게 웃는다. "그러려고 하는 중일지도."',delta:1}
]}),
scene({id:'lucifer-s12-rude-father-0',title:'찰리한테 좋은 아버지는 아니었던 거죠?',min:0,max:29,opening:'질문이 끝나자 루시퍼의 표정이 딱 멈춘다. 장난으로 받아칠 여지가 거의 없는 말이었다.',reaction:'"내가 실수한 건 알아. 그런데 처음부터 사람을 판결문처럼 몰아붙이는 질문엔 친절하게 답해줄 생각 없어."',topics:['charlie','fatherhood','family','rude'],conversationType:'PERSONAL',choices:[
{text:'말이 너무 셌네요. 미안해요.',response:'"그래. 그건 인정하지."',delta:0},{text:'후회는 하고 있죠?',response:'"하고 있어. 그렇다고 네 말투까지 괜찮아지는 건 아니고."',delta:0},{text:'지금은 달라지려고 하는 거예요?',response:'"그걸 위해 여기 있는 거야."',delta:0},{text:'찰리를 아끼는 건 알아요.',response:'그의 표정이 아주 조금 풀린다. "그럼 그 부분은 잊지 마."',delta:0},{text:'이 질문은 취소할게요.',response:'"완전히 취소는 못 해도, 다음엔 좀 낫게 물어봐."',delta:0}
]}),
scene({id:'lucifer-s12-rude-father-30',title:'찰리한테 좋은 아버지는 아니었던 거죠?',min:30,max:59,opening:'루시퍼는 질문의 의도보다 말투에 먼저 반응한다. 그래도 예전처럼 대화를 완전히 닫지는 않는다.',reaction:'"좋지 못했던 순간이 많았어. 그건 내가 제일 잘 알아. 하지만 네가 그걸 한 문장으로 내리찍으면 나도 기분은 나쁘지."',topics:['charlie','fatherhood','regret','rude'],conversationType:'RELATIONSHIP',choices:[
{text:'표현이 거칠었어요. 미안해요.',response:'"좋아. 그 사과는 받을게."',delta:0},{text:'그래도 다시 해보려는 건 보여요.',response:'그가 천천히 고개를 끄덕인다. "그게 지금 내가 할 수 있는 일이니까."',delta:1},{text:'찰리도 그걸 느낄 것 같아요.',response:'"그랬으면 좋겠네."',delta:1},{text:'실수한 걸 인정하는 건 쉽지 않죠.',response:'"쉽진 않아. 그래도 모른 척하는 것보단 낫고."',delta:1},{text:'다음엔 덜 공격적으로 물을게요.',response:'루시퍼가 짧게 웃는다. "그럼 대화가 훨씬 길어질 거야."',delta:1}
]}),
scene({id:'lucifer-s12-rude-father-60',title:'찰리한테 좋은 아버지는 아니었던 거죠?',min:60,max:100,opening:'가까워진 사이여도 질문은 아프다. 다만 루시퍼는 당신이 악의로만 묻는 것은 아니라는 걸 안다.',reaction:'"항상 좋은 아버지는 아니었어. 멀어진 시간도 있고, 내가 겁먹고 피한 순간도 있었지. 네가 그렇게 단정해서 말하면 아픈 건 여전하지만... 이제는 그 사실 자체를 숨기진 않아."',topics:['charlie','fatherhood','regret','trust','rude'],conversationType:'RELATIONSHIP',choices:[
{text:'상처 주려고 한 말은 아니었어요.',response:'"알아. 그래서 아직 대답하고 있잖아."',delta:0},{text:'지금의 선택이 더 중요하다고 생각해요.',response:'"나도 그렇게 믿으려고 해."',delta:1},{text:'찰리 곁에 계속 있어줘요.',response:'그가 작게 웃는다. "그럴 생각이야."',delta:1},{text:'당신도 스스로를 너무 오래 벌주진 마요.',response:'루시퍼가 잠시 말을 멈춘다. "...그건 꽤 어려운 주문인데."',delta:1},{text:'다음엔 더 조심해서 물을게요.',response:'"그럼 나도 조금 덜 날카롭게 답할게."',delta:1}
]}),
scene({id:'lucifer-s12-s1-call',title:'시즌 1 때 찰리가 처음 전화했을 때 그렇게 놀랐어요?',kind:'ASK',min:0,max:100,opening:'그때의 전화를 떠올리자 루시퍼는 민망함을 감추듯 모자 챙을 한번 고쳐 잡는다.',reaction:'"놀랐지. 반갑기도 했고. 한동안 제대로 연락하지 못했는데 갑자기 도움이 필요하다고 하니까, 기회를 놓치고 싶지 않았어."',topics:['season1','charlie','phone','hotel'],conversationType:'RELATIONSHIP',choices:[
{text:'그래서 바로 호텔로 온 거군요.',response:'"조금 과하게 준비해서 왔다는 건 인정하지."',delta:1},{text:'찰리가 먼저 연락해서 기뻤어요?',response:'그가 잠깐 웃는다. "응. 생각보다 많이."',delta:1},{text:'긴장도 했죠?',response:'"왕이 긴장이라니. ...조금."',delta:1},{text:'그때 잘하고 싶었던 거네요.',response:'"적어도 망치고 싶진 않았지. 결과는 좀 요란했지만."',delta:1},{text:'지금 다시 그 전화를 받으면 달라요?',response:'"덜 떠들고 더 빨리 들어줄 것 같네."',delta:1}
]}),
scene({id:'lucifer-s12-s1-alastor',title:'시즌 1에 알래스터랑 왜 그렇게까지 경쟁했어요?',kind:'ASK',min:0,max:100,opening:'알래스터를 떠올리는 것만으로도 루시퍼의 표정이 아주 미묘하게 구겨진다.',reaction:'"내가 오랜만에 딸을 보러 갔는데, 웬 라디오 사슴이 이미 가족 같은 얼굴로 자리를 차지하고 있더라고. 이성적으로만 반응하기엔 상황이 아주 성가셨지."',topics:['season1','alastor','charlie','rivalry'],conversationType:'PERSONAL',choices:[
{text:'질투였네요.',response:'"보호 본능이라고 부르면 훨씬 품위 있어."',delta:1},{text:'알래스터도 일부러 긁었죠?',response:'"그 녀석은 숨 쉬듯 그러더군."',delta:1},{text:'찰리 앞이라 더 예민했어요?',response:'"당연하지. 내 딸 주변의 수상한 놈인데."',delta:1},{text:'지금 생각하면 좀 웃겨요.',response:'루시퍼가 눈을 가늘게 뜬다. "남 일이라서 그렇지."',delta:0},{text:'그래도 그때 호텔을 더 보게 됐죠?',response:'"...그건 부정 못 하겠네."',delta:1}
]}),
scene({id:'lucifer-s12-s1-heaven-meeting',title:'찰리를 위해 천국과 만날 길을 열어준 건 어떤 마음이었어요?',kind:'TALK',min:20,max:100,opening:'시즌 1의 그 결정을 떠올리자 루시퍼가 잠시 조용해진다.',reaction:'"내 경험만 믿고 안 될 거라고 잘라 말하는 게 찰리한테 도움이 되진 않더군. 적어도 직접 부딪쳐볼 기회는 줘야 했어."',topics:['season1','charlie','heaven','support'],conversationType:'RELATIONSHIP',repeatable:false,priority:24,choices:[
{text:'그때부터 정말 돕기 시작한 거네요.',response:'"그래. 말이 아니라 행동으로 해야 했지."',delta:2},{text:'무서웠을 것 같아요.',response:'"좋은 기억만 있는 곳은 아니니까. 그래도 찰리 일이 먼저였어."',delta:1},{text:'찰리를 믿은 거군요.',response:'"적어도 그 애가 직접 증명할 기회는 믿었지."',delta:2},{text:'예전의 자기 자신도 떠올랐어요?',response:'그가 한 박자 늦게 대답한다. "...조금."',delta:1},{text:'그 선택은 잘한 것 같아요.',response:'"나도 지금은 그렇게 생각해."',delta:2}
]}),
scene({id:'lucifer-s12-s1-final-battle',title:'시즌 1 마지막 전투 때 제일 먼저 무슨 생각이 들었어요?',kind:'ASK',min:20,max:100,opening:'마지막 전투를 떠올리자 루시퍼의 농담기가 잠시 줄어든다.',reaction:'"찰리가 다칠 수 있다는 생각. 그다음은 거의 자동이었어. 늦게 도착했다는 건 아직도 마음에 안 들지만, 그 순간만큼은 다른 계산을 할 여유가 없었지."',topics:['season1','adam','battle','charlie'],conversationType:'RELATIONSHIP',choices:[
{text:'정말 화났겠네요.',response:'"분노는 꽤 훌륭한 추진력이더군. 남용은 추천 안 하지만."',delta:1},{text:'찰리를 먼저 본 거죠?',response:'"당연하지."',delta:1},{text:'아담이 무섭진 않았어요?',response:'"무서움보다 화가 훨씬 컸어."',delta:1},{text:'그 뒤 호텔도 같이 다시 세웠잖아요.',response:'그가 고개를 끄덕인다. "싸우고 끝낼 일이 아니었으니까."',delta:2},{text:'그때 가족으로 돌아온 느낌이었어요?',response:'루시퍼가 천천히 웃는다. "...조금은."',delta:2}
]}),
scene({id:'lucifer-s12-s1-rebuild',title:'호텔을 다시 세우던 날',kind:'TALK',min:30,max:100,opening:'무너진 호텔을 다시 세우던 날의 기억이 대화에 올라온다.',reaction:'"이상했어. 잔해를 치우는데도 끝났다는 느낌보다 다시 시작한다는 느낌이 더 컸거든. 찰리가 포기하지 않았고, 나도 이번엔 옆에 있고 싶었어."',topics:['season1','hotel','rebuild','charlie'],conversationType:'RELATIONSHIP',repeatable:false,priority:22,choices:[
{text:'그날 기분 좋았겠네요.',response:'"끔찍하게 피곤했지만... 응."',delta:2},{text:'호텔을 진짜 자기 일처럼 느낀 거예요?',response:'"찰리 일이라서 시작했는데, 어느 순간 내 일도 됐지."',delta:2},{text:'다시 무너지면 또 세울 거죠?',response:'"그런 말은 징크스 같아서 싫지만, 그래."',delta:1},{text:'그때부터 미래를 좀 믿게 됐어요?',response:'"아주 조금. 그걸로도 충분히 시작할 수 있더군."',delta:2},{text:'찰리도 든든했을 거예요.',response:'그가 시선을 내린다. "그랬기를 바라."',delta:1}
]}),
scene({id:'lucifer-s12-s2-pentious',title:'시즌 2 초반, 펜셔스 일 뒤 찰리가 힘들어할 때 무슨 생각이었어요?',kind:'ASK',min:20,max:100,opening:'펜셔스 이후의 분위기를 떠올리자 루시퍼의 표정이 차분해진다.',reaction:'"찰리가 모든 책임을 자기 어깨에 올려놓고 있더군. 내가 답을 다 줄 수는 없어도, 혼자 버티게 두고 싶진 않았어."',topics:['season2','pentious','charlie','grief','support'],conversationType:'RELATIONSHIP',choices:[
{text:'위로하는 법을 많이 고민했겠네요.',response:'"정답을 찾으려다 말을 망칠까 봐, 그냥 곁에 있는 쪽을 택했지."',delta:2},{text:'왕으로서의 조언도 해주고 싶었어요?',response:'"조언보다 먼저 숨 좀 쉬게 해주고 싶었어."',delta:1},{text:'찰리가 당신한테 기대는 게 좋았어요?',response:'그가 잠시 웃는다. "좋다고 말하면 상황이 이상하지만... 믿고 찾아온 건 고마웠지."',delta:2},{text:'당신도 같이 힘들었죠?',response:'"응. 하지만 그 순간엔 찰리가 먼저였어."',delta:1},{text:'그때 더 가까워졌다고 느꼈어요?',response:'"조금. 적어도 예전처럼 문 밖에서만 걱정하진 않았으니까."',delta:2}
]}),
scene({id:'lucifer-s12-s2-vox',title:'복스한테 직접 간 건 후회해요?',kind:'ASK',min:20,max:100,opening:'복스 이야기가 나오자 루시퍼가 아주 불쾌한 기억을 씹어 삼키는 얼굴을 한다.',reaction:'"방법은 후회해. 찰리와 호텔을 지키고 싶다는 마음까지 후회하진 않아. 그 녀석이 내가 손쓸 수 없는 선을 정확히 이용했지."',topics:['season2','vox','hotel','humiliation'],conversationType:'PERSONAL',choices:[
{text:'혼자 가지 말았어야 했네요.',response:'"결과만 보면 아주 훌륭한 지적이야."',delta:1},{text:'복스가 일부러 가족 얘기를 건드렸죠?',response:'루시퍼의 표정이 굳는다. "그래. 아주 계산적으로."',delta:1},{text:'당신도 너무 급했어요.',response:'"인정해. 보호하려다 더 큰 문제를 만든 셈이지."',delta:1},{text:'그래도 찰리를 지키려던 건 알겠어요.',response:'"그걸 알아주는 건... 고맙네."',delta:2},{text:'다시라면 어떻게 할 거예요?',response:'"혼자 영웅 흉내 내진 않을 거야. 아마도."',delta:2}
]}),
scene({id:'lucifer-s12-s2-charlie-leave',title:'찰리가 호텔에서 나가라고 했을 때 어땠어요?',kind:'ASK',min:30,max:100,opening:'그 순간을 묻자 루시퍼가 장난으로 피하려다 결국 포기한다.',reaction:'"아팠지. 그 말이 화에서 나온 거라는 걸 알아도, 내가 또 잘못 끼어들어서 일을 망쳤다는 생각이 먼저 들었어. 변명하고 싶었는데 그러면 더 나빠질 것 같았고."',topics:['season2','charlie','conflict','hotel'],conversationType:'RELATIONSHIP',choices:[
{text:'그래도 바로 싸우진 않았네요.',response:'"그때 더 밀어붙였으면 정말 최악이었겠지."',delta:1},{text:'많이 후회했어요?',response:'"응. 내가 옳았다는 걸 증명하는 것보다 그게 먼저였어."',delta:2},{text:'찰리도 나중엔 이해했을 거예요.',response:'"그랬으면 좋겠고... 조금은 그렇게 믿어."',delta:1},{text:'그때 혼자 있었어요?',response:'그가 시선을 피한다. "한동안은."',delta:0},{text:'다시 그런 일이 생기면요?',response:'"먼저 물어보고, 덜 멋대로 움직이고, 가능하면 말로 끝내야지."',delta:2}
]}),
scene({id:'lucifer-s12-s2-after-leaving',title:'호텔을 떠난 뒤',kind:'TALK',min:30,max:100,opening:'시즌 2에 찰리와 크게 부딪힌 뒤 호텔을 떠났던 시간을 떠올린다.',reaction:'"예전 같았으면 멀어지는 게 서로에게 낫다고 합리화했을지도 몰라. 이번엔 그게 같은 실수를 반복하는 거라는 걸 알았어. 그래서 돌아갈 방법을 계속 생각했지."',topics:['season2','charlie','conflict','regret'],conversationType:'RELATIONSHIP',repeatable:false,priority:26,choices:[
{text:'도망치지 않으려고 한 거네요.',response:'"그래. 아주 느린 진전이지만 진전은 진전이지."',delta:2},{text:'먼저 사과하려고 했어요?',response:'"몇 번이나 머릿속으로 연습했어. 너무 길어서 문제였지만."',delta:2},{text:'또 멀어질까 무서웠죠?',response:'루시퍼가 잠깐 웃음을 잃는다. "응. 꽤."',delta:2},{text:'그래도 예전이랑 달랐네요.',response:'"이번엔 관계를 포기하는 쪽이 쉬운 답이라는 걸 알아버렸거든."',delta:2},{text:'돌아가고 싶었군요.',response:'"처음부터."',delta:2}
]}),
scene({id:'lucifer-s12-s2-vox-trap',title:'복스가 찰리인 척 불렀을 때 진짜 믿었어요?',kind:'ASK',min:20,max:100,opening:'질문이 나오자 루시퍼가 얼굴을 손으로 쓸어내린다. 떠올리기만 해도 자존심이 상하는 모양이다.',reaction:'"믿었어. 찰리랑 화해할 기회라고 생각했으니까. 그걸 미끼로 쓸 거라고는... 그래, 지금 생각하면 내가 너무 급했지."',topics:['season2','vox','charlie','trap','apology'],conversationType:'PERSONAL',choices:[
{text:'화해하고 싶은 마음이 컸네요.',response:'"엄청 컸지. 그래서 의심보다 먼저 움직였고."',delta:2},{text:'사과도 준비했어요?',response:'그가 한숨을 쉰다. "지나치게 길고 화려한 버전으로."',delta:1},{text:'속은 게 창피해요?',response:'"굳이 확인까지 해야 해? 당연히 창피하지."',delta:0},{text:'복스가 가장 아픈 부분을 찔렀네요.',response:'루시퍼가 짧게 고개를 끄덕인다. "그래. 그건 인정하기 싫지만 정확해."',delta:1},{text:'그래도 화해하려 했다는 건 중요해요.',response:'"...그렇게 말하면 조금 덜 바보 같긴 하네."',delta:2}
]}),
scene({id:'lucifer-s12-s2-more-than-anything',title:'찰리랑 다시 제대로 이야기한다면 가장 먼저 무슨 말을 하고 싶어요?',kind:'TALK',min:50,max:100,opening:'한참 생각하던 루시퍼는 이번엔 농담으로 빠져나가지 않는다.',reaction:'"내가 또 겁먹고 멋대로 결정해서 미안하다고. 그리고 이번엔 말뿐이 아니라 계속 옆에 있겠다고. 예전처럼 중요한 순간에만 나타나는 아버지가 되고 싶진 않아."',topics:['season2','charlie','reconciliation','fatherhood'],conversationType:'RELATIONSHIP',repeatable:false,priority:28,choices:[
{text:'찰리도 그 말을 듣고 싶을 거예요.',response:'"그랬으면 좋겠네."',delta:2},{text:'말보다 계속 있는 게 중요하겠죠.',response:'"응. 그건 이제 확실히 알아."',delta:2},{text:'완벽할 필요는 없어요.',response:'그가 잠깐 웃는다. "요즘 제일 어려운 교훈이 그거야."',delta:2},{text:'이번엔 둘 다 덜 참았으면 좋겠어요.',response:'"동의해. 쌓아두면 결국 더 크게 터지더군."',delta:2},{text:'그래도 서로 많이 사랑하잖아요.',response:'루시퍼의 표정이 부드러워진다. "그건 한 번도 의심한 적 없어."',delta:2}
]})
];
added.forEach(s=>upsert(state,s));

function extraPairFor(sc){const bag=[...(sc.topics||[]),String(sc.title||'')].join(' ').toLowerCase();
  if(/charlie|찰리|family|father|가족|아버지/.test(bag))return[
    ['그 얘기, 조금 더 듣고 싶어요.','루시퍼가 잠깐 생각한 뒤 조금 더 솔직하게 말을 잇는다. "네가 판단부터 하지 않는다면, 조금은."',1],
    ['찰리 입장도 같이 생각해볼게요.','그가 눈을 한 번 깜빡인다. "그 말은 마음에 드네. 내 입장만 맞다고 할 생각은 없거든."',1]
  ];
  if(/heaven|천국|past|lilith|릴리스/.test(bag))return[
    ['말하고 싶은 만큼만 해요.','루시퍼의 긴장이 아주 조금 풀린다. "그 정도 거리는 꽤 고맙네."',1],
    ['나중에 더 편할 때 이어서 말해줘요.','"그래. 서두르지 않는 쪽이 낫겠어."',1]
  ];
  if(/alastor|알래스터/.test(bag))return[
    ['그래도 인정할 건 인정하네요.','"싫어한다고 현실까지 부정하진 않아. 그건 품위 없잖아."',1],
    ['그 사람 얘긴 여기까지만 할까요?','루시퍼가 즉시 고개를 끄덕인다. "오늘 들은 제안 중 최고군."',1]
  ];
  if(/duck|오리|hobby|취미/.test(bag))return[
    ['하나 만드는 과정도 보여줘요.','"좋아. 단, 작업대 질서는 내 법이야."',1],
    ['왜 이게 마음을 편하게 해줘요?','"작고, 고칠 수 있고, 끝이 보이니까. 거창한 문제들보다 훨씬 친절하지."',1]
  ];
  if(/hotel|호텔|redemption|구원/.test(bag))return[
    ['그럼 지금은 뭘 제일 돕고 싶어요?','"찰리가 혼자 모든 걸 떠안지 않게 하는 것부터."',1],
    ['결국 가능성을 보고 있는 거네요.','그가 작게 웃는다. "그래. 보기 싫어도 자꾸 보이더군."',1]
  ];
  return[
    ['조금 더 자세히 말해줘요.','"질문이 많네. ...그래도 그 정도는 말해줄 수 있지."',1],
    ['그렇게 생각하게 된 계기가 있어요?','루시퍼가 잠시 생각한다. "한 가지 계기라기보단, 오래 쌓인 결과에 가깝지."',1]
  ];
}
function ensureFiveChoices(sc){if(sc?.characterId!==CID||String(sc.kind||'').toUpperCase()!=='ASK')return;const node=(sc.nodes||[])[0];if(!node)return;node.choices=Array.isArray(node.choices)?node.choices:[];if(node.choices.length>=5)return;const extras=extraPairFor(sc);let n=0;while(node.choices.length<5&&n<extras.length){const [text,response,delta]=extras[n++];const id=`${sc.id}-extra-${node.choices.length+1}`;if(!node.choices.some(c=>c.id===id||c.text===text))node.choices.push(choice(id,text,response,delta));}}
state.dialogues.forEach(ensureFiveChoices);

write(state);
try{localStorage.setItem(VERSION_KEY,String(VERSION))}catch{}
window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'thought-archive',clearDirty:false}}));
})();
