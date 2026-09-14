(()=>{
const STATE_KEY='hellaverse_dialogue_state_v1';
const SEED_KEY='hellaverse_lucifer_early_conversation_seed_version';
const VERSION=5;
const CID='lucifer-morningstar';
if(window.__HELLAVERSE_LUCIFER_EARLY_V5__)return;
window.__HELLAVERSE_LUCIFER_EARLY_V5__=1;

const read=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||'')||f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const upper=v=>String(v||'').trim().toUpperCase();
const badLegacyTexts=new Set([
  '그건 별로 중요하지 않은 것 같은데요.',
  '좀 과하게 생각하는 거 아닌가요?',
  '그냥 신경 안 쓰면 되잖아요.'
]);

function choice(id,text,response,delta=0,nextNodeId='',opts={}){
  return{
    id,type:'speech',text,playerLine:text,response,affectionDelta:Number(delta||0),
    requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',
    lockDisplay:'disabled',setFlags:opts.setFlags||((opts.mood||'')==='ANNOYED'?'lucifer.player_offended_him':''),
    removeFlags:opts.removeFlags||'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',
    moodChange:opts.mood||'',unlockItemId:'',nextNodeId,endConversation:!nextNodeId,
    nextTopics:opts.nextTopics||[]
  };
}
function node(id,text,choices=[]){return{id,speaker:'character',text:text||'',choices}}
function baseScene(id,title,opening,{repeatable=false,priority=0,topics=[]}={}){
  return{
    id,characterId:CID,title,kind:'TALK',repeatable,
    requiredAffection:0,maxAffection:19,requiredStage:'',requiredMood:'ANY',
    requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',
    priority,probability:100,opening,openingType:'character',sceneRole:'CONVERSATION',conversationType:'CASUAL',
    topics,followUpTopics:topics,exitLine:'',after:'',used:false,_seedOwner:'lucifer-early-v5'
  };
}
function makeLong(n,title,opening,setup,branches,wrap,topics=[],priority=0){
  const id=`lucifer-early-${String(n).padStart(2,'0')}`;
  const startChoices=branches.map((b,i)=>choice(`${id}-start-${i+1}`,b.text,b.response,b.delta||0,`branch-${i+1}`,{mood:b.mood||'',removeFlags:b.removeFlags||'',nextTopics:b.nextTopics||topics}));
  const nodes=[node('start',setup,startChoices)];
  branches.forEach((b,i)=>{
    const follow=(b.follow||[]).map((f,j)=>choice(`${id}-b${i+1}-${j+1}`,f.text,f.response,f.delta||0,'wrap',{mood:f.mood||'',removeFlags:f.removeFlags||'',nextTopics:f.nextTopics||topics}));
    nodes.push(node(`branch-${i+1}`,b.branch||'',follow));
  });
  nodes.push(node('wrap',wrap,[]));
  return{...baseScene(id,title,opening,{repeatable:false,priority,topics}),nodes,openingNodeId:'start'};
}
function makeShort(n,title,opening,setup,choices,topics=[]){
  const id=`lucifer-early-${String(n).padStart(2,'0')}`;
  return{...baseScene(id,title,opening,{repeatable:true,priority:0,topics}),nodes:[node('start',setup,choices.map((c,i)=>choice(`${id}-c${i+1}`,c.text,c.response,0,'',{nextTopics:topics})))],openingNodeId:'start'};
}

const longScenes=[
makeLong(1,'새 손님 확인',
  '루시퍼는 당신을 보자마자 잠깐 눈을 가늘게 뜬다. "아, 맞다. 찰리가 말한 새 손님."',
  '그는 지팡이 끝으로 빈 의자를 톡 가리킨다. "그래서. 아직 도망가지 않았네. 첫날치고는 훌륭해."',[
    {text:'생각보다 괜찮아요.',response:'"생각보다? 시작부터 기대치가 꽤 낮았던 모양이네."',delta:1,branch:'그는 당신을 잠깐 살펴보다가 의자에 기대 앉는다.',follow:[{text:'그래도 조금 긴장돼요.',response:'"정상이야. 여기서 첫날부터 편한 사람이 더 수상해."',delta:1},{text:'호텔이 꽤 재밌어요.',response:'"그 말은 며칠 뒤에도 같은지 확인해보지."',delta:0}]},
    {text:'도망갈 타이밍을 놓쳤어요.',response:'루시퍼가 짧게 웃는다. "그건 인정. 이 호텔은 타이밍 감각을 망가뜨리거든."',delta:1,branch:'그는 손가락으로 책상을 두 번 두드린다.',follow:[{text:'며칠은 더 있어볼게요.',response:'"며칠이 몇 주가 되는 건 순식간이지."',delta:1},{text:'그럼 책임져주실래요?',response:'"내가? 숙박 계약서에 그런 조항은 없던데."',delta:0}]},
    {text:'제가 여기 있어도 되는 건 맞죠?',response:'장난스러운 표정이 조금 누그러진다. "찰리가 방을 줬다면 되는 거야."',delta:0,branch:'그는 굳이 더 캐묻지 않고 시선을 옆으로 돌린다.',follow:[{text:'괜히 물었네요.',response:'"아니, 새 손님이면 물을 만하지. 안내가 엉망이니까."',delta:1},{text:'당신이 싫다고 하면 나가야 하나 해서요.',response:'"내가 손님 퇴실 심사까지 하게? 너무 바빠 보이지 않나."',delta:0}]}
  ],'"어쨌든 첫날 생존 축하." 그가 손을 한 번 흔든다. "지금은 그 정도면 충분해."',['guest','hotel','first-days'],30),

makeLong(2,'이름 기억하기',
  '루시퍼는 당신을 보더니 입을 열었다가 잠깐 멈춘다. "...잠깐. 이름이."',
  '그는 아무렇지 않은 척 손가락을 튕긴다. "알고 있어. 확인하는 거야. 아주 중요한 차이지."',[
    {text:'다시 말해드릴게요.',response:'"좋아. 협조적인 손님. 기억하기 쉬운 유형이군."',delta:1,branch:'당신이 이름을 다시 말하자 그는 한 번 따라 말해본다.',follow:[{text:'이번엔 기억해주세요.',response:'"명령형이네. 마음에 들어. 노력은 해보지."',delta:1},{text:'헷갈릴 수도 있죠.',response:'"봐, 이런 관대한 태도가 사람을 게으르게 만든다니까."',delta:0}]},
    {text:'벌써 잊으셨어요?',response:'"벌써라니. 전략적으로 기억을 재정렬하는 중이었어."',delta:1,branch:'그는 당신 이름을 일부러 과장되게 발음한다.',follow:[{text:'그렇게 부르진 마세요.',response:'"아쉽군. 왕실 행사 같은 울림이 있었는데."',delta:0},{text:'생각보다 잘 어울리네요.',response:'루시퍼가 웃는다. "좋아. 네가 허락했다."',delta:2}]},
    {text:'다른 손님 이름도 다 잊어요?',response:'그가 눈썹을 든다. "새 손님이 꽤 빠르게 공격적으로 나오네."',delta:-1,mood:'ANNOYED',branch:'루시퍼는 의자 등받이에 기대며 당신 반응을 본다.',follow:[{text:'농담이었어요.',response:'"농담은 타이밍이 절반이야. 이번 건 사십 점."',delta:0,mood:'NORMAL',removeFlags:'lucifer.player_offended_him'},{text:'그냥 궁금해서요.',response:'"질문 방식은 조금 덜 궁금하게 만들 수 있었어."',delta:-1,mood:'ANNOYED'}]}
  ],'그는 마지막으로 당신 이름을 정확하게 한 번 부른다. "됐어. 이번엔 저장 완료."',['guest','name','first-days'],20),

makeLong(3,'방은 괜찮은지',
  '"방은 어때?" 루시퍼가 갑자기 묻는다. "찰리가 손님방에 쿠션을 너무 많이 넣는 버릇이 있거든."',
  '그는 손가락으로 허공에 사각형을 그린다. "침대, 문, 창문. 최소한 셋은 멀쩡하지?"',[
    {text:'네, 생각보다 편해요.',response:'"생각보다? 또 그 표현이네. 기대치가 너무 낮아."',delta:1,branch:'그는 방 상태를 기록하는 척 진지한 얼굴을 한다.',follow:[{text:'쿠션도 나쁘지 않고요.',response:'"찰리한테 그 말은 하지 마. 내일 두 배가 된다."',delta:0},{text:'창문이 좀 뻑뻑해요.',response:'"그건 말해둬. 문이랑 창문은 농담할 부분이 아니야."',delta:1}]},
    {text:'쿠션이 저보다 많아요.',response:'루시퍼가 웃음을 터뜨린다. "역시. 그 애는 편안함을 물량으로 해결하지."',delta:1,branch:'그는 양손으로 쿠션 산 모양을 흉내 낸다.',follow:[{text:'몇 개 가져가실래요?',response:'"내 방에도 충분해. 내가 산 건 아니고."',delta:1},{text:'방패처럼 쓰고 있어요.',response:'"실용적이군. 여기선 실제로 도움 될지도 몰라."',delta:1}]},
    {text:'솔직히 별로예요.',response:'"오." 그는 의외로 기분 나빠하지 않는다. "구체적으로?"',delta:0,branch:'이번에는 실제 불편을 확인하려는 표정이다.',follow:[{text:'너무 시끄러워요.',response:'"그건 방 문제가 아니라 호텔 전체 문제일 가능성이 높아."',delta:0},{text:'그냥 제 취향이 아니에요.',response:'"그건 고칠 수 있지. 취향까지 재교육할 생각은 없거든."',delta:1}]}
  ],'"불편한 건 참지 말고 말해." 그가 덧붙인다. "찰리는 손님 불편하다는 말 들으면 바로 뛰어다니니까."',['guest','room','hotel'],12),

makeLong(4,'호텔에서 길 찾기',
  '루시퍼는 복도 쪽에서 돌아오는 당신을 보고 묻는다. "너 방금 세 번째로 같은 계단에서 나오지 않았어?"',
  '"이 호텔 구조가 합리적이라고 말하진 않겠어. 나도 문 하나 잘못 열면 전혀 다른 곳이 나오더군."',[
    {text:'조금 헤맸어요.',response:'"조금이라고 해두자. 네 자존심을 존중해주지."',delta:1,branch:'그는 지팡이로 복도 방향을 가리킨다.',follow:[{text:'식당은 어느 쪽이에요?',response:'"왼쪽, 두 번 꺾고, 소리 큰 쪽을 피해."',delta:0},{text:'제 방은 이제 외웠어요.',response:'"대단한 진전이네. 진심으로."',delta:1}]},
    {text:'호텔이 일부러 절 헷갈리게 해요.',response:'"좋아, 벌써 건물에 인격을 부여했군."',delta:1,branch:'루시퍼는 심각한 척 주변 벽을 바라본다.',follow:[{text:'당신도 길 잃어본 적 있어요?',response:'"없다고 하면 거짓말이겠지."',delta:1},{text:'안내표지판 좀 달아주세요.',response:'"그건 찰리에게 건의해. 색깔별로 열두 개쯤 만들 거야."',delta:0}]},
    {text:'보고만 있었어요? 도와주지.',response:'그의 눈썹이 올라간다. "새 손님이 벌써 왕을 부려먹네."',delta:-1,mood:'ANNOYED',branch:'그는 못마땅한 표정으로도 결국 방향을 가리킨다.',follow:[{text:'말이 좀 세게 나왔네요.',response:'"알면 됐어. 이번엔 길도 알려줬고."',delta:0,mood:'NORMAL',removeFlags:'lucifer.player_offended_him'},{text:'그래도 알려주셨잖아요.',response:'"그 태도가 특히 얄미운 거야."',delta:-1,mood:'ANNOYED'}]}
  ],'"길 잃으면 그냥 물어봐." 그는 한숨처럼 웃는다. "적어도 같은 계단 네 번 도는 것보단 빠르니까."',['guest','hotel','directions'],8),

makeLong(5,'호텔 첫 식사',
  '루시퍼가 식당 쪽을 힐끗 보며 묻는다. "여기 음식은 먹어봤어?"',
  '"대답하기 전에 말해두는데, 내가 주방 품질 보증까지 맡은 건 아니야."',[
    {text:'생각보다 괜찮았어요.',response:'"그 말 들으면 누군가는 감동하겠네. 생각보다라는 부분은 빼고."',delta:1,branch:'그는 메뉴를 떠올리는 듯 손가락으로 탁자를 두드린다.',follow:[{text:'추천 메뉴 있어요?',response:'"추천이라... 안전한 걸 원하면 달걀 쪽."',delta:0},{text:'같이 먹어본 적도 있어요?',response:'"아주 가끔. 소란을 감수할 마음이 있을 때."',delta:1}]},
    {text:'뭘 먹었는지 잘 모르겠어요.',response:'루시퍼가 잠깐 멈춘다. "그건... 이 호텔에선 꽤 현실적인 답이군."',delta:1,branch:'그는 심각하게 고개를 끄덕인다.',follow:[{text:'그래도 맛은 있었어요.',response:'"그럼 재료 정체는 묻지 마. 행복이 오래 간다."',delta:0},{text:'다음엔 당신이 골라주세요.',response:'"갑자기 책임이 커졌는데."',delta:1}]},
    {text:'별로였어요.',response:'"좋아. 솔직한 리뷰." 그는 웃는다. "누구한테 들키지만 마."',delta:0,branch:'그는 목소리를 조금 낮춘다.',follow:[{text:'누가 만든 건데요?',response:'"그 질문은 네 생존을 위해 보류하자."',delta:0},{text:'그래도 다시 먹어보긴 할게요.',response:'"용감하군. 혹은 배가 고프거나."',delta:1}]}
  ],'"결론은 먹을 만한 걸 찾으면 그걸 기억해둬." 그가 충고한다. "호텔 생활의 기본이야."',['guest','food','hotel'],5),

makeLong(6,'첫날 밤',
  '"잠은 잤어?" 루시퍼가 묻는다. "첫날 밤엔 보통 복도 소리 때문에 한 번쯤 깨거든."',
  '그는 손가락으로 하나씩 세기 시작한다. "문 닫는 소리, 누군가 뛰는 소리, 정체불명의 폭발음."',[
    {text:'의외로 잘 잤어요.',response:'"오. 적응력이 훌륭하네."',delta:1,branch:'그는 조금 놀란 듯 당신 얼굴을 본다.',follow:[{text:'원래 잘 자는 편이에요.',response:'"그 재능은 지옥에서 꽤 유용해."',delta:1},{text:'너무 피곤했나 봐요.',response:'"그것도 훌륭한 수면 전략이지."',delta:0}]},
    {text:'몇 번 깼어요.',response:'"정상 범위야. 셋 이하라면 아주 양호하고."',delta:0,branch:'그는 마치 호텔 통계를 말하듯 진지하다.',follow:[{text:'폭발음도 들렸어요.',response:'"그건... 일단 벽이 멀쩡하면 괜찮아."',delta:0},{text:'누가 노래도 하던데요.',response:'"그건 시간대에 따라 범인이 너무 많군."',delta:1}]},
    {text:'여기선 사람이 어떻게 자요?',response:'루시퍼가 웃음을 참는다. "며칠 지나면 놀랍게도 가능해져."',delta:0,branch:'그는 어깨를 으쓱한다.',follow:[{text:'믿기 힘든데요.',response:'"나도 처음엔 그랬지."',delta:0},{text:'귀마개부터 구해야겠네요.',response:'"현명한 판단. 아주 현실적이고."',delta:1}]}
  ],'"그래도 너무 못 자면 말해." 그가 덧붙인다. "잠 못 잔 손님은 찰리가 특히 걱정하거든."',['guest','sleep','hotel'],5),

makeLong(7,'찰리의 환영 질문',
  '루시퍼가 당신을 보며 묻는다. "찰리가 벌써 이것저것 물어봤지?"',
  '"꿈은 뭐냐, 목표는 뭐냐, 호텔은 어떠냐. 질문 세트가 있거든."',[
    {text:'네. 엄청 많이요.',response:'"역시." 그는 전혀 놀라지 않는다.',delta:1,branch:'루시퍼는 찰리의 질문 목록을 아는 사람처럼 고개를 끄덕인다.',follow:[{text:'그래도 친절했어요.',response:'"그건 의심할 필요 없지. 너무 친절해서 문제일 때도 있고."',delta:1},{text:'조금 정신없긴 했어요.',response:'"그것도 찰리답네."',delta:0}]},
    {text:'생각보다 괜찮았어요.',response:'"그럼 네가 질문 공세에 꽤 강한 편인가 보네."',delta:1,branch:'그가 장난스럽게 당신을 평가한다.',follow:[{text:'저도 질문하는 걸 좋아해서요.',response:'"그건 위험한 정보인데. 나한텐 적당히 해."',delta:1},{text:'대답 안 한 것도 있어요.',response:'"그래도 돼. 찰리도 결국 이해할 거야."',delta:1}]},
    {text:'좀 부담스러웠어요.',response:'루시퍼는 바로 반박하지 않는다. "그럴 수 있지."',delta:0,branch:'그는 의외로 진지하게 고개를 끄덕인다.',follow:[{text:'싫다는 건 아니에요.',response:'"그럼 됐어. 필요하면 천천히 말해."',delta:1},{text:'다음엔 좀 덜 물었으면 좋겠어요.',response:'"성공 확률은 낮지만 전달은 해보지."',delta:0}]}
  ],'"새 손님 딱지는 언젠가 떨어지겠지." 그는 가볍게 손을 흔든다. "그때까지는 천천히 봐."',['guest','charlie','hotel'],4),

makeLong(8,'다른 주민들',
  '루시퍼가 당신 쪽을 보며 묻는다. "그래서, 다른 주민들은 좀 만났어?"',
  '"누굴 먼저 만났느냐에 따라 호텔 첫인상이 굉장히 달라질 수 있어."',[
    {text:'몇 명이랑 인사했어요.',response:'"좋아. 아직 모두와 친해질 필요는 없어."',delta:1,branch:'그는 누가 먼저 말을 걸었는지 궁금한 표정이다.',follow:[{text:'다들 개성이 강하더라고요.',response:'"굉장히 외교적인 표현이군."',delta:1},{text:'아직 이름이 헷갈려요.',response:'"그건 이해해. 나도 처음엔 별명으로 저장한 적 있어."',delta:0}]},
    {text:'정상적인 사람은 없는 것 같던데요.',response:'루시퍼가 바로 웃는다. "관찰이 빠르네."',delta:1,branch:'그는 손가락으로 하나씩 세는 시늉을 하다 포기한다.',follow:[{text:'당신 포함해서요.',response:'그가 웃음을 멈춘다. "...용감하네."',delta:-1,mood:'ANNOYED'},{text:'그래도 재밌어요.',response:'"익숙해지면 조용한 곳이 더 이상하게 느껴져."',delta:1}]},
    {text:'조금 무서운 사람도 있어요.',response:'표정이 잠깐 진지해진다. "그럼 거리를 둬."',delta:1,branch:'그는 장난스러운 태도를 잠깐 접는다.',follow:[{text:'그렇게 해도 괜찮아요?',response:'"당연하지. 친해질 의무 계약은 없어."',delta:1},{text:'괜히 예민한 건가 했어요.',response:'"불편하면 일단 불편한 거야. 이유 분석은 나중에."',delta:1}]}
  ],'"천천히 봐. 사람도 호텔도 첫날에 다 파악하려 들면 피곤해져."',['guest','residents','hotel'],3),

makeLong(9,'고무오리 작업대',
  '루시퍼는 작업대 위 반쯤 완성된 고무오리를 내려놓다가 당신 시선을 눈치챈다. "...뭐."',
  '"이건 장난감이 아니라 아주 정교한 소형 작품이야. 형태가 오리일 뿐이지."',[
    {text:'디테일이 꽤 좋네요.',response:'그가 즉시 만족한 표정을 짓는다. "그렇지? 보는 눈은 있군."',delta:2,branch:'그는 오리를 집어 당신이 보기 좋게 돌린다.',follow:[{text:'직접 칠한 거예요?',response:'"전부. 작은 건 대충 만들면 더 티 나거든."',delta:1},{text:'만드는 데 오래 걸려요?',response:'"종류에 따라. 가끔은 쓸데없이 오래."',delta:0}]},
    {text:'그냥 오리 같은데요.',response:'"그냥?" 그는 가슴에 손을 얹는다. "잔인한 평론가가 왔군."',delta:0,branch:'그는 오리를 눌러 삑 소리를 낸다.',follow:[{text:'소리까지 나네요.',response:'"물론이지. 예술은 여러 감각을 자극해야 하니까."',delta:1},{text:'그 소리는 좀 처량해요.',response:'"그건 아직 조정 중이야. 그 부분은 인정."',delta:0}]},
    {text:'이런 걸 왜 만들어요? 유치한데.',response:'루시퍼의 표정이 싸늘하게 굳는다. "...유치해?"',delta:-2,mood:'ANNOYED',branch:'그는 오리를 내려놓고 당신을 빤히 본다.',follow:[{text:'말이 심했네요. 미안해요.',response:'"좋아. 취향 차이까지 싸울 생각은 없어."',delta:0,mood:'NORMAL',removeFlags:'lucifer.player_offended_him'},{text:'제 취향은 아니란 뜻이에요.',response:'"그렇게 말했으면 훨씬 덜 성가셨겠지."',delta:-1,mood:'ANNOYED'}]}
  ],'루시퍼는 다시 오리를 작업대에 올려놓는다. "완성되면 지금보다 훨씬 낫게 보일 거야. 당연히."',['guest','duck','hobby'],2),

makeLong(10,'모자 이야기',
  '루시퍼가 모자 챙을 손끝으로 바로잡는다. "왜. 아까부터 계속 보던데."',
  '"미리 말하지만 이건 과한 게 아니야. 적절하게 눈에 띄는 거지."',[
    {text:'잘 어울려서 봤어요.',response:'그가 바로 미소 짓는다. "그래. 가장 정확한 답이군."',delta:1,branch:'그는 모자를 아주 조금 기울여 각도를 바꾼다.',follow:[{text:'그 각도가 더 나아요.',response:'"오? 취향이 꽤 쓸 만하네."',delta:2},{text:'아까가 더 좋았어요.',response:'"솔직한 의견. 좋아. 원상복구."',delta:1}]},
    {text:'모자까지 포함해서 키 계산하나요?',response:'그의 미소가 멈춘다. "...새 손님이 벌써 그 농담을 한다고?"',delta:-1,mood:'ANNOYED',branch:'그는 모자를 한 번 눌러쓰며 당신을 노려본다.',follow:[{text:'농담이에요. 잘 어울려요.',response:'"늦었지만 회복 시도는 인정하지."',delta:0,mood:'NORMAL',removeFlags:'lucifer.player_offended_him'},{text:'진짜 궁금해서요.',response:'"궁금함을 마음속에 간직하는 기술도 있어."',delta:-1,mood:'ANNOYED'}]},
    {text:'매일 쓰면 안 불편해요?',response:'"좋은 질문이네. 아주 조금 불편해. 하지만 멋에는 비용이 들지."',delta:1,branch:'그는 모자를 벗었다가 곧바로 다시 쓴다.',follow:[{text:'안 쓴 것도 괜찮은데요.',response:'"괜찮음은 목표가 아니야. 훌륭함이 목표지."',delta:0},{text:'지금이 더 루시퍼 같아요.',response:'그가 만족스럽게 웃는다. "정답."',delta:2}]}
  ],'"결론은 모자는 유지." 그는 판결이라도 내리듯 손을 내린다.',['guest','hat','appearance'],1),

makeLong(11,'왜 또 찾아왔어',
  '루시퍼가 문 쪽을 보다가 당신에게 시선을 돌린다. "근데 너, 요즘 내 방 꽤 자주 오지 않아?"',
  '"불만이라는 건 아니고. 통계적으로 눈에 띈다는 거야."',[
    {text:'그냥 이야기하기 편해서요.',response:'그가 잠깐 말을 멈춘다. "...그건 꽤 괜찮은 이유네."',delta:2,branch:'루시퍼는 괜히 책상 위 물건을 정리한다.',follow:[{text:'싫으면 덜 올게요.',response:'"내가 싫다고 했나? 너무 앞서가진 마."',delta:1},{text:'당신도 심심해 보이니까요.',response:'"그건 사실이지만 굳이 그렇게 말할 필요는 없었어."',delta:0}]},
    {text:'여기 구경할 게 많잖아요.',response:'"아, 난 부차적 요소였군. 상처받을 뻔했네."',delta:1,branch:'그는 과장되게 가슴에 손을 얹는다.',follow:[{text:'당신도 포함이에요.',response:'"좋아. 수정된 답은 합격."',delta:1},{text:'오리가 제일 궁금해서요.',response:'"역시 작품이 사람을 부르는군."',delta:1}]},
    {text:'오면 안 돼요?',response:'그의 표정이 조금 누그러진다. "그런 뜻은 아니야."',delta:1,branch:'그는 문 쪽에서 시선을 떼고 다시 당신을 본다.',follow:[{text:'그럼 계속 올게요.',response:'"자신감 하나는 훌륭하군."',delta:1},{text:'괜히 물었네요.',response:'"아니. 확인은 나쁘지 않지."',delta:1}]}
  ],'"아무튼 문은 열려 있으면 들어와도 돼." 그가 가볍게 덧붙인다. "대부분은."',['guest','visit','daily'],1),

makeLong(12,'첫 주 적응',
  '"그래서." 루시퍼가 당신을 가만히 본다. "며칠 지났는데 아직 호텔이 이상해 보여?"',
  '"정답은 물론 그렇다겠지만, 어느 정도로 이상한지가 궁금해서."',[
    {text:'처음보단 익숙해졌어요.',response:'"그게 제일 무서운 단계지. 이상한 걸 이상하게 안 느끼기 시작하거든."',delta:1,branch:'그는 만족한 듯 고개를 끄덕인다.',follow:[{text:'나쁘진 않아요.',response:'"그럼 적응 성공에 가깝네."',delta:1},{text:'조금 걱정되는데요.',response:'"그 걱정이 남아 있으면 아직 정상 범위야."',delta:0}]},
    {text:'아직 매일 새로워요.',response:'"좋은 태도야. 이 호텔은 일관성이 없거든."',delta:1,branch:'루시퍼는 복도 쪽 소리를 잠깐 듣는다.',follow:[{text:'오늘도 뭔가 터졌나요?',response:'"오늘은 아직. 강조하자면 아직."',delta:0},{text:'그게 좀 재밌어요.',response:'"너 생각보다 이곳이 잘 맞을지도 모르겠네."',delta:1}]},
    {text:'솔직히 아직 불편해요.',response:'그가 장난을 줄인다. "그럼 천천히 해. 적응에도 속도가 있는 거니까."',delta:1,branch:'그는 더 캐묻지 않고 잠깐 기다린다.',follow:[{text:'그래도 나가고 싶진 않아요.',response:'"그 정도면 충분하지."',delta:1},{text:'조금 더 지켜보려고요.',response:'"좋아. 판단은 네가 하는 거니까."',delta:1}]}
  ],'"처음부터 여기가 집처럼 느껴질 필요는 없어." 그가 말한다. "그건 너무 많은 걸 요구하는 거니까."',['guest','first-week','hotel'],1)
];

const shortScenes=[
makeShort(13,'복도 소음','복도에서 뭔가 크게 떨어지는 소리가 난다. 루시퍼는 눈도 깜빡이지 않는다.','"...세 번째네. 오늘만."',[
  {text:'확인 안 해봐도 돼요?',response:'"비명 없으면 보통은 괜찮아."'},
  {text:'이제 익숙하세요?',response:'"그 질문 자체가 답이지."'},
  {text:'저는 아직 놀라요.',response:'"정상 반응이야. 유지해."'}],['hotel','noise','daily']),
makeShort(14,'엘리베이터','루시퍼가 엘리베이터 쪽을 보며 한숨 쉰다.','"방금 또 문 닫히기 직전에 멈췄어. 아주 성격이 있어."',[
  {text:'기계에 성격이요?',response:'"여기선 충분히 가능한 가설이지."'},
  {text:'계단 탈게요.',response:'"현명하지만 운동량이 늘어나는 선택이군."'},
  {text:'고쳐야 하는 거 아닌가요?',response:'"그 말은 너무 합리적이라 여기선 약간 낯설어."'}],['hotel','elevator','daily']),
makeShort(15,'로비 소파','루시퍼가 로비 소파를 가리킨다.','"저 소파, 보기보다 깊게 꺼져. 앉으면 일어날 때 자존심이 상해."',[
  {text:'직접 당해보셨어요?',response:'"그 질문엔 대답하지 않겠어."'},
  {text:'그럼 다른 데 앉을게요.',response:'"좋은 선택. 경험자의 조언을 존중하네."'},
  {text:'한번 앉아볼래요.',response:'"모험심이 쓸데없는 방향으로 훌륭하군."'}],['hotel','lobby','daily']),
makeShort(16,'수하물','루시퍼가 당신 방 앞의 짐을 본다.','"아직도 안 풀었어? 새 손님 티가 너무 나는데."',[
  {text:'정리하기 귀찮아서요.',response:'"이해해. 상자는 가구처럼 쓸 수도 있지."'},
  {text:'곧 할 거예요.',response:'"모두가 그렇게 말하지."'},
  {text:'도와주실래요?',response:'"내가 왜 자연스럽게 노동력 후보가 된 거지?"'}],['guest','luggage','room']),
makeShort(17,'문 잠금','루시퍼가 당신 방문 손잡이를 한번 확인한다.','"이건 잠금 괜찮네. 적어도 기본은 되어 있어."',[
  {text:'원래 확인하세요?',response:'"새 손님 방이면 한 번쯤은."'},
  {text:'걱정해주시는 거예요?',response:'"시설 점검이라고 하자. 그 표현이 덜 민망하니까."'},
  {text:'제가 알아서 할 수 있어요.',response:'"좋아. 그럼 난 확인만 한 걸로."'}],['guest','room','safety']),
makeShort(18,'호텔 음악','멀리서 음악이 희미하게 들린다. 루시퍼가 귀를 기울인다.','"오늘 선곡은 나쁘지 않군."',[
  {text:'이런 음악 좋아해요?',response:'"취향 범위는 넓어. 기준은 좀 까다롭고."'},
  {text:'전 조금 시끄러운데요.',response:'"그럼 복도 끝 방은 피하는 게 좋아."'},
  {text:'누가 틀었어요?',response:'"모르는 게 더 평화로운 정보도 있어."'}],['hotel','music','daily']),
makeShort(19,'깜빡이는 조명','천장의 불빛이 두 번 깜빡인다. 루시퍼가 올려다본다.','"저건 분위기 연출이 아니야. 아마도."',[
  {text:'아마도요?',response:'"확률을 남겨두는 게 안전하지."'},
  {text:'고장 신고해야겠네요.',response:'"찬성. 아주 지루하고 올바른 선택이야."'},
  {text:'전 이런 분위기도 좋아요.',response:'"적응력이 빠르군. 조금 걱정될 정도로."'}],['hotel','light','daily']),
makeShort(20,'커피냐 차냐','루시퍼가 빈 컵을 들어 보인다.','"커피냐 차냐. 아주 중요한 성향 검사야."',[
  {text:'커피요.',response:'"좋아. 빠르고 명확하군."'},
  {text:'차요.',response:'"나쁘지 않아. 적어도 향은 더 낫지."'},
  {text:'둘 다 별로예요.',response:'"흥미롭군. 제3세력 등장."'}],['guest','drink','daily']),
makeShort(21,'지팡이를 어디 뒀지','루시퍼가 주변을 두 번 둘러본다.','"내 지팡이 봤어? 분명 방금까지 있었는데."',[
  {text:'손에 들고 있는데요.',response:'그가 손을 내려다본다. "...좋아. 이 장면은 없던 걸로."'},
  {text:'책상 뒤에 있지 않아요?',response:'"아니, 그건 어제 잃어버린 다른 거야."'},
  {text:'왕도 물건 잃어버려요?',response:'"왕권에는 위치 추적 기능이 없어."'}],['lucifer','cane','daily']),
makeShort(22,'벽 장식','루시퍼가 복도 벽 장식을 한참 본다.','"저건 누가 저기 걸었지? 각도가 정확히 마음에 안 들어."',[
  {text:'제가 바로잡을까요?',response:'"오. 쓸모 있는 손님이네."'},
  {text:'전 잘 모르겠는데요.',response:'"바로 그 점이 문제야. 미묘하게 틀렸거든."'},
  {text:'그냥 두세요.',response:'"그 말을 듣고 더 신경 쓰이기 시작했어."'}],['hotel','decor','daily']),
makeShort(23,'늦은 밤 복도','늦은 시간, 루시퍼가 복도에서 당신과 마주친다.','"안 자고 뭐 해? 길 잃은 건 아니지?"',[
  {text:'잠이 안 와서요.',response:'"그럼 조금 걷는 것도 나쁘진 않지."'},
  {text:'물 마시러 나왔어요.',response:'"좋아. 아주 평범한 이유라 오히려 안심되네."'},
  {text:'또 길 잃었어요.',response:'"...적어도 솔직하군. 이쪽이야."'}],['guest','night','hotel']),
makeShort(24,'오늘 별일 없나','루시퍼가 창밖을 한번 보고 당신을 본다.','"오늘은 이상하게 별일이 없네. 불길할 정도로."',[
  {text:'조용하면 좋은 거 아닌가요?',response:'"이 호텔에선 조용함도 사건 전조처럼 느껴져."'},
  {text:'곧 뭔가 생기겠죠.',response:'"그 예언은 적중률이 너무 높아서 재미가 없어."'},
  {text:'그냥 쉬세요.',response:'"아주 급진적인 제안이군. 고려는 해보지."'}],['daily','quiet','hotel'])
];

function allChoices(scene){return(scene?.nodes||[]).flatMap(n=>Array.isArray(n.choices)?n.choices:[])}
function restoreLegacyAffectionEffects(state){const effects=state.dialogueRuntime?.repeatAffectionEffects;if(!effects||typeof effects!=='object')return false;let changed=false;for(const scene of state.dialogues||[]){for(const c of allChoices(scene)){const e=effects[c?.id];if(e&&Number(c.affectionDelta||0)===0&&Number(e.delta||0)!==0){c.affectionDelta=Number(e.delta||0);changed=true}}}if(state.dialogueRuntime){delete state.dialogueRuntime.repeatAffectionEffects;state.dialogueRuntime.version=VERSION}return changed}
function cleanLegacyEntryChoices(state){let changed=false;for(const scene of state.dialogues||[]){if(scene?.characterId!==CID)continue;const kind=upper(scene.kind);if(kind==='TALK')continue;for(const n of scene.nodes||[]){if(!Array.isArray(n.choices))continue;const before=n.choices.length;n.choices=n.choices.filter(c=>{const id=String(c?.id||''),text=String(c?.text||c?.playerLine||'').trim();return !id.endsWith('-awkward')&&!badLegacyTexts.has(text)});if(n.choices.length!==before)changed=true}}return changed}
function seed(state){state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];state.player=state.player&&typeof state.player==='object'?state.player:{};state.player.role='HOTEL GUEST';state.player.premise='Hazbin Hotel에 새로 들어온 손님';let changed=false;changed=restoreLegacyAffectionEffects(state)||changed;changed=cleanLegacyEntryChoices(state)||changed;const oldLegacy=new Set(state.dialogues.filter(s=>String(s?.id||'').startsWith('lucifer-h0-casual-')).map(s=>s.id));if(oldLegacy.size){state.dialogues=state.dialogues.filter(s=>!oldLegacy.has(s.id));changed=true}for(const scene of [...longScenes,...shortScenes]){const i=state.dialogues.findIndex(x=>x?.id===scene.id);if(i>=0){state.dialogues[i]=scene}else state.dialogues.push(scene);changed=true}const shallow=state.dialogues.find(s=>s?.id==='base-v1-lucifer-morningstar-talk-1');if(shallow&&Number(shallow.requiredAffection||0)<10){shallow.requiredAffection=10;changed=true}const duck=state.dialogues.find(s=>s?.id==='lc-v1-lucifer-long-ducks');if(duck&&Number(duck.requiredAffection||0)<20){duck.requiredAffection=20;changed=true}state.dialogueRuntime=state.dialogueRuntime&&typeof state.dialogueRuntime==='object'?state.dialogueRuntime:{};state.dialogueRuntime.version=VERSION;state.dialogueRuntime.earlyConversationCount=24;state.dialogueRuntime.lastSeedAt=new Date().toISOString();try{localStorage.setItem(SEED_KEY,String(VERSION))}catch{}return changed}

const state=read(STATE_KEY,{});seed(state);write(STATE_KEY,state);window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-early-v5'}}));
})();