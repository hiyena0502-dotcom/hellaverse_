(()=>{
'use strict';
if(window.__HELLAVERSE_EVENT_PROGRESSION_PACK_V1__)return;
window.__HELLAVERSE_EVENT_PROGRESSION_PACK_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_event_progression_pack_v1';
let version=0;try{version=Number(localStorage.getItem(VK)||0)}catch{}
if(version>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{localStorage.setItem(K,JSON.stringify(s));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'event-progression-pack',clearDirty:false}}))};
const split=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/[\n,;/|]+/).map(x=>x.trim()).filter(Boolean);
const addToken=(v,id)=>[...new Set([...split(v),id])].join(', ');
const EVENTS=[
 ['lucifer.quiet_side_seen','Lucifer · 조용한 면을 봄','피아노와 조용한 순간을 통해 루시퍼가 방어적인 농담 뒤의 차분한 면을 보였다.','lucifer-morningstar'],
 ['lucifer.heaven_boundary_spoken','Lucifer · 천국 이야기에 선을 그음','루시퍼가 천국에 대해 말할 수 있는 범위와 아직 말하기 어려운 경계를 직접 드러냈다.','lucifer-morningstar'],
 ['charlie.plan_overflow_noticed','Charlie · 계획이 과해진 걸 자각함','찰리가 호텔 계획을 너무 크게 벌이고 있다는 사실을 스스로 인지했다.','charlie-morningstar'],
 ['charlie.accepted_help','Charlie · 도움을 받아들임','찰리가 모든 것을 혼자 해결하려 하지 않고 바기와 역할을 나누는 태도를 보였다.','charlie-morningstar'],
 ['vaggie.security_concern_shared','Vaggie · 경계심을 공유함','바기가 호텔을 지키기 위해 무엇을 걱정하는지 직접 털어놓았다.','vaggie'],
 ['vaggie.charlie_pace_discussed','Vaggie · Charlie의 속도를 이야기함','바기가 찰리의 과한 추진력을 어떻게 받아들이는지 이야기했다.','vaggie'],
 ['alastor.hotel_interest_seen','Alastor · 호텔에 대한 흥미를 드러냄','알래스터가 호텔을 단순한 심심풀이 이상으로 관찰하고 있다는 단서를 보였다.','alastor'],
 ['alastor.vox_topic_opened','Alastor · Vox 화제를 허용함','알래스터가 Vox 이야기를 완전히 피하지 않고 자신의 반응을 드러냈다.','alastor'],
 ['angel.off_camera_seen','Angel · 카메라 밖 모습을 봄','엔젤이 촬영과 무대가 없는 상태에서 보이는 태도를 드러냈다.','angel-dust'],
 ['angel.husk_trust_spoken','Angel · Husk에 대한 신뢰를 말함','엔젤이 허스크를 단순한 바텐더 이상으로 신뢰하고 있음을 드러냈다.','angel-dust'],
 ['husk.quiet_side_seen','Husk · 조용한 밤을 함께함','허스크와 말이 적은 시간을 보내며 그의 편안한 침묵을 경험했다.','husk'],
 ['husk.angel_concern_spoken','Husk · Angel 걱정을 말함','허스크가 엔젤을 어떻게 보고 있는지 평소보다 직접적으로 이야기했다.','husk'],
 ['sera.post_meeting_doubt','Sera · 회의 뒤 의심이 남음','세라가 공식적인 결론 뒤에도 마음속 의문이 남아 있음을 보였다.','sera'],
 ['sera.redemption_evidence_seen','Sera · 구원의 증거를 인정함','세라가 기존 판단만으로 설명하기 어려운 구원의 증거를 직접 인정했다.','sera'],
 ['emily.hell_curiosity_opened','Emily · 지옥에 대한 호기심을 열어둠','에밀리가 지옥을 단순한 금지된 장소가 아니라 이해해야 할 곳으로 보기 시작했다.','emily'],
 ['emily.lucifer_questions_opened','Emily · Lucifer에 대한 질문을 품음','에밀리가 루시퍼의 과거와 현재를 더 알고 싶다는 마음을 드러냈다.','emily'],
 ['lute.adam_grief_spoken','Lute · Adam 이후의 감정을 드러냄','류트가 Adam 이후의 상실과 분노를 완전히 숨기지 못했다.','lute'],
 ['lute.command_doubt','Lute · 명령과 판단 사이에서 흔들림','류트가 명령을 따르는 것과 스스로 판단하는 것 사이의 충돌을 인정했다.','lute'],
 ['vox.alastor_fixation_seen','Vox · Alastor 집착이 드러남','Vox가 Alastor를 단순한 경쟁사 이상으로 의식하고 있다는 것이 드러났다.','vox'],
 ['vox.vees_balance_spoken','Vox · Vees 내부 균형을 말함','Vox가 Vees 세 사람의 이해관계와 균형에 대해 비교적 솔직하게 말했다.','vox'],
 ['pentious.egg_bois_memory_opened','Pentious · Egg Boiz 추억을 꺼냄','펜셔스가 Egg Boiz에 대한 그리움과 기억을 입 밖으로 꺼냈다.','sir-pentious'],
 ['pentious.cherri_feelings_spoken','Pentious · Cherri에 대한 마음을 말함','펜셔스가 Cherri를 향한 감정을 숨기지 못하고 드러냈다.','sir-pentious'],
 ['cherri.angel_history_spoken','Cherri · Angel과의 오래된 관계를 말함','체리가 Angel과 오래 알고 지낸 관계의 무게를 이야기했다.','cherri-bomb'],
 ['cherri.pentious_memory_opened','Cherri · Pentious를 떠올림','체리가 Pentious에 대한 기억을 농담으로만 넘기지 못했다.','cherri-bomb']
].map(([id,name,description,characterId])=>({id,name,description,type:'MILESTONE',characterId,namespace:id.split('.')[0]}));

const CHAINS=[
 ['lucifer-morningstar','피아노의 짧은 곡','lucifer.quiet_side_seen','천국 이야기'],
 ['lucifer-morningstar','천국 이야기','lucifer.heaven_boundary_spoken','왕의 업무'],
 ['charlie-morningstar','오늘의 호텔 계획','charlie.plan_overflow_noticed','바기와의 팀워크'],
 ['charlie-morningstar','바기와의 팀워크','charlie.accepted_help','아빠 이야기'],
 ['vaggie','호텔 경비','vaggie.security_concern_shared','찰리의 속도'],
 ['vaggie','찰리의 속도','vaggie.charlie_pace_discussed','신뢰를 다시 쌓는 법'],
 ['alastor','호텔 관찰','alastor.hotel_interest_seen','Vox 이야기'],
 ['alastor','Vox 이야기','alastor.vox_topic_opened','Rosie와 차 한 잔'],
 ['angel-dust','촬영 없는 날','angel.off_camera_seen','Husk 이야기'],
 ['angel-dust','Husk 이야기','angel.husk_trust_spoken','무대와 진짜 얼굴'],
 ['husk','바가 조용한 시간','husk.quiet_side_seen','Angel을 보는 법'],
 ['husk','Angel을 보는 법','husk.angel_concern_spoken','술 없이 버티는 밤'],
 ['sera','회의가 끝난 뒤','sera.post_meeting_doubt','구원의 증거'],
 ['sera','구원의 증거','sera.redemption_evidence_seen','과거의 결정'],
 ['emily','지옥에 대한 궁금증','emily.hell_curiosity_opened','Lucifer에 대한 호기심'],
 ['emily','Lucifer에 대한 호기심','emily.lucifer_questions_opened','천국의 규칙'],
 ['lute','Adam 이후','lute.adam_grief_spoken','명령과 판단'],
 ['lute','명령과 판단','lute.command_doubt','천국의 변화'],
 ['vox','Alastor의 존재감','vox.alastor_fixation_seen','Vees의 균형'],
 ['vox','Vees의 균형','vox.vees_balance_spoken','통제와 방송'],
 ['sir-pentious','Egg Boiz 이야기','pentious.egg_bois_memory_opened','Cherri 생각'],
 ['sir-pentious','Cherri 생각','pentious.cherri_feelings_spoken','용기에 대한 생각'],
 ['cherri-bomb','Angel과 오래된 우정','cherri.angel_history_spoken','Pentious 얘기'],
 ['cherri-bomb','Pentious 얘기','cherri.pentious_memory_opened','호텔에 남은 이유']
];

const THOUGHTS=[
 ['event-thought-lucifer-heaven-boundary','lucifer-morningstar','lucifer.heaven_boundary_spoken','past','normal','말하지 않는 게 더 쉬운 건 맞아.\n그렇다고 영원히 아무 말도 안 할 수는 없겠지.'],
 ['event-thought-charlie-help','charlie-morningstar','charlie.accepted_help','relationship','normal','도움을 받는 건 포기하는 게 아니야.\n같이 하자는 뜻이야. 그걸 자꾸 잊어.'],
 ['event-thought-vaggie-pace','vaggie','vaggie.charlie_pace_discussed','relationship','normal','찰리를 멈추게 하고 싶은 게 아니야.\n넘어지기 전에 옆에서 속도를 맞추고 싶은 거지.'],
 ['event-thought-angel-husk','angel-dust','angel.husk_trust_spoken','relationship','rare','그 영감 앞에서는 가끔 농담을 한 번 덜 해도 되는 것 같아.\n…그게 제일 이상해.'],
 ['event-thought-husk-angel','husk','husk.angel_concern_spoken','relationship','rare','도와달라는 말을 안 한다고 도움이 필요 없는 건 아니지.\n문제는 그걸 내가 너무 잘 안다는 거고.'],
 ['event-thought-sera-evidence','sera','sera.redemption_evidence_seen','heaven','rare','증거가 나타났다면 판단을 고쳐야 한다.\n그게 원칙이다. 그런데 왜 이렇게 늦었을까.'],
 ['event-thought-emily-lucifer','emily','emily.lucifer_questions_opened','heaven','normal','궁금한 건 많은데, 물어보는 게 상처를 건드리는 일이면 어떡하지?\n알고 싶다는 마음도 조심해야 하는 걸까.'],
 ['event-thought-lute-command','lute','lute.command_doubt','past','rare','명령이 틀렸다면 따르는 쪽은 어디까지 책임져야 하지.\n…쓸데없는 질문이야.'],
 ['event-thought-vox-alastor','vox','vox.alastor_fixation_seen','relationship','normal','모니터링이야. 경쟁 분석.\n몇 시간째 보고 있었다고 해서 의미가 달라지는 건 아니야.'],
 ['event-thought-pentious-cherri','sir-pentious','pentious.cherri_feelings_spoken','relationship','normal','말할 때는 언제나 완벽한 문장을 준비했는데…\n정작 그 사람 앞에서는 하나도 안 나오는군.'],
 ['event-thought-cherri-pentious','cherri-bomb','cherri.pentious_memory_opened','past','rare','웃긴 놈이었지. 진짜로.\n…그래서 더 짜증나게 기억나는 거고.']
];

const s=read();s.events=Array.isArray(s.events)?s.events:[];s.eventCatalog=Array.isArray(s.eventCatalog)?s.eventCatalog:[];s.dialogueMeta=s.dialogueMeta&&typeof s.dialogueMeta==='object'&&!Array.isArray(s.dialogueMeta)?s.dialogueMeta:{};s.thoughts=Array.isArray(s.thoughts)?s.thoughts:[];
for(const e of EVENTS){
  const i=s.events.findIndex(x=>x?.id===e.id);if(i>=0)s.events[i]={...s.events[i],...e};else s.events.push(e);
}
for(const [cid,sourceTitle,eventId,targetTitle] of CHAINS){
  const source=(s.dialogues||[]).find(x=>x?.characterId===cid&&x?.title===sourceTitle);
  const target=(s.dialogues||[]).find(x=>x?.characterId===cid&&x?.title===targetTitle);
  if(source){
    const meta=s.dialogueMeta[source.id]&&typeof s.dialogueMeta[source.id]==='object'?s.dialogueMeta[source.id]:{};
    meta.completionEvents=[...new Set([...split(meta.completionEvents),eventId])];
    s.dialogueMeta[source.id]=meta;
  }
  if(target)target.requiredFlags=addToken(target.requiredFlags,eventId);
}
for(const [id,characterId,requiredFlags,category,frequency,text] of THOUGHTS){
  if(s.thoughts.some(x=>x?.id===id))continue;
  s.thoughts.push({id,characterId,category,categories:[category],text,variants:[],requiredAffection:0,requiredMood:'ANY',requiredMoods:[],requiredFlags,blockedFlags:'',requiredMemoryTags:'',frequency,appearanceWeight:frequency==='rare'?1:4,probability:''});
}
write(s);try{localStorage.setItem(VK,'1')}catch{}
})();