(()=>{
'use strict';
if(window.__HELLAVERSE_ITEM_CATALOG_REBALANCE_V3__)return;
window.__HELLAVERSE_ITEM_CATALOG_REBALANCE_V3__=1;
const K='hellaverse_dialogue_state_v1';
const normalize=v=>String(v||'').normalize('NFKC').trim();
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s){const v=JSON.stringify(s);localStorage.setItem(K,v);try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:v}))}catch{}window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'item-catalog-rebalance-v3',clearDirty:false}}))}
const OWNER=[
 [/^사탄이 |^사탄의 /,'satan'],[/^비가 |^퀸비가 |^베엘제붑/,'beelzebub'],[/^맘몬/,'mammon'],[/^아스모데우스/,'asmodeus'],[/^벨페고르/,'belphegor'],[/^레비아탄/,'leviathan'],[/^알래스터/,'alastor'],[/^찰리가 |^찰리의 /,'charlie-morningstar'],[/^호텔 직원들의 /,'charlie-morningstar'],[/^니프티/,'niffty'],[/^에밀리/,'emily'],[/^발신인 없는 천국/,'emily'],[/^배기가 |^배기 /,'vaggie']
];
const OWNER_EXCEPTIONS={
 '사탄의 독촉장':'lucifer-morningstar',
 '찰리의 첫 리본':'lucifer-morningstar',
 '찰리의 어린 시절 그림':'lucifer-morningstar',
 '레비아탄 덕':'lucifer-morningstar',
 '벨페고르 덕':'lucifer-morningstar',
 '아스모데우스 덕':'lucifer-morningstar',
 '니프티 덕':'lucifer-morningstar',
 '알래스터 덕':'lucifer-morningstar',
 '배기 덕':'lucifer-morningstar',
 '에밀리 덕':'lucifer-morningstar'
};
const ICONS={
 '루시퍼가 만든 미니 고무 오리':'🦆','금빛 사과 핀':'🍎','태엽식 미니 오리':'⚙️','루시퍼의 손글씨 카드':'✍️','????':'❓',
 '사탄이 보낸 흑요석 인장 문진':'🪨','사탄이 떠넘긴 밀린 업무철':'📁','비가 보낸 허니애플 캔디 박스':'🍬','비가 보낸 네온 오리 머리띠':'🦆',
 '맘몬의 KING OF HELL 굿즈 시제품':'👑','맘몬이 보낸 순금 도금 오리':'🪙','아스모데우스가 보낸 맞춤 장갑':'🧤','벨페고르가 보낸 수면용 허브티':'🍵',
 '레비아탄이 보낸 심해 유리 오리':'🌊','칠죄종 공동 서명 카드':'💌','알래스터가 전해달란 빈티지 진공관':'📻','알래스터가 보낸 사과잼':'🍎',
 '알래스터의 손글씨 초대 카드':'✉️','알래스터가 보낸 사슴뿔 장식':'🦌','알래스터가 고치라고 보낸 고장난 라디오':'📻','찰리가 전해달라고 한 사진 봉투':'📷',
 '호텔 직원들의 감사 카드':'💌','니프티가 주워온 반짝이 나사통':'🔩','에밀리가 보낸 구름 책갈피':'☁️','발신인 없는 천국 우편 봉투':'✉️',
 '바닥에서 주운 반짝이는 나사':'🔩','고장난 작은 태엽 부품':'⚙️','누가 버린 오리 스티커':'🦆','진짜 아무것도 없는 빈 상자':'📦',
 '구겨진 영수증':'🧾','빈 사탕 포장지':'🍬','반쯤 부러진 플라스틱 포크':'🍴','새까맣게 탄 토스트':'🍞','진짜 쓰레기 봉투':'🗑️',
 '길에서 주운 금 간 고무 오리':'🦆','배기가 전해준 호텔 열쇠고리':'🗝️','찰리가 골라준 작은 사과 핀':'🍎'
};
const BASIC=new Set(['바닥에서 주운 반짝이는 나사','고장난 작은 태엽 부품','누가 버린 오리 스티커','진짜 아무것도 없는 빈 상자','구겨진 영수증','빈 사탕 포장지','반쯤 부러진 플라스틱 포크','새까맣게 탄 토스트','진짜 쓰레기 봉투','길에서 주운 금 간 고무 오리']);
function run(){
 const s=read();s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:[];s.ownedItems=Array.isArray(s.ownedItems)?s.ownedItems.map(String):[];s.newCollectionItems=Array.isArray(s.newCollectionItems)?s.newCollectionItems.map(String):[];const old=s.inventoryV2&&typeof s.inventoryV2==='object'?s.inventoryV2:{};old.version=2;old.basicItems=Array.isArray(old.basicItems)?old.basicItems:[];old.counts=old.counts&&typeof old.counts==='object'?old.counts:{};old.discovered=Array.isArray(old.discovered)?old.discovered.map(String):[];old.giftRules=old.giftRules&&typeof old.giftRules==='object'?old.giftRules:{};s.inventoryV2=old;
 let changed=false;const keep=[];
 for(const i of s.collectionItems){const itemName=normalize(i?.name||i?.title);if(ICONS[itemName]&&i.symbol!==ICONS[itemName]){i.symbol=ICONS[itemName];changed=true}const exception=OWNER_EXCEPTIONS[itemName];if(exception){if(i.characterId!==exception){i.characterId=exception;changed=true}}else{const own=OWNER.find(([re])=>re.test(itemName));if(own&&i.characterId!==own[1]){i.characterId=own[1];changed=true}}if(itemName==='칠죄종 공동 서명 카드'&&i.characterId!=='satan'){i.characterId='satan';changed=true}if(BASIC.has(itemName)){i.gachaEnabled=false;i.inventoryType='BASIC';i.collectionVisible=false;const id=String(i.id),had=s.ownedItems.includes(id)||Number(old.counts[id]||0)>0;if(had){old.counts[id]=Math.max(1,Number(old.counts[id]||0));if(!old.discovered.includes(id))old.discovered.push(id)}let j=old.basicItems.findIndex(x=>String(x.id)===id);if(j<0)old.basicItems.push({...i});else old.basicItems[j]={...old.basicItems[j],...i};s.ownedItems=s.ownedItems.filter(x=>x!==id);s.newCollectionItems=s.newCollectionItems.filter(x=>x!==id);changed=true;continue}i.inventoryType='COLLECTION';i.collectionVisible=true;keep.push(i)}
 if(keep.length!==s.collectionItems.length){s.collectionItems=keep;s.items=keep;changed=true}
 const profiles={satan:'SATAN COLLECTION',beelzebub:'BEELZEBUB COLLECTION',mammon:'MAMMON COLLECTION',asmodeus:'ASMODEUS COLLECTION',belphegor:'BELPHEGOR COLLECTION',leviathan:'LEVIATHAN COLLECTION',alastor:'ALASTOR COLLECTION','charlie-morningstar':'CHARLIE COLLECTION',niffty:'NIFFTY COLLECTION',emily:'EMILY COLLECTION',vaggie:'VAGGIE COLLECTION'};s.collectionProfiles=s.collectionProfiles||{};for(const [id,title] of Object.entries(profiles)){if(s.collectionProfiles[id]?.title!==title){s.collectionProfiles[id]={...(s.collectionProfiles[id]||{}),title};changed=true}}
 const paper=s.collectionItems.find(i=>normalize(i.name)==='사탄이 보낸 흑요석 인장 문진');if(paper){old.giftRules[paper.id]=old.giftRules[paper.id]||{};if(!old.giftRules[paper.id]['lucifer-morningstar']){old.giftRules[paper.id]['lucifer-morningstar']={preference:'DISLIKED',affectionDelta:0,opening:'당신은 흑요석 인장 문진을 루시퍼에게 내민다.',response:'루시퍼는 검은 문진을 보자마자 미간부터 찌푸린다. “...잠깐. 이거 사탄 거잖아.”',afterEvent:'',setFlags:'',removeFlags:'',moodChange:'ANNOYED',memoryTitle:'사탄의 문진을 루시퍼에게 전달함',memorySummary:'사탄에게 받은 흑요석 인장 문진을 루시퍼에게 건넸다.',memoryTags:'gift, satan, paperweight',approaches:[{id:'personal',label:'내가 주는 선물이야.',type:'speech',playerLine:'내가 주는 선물이야.',response:'루시퍼는 문진과 당신을 번갈아 본다. “네가? 나한테? ...취향이 꽤 무겁네. 문자 그대로.”',affectionDelta:1,afterEvent:''},{id:'relay',label:'사탄이 전해주래.',type:'speech',playerLine:'사탄이 전해주래.',response:'루시퍼의 웃는 얼굴이 아주 잠깐 굳는다. “아. 사탄. 물론이지. 굉장히... 사탄다운 전달 방식이군.”',affectionDelta:0,afterEvent:'lucifer.satan_paperweight_received'},{id:'silent',label:'말없이 건넨다.',type:'action',playerLine:'말없이 문진을 건넨다.',response:'루시퍼는 문진을 받아 들고 한참 당신을 본다. “설명은? 없어? ...좋아. 그게 더 무섭네.”',affectionDelta:-1,afterEvent:''}]};changed=true}
 s.events=Array.isArray(s.events)?s.events:[];if(!s.events.some(e=>e?.id==='lucifer.satan_paperweight_received')){s.events.push({id:'lucifer.satan_paperweight_received',name:'사탄의 문진을 전달받음',description:'플레이어가 사탄의 부탁으로 흑요석 인장 문진을 루시퍼에게 전달했다.',type:'MILESTONE',characterId:'lucifer-morningstar',namespace:'lucifer'});changed=true}}
 if(changed){s.migrations=s.migrations||{};s.migrations.itemCatalogRebalanceV3={at:new Date().toISOString()};write(s)}
}
run();
})();