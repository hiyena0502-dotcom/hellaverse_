(()=>{
if(window.__HELLAVERSE_LUCIFER_ROOM_MONOLOGUES_V1__)return;
window.__HELLAVERSE_LUCIFER_ROOM_MONOLOGUES_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_lucifer_room_monologues_v1',CID='lucifer-morningstar';
let done=0;try{done=Number(localStorage.getItem(VK)||0)||0}catch{}if(done>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}};
const choice=(id,c)=>({id,type:'speech',text:c.text,playerLine:c.text,response:c.response,affectionDelta:Number(c.delta||0),requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:'',unlockItemId:'',nextNodeId:'',endConversation:true});
function scene({id,title,opening,reaction,choices=[],min=0,max=100,type='AMBIENT',topics=[],priority=8,repeatable=true}){return{id,characterId:CID,title,kind:'TALK',repeatable,requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'narration',sceneRole:'CONVERSATION',conversationType:type,topics,followUpTopics:topics,exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:reaction,choices:choices.map((c,i)=>choice(`${id}-c${i+1}`,c))}],openingNodeId:'start',_luciferRoomExpansion:true}}
const quiet=[
scene({id:'lucifer-room-mono-quiet-01',title:'오리에게 설명 중',opening:'루시퍼는 당신이 들어온 줄 모른 채 작업대 위의 오리에게 진지하게 말을 걸고 있다.',reaction:'“그러니까 네 문제는 무게중심이야. 얼굴이 너무 귀여워서 앞쪽이 무거워. 치명적인 결함이지. 아주 사랑스럽고 치명적인 결함.”',topics:['monologue','duck','craft']}),
scene({id:'lucifer-room-mono-quiet-02',title:'사과 연습',opening:'루시퍼가 거울 앞에서 몇 번이나 같은 문장을 시작했다 멈춘다.',reaction:'“찰리, 그때 내가… 아니. 너무 무겁잖아. ‘딸, 아빠가 좀—’ 으, 더 최악이네.” 그는 한숨을 쉬고 처음부터 다시 생각한다.',min:20,max:100,type:'PERSONAL',topics:['monologue','charlie','fatherhood']}),
scene({id:'lucifer-room-mono-quiet-03',title:'혼자 하는 업무 회의',opening:'루시퍼가 빈 의자들을 향해 서류를 펼쳐 놓고 혼자 회의를 진행하고 있다.',reaction:'“첫 번째 안건. 왜 전부 내가 해야 하는가. 두 번째 안건. 첫 번째 안건을 지지하는 의견이 있는가. 만장일치군. 회의 종료.”',topics:['monologue','work','joke']}),
scene({id:'lucifer-room-mono-quiet-04',title:'멜로디 조각',opening:'루시퍼가 아주 작은 목소리로 멜로디를 흥얼거리며 건반을 짚는다.',reaction:'“음… 아니, 거기서 올라가면 너무 밝고. 내려가면 너무 우울하고. 그 사이가 있었는데.” 그는 같은 네 음을 다시 반복한다.',topics:['monologue','music','memory']}),
scene({id:'lucifer-room-mono-quiet-05',title:'별 이름',opening:'오래된 별 지도를 내려다보며 루시퍼가 거의 들리지 않을 만큼 조용히 이름들을 읽는다.',reaction:'“아직 있네. 너도. …너는 없어졌고. 저쪽은 이름이 바뀌었군.” 손끝이 오래된 표식 위에서 잠깐 멈춘다.',min:40,max:100,type:'PERSONAL',topics:['monologue','stars','past']}),
scene({id:'lucifer-room-mono-quiet-06',title:'작은 왕관',opening:'루시퍼는 손바닥만 한 왕관 장식을 고치며 혼잣말한다.',reaction:'“이건 너무 크고… 이건 너무 무겁고. 찰리는 어릴 때도 머리에 뭐 올려두는 걸 오래 못 참았지. 세 걸음 가면 벗어 던졌어.” 그가 혼자 웃는다.',topics:['monologue','charlie','family','craft']}),
scene({id:'lucifer-room-mono-quiet-07',title:'서류에게 협박',opening:'루시퍼가 답장하지 않은 서류 더미를 노려보고 있다.',reaction:'“계속 그렇게 쌓여 봐. 내가 무서울 줄 알아? 나는 지옥의 왕이야. 종이한테 질 리가—” 위에서 한 장이 미끄러져 떨어진다. “…비겁하군.”',topics:['monologue','work','joke']}),
scene({id:'lucifer-room-mono-quiet-08',title:'가족사진 앞에서',opening:'루시퍼가 오래된 가족사진을 들고 엄지로 모서리를 문지르고 있다.',reaction:'“진짜 작았는데.” 짧은 웃음 뒤로 한동안 아무 말이 없다. “너무 빨리 컸어.”',min:50,max:100,type:'PERSONAL',topics:['monologue','charlie','family','past'],repeatable:false}),
scene({id:'lucifer-room-mono-quiet-09',title:'천국의 천장',opening:'루시퍼가 새 설계도를 그리다가 무심코 오래된 형태의 아치를 그려 놓는다.',reaction:'“또 이 모양이네.” 그는 연필로 선 하나를 지운다. “그렇게 오래 지났는데 손은 아직 기억하고 있고.”',min:60,max:100,type:'SECRET',topics:['monologue','heaven','past'],repeatable:false}),
scene({id:'lucifer-room-mono-quiet-10',title:'스스로 칭찬하기',opening:'작은 장치가 제대로 작동하자 루시퍼가 주위를 확인하지도 않고 혼자 박수를 친다.',reaction:'“좋았어, 루시퍼. 훌륭했어. 역시 천재야. 아무도 안 칭찬해주면 직접 하면 되지.”',topics:['monologue','craft','joke']}),
scene({id:'lucifer-room-mono-quiet-11',title:'세 마리',opening:'루시퍼가 가족 덕 세 마리를 상자에서 꺼내 가지런히 놓는다.',reaction:'“하나, 둘, 셋.” 그는 순서를 조금 바꿨다가 다시 원래대로 돌려놓는다. “그래. 이게 낫지.”',min:60,max:100,type:'PERSONAL',topics:['monologue','family','duck'],repeatable:false}),
scene({id:'lucifer-room-mono-quiet-12',title:'조용한 약속',opening:'루시퍼가 찰리가 두고 간 메모를 접어 서랍 안쪽에 넣는다.',reaction:'“이번엔 도망가지 말자.” 아주 작게 중얼거린 뒤 서랍을 닫는다. “적어도 그건 할 수 있잖아.”',min:70,max:100,type:'SECRET',topics:['monologue','charlie','fatherhood','promise'],repeatable:false})
];
const caught=[
scene({id:'lucifer-room-mono-caught-01',title:'인사 연습 들킴',opening:'루시퍼가 문 쪽을 보며 혼자 자연스러운 표정을 연습하고 있다.',reaction:'“오, 왔어? 아니, 너무 반갑나. ‘그래, 들어와.’ 아니, 너무 무심하고—” 그가 당신과 눈이 마주친다. “…언제부터 거기 있었어?”',topics:['monologue','entry','embarrassed'],choices:[
{text:'처음부터요.',response:'루시퍼가 두 손으로 얼굴을 가린다. “끔찍하군. 이 기억은 서로 묻자.”',delta:1},{text:'방금 왔어요.',response:'“좋아. 아주 믿음직한 거짓말이야. 마음에 들어.”',delta:2},{text:'저 올 때마다 연습해요?',response:'“아니! …매번은 아니야.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-02',title:'알래스터 욕 들킴',opening:'루시퍼가 서류에 뭔가 적으며 작게 투덜거리고 있다.',reaction:'“사슴대가리, 웃는 얼굴, 지팡이, 라디오 잡음까지 전부—” 당신이 헛기침하자 그가 멈춘다. “어. 있었어?”',topics:['monologue','alastor','embarrassed'],choices:[
{text:'계속해요. 재밌는데.',response:'“안 돼. 관객이 생기면 이건 험담이 되잖아. 방금까진 독백이었어.”',delta:1},{text:'못 들은 척할게요.',response:'“훌륭해. 네 사회생활 능력이 마음에 드네.”',delta:2},{text:'생각보다 많이 싫어하네요.',response:'“생각보다? 내가 표현을 덜 했나?”',delta:1}
]}),
scene({id:'lucifer-room-mono-caught-03',title:'찰리 칭찬 연습',opening:'루시퍼가 손에 든 작은 선물을 보며 혼자 중얼거린다.',reaction:'“찰리, 네가 자랑스러— 아니, 그건 너무 갑자기 무겁고. 그냥 ‘잘했어’가—” 인기척에 그가 홱 돌아본다. “…아.”',min:20,max:100,type:'PERSONAL',topics:['monologue','charlie','fatherhood','embarrassed'],choices:[
{text:'그대로 말해도 좋아할 거예요.',response:'그가 선물을 내려다본다. “알아. 아는데 입 밖으로 꺼낼 때만 이상하게 어려워져.”',delta:2},{text:'제가 아무것도 못 들었어요.',response:'“그래. 아주 훌륭해. 그 태도 유지해.”',delta:1},{text:'연습 더 해볼래요?',response:'“네 앞에서? 절대 아니야. …적어도 오늘은.”',delta:1}
]}),
scene({id:'lucifer-room-mono-caught-04',title:'오리와 싸우다 들킴',opening:'루시퍼가 책상 위 오리를 향해 손가락질하고 있다.',reaction:'“네가 먼저 넘어졌잖아. 나를 보지 마. 물리법칙 문제야.” 당신을 본 루시퍼가 오리를 천천히 내려놓는다. “…설명할 수 있어.”',topics:['monologue','duck','joke','embarrassed'],choices:[
{text:'오리가 먼저 시작했죠?',response:'“그렇지! 드디어 목격자가— 잠깐, 너 지금 놀리는 거지?”',delta:2},{text:'설명 안 해도 돼요.',response:'“그게 더 창피해. 차라리 물어봐.”',delta:1},{text:'누가 이겼어요?',response:'그가 오리를 힐끗 본다. “…아직 결판 안 났어.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-05',title:'자기 격려',opening:'루시퍼가 서류를 들고 깊게 숨을 들이쉰다.',reaction:'“좋아. 전화 한 통이면 돼. 평범한 왕의 업무야. 넌 지옥 전체를—” 당신을 발견한 그가 말을 끊는다. “뭐.”',topics:['monologue','work','embarrassed'],choices:[
{text:'응원 필요해요?',response:'“필요 없어. …하지만 해도 막진 않을게.”',delta:1},{text:'전화 무서워해요?',response:'“무서운 게 아니라 귀찮은 거야. 엄청나게 다른 감정이라고.”',delta:0},{text:'할 수 있어요, 폐하.',response:'그가 헛웃음을 친다. “와. 이상하게 효과 있네. 다시는 하지 마.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-06',title:'옛 노래 들킴',opening:'루시퍼가 아주 오래된 듯한 노래를 낮게 흥얼거리고 있다.',reaction:'당신이 가까워지자 노래가 뚝 끊긴다. “그 곡 알아?” 물어본 뒤 스스로 고개를 젓는다. “아니. 알 리가 없겠지.”',min:40,max:100,type:'PERSONAL',topics:['monologue','music','past'],choices:[
{text:'좋은 노래네요.',response:'“응. 오래됐어. 아주 오래.”',delta:2},{text:'누가 만든 곡이에요?',response:'그가 잠깐 망설인다. “나중에 말해줄게. 오늘은 그냥 노래로 두자.”',delta:1},{text:'계속 불러줘요.',response:'“내가 콘서트 해주는 사람처럼 보이— …한 소절만.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-07',title:'가족사진 들킴',opening:'루시퍼가 가족사진을 내려다보며 혼자 웃고 있다.',reaction:'“저때 찰리가 내 모자 안 놔줘서 한참—” 당신을 발견하자 사진을 살짝 내린다. “언제 들어왔어?”',min:40,max:100,type:'PERSONAL',topics:['monologue','family','charlie','past'],choices:[
{text:'방금요. 계속 말해줘요.',response:'그가 사진을 다시 본다. “음… 저날 결국 모자에 이빨 자국도 났어.”',delta:2},{text:'좋아 보이네요.',response:'“좋았지.” 짧은 대답 뒤 미소가 남는다.',delta:2},{text:'사진 보여줘요.',response:'잠깐 망설이다 당신 쪽으로 기울인다. “조심해서 봐.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-08',title:'천국 얘기 들킴',opening:'루시퍼가 낡은 장식핀을 손끝으로 돌리며 혼잣말한다.',reaction:'“저때도 저 색은 촌스럽다고 했는데 아무도—” 당신을 본 순간 그의 손이 멈춘다. “…이건 아무것도 아니야.”',min:60,max:100,type:'SECRET',topics:['monologue','heaven','past','embarrassed'],choices:[
{text:'말하고 싶을 때만 해요.',response:'루시퍼가 손안의 핀을 내려다본다. “응. 그게 좋겠네.”',delta:2},{text:'조금만 들었어요.',response:'“그 ‘조금’이 어느 정도인지 굉장히 불안한데.”',delta:1},{text:'천국 장식 취향 별로였어요?',response:'그가 뜻밖에 웃는다. “끔찍했지. 드디어 안전한 질문이 나왔군.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-09',title:'깜짝 선물 계획',opening:'루시퍼가 종이에 CHARLIE라고 크게 적어놓고 목록을 작성하고 있다.',reaction:'“너무 크면 부담스럽고, 너무 작으면 성의 없어 보이고, 노래는 갑자기 부르면—” 당신을 본 그가 종이를 뒤집는다. “못 봤지?”',topics:['monologue','charlie','gift','embarrassed'],choices:[
{text:'아무것도 못 봤어요.',response:'“좋아. 네 협조에 왕실 차원의 감사를 표하지.”',delta:2},{text:'깜짝 선물이에요?',response:'“쉿! 그 단어부터 크게 말하지 마!”',delta:1},{text:'도와줄까요?',response:'그가 잠깐 고민하다 종이를 다시 뒤집는다. “좋아. 의견 하나만.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-10',title:'이름을 부르다 멈춤',opening:'당신이 문을 열기 직전, 루시퍼가 아주 작게 누군가의 이름을 부르는 소리가 난다.',reaction:'문이 열리자 그가 즉시 고개를 든다. “…아. 너였네.” 평소보다 짧은 침묵이 흐른다. “아무것도 아니야.”',min:70,max:100,type:'SECRET',topics:['monologue','past','loss','embarrassed'],choices:[
{text:'안 물어볼게요.',response:'그가 천천히 고개를 끄덕인다. “고마워.”',delta:2},{text:'괜찮아요?',response:'“응. 그냥 잠깐 옛날 생각이 났어.”',delta:2},{text:'혼자 있고 싶어요?',response:'잠시 생각한 그가 옆자리를 본다. “아니. 지금은 괜찮아.”',delta:3}
]}),
scene({id:'lucifer-room-mono-caught-11',title:'당신 얘기 들킴',opening:'루시퍼가 오리를 고치며 혼자 중얼거린다.',reaction:'“걔는 또 언제 오려나. 아니, 내가 왜 그걸—” 문 쪽의 당신과 눈이 마주친다. 그의 손이 그대로 멈춘다. “…아.”',min:80,max:100,type:'RELATIONSHIP',topics:['monologue','player','trust','embarrassed'],choices:[
{text:'저 기다렸어요?',response:'“그 단어를 꼭 그렇게 크게 말해야 해?” 시선을 피하면서도 부정하지 않는다.',delta:3},{text:'타이밍 좋았네요.',response:'“너무 좋아서 의심스러울 정도야.”',delta:2},{text:'못 들은 척할게요.',response:'“안 돼. 이미 네 표정이 다 들었다고 말하고 있어.”',delta:2}
]}),
scene({id:'lucifer-room-mono-caught-12',title:'조용한 진심 들킴',opening:'루시퍼가 창밖의 호텔을 보며 거의 속삭이듯 말한다.',reaction:'“이번엔 잘하고 싶어. 정말로.” 뒤에서 작은 소리가 나자 그가 홱 돌아본다. “…얼마나 들었어?”',min:80,max:100,type:'RELATIONSHIP',topics:['monologue','charlie','hotel','fatherhood','trust'],choices:[
{text:'그 말만요.',response:'그가 잠시 입을 다물었다가 고개를 끄덕인다. “그럼… 됐어.”',delta:3},{text:'잘할 수 있을 거예요.',response:'루시퍼가 눈을 내리깔며 작게 웃는다. “그렇게 쉽게 말하면 내가 믿고 싶어지잖아.”',delta:3},{text:'못 들은 걸로 할까요?',response:'“아니.” 짧은 침묵 뒤 그가 덧붙인다. “이번엔 굳이 숨기고 싶진 않아.”',delta:3}
]})
];
const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];for(const x of [...quiet,...caught]){const i=s.dialogues.findIndex(d=>d?.id===x.id);if(i>=0)s.dialogues[i]={...s.dialogues[i],...x};else s.dialogues.push(x)}
if(write(s)){try{localStorage.setItem(VK,'1')}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-room-monologues'}}))}
})();