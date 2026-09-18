(()=>{
'use strict';
if(window.__HELLAVERSE_CHARLIE_COLLECTION_CANON_REPAIR_V1__)return;
window.__HELLAVERSE_CHARLIE_COLLECTION_CANON_REPAIR_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_charlie_collection_canon_repair_v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const write=s=>{try{const v=JSON.stringify(s);localStorage.setItem(K,v);try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:v,storageArea:localStorage,url:location.href}))}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'charlie-collection-canon-repair',clearDirty:false}}));return true}catch(error){console.warn('Charlie Collection repair could not be saved safely.',error);return false}};
const norm=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const nameOf=i=>clean(i?.name||i?.title||'');
const bodyOf=i=>clean(i?.desc||i?.description||'');
const revealOf=i=>clean(i?.revealLine||i?.claimLine||'');

function isKnownGood(name){
 return new Set([
  'Hazbin Hotel 웰컴 스티커','손으로 접은 작은 별','빨강·금색 호텔 열쇠고리','구원 체크리스트 카드',
  '낙서가 가득한 일정표 한 장','호텔 기념 리본','미완성 노래 악보','호텔 단체사진 복사본',
  '초창기 호텔 브로슈어','Charlie의 개인 메모 카드',
  '🏨 손글씨 웰컴 네임카드','⭐ 작은 희망 별 스티커 시트','🎵 물어뜯은 노래 연습 연필','💌 빈 격려 편지 봉투',
  '📋 호텔 체크인 클립보드','🌈 구원 프로젝트 색인 탭','📸 호텔 가족사진 투명 슬리브','☕ ‘오늘은 여기까지’ 휴식 카드',
  '🌟 작은 성공 기록장','😇 Heaven 발표용 손글씨 큐카드','🎀 호텔 첫 기념일 리본','🎤 듀엣 연습용 금빛 페이지 마커',
  '🌈 수정 흔적 가득한 구원 바인더','📸 호텔 단체사진 컨택트 시트','🎼 끝맺지 않은 리프라이즈 악보',
  '🗝️ 첫 입주자 방 예비 열쇠','📸 가족사진 원본 봉투','💌 보내지 않은 희망 편지','🏨 호텔 식구 이름 아카이브','🌈 ‘한 번 더’ 마지막 카드'
 ]).has(name);
}
function luciferSpecific(text){
 return /(루시퍼가|lucifer\b|릴리스가|lilith\b|내가 묶어준 적|지옥의 왕|king of hell|고무 ?오리|rubber duck|태엽식 미니 오리|금빛 사과|golden apple|루시퍼의 손글씨|왕의 오래된|아빠가 만든 오리)/i.test(text);
}
function duplicateOfLucifer(item,lucifer){
 const d=norm(bodyOf(item)),r=norm(revealOf(item));
 if(!d&&!r)return false;
 return lucifer.some(x=>{
   const xd=norm(bodyOf(x)),xr=norm(revealOf(x));
   return (d&&xd&&d===xd)||(r&&xr&&r===xr)||(d&&xr&&d===xr)||(r&&xd&&r===xd);
 });
}
function rewrite(item){
 const n=nameOf(item),low=norm(n);
 item.characterId='charlie-morningstar';
 if(/찰리의 첫 리본|첫 리본/.test(n)){
   item.name='찰리의 첫 리본';
   item.desc='찰리가 아주 어릴 때 처음으로 자기 물건이라고 아끼기 시작한 붉은 리본. 오래된 가족사진 속에서도 같은 리본을 볼 수 있다.';
   item.description=item.desc;
   item.revealLine='찰리가 리본을 두 손가락 사이에 걸어 보고는 조금 민망하게 웃는다. “이게 내가 처음 진짜 좋아했던 리본이야. 어릴 땐 매일 비슷하게 묶는 것도 엄청 중요한 일처럼 느껴졌거든.”';
   item.claimLine=item.revealLine;
   item.condition='찰리와 어린 시절·가족 이야기를 충분히 나눈 뒤 획득 가능';
   item.dialogueSourceCharacterId='charlie-morningstar';
   return;
 }
 if(/리본|ribbon/.test(low)){
   item.desc='찰리가 오래 보관해 온 리본. 호텔 장식이나 개인적인 추억과 연결된 물건이라 가장자리의 작은 구김까지 그대로 남아 있다.';
   item.revealLine='찰리가 리본을 천천히 펴 보며 웃는다. “이런 건 별거 아닌 것 같아도 그날 분위기가 그대로 기억나. 그래서 잘 못 버리겠더라.”';
 }else if(/사진|photo|picture|폴라로이드/.test(low)){
   item.desc='찰리가 호텔과 가족의 순간을 남겨 둔 사진. 완벽하게 잘 나온 장면보다 실제로 함께 있었던 분위기가 더 선명하게 남아 있다.';
   item.revealLine='찰리가 사진을 한참 들여다보다가 웃는다. “잘 나온 사진도 좋지만, 난 이런 게 더 좋아. 다들 진짜 그날 같잖아.”';
 }else if(/악보|노래|score|music|가사/.test(low)){
   item.desc='찰리가 노래와 생각을 정리하며 남긴 기록. 고쳐 쓴 흔적과 멈춘 부분이 그대로 남아 있어 완성본보다 솔직하다.';
   item.revealLine='찰리가 종이를 알아보고 황급히 웃는다. “아직 완성된 건 아니야. 근데… 지금의 내가 어디까지 생각했는지는 꽤 잘 남아 있네.”';
 }else if(/편지|메모|카드|letter|note/.test(low)){
   item.desc='찰리가 누군가를 응원하거나 마음을 전하려고 직접 적어 둔 기록. 밝은 문장 사이에 여러 번 고친 흔적이 남아 있다.';
   item.revealLine='찰리가 자기 글씨를 확인하고 조금 쑥스러운 듯 웃는다. “쓴 사람보다 받는 사람이 덜 힘들었으면 해서 적은 거야. 그 정도면 충분하지.”';
 }else if(/호텔|hotel|브로슈어|brochure|열쇠|key/.test(low)){
   item.desc='찰리가 호텔을 꾸리고 사람들을 맞이하면서 남겨 둔 물건. 계획이 여러 번 바뀐 흔적까지 호텔의 역사처럼 남아 있다.';
   item.revealLine='찰리가 물건을 들고 활짝 웃는다. “호텔은 계속 바뀌었는데 이런 건 남아 있더라. 우리가 진짜 여기까지 왔다는 증거 같아.”';
 }else if(/천국|heaven|seraph|angel/.test(low)){
   item.desc='찰리가 천국과 구원 문제를 설명하기 위해 준비하거나 보관해 온 기록. 낙관만으로 밀어붙이지 않으려 고친 흔적이 많다.';
   item.revealLine='찰리가 한 번 숨을 고르고 물건을 건넨다. “이건 내가 맞다는 증거라기보다, 계속 설명하고 다시 들으려고 했던 기록에 가까워.”';
 }else if(/가족|family|morningstar/.test(low)){
   item.desc='찰리가 가족에 관한 기억을 간직하며 남겨 둔 물건. 좋은 기억과 아직 정리되지 않은 감정이 함께 묻어 있다.';
   item.revealLine='찰리가 잠시 조용해졌다가 물건을 네 손에 놓는다. “가족 얘기는 한 가지 감정으로만 남지 않더라. 그래서 더 쉽게 버릴 수가 없었어.”';
 }else{
   item.desc='찰리가 호텔 생활 속에서 직접 쓰거나 보관해 온 개인 물건. 사소해 보여도 그 시기의 습관과 마음이 남아 있다.';
   item.revealLine='찰리가 물건을 알아보고 웃는다. “이건 내가 쓰던 거야. 엄청 대단한 건 아닌데… 그래서 오히려 내가 더 잘 기억하는 물건 같아.”';
 }
 item.description=item.desc;
 item.claimLine=item.revealLine;
 item.dialogueSourceCharacterId='charlie-morningstar';
 item.condition='찰리와 관련된 대화·이벤트를 통해 획득 가능';
}
function run(){
 const s=read(),items=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);
 const lucifer=items.filter(i=>i?.characterId==='lucifer-morningstar');
 const changed=[];
 for(const item of items){
   const n=nameOf(item);
   const explicit=/찰리의 첫 리본|첫 리본/.test(n);
   const isCharlie=item?.characterId==='charlie-morningstar'||/^찰리의 |^찰리가 |^charlie\b/i.test(n);
   if(!explicit&&!isCharlie)continue;
   if(isKnownGood(n)&&!explicit)continue;
   const suspicious=explicit||duplicateOfLucifer(item,lucifer)||luciferSpecific(bodyOf(item)+' '+revealOf(item));
   if(!suspicious)continue;
   rewrite(item);changed.push(n||item.id);
   const iid=String(item.id||'');
   if(iid){
     for(const sc of s.dialogues||[])for(const node of sc.nodes||[])for(const ch of node.choices||[]){
       if(ch?.unlockItemId===iid&&sc.characterId==='lucifer-morningstar')ch.unlockItemId='';
     }
   }
 }
 s.collectionItems=items;s.items=items;
 s.collectionProfiles=s.collectionProfiles&&typeof s.collectionProfiles==='object'?s.collectionProfiles:{};
 s.collectionProfiles['charlie-morningstar']={...(s.collectionProfiles['charlie-morningstar']||{}),title:'CHARLIE COLLECTION',memo:'호텔, 구원 프로젝트, 노래, 가족과 관계 속에서 찰리가 직접 남긴 기록들.'};
 if(changed.length){
   write(s);
   try{localStorage.setItem(VK,JSON.stringify({at:new Date().toISOString(),changed}))}catch{}
 }
 window.__HV_CHARLIE_COLLECTION_REPAIR_INFO__={changed,count:changed.length};
}
run();
})();