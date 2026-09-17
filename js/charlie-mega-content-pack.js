(()=>{
'use strict';
if(window.__HELLAVERSE_CHARLIE_MEGA_CONTENT_V1__)return;
window.__HELLAVERSE_CHARLIE_MEGA_CONTENT_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_charlie_mega_content_v1',CID='charlie-morningstar',PACK='charlie-mega-content-v1';
let ver=0;try{ver=Number(localStorage.getItem(VK)||0)}catch{}if(ver>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const save=s=>{localStorage.setItem(K,JSON.stringify(s));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'charlie-mega-content'}}));window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source:'charlie-mega-content'}}))};
const base=(id,title,kind,role,opening,priority=7)=>({id,characterId:CID,title,kind,sceneRole:role,repeatable:true,requiredAffection:0,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'character',exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:[]}],openingNodeId:'start',conversationType:'CASUAL',contentPack:PACK,canonGrounding:'fanmade original inspired by collection archive themes'});
const choice=(id,text,response,delta=0)=>({id,type:'speech',text,playerLine:text,response,affectionDelta:delta,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:'',unlockItemId:'',nextNodeId:'',endConversation:true});
function conv(i,row){const [title,opening,aText,aRes,aDelta,bText,bRes,bDelta,topics=[]]=row,id=`charlie-mega-conv-${String(i+1).padStart(2,'0')}`,s=base(id,title,'TALK','CONVERSATION',opening,8);s.topics=topics;s.followUpTopics=topics;s.nodes=[{id:'start',speaker:'character',text:'',choices:[choice(`${id}-a`,aText,aRes,aDelta),choice(`${id}-b`,bText,bRes,bDelta)]}];return s}
function ask(i,row){const [title,answer,topics=[]]=row,id=`charlie-mega-q-${String(i+1).padStart(2,'0')}`,s=base(id,title,'ASK','QUESTION',answer,6);s.topics=topics;s.nodes=[{id:'start',speaker:'character',text:'',choices:[]}];return s}
function action(i,row){const [title,narration,response]=row,id=`charlie-mega-act-${String(i+1).padStart(2,'0')}`,opening=`[[NARRATION]] ${narration}\n[[CHARACTER]] ${response}`;return base(id,title,'TALK','ACTION',opening,9)}
function simple(i,text,kind,role){return base(`charlie-mega-${role.toLowerCase()}-${String(i+1).padStart(2,'0')}`,`${role} ${i+1}`,kind,role,text,20)}

const CONVERSATIONS=[
['환영 카드 더미','찰리가 색색의 카드 더미에 이름을 하나씩 적고 있다.','누구한테 주는 카드예요?','“새로 오는 사람들! 첫날부터 자기 이름이 적힌 걸 하나쯤 보면 조금 덜 낯설지 않을까 해서.”',1,'매번 직접 쓰면 너무 힘들지 않아요?','“맞아. 근데 인쇄된 ‘환영합니다’랑 누가 직접 쓴 이름은 느낌이 다르잖아.”',0,['hotel','welcome']],
['체크리스트의 빈칸','찰리가 구원 체크리스트를 보다가 빈칸 하나에 별표를 그린다.','빈칸인데 왜 별표예요?','“실패한 칸도 기록이니까. 다시 해볼 자리를 남겨둔 거야.”',1,'그냥 실패한 거 아닌가요?','찰리의 웃음이 조금 작아진다. “실패한 건 맞아. 그래도 거기서 끝내진 않을 거야.”',-1,['redemption','hope']],
['호텔의 아침','찰리가 아직 조용한 로비를 둘러보며 의자를 하나 바로잡는다.','이 시간 좋아해요?','“응. 아무 일도 터지기 전의 호텔은… 가능성이 가득한 것 같아.”',1,'곧 다 시끄러워질 텐데요.','“그것도 호텔이지! 조용한 것만 집인 건 아니니까.”',0,['hotel','daily']],
['Vaggie가 지운 일정','찰리가 일정표를 보다가 줄 하나가 깔끔하게 지워진 걸 발견한다.','배기가 지웠나 봐요.','“응. ‘쉬기’도 일정이라고 써놨더라. 너무 티 나지?”',1,'다시 일정 넣을 거죠?','찰리가 펜을 들었다가 내려놓는다. “...아니. 오늘은 그 사람 말 한번 들어볼래.”',1,['vaggie','relationship']],
['아빠에게 보낼 메시지','찰리가 휴대폰 입력창을 열었다 닫았다 반복한다.','루시퍼한테 먼저 보내요.','“그럴까? 별일 없어도 연락해도 되는 사이가 되는 게… 생각보다 연습이 필요하더라.”',1,'급한 일 아니면 안 보내도 되죠.','“예전엔 그렇게 생각했는데. 그래서 너무 많은 날을 그냥 지나친 것 같아.”',0,['lucifer','family']],
['노래가 먼저 나오는 순간','찰리가 설명을 하다 갑자기 멜로디를 흥얼거리고 스스로 멈춘다.','그냥 계속 불러도 되는데요.','“아, 또 그랬지? 말로 정리 안 되면 자꾸 노래로 먼저 나와.”',1,'모든 걸 노래로 해결할 순 없잖아요.','“알아. 그래서 요즘은 노래 끝난 다음에 대화하는 연습도 해.”',0,['music','communication']],
['가족사진 뒷면','찰리가 사진 한 장 뒤에 날짜와 짧은 문장을 적고 있다.','사진마다 메모해요?','“나중에 표정만 보고는 그날 무슨 일이 있었는지 잊을 수도 있잖아. 좋은 날은 자세히 남겨두고 싶어.”',1,'나쁜 날은 안 남겨요?','“남겨. 다만 그날을 미워하는 말 대신, 우리가 결국 지나왔다는 걸 적어.”',1,['family','memory']],
['구원 발표 연습','찰리가 빈 소파를 청중처럼 세워놓고 발표를 연습한다.','제가 청중 해줄게요.','“진짜? 좋아! 이번엔 중간에 질문도 해줘. 너무 쉬운 것 말고!”',1,'소파가 더 덜 긴장되지 않아요?','“맞아. 근데 소파는 반박을 안 하잖아. 현실적인 연습이 안 돼.”',0,['redemption','presentation']],
['기대가 너무 큰 날','찰리가 미소를 짓고 있지만 손에 든 펜은 조금 구겨져 있다.','오늘은 좀 쉬어도 돼요.','“알아. 누가 그렇게 말해주면 그제야 허락받은 기분이 드는 게 문제지만.”',1,'공주면 이 정도는 해야죠.','찰리가 잠시 조용해진다. “그 말, 나도 나한테 너무 자주 해. 그래서 별로 도움이 안 돼.”',-3,['pressure','family']],
['호텔 식구라는 말','찰리가 방명록의 여러 이름을 손가락으로 훑는다.','다 가족 같아요?','“가족이랑 똑같진 않아. 그래도 ‘여기 있어도 되는 사람들’이라는 느낌은 있어.”',1,'결국 손님 아닌가요?','“처음엔 손님이어도 돼. 집처럼 느끼기 시작하는 순간은 사람마다 다르니까.”',0,['hotel','found-family']],
['실패한 상담 기록','찰리가 찢지 않고 남겨둔 상담 메모를 접어 보관함에 넣는다.','왜 버리지 않아요?','“다음엔 같은 방식으로 밀어붙이지 않으려고. 실패도 다른 사람을 덜 다치게 하는 자료가 될 수 있잖아.”',1,'그런 걸 계속 보면 우울하지 않아요?','“조금. 그래서 혼자 볼 때는 한 번에 하나만 꺼내.”',0,['redemption','learning']],
['천국의 답을 기다리는 법','찰리가 창밖을 보며 손가락으로 책상 모서리를 두드린다.','기다리는 게 힘들어요?','“응. 노력하면 답이 와야 할 것 같은데, 세상은 꼭 그렇진 않더라.”',1,'그럼 포기하면 편하잖아요.','찰리의 표정이 단단해진다. “편한 게 목표였다면 처음부터 호텔을 안 했을 거야.”',-2,['heaven','redemption']],
['격려 문구 초안','찰리가 ‘괜찮아질 거야’라고 썼다가 지운다.','왜 지웠어요?','“상대가 안 괜찮은데 내가 먼저 괜찮아질 거라고 정해버리는 것 같아서.”',1,'그래도 긍정적인 말이 낫지 않아요?','“긍정도 듣는 사람 자리를 남겨둬야 한다고 생각해.”',1,['encouragement','communication']],
['밤의 호텔 순찰','찰리가 밤늦게 빈 복도를 한 번 더 확인한다.','배기가 보면 뭐라고 할까요?','“당장 자라고 하겠지. 그리고 맞는 말이라 더 억울할 거야.”',1,'불안해서 도는 거예요?','“조금. 다들 잘 있는지 확인하면 마음이 가라앉거든.”',0,['hotel','vaggie']],
['아빠 닮았다는 말','누군가 루시퍼와 닮았다고 했던 이야기가 나오자 찰리가 잠깐 웃는다.','좋은 뜻으로 들려요?','“요즘은. 예전엔 복잡했는데, 이제는 닮은 부분 중 좋은 것도 내가 고를 수 있다고 생각해.”',1,'안 닮고 싶었던 적도 있어요?','“응. 그래도 그건 아빠를 싫어해서가 아니라, 같은 실수를 반복할까 무서워서였어.”',1,['lucifer','family']],
['Vaggie의 조용한 방식','찰리가 책상 한쪽에 놓인 물컵을 보고 미소 짓는다.','배기가 가져다준 거죠?','“응. ‘물 마셔’라고 말하면 내가 또 ‘잠깐만’ 하니까 그냥 두고 가.”',1,'잔소리 같진 않아요?','“아니. 나를 아는 사람이 고른 방식 같아.”',1,['vaggie','relationship']],
['노래의 두 번째 버전','찰리가 같은 가사의 두 버전을 나란히 적어두었다.','뭐가 달라요?','“첫 번째는 내가 하고 싶은 말이고, 두 번째는 상대가 들을 수 있는 말이야.”',1,'첫 번째가 더 솔직한 거 아닌가요?','“솔직함이 상대를 밀어붙이는 면허는 아니니까.”',1,['music','communication']],
['호텔 간판 아래에서','찰리가 로비 간판을 올려다본다.','아직도 볼 때마다 특별해요?','“응. 건물이 아니라 우리가 다시 세운 약속 같아서.”',1,'언젠간 익숙해지겠죠.','“익숙해져도 괜찮아. 집이 된다는 건 그런 거니까.”',1,['hotel','memory']],
['구원 이후의 다음 질문','찰리가 노트 맨 위에 ‘그 다음은?’이라고 크게 적는다.','구원되면 끝 아닌가요?','“그 사람이 새곳에서 어떻게 사는지도 중요하잖아. 문을 통과했다고 이야기가 끝나는 건 아니야.”',1,'너무 멀리 걱정하는 거 아녜요?','“맞아! 그래서 일단 옆에 ‘지금 할 일’도 적어놨어.”',0,['redemption','heaven']],
['엄마 이야기를 꺼내는 법','찰리가 가족사진 가장자리를 엄지로 문지른다.','릴리스 얘기해도 돼요?','“응. 내가 먼저 괜찮다고 했을 때는. 아직은 질문 하나가 다른 질문 열 개를 데리고 오거든.”',1,'가족이면 그냥 말해야 하는 거 아닌가요?','찰리의 미소가 사라진다. “가족이라서 더 조심해야 하는 이야기도 있어.”',-3,['family','lilith']],
['새 입주자의 첫날','찰리가 빈 방 문에 작은 환영 리본을 묶는다.','이런 것까지 준비해요?','“첫날엔 아주 작은 것도 ‘나를 기다린 사람이 있었구나’처럼 느껴질 수 있으니까.”',1,'금방 망가질 텐데요.','“그래도 첫날엔 있었잖아. 그걸로 충분해.”',0,['hotel','welcome']],
['포기하고 싶은 순간','찰리가 잠깐 펜을 내려놓고 깊게 숨을 쉰다.','그럴 때도 있어요?','“당연하지. 희망적인 사람이 절망을 못 느끼는 건 아니잖아.”',1,'그래도 티 내면 안 되죠.','“그렇게 생각했던 적 있어. 근데 그러다 제일 가까운 사람들까지 밖에 세워두게 되더라.”',-2,['hope','vulnerability']],
['호텔 규칙 0번','찰리가 새 규칙표 맨 위에 빈 줄을 남겨둔다.','0번은 왜 비었어요?','“누군가 정말 필요한 걸 말하면 규칙보다 먼저 듣기. 아직 문장으로 정리 중이야.”',1,'규칙은 예외가 없어야 하지 않아요?','“사람을 위한 규칙이면 사람 때문에 바뀔 수도 있어야지.”',0,['hotel','rules']],
['오늘의 작은 성공','찰리가 체크리스트 맨 아래에 ‘한 사람 웃음’이라고 적고 체크한다.','그것도 성공이에요?','“당연하지. 큰 기적만 세면 우리는 너무 자주 실패한 사람이 되잖아.”',1,'조금 기준이 낮은 거 아닌가요?','“낮춘 게 아니라 가까이 본 거야.”',0,['hope','daily']]
];

const QUESTIONS=[
['호텔에서 제일 좋아하는 공간은?','“로비. 누가 들어오고, 누가 내려오고, 누가 그냥 지나가는지 다 보이잖아. 호텔이 살아 있다는 느낌이 제일 커.”',['hotel']],
['구원을 믿는 이유는?','“사람이 한 번의 최악으로만 정의되면 너무 많은 사람이 영원히 거기 갇히잖아. 난 다른 가능성도 있다고 믿고 싶어.”',['redemption']],
['Vaggie에게 가장 고마운 건?','“내 꿈을 무조건 예쁘게만 보지 않는 거. 현실적인 문제를 말해주면서도 결국 내 옆에 남아주는 거.”',['vaggie']],
['Lucifer와 요즘은 어때요?','“완벽하진 않아. 그래도 예전처럼 서로 모르는 척 지나가진 않아. 그게 나한텐 엄청 큰 변화야.”',['lucifer','family']],
['노래는 언제 만들어요?','“말이 너무 많아서 한 문장으로 못 잡을 때. 멜로디를 붙이면 내가 진짜 하고 싶은 말이 어디 있는지 좀 보이더라.”',['music']],
['가족사진을 왜 그렇게 많이 모아요?','“좋은 순간은 지나갈 때 너무 빨라서. 사진을 보면 ‘그때 진짜 있었지’ 하고 다시 붙잡을 수 있잖아.”',['family','memory']],
['천국에 가장 바라는 건?','“당장 나를 믿으라는 게 아니라, 증거가 생겼을 때 외면하지 않는 것. 그 정도부터 시작해도 돼.”',['heaven']],
['실패한 사람한테도 계속 기회를 줘요?','“기회랑 면죄부는 달라. 잘못은 책임져야 하지만, 책임진 뒤에도 앞으로 갈 길은 있어야 한다고 생각해.”',['redemption']],
['호텔이 집 같다고 느낀 순간은?','“사람들이 허락 없이 냉장고를 열기 시작했을 때? ...농담 같지만 진짜야. 편해졌다는 뜻이잖아.”',['hotel','joke']],
['가장 어려운 설득 상대는?','“이미 결론을 정하고 나를 듣는 사람. 그래도 그럴수록 더 크게 말하기보다 다른 문을 찾아보려고 해.”',['communication']],
['공주라는 게 부담스러워요?','“가끔. 내가 한 말이 그냥 내 의견이 아니라 ‘공주의 말’이 되는 순간이 있거든.”',['family','pressure']],
['사람들 앞에서 울어도 괜찮아요?','“예전엔 아니라고 생각했어. 지금은... 울면서도 할 말은 할 수 있다고 생각해.”',['vulnerability']],
['엄마를 생각하면 제일 먼저 뭐가 떠올라요?','찰리가 잠깐 숨을 고른다. “목소리. 그리고 설명하기 어려운 빈자리. 둘 다 같이 떠올라.”',['lilith','family']],
['아빠를 닮았다고 느끼는 순간은?','“뭔가를 너무 크게 만들고 싶어질 때. 발표도, 선물도, 감정도. 그럴 때 ‘아, 이건 확실히 아빠 쪽이구나’ 해.”',['lucifer','family']],
['호텔 식구 중 제일 걱정되는 사람은?','“하나만 고르라고 하면 너무 어렵지! 다들 각자 다른 방식으로 걱정돼.”',['hotel']],
['쉬는 날엔 뭘 해요?','“계획표에 ‘쉬기’를 쓰고, 그걸 너무 열심히 계획하다가 Vaggie한테 계획표를 뺏겨.”',['vaggie','daily']],
['격려할 때 제일 조심하는 건?','“내가 듣고 싶은 말을 상대에게 강요하지 않는 것. ‘괜찮아’보다 ‘여기 있어’가 필요한 날도 있으니까.”',['encouragement']],
['지금 가장 듣고 싶은 말은?','찰리가 잠깐 생각하다 웃는다. “오늘 할 만큼 했어. 내일 다시 해도 돼.”',['secret','daily']]
];

const ACTIONS=[
['환영 카드 한 장을 같이 쓴다','당신은 빈 환영 카드에 새 입주자를 위한 짧은 문장을 적는다.','찰리가 옆에서 읽고 환하게 웃는다. “좋아! 이건 진짜 사람이 기다리고 있었다는 느낌이 나.”'],
['구원 체크리스트에 별을 붙인다','당신은 완료된 항목 옆에 작은 별 스티커를 붙인다.','“오, 좋다! 체크 표시보다 훨씬 덜 무섭고 훨씬 귀여워.”'],
['노래 연습 박자를 맞춰준다','당신은 찰리가 부르는 박자에 맞춰 가볍게 손가락을 두드린다.','찰리가 곧 리듬을 따라 웃는다. “좋아, 이제 혼자 연습하는 느낌이 아니야.”'],
['단체사진 자리를 정리한다','당신은 책상 위 여러 장의 사진을 날짜순으로 정리한다.','“와, 나 이거 계속 미루고 있었는데! 잠깐, 이건 날짜보다 ‘대형 사고 전/후’로 나누는 게 빠를지도.”'],
['격려 메모를 접어준다','당신은 찰리가 쓴 메모를 작은 카드 크기로 접는다.','찰리가 조심히 받아 든다. “받는 사람이 주머니에 넣고 다닐 수 있겠다. 좋은 생각이야.”'],
['호텔 간판 먼지를 닦는다','당신은 로비 간판의 먼지를 손수건으로 닦는다.','찰리가 고개를 들어 간판을 본다. “고마워. 별거 아닌데 갑자기 새것처럼 보여.”'],
['프레젠테이션 청중이 되어준다','당신은 소파에 앉아 진지하게 발표를 들어준다.','찰리가 자세를 바로잡는다. “좋아. 이번엔 중간에 의심스러운 표정도 해줘. 실전처럼!”'],
['물컵을 밀어준다','당신은 말없이 찰리 쪽으로 물컵을 밀어준다.','찰리가 멈칫한다. “...Vaggie한테 배웠지? 효과 좋네.”'],
['가족사진 액자를 세운다','넘어져 있던 작은 가족사진 액자를 조심히 세운다.','찰리는 잠깐 사진을 바라보다 부드럽게 웃는다. “응. 거기가 더 좋다.”'],
['일정표에서 한 칸을 비워둔다','당신은 빽빽한 일정표 한가운데 빈 시간을 표시한다.','찰리가 항의하려다 멈춘다. “좋아. 딱 한 시간. ...두 시간은 너무 과해.”'],
['호텔 손님용 담요를 접는다','당신은 로비 소파의 담요를 가지런히 접는다.','“고마워! 누가 밤에 내려왔을 때 바로 쓸 수 있겠다.”'],
['노래 가사 한 줄을 가려준다','찰리가 부끄러워하던 미완성 가사 부분을 종이로 살짝 가려준다.','찰리가 웃음을 터뜨린다. “좋아, 그 부분은 아직 비공개. 아주 현명한 판단이야.”'],
['브로슈어 더미를 나눠 든다','당신은 찰리 팔에 쌓인 브로슈어 절반을 받아 든다.','“아, 살았다! 내가 ‘한 번에 가능해’라고 말하면 다음부터 믿지 마.”'],
['조용히 옆에 있어준다','당신은 계획도 질문도 꺼내지 않고 잠시 찰리 옆에 앉아 있는다.','찰리의 어깨가 천천히 내려간다. “...이런 시간도 일정표에 넣어야 하나 봐.”']
];

const ENTRIES=[
'찰리가 여러 색 펜을 한꺼번에 들고 고개를 든다. “왔어? 좋아! 지금 딱 사람 손이 하나 더 필요했— 아니, 쉬러 온 거면 그냥 쉬어!”',
'“어서 와! 오늘은 아직 큰 사고가 없어. ...내가 말하자마자 생기진 않겠지?”',
'찰리가 로비 쪽에서 급히 돌아온다. “아, 왔구나! 차 마실래? 물? 격려 카드? 선택지는 많아!”',
'“문 열려 있었지? 일부러야! 호텔은 환영하는 곳이니까. ...보안 문제는 Vaggie랑 따로 얘기할게.”',
'찰리가 노트를 덮으며 웃는다. “좋아, 업무 잠깐 중단. 네 얘기부터 들을래.”',
'“타이밍 좋다! 지금 막 ‘오늘도 할 수 있다’고 스스로 설득하던 중이었어.”',
'찰리가 손을 흔든다. “와줘서 고마워. 진짜 별일 없어도 와도 돼.”',
'“들어와! 방 상태는... 창의적인 업무 과정이라고 해두자.”'
];
const EXITS=[
'찰리가 문 쪽까지 따라와 손을 흔든다. “잘 가! 그리고 오늘 잘한 거 하나는 꼭 기억하고 가.”',
'“벌써 가? 응, 괜찮아. 다음에 또 오면 되지! 조심해서 가.”',
'찰리가 작은 메모를 건넨다. “이건 그냥... 오늘 남은 시간 버티라고. 나중에 봐!”',
'“가서 꼭 쉬어! 이 말은 나도 들을 필요가 있으니까 같이 지키자.”',
'찰리가 웃으며 문을 열어준다. “오늘 얘기해줘서 고마워. 다음엔 내가 더 많이 들을게.”',
'“또 와. 정말로. 초대장 없어도 돼.”',
'찰리가 두 손을 흔든다. “잘 가! 호텔 어디선가 소리 나도 80퍼센트는 정상적인 소리일 거야!”',
'“오늘은 여기까지. 내일 다시 하면 돼. 너도, 나도.”'
];

const THOUGHTS=[
['charlie-thought-mega-01','새로 오는 사람 이름을 미리 카드에 적어두면 조금 덜 무서울까?','daily','normal','common',0],
['charlie-thought-mega-02','Vaggie가 지운 일정 하나... 다시 넣지 말자. 오늘은 진짜로.','relationship','normal','common',0],
['charlie-thought-mega-03','아빠한테 별일 없어도 먼저 메시지 보내도 되지. 가족이니까.','family','normal','normal',15],
['charlie-thought-mega-04','“괜찮아질 거야”보다 “여기 있어”가 더 필요한 날도 있겠지.','relationship','sad','normal',10],
['charlie-thought-mega-05','호텔 간판은 볼 때마다 조금 다르게 느껴져. 집 같다가, 약속 같다가.','daily','good','common',0],
['charlie-thought-mega-06','오늘 체크리스트 세 칸. 세 칸이면 충분해. ...네 칸은 욕심인가?','daily','tired','common',0],
['charlie-thought-mega-07','누가 웃었다. 큰 기적은 아니어도 오늘 성공 하나.','daily','good','common',0],
['charlie-thought-mega-08','노래로 먼저 말하지 말고... 한 문장부터. 할 수 있어.','other','normal','common',0],
['charlie-thought-mega-09','Vaggie는 내가 “잠깐만” 할 걸 알아서 물컵만 두고 간다. 너무 잘 알아.','relationship','good','common',5],
['charlie-thought-mega-10','아빠랑 닮은 점이 있다는 게 요즘은 조금 덜 무섭다.','family','normal','normal',25],
['charlie-thought-mega-11','엄마 얘기는 질문 하나가 질문 열 개를 데리고 온다. 오늘은 하나만.','family','sad','rare',35],
['charlie-thought-mega-12','천국이 바로 믿어주지 않아도 돼. 증거를 봤을 때 눈을 돌리지만 않으면 돼.','heaven','normal','normal',20],
['charlie-thought-mega-13','사람이 최악의 하루 하나로 영원히 결정되면 너무 슬프잖아.','other','sad','normal',0],
['charlie-thought-mega-14','새 입주자 방에 리본 하나. 사소해도 누군가 기다렸다는 표시는 되니까.','daily','excited','common',0],
['charlie-thought-mega-15','사진 뒷면에 날짜만 쓰지 말고 그날 좋았던 것도 하나 적자.','family','good','common',10],
['charlie-thought-mega-16','실패한 상담 기록을 버리지 말자. 다음 사람한테 같은 실수 안 하게.','past','normal','normal',15],
['charlie-thought-mega-17','공주니까 잘해야 한다는 말... 제일 자주 하는 사람이 나네.','secret','tired','rare',40],
['charlie-thought-mega-18','쉬는 걸 계획하려다 쉬는 계획표를 만들고 있네. Vaggie가 보면 뺏겠다.','joke','normal','common',0],
['charlie-thought-mega-19','아빠한테 자랑하고 싶은 일이 생겼다. 예전 같으면 그냥 혼자 간직했을 텐데.','family','good','normal',30],
['charlie-thought-mega-20','모두를 구하고 싶다는 말이 모두를 내 방식대로 바꾸겠다는 뜻이 되면 안 돼.','secret','normal','rare',55],
['charlie-thought-mega-21','오늘은 발표할 때 질문 받는 연습. 반박을 들어도 목소리부터 키우지 않기.','heaven','normal','normal',10],
['charlie-thought-mega-22','호텔 식구가 된다는 건 허락 없이 냉장고 여는 순간부터일지도 몰라.','joke','good','common',0],
['charlie-thought-mega-23','누군가 포기하고 싶다고 말하면 바로 설득하지 말고 먼저 왜 그런지 듣기.','relationship','normal','normal',20],
['charlie-thought-mega-24','노래 두 번째 버전이 더 좋아. 내가 말하고 싶은 것보다 상대가 들을 수 있는 말.','other','good','normal',15],
['charlie-thought-mega-25','가족사진에서 빈자리를 보는 날도 있고, 같이 있는 사람부터 보는 날도 있다.','family','sad','rare',50],
['charlie-thought-mega-26','한 사람 웃게 하기. 오늘 목표치로는 충분해.','daily','good','common',0],
['charlie-thought-mega-27','희망적인 사람도 절망할 수 있어. 숨긴다고 희망이 더 진짜가 되는 건 아니야.','secret','sad','rare',60],
['charlie-thought-mega-28','아빠한테 “도와줘”라고 말하는 게 예전보다 쉬워졌다. 조금씩.','family','normal','normal',45],
['charlie-thought-mega-29','Vaggie한테 내가 기대는 만큼, 나도 그 사람이 기대도 되는 사람이면 좋겠다.','relationship','good','rare',50],
['charlie-thought-mega-30','언젠가 호텔에 “구원 성공 사례”가 너무 많아서 벽이 모자라는 날이 오면 좋겠다.','other','excited','rare',70]
].map(([id,text,category,mood,frequency,requiredAffection])=>({id,characterId:CID,text,categories:[category],category,requiredMoods:[mood],requiredMood:mood.toUpperCase(),requiredAffection,requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',frequency,contentPack:PACK}));

const ITEMS=[
['welcome-name-card','🏨 손글씨 웰컴 네임카드','🏨','COMMON',5,'새 입주자 이름을 직접 적어 문 앞에 붙이는 작은 카드.','“이름이 적혀 있으면 진짜 기다리고 있었다는 느낌이 들잖아. 네 것도 하나 만들어줄까?”',['hotel','welcome','handwritten']],
['hope-star-sheet','⭐ 작은 희망 별 스티커 시트','⭐','COMMON',5,'완벽히 해내지 못한 날에도 체크 대신 붙일 수 있게 만든 별 스티커.','“체크 못 했다고 실패는 아니니까! 이런 날은 별 하나 붙이고 내일 다시 하는 거야.”',['redemption','sticker','hope']],
['rehearsal-pencil','🎵 물어뜯은 노래 연습 연필','🎵','COMMON',10,'가사를 고치다가 끝부분을 자꾸 깨문 흔적이 남은 연필.','“아, 그 연필! 가사 안 나올 때마다 이랬나 봐. ...생각보다 심하네.”',['music','handwritten']],
['encouragement-envelope','💌 빈 격려 편지 봉투','💌','COMMON',10,'아직 수신인을 적지 않은 작은 봉투. 안에는 짧은 응원 문장이 들어 있다.','“누가 필요할지 몰라서 이름은 비워뒀어. 네가 필요하면 지금 써도 돼.”',['encouragement','letter']],
['checkin-clipboard','📋 호텔 체크인 클립보드','📋','UNCOMMON',20,'입주자 이름 옆에 음식·알레르기·편한 호칭까지 적어두는 체크인 판.','“방 번호만 적으면 너무 사무적이잖아. 사람을 알아야 환영도 제대로 하지!”',['hotel','welcome','work']],
['redemption-tab-set','🌈 구원 프로젝트 색인 탭','🌈','UNCOMMON',25,'실패·재시도·작은 성공을 색으로 나눠 표시하는 인덱스 탭 묶음.','“빨간색이 실패가 아니야! 빨간색은 ‘다른 방법 찾아보기’야.”',['redemption','paper','work']],
['photo-sleeve','📸 호텔 가족사진 투명 슬리브','📸','UNCOMMON',30,'단체사진 모서리가 닳지 않게 찰리가 직접 고른 보관 슬리브.','“사진은 자주 꺼내보려고 보관하는 거니까. 너무 꽁꽁 숨기면 의미 없잖아.”',['family','photo','hotel']],
['rest-card','☕ ‘오늘은 여기까지’ 휴식 카드','☕','UNCOMMON',30,'Vaggie의 조언을 받아 만든 강제 휴식용 작은 카드.','“이 카드가 나오면 진짜 멈추는 거야. ...나도 포함. 특히 나.”',['vaggie','rest','handwritten']],
['success-log','🌟 작은 성공 기록장','🌟','RARE',40,'거창한 기적이 아니라 하루의 작은 변화만 따로 기록하는 수첩.','“오늘 누가 먼저 사과했다, 누가 웃었다, 누가 다시 내려왔다. 이런 것도 전부 성공이야.”',['redemption','hope','journal']],
['heaven-cue-card','😇 Heaven 발표용 손글씨 큐카드','😇','RARE',45,'천국에서 구원 가능성을 설명하기 위해 수없이 고친 발표용 카드 묶음.','“이건 버전이... 열일곱 번째쯤? 세기 시작하면 더 긴장돼서 중간에 포기했어.”',['heaven','presentation','redemption']],
['anniversary-ribbon','🎀 호텔 첫 기념일 리본','🎀','RARE',45,'호텔 식구들이 함께 보낸 날을 기념해 남겨둔 리본 한 조각.','“장식은 치웠는데 이건 못 버리겠더라. 좋은 날은 조금 남겨놔도 되지?”',['hotel','memory','family']],
['duet-marker','🎤 듀엣 연습용 금빛 페이지 마커','🎤','RARE',50,'노래 파트를 나눌 때 상대가 들어올 지점을 표시한 얇은 금빛 마커.','“혼자 부르는 노래보다 누가 들어오는 타이밍 맞추는 게 훨씬 어렵고... 훨씬 좋아.”',['music','relationship']],
['revised-binder','🌈 수정 흔적 가득한 구원 바인더','🌈','EPIC',60,'실패한 계획을 버리지 않고 수십 번 덧붙여 다시 만든 두꺼운 바인더.','“깔끔하진 않지만 이게 더 솔직해. 우리가 몇 번 다시 시작했는지도 다 남아 있거든.”',['redemption','work','memory']],
['contact-sheet','📸 호텔 단체사진 컨택트 시트','📸','EPIC',65,'잘 나온 한 장보다 웃기고 흔들린 사진까지 모두 남아 있는 원본 인화 시트.','“완벽한 사진보다 이게 더 좋아. 다들 진짜 우리 같잖아.”',['photo','family','hotel']],
['unfinished-reprise','🎼 끝맺지 않은 리프라이즈 악보','🎼','EPIC',65,'같은 멜로디를 더 조용한 가사로 다시 쓴 미완성 악보.','“처음 노래랑 같은 멜로디인데... 지금은 하고 싶은 말이 조금 달라졌어.”',['music','personal','memory']],
['first-room-key','🗝️ 첫 입주자 방 예비 열쇠','🗝️','LEGENDARY',75,'호텔이 아직 불안정하던 시절 만들어 둔 오래된 예비 열쇠.','“이거 하나 때문에 얼마나 뛰어다녔는지 몰라. 그래도 그 방에 누군가 들어왔다는 게 너무 기뻤어.”',['hotel','memory','welcome']],
['family-photo-envelope','📸 가족사진 원본 봉투','📸','LEGENDARY',80,'공개용 복사본이 아니라 원본 사진 몇 장이 들어 있는 오래된 봉투.','“이건 진짜 조심히 봐줘. 좋은 기억도, 아직 정리 안 된 기억도 같이 들어 있어.”',['family','photo','personal']],
['private-hope-letter','💌 보내지 않은 희망 편지','💌','LEGENDARY',85,'누군가 포기하려 했던 밤에 썼지만 결국 건네지 못한 긴 편지.','“그날은 말보다 옆에 있는 게 맞았어. 그래도 이 편지는... 내가 얼마나 걱정했는지 남아 있네.”',['encouragement','letter','personal']],
['hotel-heart-archive','🏨 호텔 식구 이름 아카이브','🏨','MISTIC',90,'떠났다가 돌아온 사람까지 포함해 호텔에 머문 이름을 지우지 않고 모아둔 비공개 기록.','“방을 비웠다고 그 사람이 여기 있었던 일까지 없어지는 건 아니잖아. 그래서 이름은 안 지워.”',['hotel','family','memory','secret']],
['one-more-chance-card','🌈 ‘한 번 더’ 마지막 카드','🌈','MISTIC',95,'수없이 수정한 구원 프로젝트 문서 사이에 찰리가 혼자 간직하던 한 장짜리 카드.','“거창한 계획은 없고 한 문장뿐이야. ‘한 번 더 해보자.’ 내가 제일 필요할 때 보는 카드야.”',['redemption','hope','personal','secret']]
];

const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};s.thoughts=Array.isArray(s.thoughts)?s.thoughts:[];s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);s.items=s.collectionItems;s.collectionTransferConfig=s.collectionTransferConfig&&typeof s.collectionTransferConfig==='object'?s.collectionTransferConfig:{};s.collectionProfiles=s.collectionProfiles&&typeof s.collectionProfiles==='object'?s.collectionProfiles:{};
function putScene(scene,role){const i=s.dialogues.findIndex(x=>x?.id===scene.id);if(i>=0){scene.used=s.dialogues[i]?.used||false;s.dialogues[i]=scene}else s.dialogues.push(scene);s.dialogueFileMap[scene.id]=role}
CONVERSATIONS.forEach((r,i)=>putScene(conv(i,r),'CONVERSATION'));QUESTIONS.forEach((r,i)=>putScene(ask(i,r),'QUESTION'));ACTIONS.forEach((r,i)=>putScene(action(i,r),'ACTION'));ENTRIES.forEach((t,i)=>putScene(simple(i,t,'ENTRY','ENTRY'),'ENTRY'));EXITS.forEach((t,i)=>putScene(simple(i,t,'EXIT','EXIT'),'EXIT'));
for(const t of THOUGHTS){const i=s.thoughts.findIndex(x=>x?.id===t.id);if(i>=0)s.thoughts[i]={...s.thoughts[i],...t};else s.thoughts.push(t)}
s.collectionProfiles[CID]={...(s.collectionProfiles[CID]||{}),title:'CHARLIE COLLECTION',memo:'호텔 환영 · 구원 프로젝트 · 노래 · 가족 사진 · 격려 메시지로 이어지는 찰리의 기록들.'};
for(const row of ITEMS){const [slug,name,symbol,rarity,claimMinHeart,desc,revealLine,tags]=row,id=`charlie-morningstar-mega-${slug}`,baseItem={id,characterId:CID,name,symbol,rarity,condition:`가챠 또는 ${claimMinHeart} Heart 이상에서 캐릭터에게 직접 받기`,desc,revealLine,gachaEnabled:true};const at=s.collectionItems.findIndex(x=>String(x?.id)===id);if(at<0)s.collectionItems.push(baseItem);else s.collectionItems[at]={...s.collectionItems[at],...baseItem,gachaEnabled:true};const old=s.collectionTransferConfig[id]||{};s.collectionTransferConfig[id]={claimable:true,claimMinHeart,transferable:true,defaultPreference:'LIKED',tags,claimLine:revealLine,revealLine,...old,claimable:old.claimable??true,transferable:old.transferable??true}}
s.items=s.collectionItems;save(s);try{localStorage.setItem(VK,'1')}catch{}
})();