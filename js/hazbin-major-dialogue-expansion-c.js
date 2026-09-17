(()=>{
'use strict';
if(window.__HELLAVERSE_MAJOR_DIALOGUE_EXPANSION_C_V1__)return;
window.__HELLAVERSE_MAJOR_DIALOGUE_EXPANSION_C_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_major_dialogue_expansion_c_v1',PACK='hazbin-major-expansion-c-v1';
let version=0;try{version=Number(localStorage.getItem(VK)||0)}catch{}if(version>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const base=(id,cid,title,kind,role,opening,priority=6)=>({id,characterId:cid,title,kind,sceneRole:role,repeatable:true,requiredAffection:0,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority,probability:100,opening,openingType:'character',exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:[]}],openingNodeId:'start',contentPack:PACK,canonGrounding:'fanmade original'});
const speech=(id,text,response)=>({id,type:'speech',text,playerLine:text,response,affectionDelta:0,requiredAffection:0,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',lockDisplay:'disabled',setFlags:'',removeFlags:'',addMemoryTitle:'',addMemorySummary:'',addMemoryTags:'',moodChange:'',unlockItemId:'',nextNodeId:'',endConversation:true});
function conv(cid,i,row){const [title,opening,a,b]=row,id=`major-${cid}-conv-${i+1}`;const s=base(id,cid,title,'TALK','CONVERSATION',opening,7);s.nodes=[{id:'start',speaker:'character',text:'',choices:[speech(`${id}-a`,'그 얘기 더 해줘요.',a),speech(`${id}-b`,'그렇게 생각한 이유가 있어요?',b)]}];return s}
function ask(cid,i,row){const [title,answer]=row,id=`major-${cid}-q-${i+1}`,s=base(id,cid,title,'ASK','QUESTION',answer,5);s.nodes=[{id:'start',speaker:'character',text:'',choices:[]}];return s}
function action(cid,i,row){const [title,narration,response]=row,id=`major-${cid}-act-${i+1}`,opening=`[[NARRATION]] ${narration}\n[[CHARACTER]] ${response}`;return base(id,cid,title,'TALK','ACTION',opening,8)}
function simple(cid,i,text,kind,role){return base(`major-${cid}-${role.toLowerCase()}-${i+1}`,cid,`${role} ${i+1}`,kind,role,text,20)}
const DATA={
'adam':{
 conv:[
 ['기타 자랑','Adam이 기타를 손에 들고 아무 요청도 없는데 연주를 시작한다.','“처음부터 쳤지. 음악 역사의 시작점이 나라고 생각하면 편해.”','“과장 아니냐고? 난 기준점이야.”'],
 ['첫 인간이라는 자부심','Adam이 의자에 기대 웃는다.','“프랜차이즈 1호점 같은 거라고. 당연히 중요하지.”','“후속작이 더 나을 수도 있다는 비유는 마음에 안 든다.”'],
 ['Lucifer 경쟁심','Adam의 표정이 이름 하나에 바로 굳는다.','“그 자식은 모든 걸 개인적으로 만들었어.”','“내 쪽도 개인적이라고? 내 쪽은 정당한 개인적 감정이야.”'],
 ['천국의 명성','Adam은 자기 이야기를 과장되게 늘어놓는다.','“당연히 다들 좋아하지. 대부분. 중요한 사람들은.”','“왜 자꾸 검증하려고 해? 그냥 믿으면 편하잖아.”'],
 ['전투 전의 허세','Adam이 웃지만 손가락은 계속 리듬을 두드린다.','“난 원래 말이 많아. 긴장이랑 상관없어.”','“긴장했냐고? 정답은 아니야. 다음 질문.”']
 ],
 q:[
 ['가장 좋아하는 노래는?','“내가 연주하는 거. 장르는 ‘내가 잘하는 거’.”'],
 ['Lucifer에게 하고 싶은 말은?','“아직 끝난 거 아니라고. 그리고 내 기타가 더 멋지다고.”'],
 ['Lute를 믿어요?','“당연하지. 말 적고 일 잘해. 완벽한 조합이잖아.”'],
 ['Charlie를 어떻게 봐요?','“고집 세고 짜증나고… 결과를 하나 만들긴 했지. 인정하기 싫지만 사실은 사실이고.”'],
 ['후회하는 선택 있어요?','Adam이 잠깐 조용해진다. “그 질문 패스.”']
 ],
 action:[
 ['기타 피크를 집어 든다','당신이 테이블 위 기타 피크를 집는다.','Adam이 바로 손을 내민다. “그건 한정판이야. 다시 줘. 대신 싸구려 하나 줄게.”'],
 ['연주에 박수를 친다','당신이 짧게 박수를 친다.','Adam이 즉시 자세를 고쳐 앉는다. “봐? 관객이 있으면 퀄리티가 올라간다니까.”'],
 ['볼륨을 조금 낮춘다','당신이 앰프 볼륨을 한 칸 낮춘다.','Adam이 당신을 노려본다. “범죄다. 음악에 대한 범죄.”'],
 ['Lute 이름을 꺼낸다','당신이 별 뜻 없이 Lute 이야기를 꺼낸다.','Adam이 반사적으로 고개를 든다. “왜? 무슨 일 있었어?”'],
 ['아무 반응 없이 바라본다','당신이 무표정하게 연주를 듣는다.','Adam이 점점 더 과장되게 연주한다. “야. 이 정도면 반응 좀 해.”']
 ],
 entry:['“오, 관객 왔네. 타이밍 좋다.”','Adam이 기타를 내려놓지 않은 채 말한다. “들어와. 문은 네가 닫아.”','“뭐야, 나 보러 왔어? 이해는 한다.”','“좋아, 딱 한 곡만 듣고 가. 아니, 세 곡.”','Adam이 턱짓한다. “앉아. 지루하진 않게 해줄게.”'],
 exit:['“가? 좋아. 다음엔 앵콜 준비해.”','“잘 가. 오늘 들은 건 무료 공연이었다.”','Adam이 손을 든다. “다음에 봐, 팬.”','“다음엔 더 재밌는 질문 가져와.”','“문 닫고 가. 기타 소리 새나가잖아.”']
},
'vox':{
 conv:[
 ['시청률 그래프','Vox가 실시간 그래프를 손가락으로 확대한다.','“숫자는 거짓말 안 해. 해석하는 사람이 거짓말할 뿐이지.”','화면이 잠깐 지직거린다. “난 불안한 게 아니라 정보 확인을 좋아하는 거야.”'],
 ['Alastor의 존재감','한 화면에 오래된 라디오 파형이 떠 있다.','“모니터링이야. 경쟁사 분석.”','“몇 시간째냐고? 철저한 분석이라는 뜻이지.”'],
 ['Vees의 균형','Vox가 여러 채널을 동시에 띄운다.','“싸우는 거랑 운영하는 건 별개야. 우린 서로 필요한 게 명확해.”','“친구라는 단어보다 사업 관계가 훨씬 정확할 때가 있어.”'],
 ['새 기술','Vox가 새 인터페이스를 자랑스럽게 넘긴다.','“멈추는 순간 구식이 되는 세상이야. 업데이트는 선택이 아니지.”','“가끔 구식도 좋다는 말은 여기서 금지.”'],
 ['통제와 방송','Vox는 동시에 여러 카메라 화면을 확인한다.','“볼 수 있는데 왜 안 봐?”','“피곤함은 자동화할 수 없어. 아직은.”']
 ],
 q:[
 ['Alastor에게 원하는 건?','“지는 모습. 공개적으로. 가능하면 여러 각도에서.”'],
 ['Valentino를 믿어요?','“신뢰는 계약보다 비싸. 우린 필요한 범위에서 충분히 맞춰.”'],
 ['Velvette를 어떻게 봐요?','“빠르고 감이 좋아. 그리고 자기 말이 마지막이어야 직성이 풀리는 타입.”'],
 ['화면이 꺼지면 불안해요?','Vox의 표정이 한 프레임 멈춘다. “질문이 기술적으로 불쾌하네.”'],
 ['가장 중요한 건 영향력이에요?','“영향력, 도달률, 통제. 이름만 다르지 연결된 문제야.”']
 ],
 action:[
 ['리모컨을 집는다','당신이 소파 옆 리모컨을 집는다.','Vox가 바로 손을 내민다. “버튼 누르기 전에 최소한 기능은 물어봐.”'],
 ['화면 밝기를 낮춘다','당신이 가까운 화면 밝기를 한 칸 낮춘다.','Vox가 즉시 원래대로 돌린다. “브랜드 가이드라인 위반.”'],
 ['Alastor 검색창을 닫는다','당신이 열려 있던 검색창을 닫는다.','모니터가 순간 지직거린다. “내가 닫으려고 했어.”'],
 ['케이블 하나를 정리한다','당신이 발밑의 케이블을 가지런히 묶는다.','Vox가 놀란 듯 내려다본다. “오. 실제로 도움이 되는 방문객이었네.”'],
 ['카메라를 향해 손을 흔든다','당신이 벽의 카메라를 향해 손을 흔든다.','Vox가 다른 화면에 당신 모습을 띄운다. “좋아, 테스트 샷. 표정은 좀 더 자연스럽게.”']
 ],
 entry:['“들어와. 지금 방송 아냐. 녹화는… 아마 아니고.”','Vox가 화면 여러 개를 끈다. “뭐야, 직접 방문? 구식인데 신선하네.”','“잠깐, 케이블 밟지 마. 그건 진짜 비싸.”','“어서 와. 좋은 타이밍이야, 방금 지루한 회의 끝났거든.”','Vox의 화면이 당신 쪽으로 돌아온다. “용건? 아니면 그냥 구경?”'],
 exit:['“가? 좋아. 다음 접속 때는 예약해.”','“잘 가. 카메라엔 손 흔들지 마—이미 했네.”','Vox가 손가락으로 화면을 넘긴다. “다음에 봐.”','“오늘 대화 데이터는… 농담이야. 아마.”','“문 닫고 가. 외부 소음 필터가 완벽하진 않거든.”']
},
'valentino':{
 conv:[
 ['촬영 스케줄','Valentino가 촬영표를 손끝으로 밀어본다.','“시간이 돈이야. 누가 늦으면 그만큼 누군가는 손해를 본다고.”','“스케줄이 빡빡한 이유? 빈 시간이 생기면 다른 놈이 그 자리를 먹으니까.”'],
 ['Vees와 사업','Valentino가 메시지를 확인하며 짧게 웃는다.','“Vox는 유통, Velvette는 흐름, 난 욕망. 서로 필요한 부분이 딱 보여.”','“친구냐고 묻는 건 사업을 너무 낭만적으로 보는 거야.”'],
 ['Angel에 대한 집착','Angel의 이름이 나오자 Valentino의 표정이 달라진다.','“걘 돈이 되고 눈에 띄고, 그래서 더 통제해야 해.”','“왜 그렇게 집착하냐고? 소유한 게 멀어지는 걸 좋아하는 사람은 없지.”'],
 ['스튜디오의 규칙','Valentino가 닫힌 문들을 차례로 본다.','“여기선 누가 결정권을 갖는지가 제일 중요해.”','“규칙은 다들 싫어하지만 자기한테 유리하면 또 잘 쓰거든.”'],
 ['자기 이미지','Valentino가 거울에 비친 자기 모습을 확인한다.','“사람들이 뭘 보는지 알면 절반은 끝난 거야.”','“진짜 모습? 그건 돈 안 되면 굳이 보여줄 필요 없지.”']
 ],
 q:[
 ['Angel을 사람으로 보긴 해요?','Valentino가 잠깐 웃는다. “그 질문에 원하는 답이 너무 뻔하네.”'],
 ['Vox를 믿어요?','“일 맡길 만큼은. 마음까지 맡길 생각은 없고.”'],
 ['Velvette가 무서운가요?','“무섭다기보다 귀찮을 정도로 빠르지. 그게 장점이기도 하고.”'],
 ['가장 싫어하는 건?','“통제 밖으로 나가는 거. 사람도, 일정도, 이야기 흐름도.”'],
 ['후회하는 게 있어요?','“후회는 비용 처리 안 돼. 난 쓸모없는 장부 안 써.”']
 ],
 action:[
 ['촬영표를 접어둔다','당신이 흩어진 촬영표를 한데 모은다.','Valentino가 손끝으로 정리된 모서리를 두드린다. “적어도 보는 눈은 있네.”'],
 ['향수병을 집어 든다','당신이 화려한 병을 들어본다.','Valentino가 웃는다. “비싼 거야. 떨어뜨리면 네가 더 놀랄걸.”'],
 ['카메라 렌즈를 닦는다','당신이 렌즈의 먼지를 닦는다.','그가 화면을 확인한다. “좋아. 적어도 얼굴에 먼지는 안 잡히겠군.”'],
 ['문을 열어 환기한다','당신이 답답한 방의 문을 열어둔다.','Valentino가 눈썹을 올린다. “분위기 망치기 직전이었는데… 뭐, 공기는 낫네.”'],
 ['말없이 시선을 피하지 않는다','당신은 그의 시선을 그대로 받아낸다.','Valentino가 흥미롭다는 듯 웃는다. “겁먹는 타입은 아니네.”']
 ],
 entry:['“왔어? 들어와. 문 앞에 서 있으면 동선 막혀.”','Valentino가 선글라스를 올린다. “무슨 일인데?”','“좋아, 지금은 촬영 없어. 운 좋네.”','“들어와. 오래 있을 거면 앉고.”','Valentino가 손짓한다. “문 닫아. 집중 깨져.”'],
 exit:['“가. 다음엔 일정 확인하고 와.”','“잘 가. 길 잃지 말고.”','Valentino가 손끝만 흔든다. “또 보자.”','“오늘은 생각보다 안 지루했네.”','“문 닫고 가. 밖 소리 듣기 싫어.”']
},
'velvette':{
 conv:[
 ['트렌드 속도','Velvette가 화면을 몇 번이나 빠르게 넘긴다.','“느리면 끝이야. 유행은 설명 기다려주지 않거든.”','“예측보다 반응 속도가 중요할 때가 더 많아.”'],
 ['Overlord 회의','Velvette가 회의 기록을 보며 코웃음 친다.','“나이 많다고 자동으로 현명해지는 거 아니잖아.”','“말을 많이 하는 사람보다 정보를 빨리 쓰는 사람이 이겨.”'],
 ['Carmilla와의 긴장','Carmilla 이야기가 나오자 Velvette가 눈을 굴린다.','“강하고 똑똑한 건 인정해. 그래서 답답한 것도 더 잘 보여.”','“정보 숨기고 혼자 책임지는 태도? 구식이야.”'],
 ['Vees의 역할','Velvette가 두 사람의 메시지를 동시에 읽는다.','“Vox는 화면, Val은 욕망, 난 사람들이 다음에 뭘 원할지 읽어.”','“우리가 싸워도 굴러가는 이유는 서로 쓸모가 확실해서야.”'],
 ['패션과 권력','Velvette가 옷 한 벌을 보며 핀을 옮긴다.','“옷은 장식이 아니라 선언이야. 누가 먼저 보이느냐부터 권력이거든.”','“취향도 전략이 될 수 있어. 대부분은 그걸 너무 늦게 깨닫지.”']
 ],
 q:[
 ['Carmilla를 싫어해요?','“싫다기보다 답답해. 똑똑한 사람이 일부러 느리게 움직이면 더 짜증나거든.”'],
 ['Vox를 어떻게 봐요?','“유능하고 집착 많고 화면 없으면 불안해하는 타입. 일할 땐 편해.”'],
 ['Valentino와 잘 맞아요?','“취향은 별개고 사업은 별개. 그걸 구분할 줄 아니까 같이 있는 거야.”'],
 ['가장 촌스럽다고 느끼는 건?','“자기 위치가 영원할 거라고 믿는 태도.”'],
 ['유행이 무서운 적 있어요?','“유행이 아니라 내가 놓치는 순간이 싫어.”']
 ],
 action:[
 ['옷걸이를 정리한다','당신이 색 순서대로 옷걸이를 정리한다.','Velvette가 한 번 훑고 고개를 끄덕인다. “감각은 평균 이상이네.”'],
 ['휴대폰 화면을 잠깐 가린다','당신이 장난스럽게 화면 앞에 손을 댄다.','Velvette가 손을 치운다. “내 산소 막지 마.”'],
 ['핀 하나를 건넨다','당신이 필요한 핀을 바로 골라 건넨다.','Velvette가 받아 들며 말한다. “좋아, 눈치 빠른 건 마음에 들어.”'],
 ['거울 각도를 바꾼다','당신이 거울을 조금 돌린다.','Velvette가 즉시 최적 각도로 되돌린다. “조명 계산 끝난 걸 건드리면 안 되지.”'],
 ['트렌드 목록에 의견을 적는다','당신이 메모 한 줄을 추가한다.','Velvette가 읽고 잠깐 멈춘다. “흠. 이건 써먹을 만하네.”']
 ],
 entry:['“들어와. 근데 지금 옷 밟으면 죽어.”','Velvette가 화면에서 눈을 떼지 않은 채 손짓한다. “앉든가 말든가.”','“좋은 타이밍. 방금 진짜 지루한 사람들하고 통화 끝났어.”','“어서 와. 의견 필요했는데 네가 쓸모 있을 수도 있겠네.”','Velvette가 고개를 든다. “뭐야, 약속 있었나? 없어도 들어와.”'],
 exit:['“가? 좋아. 다음엔 덜 촌스럽게 와.”','“잘 가. 메시지 보내면 읽을 수도 있고 아닐 수도 있어.”','Velvette가 손가락을 까딱한다. “바이.”','“오늘 의견 하나는 괜찮았어. 하나.”','“문 닫고 가. 집중해야 돼.”']
}
};
const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
function put(scene,role){const i=s.dialogues.findIndex(x=>x?.id===scene.id);if(i>=0){scene.used=s.dialogues[i]?.used||false;s.dialogues[i]=scene}else s.dialogues.push(scene);s.dialogueFileMap[scene.id]=role}
for(const [cid,d] of Object.entries(DATA)){
 d.conv.forEach((row,i)=>put(conv(cid,i,row),'CONVERSATION'));
 d.q.forEach((row,i)=>put(ask(cid,i,row),'QUESTION'));
 d.action.forEach((row,i)=>put(action(cid,i,row),'ACTION'));
 d.entry.forEach((text,i)=>put(simple(cid,i,text,'ENTRY','ENTRY'),'ENTRY'));
 d.exit.forEach((text,i)=>put(simple(cid,i,text,'EXIT','EXIT'),'EXIT'));
}
localStorage.setItem(K,JSON.stringify(s));localStorage.setItem(VK,'1');
})();
