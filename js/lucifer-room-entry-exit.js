(()=>{
if(window.__HELLAVERSE_LUCIFER_ROOM_ENTRY_EXIT_V1__)return;
window.__HELLAVERSE_LUCIFER_ROOM_ENTRY_EXIT_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_lucifer_room_entry_exit_v1',CID='lucifer-morningstar';
let done=0;try{done=Number(localStorage.getItem(VK)||0)||0}catch{}if(done>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}};
const choice=(id,text,response,delta=0)=>({id,type:'speech',text,playerLine:text,response,affectionDelta:delta,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:'',unlockItemId:'',nextNodeId:'',endConversation:true});
function scene({id,title,role,opening,min=0,max=100,type='CASUAL',topics=[],priority=10,choices=[]}){return{id,characterId:CID,title,kind:role,repeatable:true,requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'character',sceneRole:role,conversationType:type,topics,followUpTopics:topics,exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:choices.map((c,i)=>choice(`${id}-c${i+1}`,c.text,c.response,c.delta||0))}],openingNodeId:'start',_luciferRoomExpansion:true}}
const entries=[
scene({id:'lucifer-room-entry-01',title:'문 앞에서',role:'ENTRY',opening:'“문 앞에 서 있을 건가? 들어오든가.”',topics:['entry','room']}),
scene({id:'lucifer-room-entry-02',title:'노크는 장식',role:'ENTRY',opening:'“노크는 했고, 문은 열려 있고, 나는 여기 있고. 이제 남은 단계가 뭔지는 알겠지?”',topics:['entry','joke']}),
scene({id:'lucifer-room-entry-03',title:'또 왔네',role:'ENTRY',opening:'“오. 또 왔네? …아니, 싫다는 뜻은 아니야. 그렇게 바로 표정 만들지 마.”',topics:['entry','player','joke']}),
scene({id:'lucifer-room-entry-04',title:'문고리와의 결투',role:'ENTRY',opening:'“문고리랑 기싸움 중이야? 내가 심판이라도 봐줘?”',topics:['entry','joke']}),
scene({id:'lucifer-room-entry-05',title:'열려 있었어',role:'ENTRY',opening:'“문은 처음부터 열려 있었어. 설마 허락 떨어질 때까지 거기 서 있으려고 했던 건 아니지?”',topics:['entry','room']}),
scene({id:'lucifer-room-entry-06',title:'타이밍',role:'ENTRY',opening:'“딱 좋은 타이밍이네. 내가 지금 막 아주 중요한 일을— …아니, 오리 숨기지 마. 다 봤잖아.”',topics:['entry','duck','joke']}),
scene({id:'lucifer-room-entry-07',title:'조용히 들어와',role:'ENTRY',opening:'“쉿. 들어올 거면 조용히 들어와. 방금 겨우 이 녀석 균형 맞췄단 말이야.”',topics:['entry','duck','craft']}),
scene({id:'lucifer-room-entry-08',title:'손님 환영',role:'ENTRY',opening:'“찰리가 손님은 따뜻하게 맞으랬어. 그러니까… 어서 와. 됐지? 아주 따뜻했어.”',topics:['entry','charlie','joke']}),
scene({id:'lucifer-room-entry-09',title:'오리 조심',role:'ENTRY',opening:'“들어와. 단, 오른쪽 세 번째 선반은 건드리지 마. 무너지는 순간 우리는 둘 다 못 본 척하는 거야.”',topics:['entry','duck','room']}),
scene({id:'lucifer-room-entry-10',title:'예상 밖의 방문',role:'ENTRY',opening:'“네가 올 줄은 몰랐는데. 뭐, 이미 왔으니 됐지. 들어와.”',topics:['entry','player']}),
scene({id:'lucifer-room-entry-11',title:'아무 말도 안 했어',role:'ENTRY',opening:'“아. 너구나. 방금 내가 혼잣말한 거 들었으면— 못 들은 거야. 좋아, 들어와.”',topics:['entry','monologue','joke']}),
scene({id:'lucifer-room-entry-12',title:'왕의 환대',role:'ENTRY',opening:'“어서 오시죠, 폐하의 개인실에— 아, 됐다. 그냥 들어와. 내가 이걸 왜 하고 있지?”',topics:['entry','royalty','joke']}),
scene({id:'lucifer-room-entry-13',title:'업무 중',role:'ENTRY',opening:'“지금 굉장히 바쁜데… 네가 방해하는 건 그나마 덜 짜증 나니까 들어와.”',topics:['entry','work','player']}),
scene({id:'lucifer-room-entry-14',title:'잠깐 쉬는 중',role:'ENTRY',opening:'“나 지금 쉬는 중이야. 아주 공식적으로. 왕도 쉴 권리가 있어. …같이 있을 거면 문 닫고 들어와.”',topics:['entry','rest','royalty']}),
scene({id:'lucifer-room-entry-15',title:'기다린 건 아냐',role:'ENTRY',opening:'“왔네. 미리 말하지만 기다린 건 아니야. 그냥 문 쪽을 우연히 여러 번 봤을 뿐이지.”',min:40,max:100,type:'RELATIONSHIP',topics:['entry','player','relationship']}),
scene({id:'lucifer-room-entry-16',title:'잘 왔어',role:'ENTRY',opening:'“오, 잘 왔어. 마침 혼자 있기 조금 지겨워지던 참이었거든.”',min:50,max:100,type:'RELATIONSHIP',topics:['entry','player','comfort']}),
scene({id:'lucifer-room-entry-17',title:'익숙한 발소리',role:'ENTRY',opening:'“그 발소리 이제 알아듣겠네. 들어와. 굳이 노크 안 해도 돼.”',min:70,max:100,type:'RELATIONSHIP',topics:['entry','player','trust']}),
scene({id:'lucifer-room-entry-18',title:'왔네',role:'ENTRY',opening:'“왔네.” 잠깐 당신을 보던 루시퍼가 자연스럽게 옆자리를 비운다. “잘됐어. 앉아.”',min:80,max:100,type:'RELATIONSHIP',topics:['entry','player','trust']})
];
const exits=[
scene({id:'lucifer-room-exit-01',title:'벌써 가?',role:'EXIT',opening:'“벌써 가? …아니, 붙잡는 건 아니고. 그냥 생각보다 빨랐네.”',topics:['exit','player']}),
scene({id:'lucifer-room-exit-02',title:'문 닫아줘',role:'EXIT',opening:'“갈 거면 문은 뒤에서 닫아줘. 복도 소리 다 들어오거든.”',topics:['exit','room']}),
scene({id:'lucifer-room-exit-03',title:'다음엔 노크',role:'EXIT',opening:'“다음엔 노크하고 들어와. 내가 대답 안 해도 들어오는 건… 뭐, 그건 그때 생각하고.”',topics:['exit','joke']}),
scene({id:'lucifer-room-exit-04',title:'오리는 두고 가',role:'EXIT',opening:'“잠깐. 주머니 확인해. 오리 하나라도 들어가 있으면 왕실 절도죄야. …농담 반, 진담 반.”',topics:['exit','duck','joke']}),
scene({id:'lucifer-room-exit-05',title:'찰리 만나면',role:'EXIT',opening:'“찰리 만나면 나 일하고 있었다고 해줘. 세부 내용은 중요하지 않아. 아주 열심히였다고.”',topics:['exit','charlie','joke']}),
scene({id:'lucifer-room-exit-06',title:'조심해서 가',role:'EXIT',opening:'“복도 조심해. 누가 뭘 또 떨어뜨려 놨을지 모르니까. …이 호텔은 안전 기준이 감성적이야.”',topics:['exit','hotel','joke']}),
scene({id:'lucifer-room-exit-07',title:'다음엔 간식',role:'EXIT',opening:'“다음에 올 땐 간식 가져와. 네가 먹을 것도. 내가 다 먹는 사람처럼 보지 말고.”',topics:['exit','food','joke']}),
scene({id:'lucifer-room-exit-08',title:'알래스터를 만나면',role:'EXIT',opening:'“나가다가 사슴대가리 만나면… 아무 말도 하지 마. 그냥 아주 못마땅하게 한 번 쳐다봐줘.”',topics:['exit','alastor','joke']}),
scene({id:'lucifer-room-exit-09',title:'오늘 얘기는',role:'EXIT',opening:'“오늘 얘기한 건 굳이 여기저기 떠들고 다니지 마. 특히 찰리한테. …아니, 그 애가 걱정할 얘기는 아니고. 그냥.”',type:'PERSONAL',topics:['exit','privacy']}),
scene({id:'lucifer-room-exit-10',title:'왕도 일한다',role:'EXIT',opening:'“좋아, 이제 나도 일을 좀 해야겠군. 충격적이지? 나도 그래.”',topics:['exit','work','joke']}),
scene({id:'lucifer-room-exit-11',title:'또 와',role:'EXIT',opening:'“뭐… 또 와도 돼. 허가증 같은 건 필요 없어. 아직은.”',min:30,max:100,type:'RELATIONSHIP',topics:['exit','player','relationship']}),
scene({id:'lucifer-room-exit-12',title:'덜 조용해져',role:'EXIT',opening:'“네가 있다 가면 방이 좀 덜 조용해져서 좋긴 하네. …그 표정은 뭐야? 그냥 사실 말한 거야.”',min:60,max:100,type:'RELATIONSHIP',topics:['exit','player','comfort']}),
scene({id:'lucifer-room-exit-13',title:'대답 안 해도 돼',role:'EXIT',opening:'“또 올 거지?” 루시퍼가 먼저 묻고는 곧 손을 휘젓는다. “아, 됐어. 대답 안 해도 돼. 오면 알겠지.”',min:70,max:100,type:'RELATIONSHIP',topics:['exit','player','trust']}),
scene({id:'lucifer-room-exit-14',title:'잘 가',role:'EXIT',opening:'“잘 가.” 평소보다 짧게 말한 루시퍼가 문이 닫히기 직전에 덧붙인다. “그리고… 와줘서 고마웠어.”',min:80,max:100,type:'RELATIONSHIP',topics:['exit','player','trust']})
];
const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];for(const x of [...entries,...exits]){const i=s.dialogues.findIndex(d=>d?.id===x.id);if(i>=0)s.dialogues[i]={...s.dialogues[i],...x};else s.dialogues.push(x)}
if(write(s)){try{localStorage.setItem(VK,'1')}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'lucifer-room-entry-exit'}}))}
})();