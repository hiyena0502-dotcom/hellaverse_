(()=>{
'use strict';
if(window.__HELLAVERSE_HAZBIN_ROOM_EXITS_V1__)return;
window.__HELLAVERSE_HAZBIN_ROOM_EXITS_V1__=1;
const K='hellaverse_dialogue_state_v1',MK='hellaverse_hazbin_room_exits_v1';
try{if(Number(localStorage.getItem(MK)||0)>=1)return}catch{}
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch(e){console.warn('Hazbin room exits save failed',e);return false}};
function exitScene(cid,n,title,opening,min=0,type='CASUAL'){
 const id=`hazbin-${cid}-exit-${String(n).padStart(2,'0')}`;
 return {id,characterId:cid,title,kind:'EXIT',repeatable:true,requiredAffection:min,maxAffection:100,requiredStage:'',requiredMood:'ANY',requiredFlags:'',blockedFlags:'',requiredMemoryTags:'',blockedMemoryTags:'',requiredItemIds:'',priority:4,probability:100,opening,openingType:'character',sceneRole:'EXIT',conversationType:type,topics:['exit','player'],followUpTopics:['exit','player'],exitLine:'',after:'',used:false,nodes:[{id:'start',speaker:'character',text:'',choices:[]}],openingNodeId:'start',contentPack:'hazbin-room-exits-v1'};
}
const rows={
 'charlie-morningstar':[
  ['벌써 가?','“벌써 가? 알겠어. 오늘 와줘서 고마워. 다음엔 좀 더 편하게 있어도 돼!”',0,'CASUAL'],
  ['조심해서 가','“조심해서 가! 그리고 로비에서 누가 도움 필요해 보이면— 아, 아니야. 오늘은 그냥 편하게 가.”',0,'CASUAL'],
  ['또 얘기하자','“다음에 또 얘기하자. 네 얘기도 더 듣고 싶어.”',45,'RELATIONSHIP']],
 'vaggie':[
  ['복도 조심해','“가는 거야? 알겠어. 복도 조심하고, 문제 생기면 바로 말해.”',0,'CASUAL'],
  ['문 닫고 가','“문은 닫고 가줘. 찰리가 또 회의 시작하기 전에 잠깐 조용히 있고 싶어.”',0,'CASUAL'],
  ['오늘 얘긴 고마웠어','“잘 가. …그리고 오늘 얘긴 고마웠어.”',45,'RELATIONSHIP']],
 'alastor':[
  ['벌써 가시는 겁니까','“벌써 가시는 겁니까? 아쉽군요. 대화가 겨우 흥미로워지려던 참이었는데.”',0,'CASUAL'],
  ['좋은 방송만 들으시길','“그럼 이만. 복도에서 불쾌한 방송 소리가 들리면 채널을 돌리시길 권하지요.”',0,'CASUAL'],
  ['다음 방문','“다음 방문도 기대하겠습니다. 너무 오래 기다리게 하진 마십시오.”',50,'RELATIONSHIP']],
 'angel-dust':[
  ['벌써 튀게','“벌써 튀게? 알았어, 베이비. 다음엔 뭐라도 들고 와. 술이면 더 좋고.”',0,'CASUAL'],
  ['복도 조심','“잘 가. 복도에서 골치 아픈 놈 만나면 못 본 척하고 지나가.”',0,'CASUAL'],
  ['또 와','“또 와. 나 혼자 떠들면 좀 처량하잖아.”',45,'RELATIONSHIP']],
 'husk':[
  ['문 닫아','“가냐? 문 닫고 가.”',0,'CASUAL'],
  ['다음 술값','“다음엔 술값은 네가 내.”',0,'CASUAL'],
  ['조심해서 가','“…조심해서 가. 됐지?”',50,'RELATIONSHIP']],
 'niffty':[
  ['더 어질러','“벌써 가?! 다음엔 더 어질러 놓고 가! 내가 치우게!”',0,'CASUAL'],
  ['피 묻은 거','“잘 가! 피 묻은 거 생기면 꼭 나 불러!”',0,'CASUAL'],
  ['재밌는 얘기','“다음엔 재밌는 얘기 가져와! 아주 이상한 걸로!”',40,'RELATIONSHIP']],
 'sir-pentious':[
  ['또 오시오','“오, 벌써 가는 것이오? 다음에는 더 훌륭한 발명품을 보여주겠소!”',0,'CASUAL'],
  ['폭발 흔적','“조심히 가시오! 복도의 폭발 흔적은 내 것이 아닐 확률이… 상당히 높소!”',0,'CASUAL'],
  ['차를 준비하겠소','“또 오시오! 다음에는 손님을 위한 차도 준비해두겠소.”',45,'RELATIONSHIP']],
 'cherri-bomb':[
  ['폭발음 따라와','“가? 그래, 나중에 보자. 심심하면 폭발음 따라와.”',0,'CASUAL'],
  ['너무 조심하진 마','“조심히 가. 아니, 너무 조심하진 말고. 그건 재미없잖아.”',0,'CASUAL'],
  ['재미있는 얘기','“또 와. 다음엔 재미있는 얘기 하나는 들고 오고.”',45,'RELATIONSHIP']],
 'vox':[
  ['벌써 로그아웃','“벌써 로그아웃? 뭐, 다음 접속은 좀 더 흥미롭길 바라지.”',0,'CASUAL'],
  ['화면 건드리지 마','“나가면서 화면은 건드리지 마. 네 지문 남는 거 싫어.”',0,'CASUAL'],
  ['그 이름은 빼고','“다음엔 좋은 소식 가져와. 라디오 악마 얘기는 빼고.”',45,'RELATIONSHIP']],
 'valentino':[
  ['문 닫고 가','“가는 거야? 문은 닫고 가.”',0,'CASUAL'],
  ['시간 낭비','“다음엔 내 시간 낭비할 얘긴 가져오지 마.”',0,'CASUAL'],
  ['예약이라도 잡아','“또 올 거면 예약이라도 잡아. 난 바쁜 몸이니까.”',45,'RELATIONSHIP']],
 'velvette':[
  ['덜 지루한 얘기','“벌써? Fine. 다음엔 좀 덜 지루한 얘기 들고 와.”',0,'CASUAL'],
  ['사진은 찍지 마','“나가면서 사진은 찍지 마. 각도 구리면 진짜 화낼 거야.”',0,'CASUAL'],
  ['트렌드는 따라와','“다음에 올 땐 트렌드 정도는 따라오고. 내가 다 설명하게 만들지 말고.”',45,'RELATIONSHIP']],
 'carmilla-carmine':[
  ['경계를 늦추지 마','“이만 가는군. 복도에서는 경계를 늦추지 마.”',0,'CASUAL'],
  ['목적을 가지고 와','“다음에 올 땐 목적을 가지고 와. 시간은 귀하니까.”',0,'CASUAL'],
  ['기억해두겠다','“잘 가. 오늘 나눈 대화는 기억해두겠다.”',50,'RELATIONSHIP']],
 'zestial':[
  ['평온이 함께하길','“그럼 이만 돌아가도록 하게. 길 위에 평온이 함께하길.”',0,'CASUAL'],
  ['떠남에도 때가','“머무름에는 때가 있고 떠남에도 때가 있는 법이지.”',0,'CASUAL'],
  ['다시 찾아오게','“다시 찾아오게. 다음에는 조금 더 긴 이야기를 나누지.”',50,'RELATIONSHIP']],
 'rosie':[
  ['차는 다 마시고','“벌써 가니? 다음엔 차 한 잔은 다 마시고 가렴.”',0,'CASUAL'],
  ['웃으면서 무시해','“조심히 가, darling. 예의 없는 사람을 만나면 웃으면서 무시해버리렴.”',0,'CASUAL'],
  ['좋은 손님','“또 와. 좋은 손님은 언제든 환영이란다.”',45,'RELATIONSHIP']],
 'adam':[
  ['네 손해야','“뭐, 벌써 가? 그래, 네 손해야.”',0,'CASUAL'],
  ['재밌는 질문','“다음엔 좀 더 재밌는 질문 준비해 와.”',0,'CASUAL'],
  ['멋있던 건 기억해','“잘 가. 그리고 방금 내가 한 말 중 멋있던 건 기억해 둬.”',40,'RELATIONSHIP']],
 'lute':[
  ['문 닫고','“끝났으면 가. 문 닫고.”',0,'CASUAL'],
  ['시간 낭비하지 마','“다음엔 시간 낭비하지 마.”',0,'CASUAL'],
  ['표적이 된다','“조심해. 약해 보이는 건 어디서든 표적이 된다.”',50,'RELATIONSHIP']],
 'sera':[
  ['가볍게 여기지 말아줘','“그럼 이만. 오늘 들은 것을 가볍게 여기지는 말아줘.”',0,'CASUAL'],
  ['평안히 가길','“평안히 가길. 다음에는 조금 더 차분한 상황에서 이야기할 수 있으면 좋겠구나.”',0,'CASUAL'],
  ['답하지 못한 질문','“또 보자. 아직 답하지 못한 질문이 남아 있으니.”',50,'RELATIONSHIP']],
 'emily':[
  ['더 오래 얘기하자','“벌써 가? 알겠어! 다음엔 더 오래 얘기하자.”',0,'CASUAL'],
  ['또 와줄 거지','“조심히 가! 그리고… 또 와줄 거지?”',0,'CASUAL'],
  ['와줘서 고마워','“오늘 와줘서 고마워. 다음엔 내가 물어볼 것도 더 많아!”',45,'RELATIONSHIP']],
 'baxter':[
  ['실험 흐름','“끝났으면 나가. 실험 흐름 끊겼어.”',0,'CASUAL'],
  ['빨간 스위치','“다음엔 장비에 손대지 마. 특히 빨간 스위치.”',0,'CASUAL'],
  ['유용한 정보','“또 올 거면 유용한 정보라도 가져와.”',45,'RELATIONSHIP']],
 'abel':[
  ['다음에 또 보자','“벌써 가는 거야? 알겠어. 다음에 또 보자.”',0,'CASUAL'],
  ['길 조심','“조심히 가. 여기 길은 생각보다 헷갈리더라.”',0,'CASUAL'],
  ['내가 먼저 물어볼지도','“다음엔 내가 먼저 질문할지도 몰라.”',45,'RELATIONSHIP']]
};
const s=read();s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
for(const [cid,list] of Object.entries(rows)){
 if(!(s.characters||[]).some(c=>c?.id===cid))continue;
 list.forEach((row,i)=>{const x=exitScene(cid,i+1,row[0],row[1],row[2],row[3]);const at=s.dialogues.findIndex(d=>d?.id===x.id);if(at>=0)s.dialogues[at]={...s.dialogues[at],...x};else s.dialogues.push(x)});
}
if(write(s)){try{localStorage.setItem(MK,'1')}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'hazbin-room-exits'}}))}
})();