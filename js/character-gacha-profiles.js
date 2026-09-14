(()=>{
'use strict';
if(window.__HELLAVERSE_CHARACTER_GACHA_PROFILES_V2__)return;
window.__HELLAVERSE_CHARACTER_GACHA_PROFILES_V2__=1;

const K='hellaverse_dialogue_state_v1';
const UIK='hellaverse_character_gacha_editor_ui_v2';
const MIG='hellaverse_hotel_collection_emoji_migration_v2';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const lines=v=>Array.isArray(v)?v.map(String).map(x=>x.trim()).filter(Boolean):String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const short=(v,n=120)=>{v=String(v||'').replace(/\s+/g,' ').trim();return v.length>n?v.slice(0,n-1)+'…':v};

const DEFAULTS={
'lucifer-morningstar':{icon:'🦆',description:'장난스러운 오리 수집품과 왕의 오래된 개인 기록.',lines:['“오, 이걸 뽑았어? 취향이 꽤 괜찮은데.”','“하! 그건 제법 희귀한 녀석이야. 잘 간직해.”']},
'lilith-morningstar':{icon:'🎵',description:'오래된 무대의 흔적과 조용히 남겨 둔 개인 기록.',lines:['“흥미로운 걸 골랐구나.”','“그 물건에는 생각보다 긴 이야기가 있단다.”']},
'charlie-morningstar':{icon:'🌈',description:'호텔을 꾸리고 사람들을 응원하며 남은 밝고 다정한 기록.',lines:['“와! 그거 뽑았어? 진짜 잘 어울린다!”','“좋아! 그건 내가 꽤 좋아하는 물건이야!”']},
'michael':{icon:'⚔️',description:'질서와 책임, 오래된 천국의 기록.',lines:['“그 물건의 의미를 가볍게 보진 마라.”','“잘 보관하도록. 오래 남은 데에는 이유가 있다.”']},
'gabriel':{icon:'📯',description:'전해진 소식과 남겨진 메시지의 조각.',lines:['“좋은 소식처럼 도착했군.”','“메시지는 받는 사람에 따라 의미가 달라지지.”']},
'sera':{icon:'✨',description:'천국의 책임과 조용한 사적인 흔적.',lines:['“그 물건은 신중히 다뤄 주세요.”','“오래 보관한 것에는 대개 이유가 있습니다.”']},
'lute':{icon:'🗡️',description:'전투와 규율, 쉽게 내보이지 않는 개인 장비.',lines:['“운 좋았네. 함부로 다루진 마.”','“그걸 뽑았다고 들뜨진 마. 그래도… 나쁘진 않네.”']},
'adam':{icon:'🎸',description:'과장된 자랑과 무대 뒤에 남은 개인 소지품.',lines:['“당연히 좋은 게 나왔지. 내 거잖아.”','“축하해. 네 컬렉션 가치가 방금 확 올랐네.”']},
'vaggie':{icon:'🎀',description:'호텔을 지키기 위한 실용적인 준비물과 숨은 애정.',lines:['“쓸모 있는 게 나왔네. 잘 챙겨 둬.”','“그거 잃어버리지 마. 다시 구하기 귀찮으니까.”']},
'alastor':{icon:'📻',description:'라디오, 빈티지 취향, 그리고 좀처럼 내주지 않는 기록.',lines:['“하하! 제법 흥미로운 결과군요.”','“아주 훌륭합니다. 기념품은 이야기가 있을수록 가치가 있지요.”']},
'vox':{icon:'📺',description:'화면과 기술, 이미지 관리의 흔적.',lines:['“오, 그거? 화면빨 꽤 받는 아이템인데.”','“좋아. 그 정도면 당첨 화면에 띄울 만하지.”']},
'niffty':{icon:'🧹',description:'청소하다 발견한 반짝이는 잡동사니와 기묘한 보물.',lines:['“그거 나왔어?! 귀여워! 깨끗하게 해!”','“좋아! 새 거다! 아니, 오래된 건가? 아무튼 좋아!”']},
'angel-dust':{icon:'🕷️',description:'화려한 소품 사이에 섞여 있는 의외로 개인적인 흔적.',lines:['“오, 자기. 그거 뽑았어? 보는 눈 있네.”','“잘 간직해. 이런 건 아무한테나 안 굴러가거든.”']},
'husk':{icon:'🃏',description:'바와 도박, 지나간 시절의 소지품.',lines:['“쓸 만한 게 나왔네. 운 좋았다.”','“그 정도면 꽝은 아니야. 됐지?”']},
'blitzo':{icon:'🎯',description:'일과 소동 속에서 남은 I.M.P.식 잡동사니.',lines:['“오, 그거 뽑았냐? 의외로 운 있네.”','“좋아, 그건 꽤 쓸 만해. 아마도.”']},
'paimon':{icon:'👑',description:'왕족의 예법과 오래된 가문의 물건.',lines:['“그대에게 허락된 물건이라 여기도록.”','“왕가의 물건은 보관에도 예가 필요한 법이다.”']},
'satan':{icon:'🔥',description:'힘과 절제, 오래 버틴 장비와 흔적.',lines:['“좋은 물건을 골랐군. 함부로 쓰진 마라.”','“그 정도면 네 운도 완전히 형편없진 않군.”']},
'mammon':{icon:'💰',description:'돈 냄새 나는 굿즈와 사업의 부산물.',lines:['“잭팟! 이건 값 좀 나가겠는데?”','“오! 그거 뽑았냐? 재판매는 나랑 먼저 상의해!”']},
'asmodeus':{icon:'💖',description:'무대, 분위기, 관계의 감각이 묻어나는 소품.',lines:['“오, 자기. 센스 좋은 걸 뽑았네.”','“그거 분위기 괜찮다. 너한테 잘 어울리겠어.”']},
'beelzebub':{icon:'🍯',description:'달콤한 파티와 사람을 챙기는 마음이 남은 물건.',lines:['“헤이! 좋은 거 나왔네! 축하해!”','“오, 그건 완전 네 에너지인데?”']},
'belphegor':{icon:'💤',description:'휴식과 조용한 밤에 어울리는 느긋한 소지품.',lines:['“…좋은 거 나왔네. 잘 뒀다가 써.”','“그거면 됐어. 이제 조금 쉬어.”']},
'leviathan':{icon:'🌊',description:'비교와 시선, 깊은 곳에 오래 남은 물건.',lines:['“흥미로운 결과네. 네가 어떻게 볼지 궁금한데.”','“그걸 고른 건 우연일까. 뭐, 나쁘지 않아.”']},
'sir-pentious':{icon:'🐍',description:'거창한 발명과 실패작 사이에서 건진 소중한 부품.',lines:['“오오! 훌륭한 결과다! 자네의 운을 칭찬하지!”','“그건 무려 나의 위대한 컬렉션 중 하나라네!”']},
'cherri-bomb':{icon:'💣',description:'거리, 파티, 폭발 뒤에 남은 거친 기념품.',lines:['“오, 그거 뽑았냐? 존나 운 좋네.”','“좋아, 그건 꽝 아니야. 재밌게 갖고 있어.”']},
'velvette':{icon:'📱',description:'패션과 트렌드, 이미지 관리의 날카로운 흔적.',lines:['“오케이, 그건 꽤 괜찮아. 올려도 되겠네.”','“적어도 촌스러운 건 안 뽑았네. 축하해.”']},
'valentino':{icon:'🦋',description:'화려한 무대와 소유욕이 묻어나는 장식품.',lines:['“흥미로운 걸 골랐네.”','“그건 눈에 띄는 물건이지. 네가 감당할 수 있다면.”']},
'carmilla-carmine':{icon:'👠',description:'정교한 준비와 가족을 지키기 위한 물건.',lines:['“좋은 선택이군요. 관리만 제대로 해 주세요.”','“그 물건은 장식보다 쓰임을 먼저 보세요.”']},
'rosie':{icon:'🌹',description:'예절과 오래된 우정, Cannibal Town의 작은 기념품.',lines:['“어머, 아주 잘 어울리는 걸 뽑았구나.”','“좋은 물건은 좋은 주인을 만나야지. 축하해.”']},
'abel':{icon:'🐑',description:'순수한 호기심과 천국의 작은 일상 기록.',lines:['“와, 그거 나왔네! 좋은 결과다.”','“그 물건 이야기도 나중에 같이 알아보자.”']},
'saint-peter':{icon:'🔑',description:'천국의 문과 환영 업무에서 남은 소품.',lines:['“축하합니다! 좋은 카드가 나왔네요!”','“오, 멋진 결과예요! 잘 보관해 주세요!”']},
'eve':{icon:'🍎',description:'오래된 선택과 기억을 품은 상징적인 물건.',lines:['“그 물건을 네가 갖게 됐구나.”','“오래된 물건은 보는 사람에 따라 다른 이야기를 들려주지.”']},
'emily':{icon:'☁️',description:'구름처럼 가볍고 순수한 천국의 소지품.',lines:['“우와! 그거 나왔어? 예쁘다!”','“좋은 결과네! 어떤 의미인지 같이 생각해보자!”']},
'baxter':{icon:'🧪',description:'실험실과 연구 기록에서 나온 과학적 잡동사니.',lines:['“확률상 나쁘지 않은 결과야.”','“그거? 실험용으론 흥미롭겠네. 기록해 둬.”']},
'zestial':{icon:'🕸️',description:'오랜 세월을 견딘 물건과 조용한 인연의 흔적.',lines:['“오래된 물건이 그대 손에 닿았군.”','“간직하게. 세월은 사소한 것에도 뜻을 남기니.”']}
};

const ITEM_EMOJI={
'charlie-morningstar-collection-welcome-sticker':'🏨','charlie-morningstar-collection-paper-star':'⭐','charlie-morningstar-collection-hotel-keychain':'🔑','charlie-morningstar-collection-redemption-card':'✅','charlie-morningstar-collection-messy-schedule':'🗓️','charlie-morningstar-collection-hotel-ribbon':'🎀','charlie-morningstar-collection-unfinished-score':'🎼','charlie-morningstar-collection-group-photo':'📸','charlie-morningstar-collection-happy-hotel-brochure':'📕','charlie-morningstar-collection-private-encouragement':'💌',
'vaggie-collection-spare-keycard':'🪪','vaggie-collection-bandage-pack':'🩹','vaggie-collection-escape-map':'🗺️','vaggie-collection-wrist-guard':'🥊','vaggie-collection-metal-whistle':'📣','vaggie-collection-work-checklist':'📋','vaggie-collection-leather-strap':'🪢','vaggie-collection-training-card':'🥋','vaggie-collection-charlie-emergency-plan':'🚨','vaggie-collection-old-red-ribbon':'🎀',
'alastor-collection-frequency-card':'📻','alastor-collection-brass-dial':'🎛️','alastor-collection-station-matchbox':'🔥','alastor-collection-record-sleeve':'💿','alastor-collection-microphone-pin':'🎙️','alastor-collection-broadcast-cuesheet':'📜','alastor-collection-needle-case':'🎵','alastor-collection-sealed-recipe':'🍲','alastor-collection-private-script':'📄','alastor-collection-signoff-card':'📻',
'angel-dust-collection-star-sticker':'✨','angel-dust-collection-pink-lighter':'🔥','angel-dust-collection-spider-mirror':'🪞','angel-dust-collection-glitter-case':'💄','angel-dust-collection-drink-token':'🍸','angel-dust-collection-fat-nuggets-photo':'🐷','angel-dust-collection-silk-handkerchief':'🧣','angel-dust-collection-old-callsheet':'🎬','angel-dust-collection-photo-booth':'📷','angel-dust-collection-private-note':'💌',
'husk-collection-bar-coaster':'🥃','husk-collection-bottle-opener':'🍾','husk-collection-black-dice':'🎲','husk-collection-bent-chip':'🎰','husk-collection-cocktail-card':'🍸','husk-collection-card-case':'🃏','husk-collection-spade-king':'♠️','husk-collection-casino-matchbox':'🔥','husk-collection-old-overlord-chip':'🎰','husk-collection-tailored-drink-recipe':'🥃',
'niffty-collection-shiny-button':'🔘','niffty-collection-mini-duster':'🪶','niffty-collection-stain-chart':'🧼','niffty-collection-red-thread':'🧵','niffty-collection-roach-doll':'🪳','niffty-collection-bad-boy-sticker':'😈','niffty-collection-favorite-brush':'🧹','niffty-collection-roach-crown':'👑','niffty-collection-secret-box':'📦','niffty-collection-perfect-cleaning-notes':'✨',
'sir-pentious-collection-brass-screw':'🔩','sir-pentious-collection-small-gear':'⚙️','sir-pentious-collection-eggboi-card':'🥚','sir-pentious-collection-goggle-lens':'🥽','sir-pentious-collection-duck-blueprint-scribble':'🦆','sir-pentious-collection-airship-badge':'🚀','sir-pentious-collection-blueprint-fragment':'📐','sir-pentious-collection-eggboi-photo':'📸','sir-pentious-collection-cherri-dented-gear':'⚙️','sir-pentious-collection-thank-you-card':'💌',
'cherri-bomb-collection-red-marker':'🖍️','cherri-bomb-collection-bomb-sticker':'💣','cherri-bomb-collection-club-token':'🍸','cherri-bomb-collection-broken-goggle':'🥽','cherri-bomb-collection-colored-fuse':'🧨','cherri-bomb-collection-graffiti-glove':'🧤','cherri-bomb-collection-street-sign-fragment':'🚧','cherri-bomb-collection-mixtape':'🎧','cherri-bomb-collection-pentious-gear':'⚙️','cherri-bomb-collection-cherri-charm':'🍒'
};

function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function write(s,source='character-gacha-profiles-v2'){
  const v=JSON.stringify(s);localStorage.setItem(K,v);
  try{window.dispatchEvent(new StorageEvent('storage',{key:K,newValue:v}))}catch{}
  window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source,clearDirty:false}}));
  window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source}}));
}
function uiRead(){try{return JSON.parse(localStorage.getItem(UIK)||'{}')||{}}catch{return{}}}
function uiWrite(v){try{localStorage.setItem(UIK,JSON.stringify(v))}catch{}}
function charName(s,cid){return(s.characters||[]).find(c=>String(c.id)===String(cid))?.name||cid||'CHARACTER'}
function legacyProfile(s,cid){
  const p=s.gachaProfiles?.[cid]||{},cp=s.collectionProfiles?.[cid]||{},d=DEFAULTS[cid]||{icon:'🎴',description:`${charName(s,cid)}의 컬렉션 카드.`,lines:[]};
  return{
    icon:String(p.icon||cp.gachaIcon||cp.collectionIcon||cp.icon||d.icon||'🎴'),
    title:String(p.title||cp.gachaTitle||`${charName(s,cid)} GACHA`),
    description:String(p.description||cp.gachaDescription||d.description||''),
    revealLines:lines(p.revealLines||p.lines||cp.gachaRevealLines||cp.gachaLines||cp.drawLines||cp.revealLines||d.lines||[])
  };
}
function ensureData(){
  const s=read();let changed=false;
  s.characters=Array.isArray(s.characters)?s.characters:[];
  s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);
  s.items=s.collectionItems;
  s.collectionProfiles=s.collectionProfiles&&typeof s.collectionProfiles==='object'?s.collectionProfiles:{};
  s.gachaProfiles=s.gachaProfiles&&typeof s.gachaProfiles==='object'?s.gachaProfiles:{};
  for(const c of s.characters){
    const cid=String(c?.id||'');if(!cid)continue;
    const next=legacyProfile(s,cid),old=s.gachaProfiles[cid]||{};
    const merged={...next,...old};
    if(!merged.icon)merged.icon=next.icon;if(!merged.title)merged.title=next.title;if(!merged.description)merged.description=next.description;
    if(!lines(merged.revealLines||merged.lines).length)merged.revealLines=next.revealLines;
    else merged.revealLines=lines(merged.revealLines||merged.lines);
    if(JSON.stringify(old)!==JSON.stringify(merged)){s.gachaProfiles[cid]=merged;changed=true}
    const cp=s.collectionProfiles[cid]||{};
    const cpn={...cp};
    if(!cp.icon&&next.icon)cpn.icon=next.icon;
    if(!cp.gachaIcon&&next.icon)cpn.gachaIcon=next.icon;
    if(!cp.gachaTitle&&next.title)cpn.gachaTitle=next.title;
    if(!cp.gachaDescription&&next.description)cpn.gachaDescription=next.description;
    if(!lines(cp.gachaRevealLines||cp.gachaLines||cp.drawLines).length&&next.revealLines.length)cpn.gachaRevealLines=next.revealLines;
    if(JSON.stringify(cp)!==JSON.stringify(cpn)){s.collectionProfiles[cid]=cpn;changed=true}
  }
  let migrated=false;try{migrated=localStorage.getItem(MIG)==='1'}catch{}
  for(const item of s.collectionItems){
    const id=String(item?.id||'');if(!id)continue;
    const icon=ITEM_EMOJI[id];
    if(icon&&!migrated&&item.symbol!==icon){item.symbol=icon;changed=true}
    if(icon&&item.gachaEnabled==null){item.gachaEnabled=true;changed=true}
    const desc=String(item.gachaDescription||'').trim(),fallback=String(item.desc||item.description||item.memo||'').trim();
    if(icon&&!desc&&fallback){item.gachaDescription=fallback;changed=true}
  }
  if(changed)write(s,'character-gacha-seed-v2');
  if(!migrated){try{localStorage.setItem(MIG,'1')}catch{}}
  return s;
}
function profile(s,cid){return legacyProfile(s,cid)}
function itemDesc(i){return String(i?.gachaDescription||i?.desc||i?.description||i?.memo||'').trim()}
function revealLine(s,item){
  const custom=String(item?.gachaLine||item?.drawLine||item?.revealLine||'').trim();if(custom)return custom;
  const ls=profile(s,item?.characterId).revealLines;if(!ls.length)return'';
  let h=0,key=`${item?.id||''}:${s.gachaAddon?.totalDraws||0}`;for(const ch of key)h=((h<<5)-h+ch.charCodeAt(0))|0;
  return ls[Math.abs(h)%ls.length];
}

function editorPanel(s,cid){
  const p=profile(s,cid),items=(s.collectionItems||[]).filter(i=>String(i.characterId)===cid);
  return`<section class="cg-gacha-editor" data-cg-panel data-cg-cid="${esc(cid)}">
    <article class="editor-card cg-profile-card"><p class="label">${esc(charName(s,cid))} / GACHA</p>
      <p class="muted">캐릭터별 대표 이모지, 가챠 설명, 당첨 문구를 정합니다. 새 캐릭터도 이 탭을 그대로 사용할 수 있습니다.</p>
      <div class="form-grid">
        <label>Character Emoji<input data-cg-icon value="${esc(p.icon)}" maxlength="12" placeholder="🌈"></label>
        <label>Gacha Title<input data-cg-title value="${esc(p.title)}"></label>
        <label class="full">Gacha Description<textarea data-cg-description rows="3">${esc(p.description)}</textarea></label>
        <label class="full">Reveal Lines<textarea data-cg-lines rows="5" placeholder="한 줄에 하나씩 입력">${esc(p.revealLines.join('\n'))}</textarea><small>1회 뽑기 결과에서 캐릭터 아이콘과 함께 표시됩니다.</small></label>
      </div>
    </article>
    <article class="editor-card"><div class="cg-pool-head"><div><p class="label">CHARACTER GACHA POOL</p><p class="muted">아이템마다 가챠 포함 여부, 가중치, 결과 설명, 전용 당첨 문구를 지정합니다.</p></div><b>${items.length} ITEMS</b></div>
      <div class="cg-pool-list">${items.length?items.map(i=>`<details class="cg-pool-row" data-cg-item="${esc(i.id)}">
        <summary><span class="cg-item-emoji">${esc(i.symbol||'🎴')}</span><span><strong>${esc(i.name||i.title||'Item')}</strong><small>${esc(String(i.rarity||'COMMON'))}</small></span><label class="cg-switch"><input type="checkbox" data-cg-enabled ${i.gachaEnabled!==false?'checked':''}> GACHA</label><label>Weight<input type="number" min="0" step="1" data-cg-weight value="${Number(i.gachaWeight)>0?esc(Number(i.gachaWeight)):''}" placeholder="AUTO"></label></summary>
        <div class="cg-pool-detail"><label>Draw Description<textarea rows="2" data-cg-item-desc>${esc(itemDesc(i))}</textarea></label><label>Reveal Line Override<textarea rows="2" data-cg-item-line placeholder="비우면 캐릭터 공통 문구 사용">${esc(i.gachaLine||i.drawLine||i.revealLine||'')}</textarea></label></div>
      </details>`).join(''):'<p class="empty-state">이 캐릭터의 Collection Item이 아직 없습니다. Collection 탭에서 먼저 추가하세요.</p>'}</div>
      <div class="button-row"><button type="button" class="gold-button" data-cg-save>SAVE GACHA SETTINGS</button></div>
    </article>
  </section>`;
}
function patchEditor(){
  const tabs=$('.editor-main .extras-tabs');if(!tabs)return;
  let btn=tabs.querySelector('[data-cg-gacha-tab]');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.dataset.cgGachaTab='1';btn.textContent='GACHA';tabs.appendChild(btn)}
  const ui=uiRead(),active=!!ui.active;
  btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  if(!active)return;
  tabs.querySelectorAll('[data-ext]').forEach(x=>x.classList.remove('active'));
  const s=read(),cid=String(s.active||'');if(!cid)return;
  const main=tabs.parentElement,old=main.querySelector('[data-cg-panel]');
  if(old&&old.dataset.cgCid===cid)return;
  Array.from(main.children).forEach(ch=>{if(ch!==tabs)ch.remove()});
  tabs.insertAdjacentHTML('afterend',editorPanel(s,cid));
}
function saveEditor(){
  const panel=$('[data-cg-panel]');if(!panel)return;
  const s=read(),cid=String(panel.dataset.cgCid||s.active||'');if(!cid)return;
  s.gachaProfiles=s.gachaProfiles&&typeof s.gachaProfiles==='object'?s.gachaProfiles:{};
  s.collectionProfiles=s.collectionProfiles&&typeof s.collectionProfiles==='object'?s.collectionProfiles:{};
  const p={icon:String($('[data-cg-icon]',panel)?.value||'🎴').trim()||'🎴',title:String($('[data-cg-title]',panel)?.value||`${charName(s,cid)} GACHA`).trim(),description:String($('[data-cg-description]',panel)?.value||'').trim(),revealLines:lines($('[data-cg-lines]',panel)?.value||'')};
  s.gachaProfiles[cid]=p;
  s.collectionProfiles[cid]={...(s.collectionProfiles[cid]||{}),icon:p.icon,gachaIcon:p.icon,gachaTitle:p.title,gachaDescription:p.description,gachaRevealLines:p.revealLines};
  $$('[data-cg-item]',panel).forEach(row=>{
    const id=String(row.dataset.cgItem||''),item=(s.collectionItems||[]).find(x=>String(x.id)===id);if(!item)return;
    item.gachaEnabled=!!$('[data-cg-enabled]',row)?.checked;
    const w=Number($('[data-cg-weight]',row)?.value||0);if(w>0)item.gachaWeight=w;else delete item.gachaWeight;
    item.gachaDescription=String($('[data-cg-item-desc]',row)?.value||item.desc||item.description||'').trim();
    item.gachaLine=String($('[data-cg-item-line]',row)?.value||'').trim();
  });
  write(s,'character-gacha-editor-v2');
  toast('GACHA SETTINGS SAVED');
  schedule();
}

function patchCollection(){
  const s=read();
  $$('[data-hvg-group]').forEach(b=>{const cid=String(b.dataset.hvgGroup||''),p=profile(s,cid),host=b.querySelector(':scope > span:first-child');if(!host)return;let ico=host.querySelector('.cg-group-icon');if(!ico){ico=document.createElement('b');ico.className='cg-group-icon';ico.setAttribute('aria-hidden','true');host.prepend(ico)}ico.textContent=p.icon});
  $$('[data-col]').forEach(b=>{const cid=String(b.dataset.col||''),p=profile(s,cid),host=b.querySelector('span');if(!host)return;let ico=host.querySelector('.cg-group-icon');if(!ico){ico=document.createElement('b');ico.className='cg-group-icon';ico.setAttribute('aria-hidden','true');host.prepend(ico)}ico.textContent=p.icon});
}
function patchDrawResults(){
  const root=$('#hellaverseGachaRoot');if(!root)return;
  const s=read();
  const single=$('.hvg-result-card',root);
  if(single){
    const id=single.querySelector('[data-hvg-view]')?.dataset.hvgView,item=(s.collectionItems||[]).find(i=>String(i.id)===String(id));
    if(item){
      const p=profile(s,item.characterId),line=revealLine(s,item),desc=itemDesc(item),copy=$('.hvg-result-copy',single);
      let box=single.querySelector('.cg-draw-extra');
      const html=`<div class="cg-draw-speaker"><span>${esc(p.icon)}</span><div><strong>${esc(charName(s,item.characterId))}</strong>${p.description?`<small>${esc(p.description)}</small>`:''}</div></div>${line?`<p class="cg-reveal-line">${esc(line)}</p>`:''}${desc?`<p class="cg-draw-description">${esc(desc)}</p>`:''}`;
      if(copy){if(!box){box=document.createElement('section');box.className='cg-draw-extra';copy.appendChild(box)}box.innerHTML=html}
    }
  }
  $$('.hvg-ten-grid [data-hvg-detail]',root).forEach(b=>{
    const id=String(b.dataset.hvgDetail||''),item=(s.collectionItems||[]).find(i=>String(i.id)===id);if(!item)return;
    const p=profile(s,item.characterId),desc=itemDesc(item);let extra=b.querySelector('.cg-ten-extra');if(!extra){extra=document.createElement('span');extra.className='cg-ten-extra';b.appendChild(extra)}extra.innerHTML=`<b>${esc(p.icon)}</b>${desc?`<small>${esc(short(desc,82))}</small>`:''}`;
  });
}
function patchGachaLauncher(){$$('[data-hvg-open]').forEach(b=>{if(b.querySelector('.cg-launch-icon'))return;const span=document.createElement('span');span.className='cg-launch-icon';span.textContent='🎴';b.prepend(span)})}
function toast(text){let n=document.createElement('div');n.className='cg-toast';n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),1700)}

let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchEditor();patchCollection();patchDrawResults();patchGachaLauncher()})}
function boot(){ensureData();schedule();const app=$('#app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});setTimeout(schedule,250);setTimeout(schedule,900)}

document.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(t.closest('[data-cg-gacha-tab]')){e.preventDefault();e.stopImmediatePropagation();uiWrite({...uiRead(),active:true});schedule();return}
  if(t.closest('[data-ext]')){uiWrite({...uiRead(),active:false});return}
  const sec=t.closest('[data-sec]')?.dataset.sec;if(sec&&sec!=='extras')uiWrite({...uiRead(),active:false});
  if(t.closest('[data-cg-save]')){e.preventDefault();e.stopImmediatePropagation();saveEditor();return}
},true);
document.addEventListener('input',e=>{if(e.target instanceof Element&&e.target.closest('[data-cg-panel]'))e.stopImmediatePropagation()},true);
document.addEventListener('change',e=>{if(e.target instanceof Element&&e.target.closest('[data-cg-panel]'))e.stopImmediatePropagation()},true);
window.addEventListener('hellaverse:state-updated',e=>{if(!String(e.detail?.source||'').startsWith('character-gacha-'))schedule()});
window.addEventListener('hellaverse:gacha-updated',schedule);
window.addEventListener('pageshow',()=>{ensureData();schedule()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();