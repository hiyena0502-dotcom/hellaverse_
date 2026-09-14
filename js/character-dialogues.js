(()=>{
const STATE_KEY='hellaverse_dialogue_state_v1';
const SEED_KEY='hellaverse_character_dialogues_seed_version';
const SEED_VERSION=1;

function base(id,cid,title,kind,min=0,max=100,repeatable=false){return{
  id,characterId:cid,title,kind,repeatable,
  requiredAffection:min,maxAffection:max,requiredStage:'',requiredMood:'ANY',
  requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',
  priority:0,probability:100,exitLine:'',after:'',used:false
}}
function ch(id,text,response,nextNodeId='',nextTopics=[]){return{
  id,type:'speech',text,playerLine:text,response,affectionDelta:0,
  requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',
  lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',
  moodChange:'',unlockItemId:'',nextNodeId,endConversation:!nextNodeId,nextTopics
}}
function longScene({id,cid,title,min=0,max=100,type='PERSONAL',topics=[],follow=topics,opening,nodes}){
  return {...base(id,cid,title,'TALK',min,max,false),opening,openingType:'character',sceneRole:'CONVERSATION',conversationType:type,topics,followUpTopics:follow,nodes,openingNodeId:'start'};
}
function entry(id,cid,text,min=0,max=100,topics=['entry']){
  return {...base(id,cid,'Relationship Entry','ENTRY',min,max,true),opening:text,openingType:'character',sceneRole:'ENTRY',conversationType:'AMBIENT',topics,followUpTopics:topics,nodes:[{id:'start',speaker:'character',text:'',choices:[]}],openingNodeId:'start'};
}
function ask(id,cid,title,answer,min=0,topics=['ask']){
  return {...base(id,cid,title,'ASK',min,100,false),opening:`당신은 「${title}」에 대해 묻는다.`,openingType:'narration',sceneRole:'ASK',conversationType:min>=60?'PERSONAL':'CASUAL',topics,followUpTopics:topics,nodes:[{id:'start',speaker:'character',text:answer,choices:[]}],openingNodeId:'start'};
}

const scenes=[
  // Lucifer — relationship-aware entries
  entry('lc-v1-lucifer-entry-20a','lucifer-morningstar','또 왔네. 이제 문 앞에서 망설이지는 않는군.',20,49,['entry','familiar']),
  entry('lc-v1-lucifer-entry-20b','lucifer-morningstar','들어와. ...마침 조금 심심하던 참이었어.',20,49,['entry','familiar']),
  entry('lc-v1-lucifer-entry-50a','lucifer-morningstar','왔군. 앉아. 굳이 손님처럼 굴 필요는 없잖아.',50,74,['entry','trust']),
  entry('lc-v1-lucifer-entry-50b','lucifer-morningstar','오늘은 늦었네. ...아니, 기다렸다는 뜻은 아니고.',50,74,['entry','trust']),
  entry('lc-v1-lucifer-entry-75a','lucifer-morningstar','네 발소리는 이제 알아듣겠어. 들어와.',75,100,['entry','close']),
  entry('lc-v1-lucifer-entry-75b','lucifer-morningstar','왔네. 잘됐어. 오늘은 혼자 생각하기가 조금 지겨웠거든.',75,100,['entry','close']),

  // Lucifer — deeper questions
  ask('lc-v1-lucifer-ask-ducks','lucifer-morningstar','왜 고무 오리를 그렇게 좋아하세요?','좋아한다기보다... 만들다 보면 머리가 조용해져. 완성된 건 말썽도 안 부리고, 실망시키지도 않고. 게다가 귀엽잖아. 마지막 이유가 제일 중요해.',20,['duck','daily']),
  ask('lc-v1-lucifer-ask-father','lucifer-morningstar','좋은 아버지라고 생각하세요?','...그 질문에 자신 있게 그렇다고 답할 수 있었다면 좋았겠지. 지금은 적어도, 예전보다 더 나은 아버지가 되려고 한다고 말할 수는 있어.',50,['family','charlie','fatherhood']),
  ask('lc-v1-lucifer-ask-heaven','lucifer-morningstar','천국 이야기를 왜 피하세요?','모든 기억이 설명하기 좋은 모양으로 남는 건 아니야. 어떤 곳은 떠난 뒤에도 너무 선명해서, 이름만 들어도 그때의 내가 같이 떠오르거든.',75,['heaven','past','trust']),

  // Lucifer — long conversations
  longScene({
    id:'lc-v1-lucifer-long-ducks',cid:'lucifer-morningstar',title:'작업대 위의 오리',min:0,max:29,type:'CASUAL',
    topics:['duck','daily','hobby'],follow:['duck','daily','hotel'],
    opening:'그는 작업대 위에 반쯤 완성된 고무 오리를 내려놓고 당신을 흘끗 본다. "웃지 마. 아직 완성 전이야."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-duck-c1','안 웃었는데요.','표정이 웃고 있었어. 아주 미세하게. 난 그런 거 잘 보거든.','n2',['duck','hobby']),
        ch('lc-luc-duck-c2','이번 건 누구예요?','누구라니. 그냥 오리지널 디자인이지. ...찰리 같다고 하면 압수한다.','n2',['duck','charlie'])
      ]},
      {id:'n2',speaker:'character',text:'사실 작은 걸 만드는 건 편해. 망쳐도 세상이 무너지진 않으니까.',choices:[
        ch('lc-luc-duck-c3','큰일은 늘 책임이 따라오니까요?','...그래. 왕이라는 말은 근사하지만, 실패했을 때도 근사하게 책임져야 한다는 뜻이거든.','n3',['duty','past']),
        ch('lc-luc-duck-c4','그럼 오리는 실패해도 괜찮고요?','완벽해. 실패하면 녹여서 다시 만들면 되니까. 사람 관계도 그랬으면 참 편했겠지.','n3',['relationship','family'])
      ]},
      {id:'n3',speaker:'character',text:'그는 잠시 오리를 굴려 보다가 당신 쪽으로 밀어둔다. "그래도 이건 제법 잘 나왔네."',choices:[
        ch('lc-luc-duck-c5','저한테 주는 거예요?','아니! 평가만 해. ...마음에 들면 비슷한 건 하나 만들어줄 수도 있고. 아주 나중에.'),
        ch('lc-luc-duck-c6','귀엽네요.','당연하지. 만든 사람이 누군데. ...좋아, 그 반응은 합격.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-lucifer-long-hotel',cid:'lucifer-morningstar',title:'호텔의 소음',min:15,max:44,type:'CASUAL',
    topics:['hotel','charlie','daily'],follow:['charlie','family','hotel'],
    opening:'"이 호텔은 정말 잠잠한 날이 없군." 불평하는 말투와 달리 그는 복도 쪽 소리에 잠깐 귀를 기울인다.',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-hotel-c1','그래도 싫어하진 않는 것 같아요.','...그렇게 보여? 난 꽤 설득력 있게 투덜거리고 있다고 생각했는데.','n2',['hotel']),
        ch('lc-luc-hotel-c2','조용한 궁전보다 낫죠?','비교가 너무 극단적이잖아. 하지만... 적어도 여기선 무슨 일이 벌어지는지는 알 수 있지.','n2',['hotel','past'])
      ]},
      {id:'n2',speaker:'character',text:'찰리는 이런 혼란 속에서도 늘 다음 계획을 세워. 넘어져도 계획표부터 다시 쓰는 애였지.',choices:[
        ch('lc-luc-hotel-c3','자랑스러워 보여요.','자랑스럽지. 걱정도 그만큼 많고. 두 감정은 아주 성가시게 같이 다녀.','n3',['charlie','family']),
        ch('lc-luc-hotel-c4','아버지라서 잘 아네요.','...예전에는 안다고 착각했던 것 같아. 요즘은 모르는 걸 인정하는 게 먼저더군.','n3',['fatherhood','family'])
      ]},
      {id:'n3',speaker:'character',text:'"그래도 저 소리가 멈추면... 조금 이상할 것 같긴 해." 그는 아주 작게 덧붙인다.',choices:[
        ch('lc-luc-hotel-c5','이미 익숙해진 거네요.','그 단어는 인정하기 싫지만. 그래, 아마도.'),
        ch('lc-luc-hotel-c6','여기가 집처럼 느껴져요?','...아직 그 말은 조금 이르다. 하지만 예전만큼 낯설진 않아.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-lucifer-long-charlie',cid:'lucifer-morningstar',title:'찰리의 방식',min:30,max:59,type:'PERSONAL',
    topics:['charlie','family','hotel'],follow:['fatherhood','family','past'],
    opening:'"찰리는 사람을 믿는 데 겁이 없어." 그는 웃는 듯하다가 금세 표정을 가라앉힌다. "그게 그 애의 가장 대단한 점이자... 내가 제일 겁내는 점이지."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-charlie-c1','상처받을까 봐요?','당연하지. 세상은 믿는 사람에게 항상 친절한 보답을 하진 않으니까.','n2',['charlie','worry']),
        ch('lc-luc-charlie-c2','그래도 그 믿음 덕분에 여기까지 왔잖아요.','그래. 그래서 더 복잡해. 막고 싶다가도, 내가 막아선 안 된다는 걸 알아.','n2',['charlie','hotel'])
      ]},
      {id:'n2',speaker:'character',text:'예전엔 보호한다는 게 위험에서 멀리 두는 거라고 생각했어. 지금은... 그 애가 선택한 위험 옆에 서주는 것도 보호일지 모른다고 생각해.',choices:[
        ch('lc-luc-charlie-c3','찰리도 그걸 원할 거예요.','그랬으면 좋겠네. 가끔은 내가 너무 늦게 배운 것 같아서.','n3',['fatherhood','regret']),
        ch('lc-luc-charlie-c4','늦어도 하는 게 중요하죠.','...찰리도 비슷한 말을 하겠군. 너희 둘이 합심하면 정말 피곤하겠어.','n3',['charlie','trust'])
      ]},
      {id:'n3',speaker:'character',text:'그는 잠시 웃다가 시선을 피한다. "그래도 다시 기회가 있다는 건... 나쁘지 않아."',choices:[
        ch('lc-luc-charlie-c5','이번엔 놓치지 마세요.','그럴 생각이야. 적어도 도망치진 않을 거야.'),
        ch('lc-luc-charlie-c6','찰리도 당신을 포기하지 않았으니까요.','...알아. 그래서 더 고맙고, 더 미안하지.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-lucifer-long-fatherhood',cid:'lucifer-morningstar',title:'좋은 아버지의 조건',min:45,max:74,type:'PERSONAL',
    topics:['fatherhood','charlie','family','regret'],follow:['charlie','family','trust'],
    opening:'"좋은 아버지라는 건 대체 뭘까." 농담처럼 시작한 말이지만 그는 웃지 않는다.',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-father-c1','정답이 있는 건 아니겠죠.','그게 문제야. 왕 노릇은 규칙이라도 있었는데, 이건 설명서가 없더군.','n2',['fatherhood']),
        ch('lc-luc-father-c2','찰리에게 직접 물어보면요?','...그게 가장 무서운 방법이라는 거 알아? 답을 들어버리잖아.','n2',['charlie','fear'])
      ]},
      {id:'n2',speaker:'character',text:'나는 한동안 내가 멀리 있는 게 그 애에게 낫다고 믿었어. 아니, 믿고 싶었던 걸지도 모르지.',choices:[
        ch('lc-luc-father-c3','그건 후회해요?','매우. 후회한다고 시간이 돌아오지 않는다는 것도 잘 알고 있고.','n3',['regret','past']),
        ch('lc-luc-father-c4','그때는 당신도 힘들었을 테니까요.','그게 변명은 안 돼. 하지만... 그렇게 말해주는 건 고맙네.','n3',['trust','past'])
      ]},
      {id:'n3',speaker:'character',text:'"요즘은 완벽하게 하려는 대신, 그냥 거기 있으려고 해. 필요할 때."',choices:[
        ch('lc-luc-father-c5','그걸로 충분할 때도 있어요.','...그러면 좋겠군.'),
        ch('lc-luc-father-c6','계속 배우면 되죠.','왕에게 이런 말을 하는 사람도 드문데. 아버지에게는 더 필요했을지도 모르겠어.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-lucifer-long-heaven',cid:'lucifer-morningstar',title:'천국이라는 단어',min:60,max:89,type:'STORY',
    topics:['heaven','past','fall','trust'],follow:['past','trust','family'],
    opening:'천국이라는 말이 나오자 그의 손이 잠깐 멈춘다. "그곳 이야기를 기대한 거라면, 아주 재미없는 대화가 될 거야."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-heaven-c1','말하기 싫으면 안 해도 돼요.','...그렇게 쉽게 물러나면 오히려 내가 이상하게 말하고 싶어지잖아.','n2',['trust','heaven']),
        ch('lc-luc-heaven-c2','왜 그렇게 불편한지만 궁금해요.','불편하다는 말로는 조금 부족해. 그곳은 내가 누구였는지 너무 잘 기억하게 하거든.','n2',['heaven','past'])
      ]},
      {id:'n2',speaker:'character',text:'오래된 기억은 흐려진다고들 하지만, 어떤 기억은 반대야. 시간이 지날수록 더 선명해져. 다시는 돌아갈 수 없다는 걸 계속 확인하니까.',choices:[
        ch('lc-luc-heaven-c3','돌아가고 싶어요?','...그 질문엔 간단한 답이 없어. 장소가 그리운 건지, 그때의 내가 그리운 건지도 모르겠고.','n3',['past','identity']),
        ch('lc-luc-heaven-c4','그때의 자신을 미워해요?','아니. 오히려 너무 잘 알아서 괴로운 쪽에 가깝지. 정말 많은 걸 믿었거든.','n3',['past','regret'])
      ]},
      {id:'n3',speaker:'character',text:'그는 한숨을 내쉰다. "그래서 천국 이야기는 천천히 하자. 네가 궁금한 만큼, 내가 견딜 수 있는 만큼."',choices:[
        ch('lc-luc-heaven-c5','그 정도면 충분해요.','...고마워. 그 말이 생각보다 도움이 되네.'),
        ch('lc-luc-heaven-c6','언젠가 더 듣고 싶어요.','언젠가. 약속까지는 못 하겠지만... 피하지는 않을게.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-lucifer-long-silence',cid:'lucifer-morningstar',title:'오래된 침묵',min:75,max:100,type:'SECRET',
    topics:['loneliness','past','family','trust'],follow:['family','charlie','trust'],
    opening:'"긴 시간 동안 아무에게도 말하지 않으면, 나중엔 무슨 말을 해야 하는지도 잊게 돼." 그는 평소보다 낮은 목소리로 말한다.',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-silence-c1','혼자 있는 게 편해진 거예요?','편하다기보단 익숙해진 거지. 둘은 꽤 달라.','n2',['loneliness']),
        ch('lc-luc-silence-c2','그래서 농담을 많이 하나요?','하. 들켰나? 진지한 말은 한번 꺼내면 주워 담기가 어렵거든.','n2',['trust'])
      ]},
      {id:'n2',speaker:'character',text:'찰리와 다시 이야기하기 시작했을 때도 그랬어. 하고 싶은 말은 너무 많은데, 처음 꺼내는 말은 늘 엉망이더군.',choices:[
        ch('lc-luc-silence-c3','그래도 말했잖아요.','그래. 완벽한 말을 기다렸으면 아직도 아무 말도 못 했겠지.','n3',['charlie','family']),
        ch('lc-luc-silence-c4','찰리도 기다렸을 거예요.','...그 사실을 생각하면 아직도 가슴이 아파. 기다리게 했다는 게.','n3',['charlie','regret'])
      ]},
      {id:'n3',speaker:'character',text:'"그러니까 네가 여기 와서 계속 말을 걸어주는 것도... 생각보다 고맙게 생각하고 있어."',choices:[
        ch('lc-luc-silence-c5','앞으로도 올게요.','...그래. 그럼 나도 조금은 익숙해져 보지.'),
        ch('lc-luc-silence-c6','말 안 해도 같이 있을 수 있어요.','그것도 좋겠네. 침묵이 꼭 혼자인 건 아니라는 걸 잊고 있었어.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-lucifer-long-close',cid:'lucifer-morningstar',title:'남아 있는 사람',min:90,max:100,type:'RELATIONSHIP',
    topics:['trust','family','loss','relationship'],follow:['trust','family','charlie'],
    opening:'"이상하지." 그는 잠시 당신을 바라본다. "예전엔 누군가 계속 찾아오는 게 귀찮을 거라고 생각했는데."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-luc-close-c1','지금은 안 귀찮아요?','가끔은 귀찮아. 하지만 안 오는 것보단 낫더군. 이 정도면 엄청난 칭찬이야.','n2',['trust']),
        ch('lc-luc-close-c2','그럼 계속 와도 되겠네요.','...내가 언제 오지 말라고 했나?','n2',['trust','relationship'])
      ]},
      {id:'n2',speaker:'character',text:'사람이 남아 있을 거라고 기대하는 건 꽤 위험한 일이야. 기대가 생기면 잃을 수도 있으니까.',choices:[
        ch('lc-luc-close-c3','그래도 기대하는 게 낫지 않아요?','요즘은 그렇게 생각하려고 해. 무서워도 관계를 갖는 쪽으로.','n3',['relationship','trust']),
        ch('lc-luc-close-c4','저는 갑자기 사라지지 않을게요.','...그런 말은 함부로 하는 거 아니야. 내가 기억해버리거든.','n3',['trust','loss'])
      ]},
      {id:'n3',speaker:'character',text:'그는 잠깐 웃는다. 이번에는 농담으로 피하지 않는다. "그래도... 기억해둘게."',choices:[
        ch('lc-luc-close-c5','그러세요.','응. 아주 오래.'),
        ch('lc-luc-close-c6','약속이에요.','...좋아. 그럼 나도 약속 하나쯤은 해볼까. 도망치지 않을게.')
      ]}
    ]
  }),

  // Charlie — relationship-aware entries
  entry('lc-v1-charlie-entry-20a','charlie-morningstar','왔네! 이제 네가 오는 시간이 조금 익숙해졌어.',20,49,['entry','familiar']),
  entry('lc-v1-charlie-entry-20b','charlie-morningstar','어서 와! 오늘 있었던 일부터 말해줄까, 아니면 네 얘기부터 들을까?',20,49,['entry','daily']),
  entry('lc-v1-charlie-entry-50a','charlie-morningstar','왔구나. 다행이다. 오늘은 아는 얼굴을 보고 싶었어.',50,74,['entry','trust']),
  entry('lc-v1-charlie-entry-50b','charlie-morningstar','들어와! 네 자리 비워뒀어. ...응, 이제 거의 네 자리야.',50,74,['entry','trust']),
  entry('lc-v1-charlie-entry-75a','charlie-morningstar','왔네. 사실 조금 기다렸어. 오늘은 얘기하고 싶은 게 많거든.',75,100,['entry','close']),
  entry('lc-v1-charlie-entry-75b','charlie-morningstar','어서 와. 오늘은 계획표보다 네가 먼저야. 이건 꽤 큰일이야.',75,100,['entry','close']),

  // Charlie — deeper questions
  ask('lc-v1-charlie-ask-failure','charlie-morningstar','실패했다고 느끼는 순간엔 어떻게 해요?','처음엔 정말 많이 울고, 그다음엔 왜 실패했는지 적어봐. 그리고 아주 작은 것 하나라도 다시 해. 거창한 희망보다 다시 움직이는 게 먼저일 때가 있더라.',20,['hotel','hope','failure']),
  ask('lc-v1-charlie-ask-father','charlie-morningstar','아버지를 이해하기 어렵나요?','응. 사랑하는 것과 이해하는 건 같은 일이 아니더라. 그래도 요즘은 서로 모르는 부분을 그냥 모른다고 말하는 연습을 하고 있어.',50,['family','lucifer','fatherhood']),
  ask('lc-v1-charlie-ask-pressure','charlie-morningstar','모두를 구해야 한다는 부담이 있나요?','있어. 가끔은 내가 한 사람을 돕지 못한 일까지 세상 전체의 실패처럼 느껴져. 요즘은 그게 공평하지 않다는 걸 배우는 중이야. 나한테도, 다른 사람한테도.',75,['redemption','pressure','trust']),

  // Charlie — long conversations
  longScene({
    id:'lc-v1-charlie-long-plan',cid:'charlie-morningstar',title:'계획표의 빈칸',min:0,max:29,type:'CASUAL',
    topics:['hotel','daily','hope'],follow:['hotel','redemption','daily'],
    opening:'찰리는 빼곡하게 적힌 계획표를 들여다보다가 한숨을 쉰다. "이상하다. 계획은 완벽한데 왜 하루는 스물네 시간밖에 없지?"',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-plan-c1','계획을 줄이면 되죠.','그건... 논리적이네. 너무 논리적이라 조금 억울할 정도로.','n2',['daily']),
        ch('lc-char-plan-c2','제가 하나 도와줄까요?','정말? 좋아! 단, 너무 무리하는 건 금지야. 내가 그런 말 할 입장은 아니지만.','n2',['hotel'])
      ]},
      {id:'n2',speaker:'character',text:'가끔은 모든 걸 한꺼번에 고치고 싶어져. 호텔도, 사람들 문제도, 지옥에 대한 생각도.',choices:[
        ch('lc-char-plan-c3','한 번에 하나씩 해도 돼요.','알아. 머리로는. 마음이 자꾸 "조금만 더"라고 해서 문제지.','n3',['hope','pressure']),
        ch('lc-char-plan-c4','그만큼 진심이니까요.','응. 하지만 진심이라고 무조건 좋은 방법은 아니더라. 그건 배웠어.','n3',['redemption','growth'])
      ]},
      {id:'n3',speaker:'character',text:'그녀는 계획표 한 줄을 과감하게 지운다. "좋아. 오늘의 새 목표. 완벽하게 다 하지 않기."',choices:[
        ch('lc-char-plan-c5','그건 좋은 목표네요.','그치? 성공 기준도 아주 낮아서 마음에 들어!'),
        ch('lc-char-plan-c6','그 목표부터 실패할 것 같은데요.','...나도 방금 같은 생각 했어. 그래도 시도는 해보자!')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-charlie-long-small-win',cid:'charlie-morningstar',title:'작은 성공',min:15,max:44,type:'CASUAL',
    topics:['hotel','redemption','hope'],follow:['redemption','hotel','people'],
    opening:'"오늘 누가 먼저 사과했어!" 찰리는 대단한 사건을 보고하듯 말한다. "정말 작은 일이지만, 그래도 먼저였어."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-win-c1','그게 그렇게 기뻐요?','응! 변화는 항상 거대한 사건처럼 오지 않거든. 이런 데서 시작할 수도 있어.','n2',['redemption','hope']),
        ch('lc-char-win-c2','그 정도면 우연일 수도 있잖아요.','맞아. 그래서 너무 큰 의미는 안 두려고 해. ...조금만 둘 거야.','n2',['hope'])
      ]},
      {id:'n2',speaker:'character',text:'예전엔 결과가 빨리 보여야 내가 옳다는 증거라고 생각했던 것 같아. 그런데 사람은 프로젝트가 아니잖아.',choices:[
        ch('lc-char-win-c3','기다리는 것도 중요한 거네요.','응. 기다리는 동안 옆에 있어주는 것도.','n3',['trust','people']),
        ch('lc-char-win-c4','그래도 성과는 필요하죠.','필요하지. 다만 숫자로 세기 어려운 성과도 있다는 걸 잊고 싶진 않아.','n3',['hotel','redemption'])
      ]},
      {id:'n3',speaker:'character',text:'"그래서 오늘은 그 작은 사과를 축하하려고. 아주 조용하게. 케이크는 있을 수도 있고."',choices:[
        ch('lc-char-win-c5','그게 조용한 축하예요?','내 기준에선 굉장히 조용한 편이야!'),
        ch('lc-char-win-c6','케이크면 저도 참여할게요.','좋아! 역시 사람을 하나로 묶는 데 디저트만 한 게 없다니까.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-charlie-long-belief',cid:'charlie-morningstar',title:'사람을 믿는 일',min:30,max:59,type:'PERSONAL',
    topics:['redemption','trust','hope'],follow:['failure','hope','hotel'],
    opening:'"사람을 믿는 게 늘 쉬운 건 아니야." 찰리는 잠시 말을 고른다. "다들 내가 아무 의심도 없이 믿는다고 생각하지만."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-belief-c1','의심할 때도 있어요?','당연하지. 상처받기도 하고, 화도 나고, 포기하고 싶을 때도 있어.','n2',['trust','failure']),
        ch('lc-char-belief-c2','그래도 계속 믿잖아요.','믿는 건 감정이라기보다 선택에 가까운 것 같아. 적어도 내겐 그래.','n2',['hope','redemption'])
      ]},
      {id:'n2',speaker:'character',text:'누군가가 변할 수 있다고 믿는다고 해서 그 사람이 한 일을 없던 일로 만드는 건 아니잖아. 책임과 가능성을 같이 보고 싶은 거야.',choices:[
        ch('lc-char-belief-c3','둘 다 보는 게 더 어렵죠.','정말. 하나만 보면 훨씬 편한데, 사람은 그렇게 단순하지 않더라.','n3',['people','redemption']),
        ch('lc-char-belief-c4','그래서 구원이 더 어려운 거군요.','응. "착해지면 끝" 같은 문제가 아니야. 계속 선택하고 책임지는 거니까.','n3',['redemption','responsibility'])
      ]},
      {id:'n3',speaker:'character',text:'"그래도 난 가능성을 포기하고 싶지 않아. 가능성이 없다고 단정하는 순간, 시작도 못 하니까."',choices:[
        ch('lc-char-belief-c5','당신다운 답이네요.','헤헤... 그 말, 칭찬으로 받을게.'),
        ch('lc-char-belief-c6','가끔은 당신도 믿어주는 사람이 필요하겠네요.','...응. 사실 그런 사람이 있다는 게 내가 계속할 수 있는 이유 중 하나야.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-charlie-long-father',cid:'charlie-morningstar',title:'아빠를 이해하는 일',min:45,max:74,type:'PERSONAL',
    topics:['lucifer','family','fatherhood'],follow:['family','trust','past'],
    opening:'"아빠랑 얘기하다 보면 가끔 우리가 같은 문장을 두고 전혀 다른 얘기를 하는 것 같아." 찰리는 곤란하게 웃는다.',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-father-c1','그래도 예전보다 가까워졌잖아요.','응. 그래서 더 어렵기도 해. 가까워지면 기대도 생기니까.','n2',['lucifer','family']),
        ch('lc-char-father-c2','루시퍼도 많이 노력하는 것 같아요.','알아. 보여. 그래서 화가 날 때도 예전처럼 단순하게 화낼 수가 없어.','n2',['lucifer','fatherhood'])
      ]},
      {id:'n2',speaker:'character',text:'어릴 때는 부모님이 모든 답을 알고 있을 거라고 생각했어. 나중엔 아무것도 모른다고 화냈고. 지금은... 그냥 나처럼 모르는 게 많은 사람이라고 생각하려고 해.',choices:[
        ch('lc-char-father-c3','그렇게 생각하면 좀 편해져요?','조금. 대신 아빠가 상처받을 수도 있다는 것도 더 잘 보여.','n3',['family','empathy']),
        ch('lc-char-father-c4','그래도 딸인 건 변하지 않죠.','응. 이해한다고 해서 내가 서운했던 일이 사라지는 건 아니고. 둘 다 진짜야.','n3',['family','hurt'])
      ]},
      {id:'n3',speaker:'character',text:'"그래서 요즘 목표는 서로 완벽하게 이해하는 게 아니라, 모르는 부분에서 도망치지 않는 거야."',choices:[
        ch('lc-char-father-c5','좋은 목표네요.','그치? 이번 건 계획표에 적어도 될 것 같아.'),
        ch('lc-char-father-c6','둘 다 꽤 비슷하네요.','뭐?! ...음. 부정하고 싶은데, 완전히 틀린 말은 아니네.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-charlie-long-pressure',cid:'charlie-morningstar',title:'공주의 무게',min:60,max:89,type:'STORY',
    topics:['pressure','hotel','redemption','leadership'],follow:['trust','failure','hope'],
    opening:'찰리는 잠시 웃지 않는다. "가끔은 내가 희망적인 말을 하지 않으면 모두가 더 불안해질 것 같아."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-pressure-c1','항상 밝을 필요는 없어요.','알아. 그런데 내가 무너지면 같이 무너질 것 같은 얼굴들이 보일 때가 있거든.','n2',['pressure','leadership']),
        ch('lc-char-pressure-c2','그래서 힘들어도 웃는 거예요?','가끔은. 웃는 게 거짓말이라기보다... 먼저 괜찮아지고 싶어서.','n2',['pressure','hope'])
      ]},
      {id:'n2',speaker:'character',text:'누군가를 돕겠다고 말하는 건 쉬웠어. 그런데 실패했을 때 그 사람 눈을 다시 보는 건 훨씬 어렵더라.',choices:[
        ch('lc-char-pressure-c3','모든 사람을 구할 수는 없잖아요.','...그 말을 이해하는 데 정말 오래 걸렸어. 아직도 완전히 받아들이진 못했고.','n3',['failure','redemption']),
        ch('lc-char-pressure-c4','실패해도 다시 볼 수 있어야겠네요.','응. 도망치지 않고, 내가 틀렸다면 인정하고, 다시 물어보는 거.','n3',['responsibility','growth'])
      ]},
      {id:'n3',speaker:'character',text:'"아마 좋은 리더는 항상 답을 아는 사람이 아니라, 답이 없을 때도 같이 남아 있는 사람인지도 몰라."',choices:[
        ch('lc-char-pressure-c5','당신은 이미 그러고 있어요.','...고마워. 그 말 오늘은 좀 오래 기억할 것 같아.'),
        ch('lc-char-pressure-c6','당신도 누군가에게 기대도 돼요.','응. 요즘은 그걸 배우고 있어. 혼자 버티는 게 책임감은 아니더라.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-charlie-long-doubt',cid:'charlie-morningstar',title:'희망이 흔들리는 밤',min:75,max:100,type:'SECRET',
    topics:['hope','doubt','failure','trust'],follow:['trust','redemption','family'],
    opening:'"이건 다른 사람들한테는 잘 말 안 하는 건데..." 찰리는 한참 뜸을 들인다. "나도 가끔 내가 틀렸을까 봐 무서워."',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-doubt-c1','구원이 불가능할까 봐요?','그것도. 그리고 내가 믿는 방식 때문에 누군가가 더 다칠까 봐.','n2',['doubt','redemption']),
        ch('lc-char-doubt-c2','당신도 그런 생각을 하는군요.','응. 안 하는 척할 때가 많을 뿐이야. 확신이랑 두려움은 같이 있을 수 있더라.','n2',['hope','doubt'])
      ]},
      {id:'n2',speaker:'character',text:'내가 틀릴 수 있다는 걸 인정하면 처음엔 모든 게 무너지는 느낌이었어. 그런데 지금은 오히려 그래서 다른 사람 말을 더 들을 수 있게 된 것 같아.',choices:[
        ch('lc-char-doubt-c3','그럼 믿음이 약해진 게 아니네요.','나도 그렇게 생각하려고 해. 더 단단해지려면 질문도 견딜 수 있어야 하니까.','n3',['hope','growth']),
        ch('lc-char-doubt-c4','무섭다고 멈추진 않잖아요.','응. 무서워도 계속하는 게 용기라면... 나도 조금은 용감한 걸지도.','n3',['courage','hope'])
      ]},
      {id:'n3',speaker:'character',text:'그녀는 작게 숨을 내쉰다. "이런 말 해도 네가 실망하지 않아서 다행이야."',choices:[
        ch('lc-char-doubt-c5','오히려 더 믿음이 가요.','...진짜? 그럼 나, 다음엔 조금 덜 숨겨도 되겠다.'),
        ch('lc-char-doubt-c6','항상 확신할 필요는 없어요.','응. 오늘은 그 말을 믿어볼게. 적어도 오늘은.')
      ]}
    ]
  }),
  longScene({
    id:'lc-v1-charlie-long-close',cid:'charlie-morningstar',title:'기대어도 되는 사람',min:90,max:100,type:'RELATIONSHIP',
    topics:['trust','relationship','rest','hope'],follow:['trust','family','future'],
    opening:'"있잖아, 요즘은 네가 오면 조금 안심돼." 찰리는 말을 꺼낸 뒤 스스로도 놀란 듯 웃는다.',
    nodes:[
      {id:'start',speaker:'character',text:'',choices:[
        ch('lc-char-close-c1','왜요?','내가 계속 설명하지 않아도 되는 사람 같아서. 그냥 오늘 힘들었다고만 해도 알아들을 것 같거든.','n2',['trust','rest']),
        ch('lc-char-close-c2','그 말 기분 좋네요.','헤헤. 나도 말하고 나니까 기분 좋아. 조금 부끄럽기도 하고.','n2',['relationship','trust'])
      ]},
      {id:'n2',speaker:'character',text:'예전엔 내가 먼저 다른 사람을 붙잡아줘야 한다고만 생각했어. 요즘은 나도 누군가에게 기대도 된다는 걸 배우는 중이야.',choices:[
        ch('lc-char-close-c3','저한테 기대도 돼요.','...응. 그럼 아주 조금씩 연습해볼게.','n3',['trust','relationship']),
        ch('lc-char-close-c4','기대는 것도 용기죠.','맞아. 특히 늘 괜찮은 척하던 사람한테는 더 그런 것 같아.','n3',['courage','rest'])
      ]},
      {id:'n3',speaker:'character',text:'"그리고 네가 힘들 때도 말해줘. 내가 공주라서가 아니라... 그냥 나한테."',choices:[
        ch('lc-char-close-c5','약속할게요.','좋아. 그럼 나도 약속할게.'),
        ch('lc-char-close-c6','찰리에게요.','...응. 찰리에게. 그게 더 좋다.')
      ]}
    ]
  })
];

let current=0;
try{current=Number(localStorage.getItem(SEED_KEY)||0)||0}catch{}
if(current>=SEED_VERSION)return;
let state={};
try{state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{state={}}
state.dialogues=Array.isArray(state.dialogues)?state.dialogues:[];
const existing=new Set(state.dialogues.map(x=>x&&x.id).filter(Boolean));
let added=0;
for(const scene of scenes){if(!existing.has(scene.id)){state.dialogues.push(scene);added++}}
try{
  localStorage.setItem(STATE_KEY,JSON.stringify(state));
  localStorage.setItem(SEED_KEY,String(SEED_VERSION));
  window.__HELLAVERSE_CHARACTER_DIALOGUES__={version:SEED_VERSION,total:scenes.length,added};
}catch(e){console.warn('Could not seed character dialogue pack',e)}
})();