(()=>{
if(window.__HELLAVERSE_LUCIFER_ROOM_TALKS_V1__)return;
window.__HELLAVERSE_LUCIFER_ROOM_TALKS_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_lucifer_room_talks_v1',CID='lucifer-morningstar';
let done=0;try{done=Number(localStorage.getItem(VK)||0)||0}catch{}if(done>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}};
const choice=(id,c)=>({id,type:'speech',text:c.text,playerLine:c.text,response:c.response,affectionDelta:Number(c.delta||0),requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:c.setFlags||'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:c.moodChange||'',unlockItemId:'',nextNodeId:'',endConversation:true});
function scene({id,title,opening,reaction,choices,min=0,max=100,type='CASUAL',topics=[],priority=9,repeatable=true}){return{id,characterId:CID,title,kind:'TALK',repeatable,requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'narration',sceneRole:'CONVERSATION',conversationType:type,topics,followUpTopics:topics,exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:reaction,choices:choices.map((c,i)=>choice(`${id}-c${i+1}`,c))}],openingNodeId:'start',_luciferRoomExpansion:true}}
const rows=[
scene({id:'lucifer-room-talk-01',title:'오리의 공기역학',opening:'루시퍼가 작은 고무 오리의 날개 각도를 자로 재고 있다.',reaction:'“이 각도가 중요해. 귀여움과 비행 성능의 완벽한 균형이지. 물론 실제로 날지는 않아. 아직은.”',topics:['duck','craft','joke'],choices:[
{text:'진짜 날게 만들 생각이에요?',response:'“당연하지. 불가능하다는 말은 보통 설계가 아직 덜 됐다는 뜻이야.”',delta:1},{text:'귀여움이 더 중요한 거 아닌가요?',response:'“오. 드디어 핵심을 이해하는 사람이 나타났군.”',delta:1},{text:'그냥 평범한 오리 같은데요.',response:'루시퍼가 상처받은 척 가슴을 짚는다. “잔인하군. 아주 잔인해.”',delta:0}
]}),
scene({id:'lucifer-room-talk-02',title:'모자 선택',opening:'침대 위에 거의 똑같아 보이는 흰 모자 세 개가 놓여 있다.',reaction:'“왼쪽은 공식적이고, 가운데는 위엄 있고, 오른쪽은 아주 미세하게 반항적이야. 중요한 차이지.”',topics:['fashion','royalty','joke'],choices:[
{text:'다 똑같아 보여요.',response:'“아니야. 전혀 아니야. 방금 패션 범죄를 자백했어.”',delta:0},{text:'오른쪽이 제일 잘 어울려요.',response:'“그렇지? 나도 그렇게 생각했어. 반항은 디테일에서 시작하거든.”',delta:1},{text:'모자 안 써도 괜찮은데요.',response:'“그건 선택지가 아니야. 왕관을 매일 쓰긴 너무 불편하잖아.”',delta:1}
]}),
scene({id:'lucifer-room-talk-03',title:'호텔 커피',opening:'루시퍼가 호텔 머그컵을 들고 한 모금 마신 뒤 미묘한 표정을 짓는다.',reaction:'“이건 커피가 아니라 뜨거운 갈색 결정이야. 누가 내렸지?”',topics:['hotel','food','daily'],choices:[
{text:'제가 한 잔 새로 내려드릴까요?',response:'“그 제안은 아주 현명하군. 널 오늘의 영웅으로 임명하지.”',delta:1},{text:'그 정도로 맛없어요?',response:'“내가 지옥의 왕이잖아. 고통에는 익숙해. 그런데 이건 선을 넘었어.”',delta:1},{text:'그냥 드세요.',response:'“냉혹하군. 알겠어. 이 시련도 견뎌내지.”',delta:0}
]}),
scene({id:'lucifer-room-talk-04',title:'서류 더미',opening:'책상 한쪽에 서류가 위태롭게 쌓여 있다.',reaction:'“저건 업무가 아니야. 저건 협박이야. 종이 형태를 한 협박.”',topics:['work','royalty','joke'],choices:[
{text:'처리해야 하는 거 아니에요?',response:'“알아. 그래서 더 싫어.”',delta:0},{text:'제가 분류라도 도와줄까요?',response:'루시퍼의 눈이 반짝인다. “정말? 방금 굉장히 위험한 약속을 했어.”',delta:2},{text:'그냥 불태우면요?',response:'“하! 드디어 왕실 행정에 적합한 인재가 왔군.”',delta:1}
]}),
scene({id:'lucifer-room-talk-05',title:'찰리의 새 계획표',opening:'루시퍼가 찰리가 남긴 계획표 가장자리에 작은 별표를 그리고 있다.',reaction:'“여긴 너무 빡빡하고, 여긴 식사 시간이 없고… 대체 누가 자기 일정에 휴식을 안 넣지?”',topics:['charlie','hotel','support'],choices:[
{text:'찰리는 원래 열심히 하잖아요.',response:'“알아. 그래서 누가 옆에서 브레이크를 걸어줘야 해.”',delta:1},{text:'아빠답네요.',response:'그가 펜을 멈추고 잠깐 웃는다. “그 말은 아직도 조금 이상하게 좋네.”',delta:2},{text:'몰래 고치는 거예요?',response:'“몰래가 아니라… 선제적 아버지 개입이야.”',delta:1}
]}),
scene({id:'lucifer-room-talk-06',title:'왕좌의 단점',opening:'루시퍼가 의자에 비스듬히 앉아 다리를 꼬고 있다.',reaction:'“왕좌는 보기엔 멋있지. 문제는 오래 앉아 있으면 허리가 죽는다는 거야. 아무도 그건 전설에 안 적더군.”',topics:['royalty','daily','joke'],choices:[
{text:'쿠션을 놓으면 되잖아요.',response:'“그래서 놓았더니 위엄이 사라졌대. 위엄이 허리보다 중요한가?”',delta:1},{text:'왕도 허리 아파요?',response:'“왕은 척추가 없다고 생각했어?”',delta:0},{text:'저라면 푹신하게 만들겠어요.',response:'“좋아. 혁명은 이렇게 시작되는 거야.”',delta:1}
]}),
scene({id:'lucifer-room-talk-07',title:'사과 타르트',opening:'방 안에 달콤한 사과 냄새가 남아 있다.',reaction:'“한 조각 남았어. 내가 널 좋아해서 주는 건 아니고, 두 조각 먹으면 찰리가 잔소리해서 그래.”',topics:['food','apple','player'],choices:[
{text:'고맙게 먹을게요.',response:'“그래. 아주 우아하게 받아들이는군.”',delta:1},{text:'사실 저 주려고 남긴 거죠?',response:'“자신감이 과해. …완전히 틀린 건 아니지만.”',delta:2},{text:'안 먹을래요.',response:'루시퍼가 바로 접시를 자기 쪽으로 당긴다. “좋아. 아주 훌륭한 결정이야.”',delta:0}
]}),
scene({id:'lucifer-room-talk-08',title:'피아노 한 소절',opening:'루시퍼가 피아노 건반 몇 개를 가볍게 눌러 보고 있다.',reaction:'“이 멜로디 어디서 들어본 것 같지 않아? 나도 그래. 문제는 어디서인지 기억이 안 난다는 거야.”',topics:['music','memory','daily'],choices:[
{text:'계속 쳐봐요.',response:'그가 몇 음을 더 이어간다. “음… 이 다음이 분명 있었는데.”',delta:1},{text:'직접 만든 곡 아닐까요?',response:'“그럴 가능성도 있어. 오래 살면 표절 상대가 과거의 나일 때가 있거든.”',delta:1},{text:'그냥 새 곡으로 만들죠.',response:'“오. 그건 마음에 드네. 기억 안 나면 새로 쓰면 되지.”',delta:1}
]}),
scene({id:'lucifer-room-talk-09',title:'날개 손질',opening:'루시퍼가 어깨 뒤쪽을 불편하게 움직이며 얼굴을 찌푸린다.',reaction:'“깃털은 멋있어 보이지. 관리할 때까지만.”',topics:['wings','daily','angel'],choices:[
{text:'손질하기 힘들어요?',response:'“여섯 장이라고. 여섯. 디자인한 사람을 만나면 항의하고 싶네.”',delta:1},{text:'그래도 예쁘잖아요.',response:'그가 금세 만족스럽게 웃는다. “그건 맞아.”',delta:1},{text:'도와줄까요?',response:'루시퍼가 잠깐 굳는다. “어— 그건… 나중에. 조금 더 친해지고.”',delta:1}
]}),
scene({id:'lucifer-room-talk-10',title:'엘리베이터 불평',opening:'루시퍼가 호텔 엘리베이터 쪽을 보며 못마땅하게 중얼거린다.',reaction:'“저 엘리베이터는 너무 느려. 순간이동할 수 있는데도 기다리게 되는 게 더 화나.”',topics:['hotel','daily','joke'],choices:[
{text:'그럼 순간이동하면 되잖아요.',response:'“그걸 알면서도 엘리베이터 버튼을 누르는 게 습관의 무서운 점이지.”',delta:1},{text:'수리하면 되죠.',response:'“맞아. 그런데 고치려고 뜯으면 찰리가 먼저 허락받으래.”',delta:0},{text:'기다리는 것도 나쁘지 않아요.',response:'“철학적인 척하지 마. 3층 가는 데 너무 오래 걸려.”',delta:1}
]}),
scene({id:'lucifer-room-talk-11',title:'방 장식',opening:'루시퍼가 벽에 걸린 장식의 각도를 아주 조금씩 바꾸고 있다.',reaction:'“삐뚤어진 건 아니었어. 그냥… 내가 볼 때마다 0.7도씩 거슬렸을 뿐이야.”',topics:['room','daily','perfection'],choices:[
{text:'지금은 완벽해 보여요.',response:'“좋아. 증인이 생겼군. 이제 더 안 건드릴 거야. 아마.”',delta:1},{text:'조금 오른쪽 같은데요.',response:'루시퍼가 즉시 다시 쳐다본다. “왜 그런 말을 해.”',delta:0},{text:'신경 많이 쓰네요.',response:'“내 방이잖아. 적어도 벽 정도는 내 말을 들어야지.”',delta:1}
]}),
scene({id:'lucifer-room-talk-12',title:'왕이라는 호칭',opening:'루시퍼가 서류에 적힌 KING OF HELL 문구를 손가락으로 톡 친다.',reaction:'“이 호칭은 필요할 땐 편하고, 필요 없을 땐 정말 귀찮아.”',topics:['royalty','identity','work'],choices:[
{text:'그래도 멋있잖아요.',response:'“그건 부정하지 않지. 이름표가 아주 강렬하긴 해.”',delta:1},{text:'부담돼요?',response:'“가끔. 특히 다들 내가 모든 걸 알고 있을 거라고 생각할 때.”',delta:1},{text:'그럼 뭐라고 부르는 게 좋아요?',response:'“루시퍼. 충분히 거창하잖아?”',delta:1}
]}),
scene({id:'lucifer-room-talk-13',title:'알래스터의 라디오',opening:'멀리서 희미한 라디오 잡음이 들리자 루시퍼가 눈을 가늘게 뜬다.',reaction:'“저 소리만 들으면 왜 이렇게 자동으로 짜증이 나지? 신기할 정도야.”',topics:['alastor','hotel','joke'],choices:[
{text:'알래스터가 그렇게 싫어요?',response:'“싫다기보단… 굉장히 적극적으로 마음에 안 들어.”',delta:1},{text:'둘이 은근 잘 맞는 것 같은데요.',response:'“그 말 취소해. 지금.”',delta:0},{text:'무시하면 되잖아요.',response:'“나도 그러려고 해. 걔가 자꾸 무시당하지 않으려고 존재하잖아.”',delta:1}
]}),
scene({id:'lucifer-room-talk-14',title:'작은 선물',opening:'루시퍼가 손바닥만 한 금색 장식을 만지작거리다 서랍에 넣는다.',reaction:'“아무것도 아니야. 그냥… 찰리한테 줄까 하고 만든 건데 조금 과한가 싶어서.”',topics:['charlie','gift','craft'],choices:[
{text:'찰리라면 좋아할 것 같아요.',response:'“그렇지? 그래. 나도 그렇게 생각했어. 그냥 확인이 필요했을 뿐이야.”',delta:2},{text:'뭔데요?',response:'“완성되기 전엔 비밀. 실패하면 더더욱 비밀.”',delta:1},{text:'직접 주는 게 제일 좋죠.',response:'그가 장식을 다시 꺼낸다. “응. 이번엔 그러려고.”',delta:2}
]}),
scene({id:'lucifer-room-talk-15',title:'호텔 규칙',opening:'루시퍼가 벽에 붙은 호텔 규칙 안내문을 읽다가 중간에서 멈춘다.',reaction:'“‘복도에서 폭발 금지.’ 이걸 규칙으로 써야 한다는 사실부터가 문제 아닌가?”',topics:['hotel','rules','joke'],choices:[
{text:'여긴 지옥이잖아요.',response:'“그 말이 모든 안전 문제의 면죄부가 되진 않아.”',delta:1},{text:'체리 때문 아닐까요?',response:'“이름을 적지 않은 게 찰리의 배려겠지.”',delta:1},{text:'규칙 더 추가할까요?',response:'“‘왕의 오리 무단 반출 금지.’ 첫 줄로.”',delta:1}
]}),
scene({id:'lucifer-room-talk-16',title:'별 지도',opening:'루시퍼가 오래된 별 지도를 펼쳐 놓고 현재 위치와 맞지 않는 표시를 지우고 있다.',reaction:'“별도 변하고 길도 변해. 오래된 지도를 계속 고쳐 쓰는 건 좀 우습지?”',topics:['stars','past','change'],choices:[
{text:'버리는 것보단 낫죠.',response:'“그래. 새 종이보다 이쪽이 익숙하긴 해.”',delta:1},{text:'옛날 생각나요?',response:'그가 잠깐 지도를 내려다본다. “가끔. 생각보다 자주.”',delta:1},{text:'새로 그리면 되잖아요.',response:'“그럴 수도 있지. 다만 지우고 다시 그리는 것도 나쁘진 않아.”',delta:1}
]}),
scene({id:'lucifer-room-talk-17',title:'왕실 민원',opening:'루시퍼가 편지 한 장을 읽다가 이마를 짚는다.',reaction:'“‘지옥의 왕께서 직접 해결 바랍니다.’ 물론이지. 하수도 뚜껑 하나도 내가 직접 고치면 되겠군.”',topics:['work','hell','joke'],choices:[
{text:'진짜 직접 가요?',response:'“아니. 하지만 지금 순간이동해서 편지 쓴 사람 앞에 나타나고 싶은 충동은 있어.”',delta:1},{text:'왕도 민원 받아요?',response:'“놀랍게도 왕관은 고객센터 헤드셋 기능도 포함하더군.”',delta:1},{text:'답장해요.',response:'“좋아. ‘접수되었습니다.’ 네 글씨로 써줄래?”',delta:1}
]}),
scene({id:'lucifer-room-talk-18',title:'좋은 농담',opening:'루시퍼가 혼자 웃다가 당신을 보자 바로 자세를 고쳐 앉는다.',reaction:'“아니, 방금 떠오른 농담이 너무 좋았어. 문제는 설명하면 재미없어진다는 거야.”',topics:['joke','daily'],choices:[
{text:'그래도 해봐요.',response:'그가 농담을 끝까지 말한 뒤 스스로 먼저 웃는다. “봐. 역시 재밌잖아.”',delta:1},{text:'안 듣는 게 낫겠네요.',response:'“현명한 선택인데 왜 기분이 나쁘지?”',delta:0},{text:'또 혼자 웃고 있었죠?',response:'“내 최고의 관객이 나인 게 뭐가 문제야?”',delta:1}
]}),
scene({id:'lucifer-room-talk-19',title:'호텔을 보는 이유',opening:'창밖으로 호텔 로비를 내려다보던 루시퍼가 한동안 말이 없다.',reaction:'“저 아래는 항상 시끄럽네. 이상하게… 예전보다 그게 싫지 않아.”',min:30,max:100,type:'RELATIONSHIP',topics:['hotel','charlie','change'],choices:[
{text:'사람이 많아서요?',response:'“그것도 있고. 찰리가 그 한가운데 있는 걸 보면 좀 안심돼.”',delta:2},{text:'외롭지 않아서겠죠.',response:'그가 당신을 힐끗 본다. “너 가끔 너무 정확해서 곤란해.”',delta:2},{text:'이제 호텔이 좋아졌네요.',response:'“좋아한다는 단어는… 음. 인정할게. 꽤 좋아.”',delta:2}
]}),
scene({id:'lucifer-room-talk-20',title:'무언가 기대하는 일',opening:'루시퍼가 새로 만든 작은 장치를 시험하다 실패하자 다시 분해하기 시작한다.',reaction:'“예전엔 한 번 실패하면 오래 손을 놨는데, 요즘은 그냥 다시 만들면 되더라. 놀랍게도.”',min:40,max:100,type:'PERSONAL',topics:['optimism','craft','change'],choices:[
{text:'다시 기대하게 된 거네요.',response:'그가 잠깐 멈춘다. “조금씩. 아주 성가시게도.”',delta:2},{text:'실패해도 재밌어 보여요.',response:'“응. 망가지는 방식도 데이터니까.”',delta:1},{text:'이번엔 될 것 같아요.',response:'“그 말 기록해둘게. 성공하면 네 예언 덕분이라고 하지.”',delta:1}
]}),
scene({id:'lucifer-room-talk-21',title:'찰리 닮은 점',opening:'루시퍼가 찰리가 남긴 메모를 읽다가 작게 웃는다.',reaction:'“이런 데 느낌표 세 개 붙이는 건 대체 누구 닮은 건지 모르겠군.”',min:30,max:100,type:'RELATIONSHIP',topics:['charlie','family','similarity'],choices:[
{text:'당신 닮았죠.',response:'“근거 없는 비방이야. …맞지만.”',delta:2},{text:'둘이 진짜 닮았어요.',response:'그가 메모를 다시 내려다본다. “좋은 쪽만 닮았으면 좋겠는데.”',delta:1},{text:'찰리가 더 심한데요.',response:'“그건 인정. 느낌표 수에서 이미 졌어.”',delta:1}
]}),
scene({id:'lucifer-room-talk-22',title:'조용한 날',opening:'오늘은 방도 복도도 드물게 조용하다.',reaction:'“이렇게 조용하면 오히려 뭔가 터지기 직전 같지 않아?”',topics:['hotel','daily','quiet'],choices:[
{text:'그냥 평화로운 거예요.',response:'“그 단어를 이 호텔에서 믿어도 되는지 아직 검토 중이야.”',delta:1},{text:'곧 누가 소리 지를 것 같아요.',response:'“봐. 너도 학습했군.”',delta:1},{text:'조용한 게 싫어요?',response:'“예전엔 좋았는데, 요즘은 너무 오래 조용하면 좀 이상해.”',delta:1}
]}),
scene({id:'lucifer-room-talk-23',title:'당신 자리',opening:'루시퍼가 방 한쪽 의자 위에 쌓인 물건들을 치우고 있다.',reaction:'“이거 네가 자꾸 여기 앉아서 그래. 이제 매번 치우기 귀찮으니까 그냥 비워두려고.”',min:60,max:100,type:'RELATIONSHIP',topics:['player','room','trust'],choices:[
{text:'제 자리 생긴 거예요?',response:'“거창하게 말하지 마. …근데 뭐, 비슷하지.”',delta:2},{text:'괜히 미안하네요.',response:'“왜? 내가 치우기로 한 건데. 앉아.”',delta:2},{text:'다른 사람도 앉아도 돼요?',response:'루시퍼가 잠깐 의자를 본다. “굳이?”',delta:2}
]}),
scene({id:'lucifer-room-talk-24',title:'다음에 뭘 만들까',opening:'루시퍼가 빈 설계 노트를 펼쳐놓고 연필 끝으로 종이를 두드린다.',reaction:'“다음엔 뭘 만들까? 실용적인 거? 귀여운 거? 아니면 실용적이고 귀여운데 쓸데없는 거?”',topics:['craft','duck','player'],choices:[
{text:'실용적이고 귀여운 거요.',response:'“좋아. 마지막 조건만 빼는군. 도전적이야.”',delta:1},{text:'쓸데없는 게 제일 재밌죠.',response:'“정답! 드디어 창조의 본질을 아는 사람이군.”',delta:2},{text:'저한테 필요한 걸 만들어줘요.',response:'그가 흥미롭다는 듯 몸을 앞으로 기울인다. “오? 그건 구체적으로 들어봐야겠는데.”',delta:2}
]})
];
const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];for(const x of rows){const i=s.dialogues.findIndex(d=>d?.id===x.id);if(i>=0)s.dialogues[i]={...s.dialogues[i],...x};else s.dialogues.push(x)}
if(write(s)){try{localStorage.setItem(VK,'1')}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-room-talks'}}))}
})();