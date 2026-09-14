(()=>{
const STATE_KEY='hellaverse_dialogue_state_v1';
const VERSION_KEY='hellaverse_hotel_collection_pack_version';
const VERSION=1;
let current=0;try{current=Number(localStorage.getItem(VERSION_KEY)||0)||0}catch{}
if(current>=VERSION)return;
const PACKS={
'charlie-morningstar':{title:'CHARLIE COLLECTION',memo:'호텔과 사람들을 챙기며 남은 작은 기록들.',items:[
['welcome-sticker','Hazbin Hotel 웰컴 스티커','★','COMMON',10,'호텔 홍보용으로 잔뜩 만들어 둔 웰컴 스티커.','아! 이거 하나 가져갈래? 강요는 아니고! 그냥… 귀엽잖아?',['hotel','sticker'],'NEUTRAL',{'vaggie':'LIKED'}],
['paper-star','손으로 접은 작은 별','✦','COMMON',20,'회의 중 남는 종이로 접은 작은 별. 모서리가 조금 삐뚤다.','회의하면서 만들었는데 생각보다 잘 됐어! 그러니까 네 거.',['handmade','paper'],'NEUTRAL',{}],
['hotel-keychain','빨강·금색 호텔 열쇠고리','◆','UNCOMMON',30,'새 호텔용으로 시험 제작한 열쇠고리 샘플.','샘플이 하나 남았거든. 네가 갖고 있으면… 좀 호텔 식구 같고 좋을 것 같아서.',['hotel','keychain'],'NEUTRAL',{'lucifer-morningstar':'LIKED','vaggie':'LIKED'}],
['redemption-card','구원 체크리스트 카드','✓','UNCOMMON',40,'찰리가 직접 만든 습관 체크 카드. 빈칸과 별표가 많다.','체크를 다 할 필요는 없어! 사실 나도 못 해. 그냥 도움이 되면 좋겠다 싶어서.',['hotel','redemption','paper'],'NEUTRAL',{}],
['messy-schedule','낙서가 가득한 일정표 한 장','☰','RARE',50,'하루 계획이 수십 번 수정된 일정표. 옆에 응원 문구가 적혀 있다.','계획표긴 한데… 계획대로 된 건 거의 없어. 그래도 꽤 열심히 썼어!',['schedule','hotel','handwritten'],'NEUTRAL',{'vaggie':'LIKED'}],
['hotel-ribbon','호텔 기념 리본','⌁','RARE',60,'호텔 행사 장식에 쓰였던 붉은 리본 조각.','버리려고 했는데 못 버리겠더라. 좋은 날이었거든. 너한테 주고 싶어.',['hotel','memory'],'LIKED',{'lucifer-morningstar':'LIKED','vaggie':'LIKED'}],
['unfinished-score','미완성 노래 악보','♫','EPIC',70,'지우고 다시 쓴 흔적이 많은 미완성 악보.','아직 완성 안 됐어! 그러니까 평가 금지. …근데 네가 갖고 있어줬으면 해.',['music','handwritten','memory'],'LIKED',{'lucifer-morningstar':'LIKED','vaggie':'LIKED'}],
['group-photo','호텔 단체사진 복사본','▣','EPIC',80,'다 함께 제대로 찍힌 드문 사진. 뒤에는 찰리의 짧은 메모가 있다.','다 같이 제대로 찍힌 사진이 별로 없잖아. 너도 한 장 있어야지.',['photo','hotel','family'],'LIKED',{'lucifer-morningstar':'LOVED','vaggie':'LOVED'}],
['happy-hotel-brochure','초창기 호텔 브로슈어','◇','LEGENDARY',90,'Happy Hotel 시절의 오래된 홍보물. 처음의 꿈이 고스란히 남아 있다.','엄청 촌스럽지? 그래도… 내가 처음 진짜 해보겠다고 마음먹었던 때의 거야.',['hotel','memory','redemption'],'LIKED',{'lucifer-morningstar':'LOVED','vaggie':'LIKED'}],
['private-encouragement','Charlie의 개인 메모 카드','♥','MISTIC',95,'앞에는 격려문, 뒤에는 특정 사람에게만 쓴 짧은 한 줄이 있다.','이건 남들한테 보여주려고 쓴 게 아니야. 그냥… 네가 힘들 때 봐.',['handwritten','memory','personal'],'LIKED',{'lucifer-morningstar':'LOVED','vaggie':'LOVED'}]
]},
'vaggie':{title:'VAGGIE COLLECTION',memo:'실용적인 준비물 사이에 숨은 애정과 경계심.',items:[
['spare-keycard','호텔 예비 키카드','▤','COMMON',10,'호텔 직원용으로 보관해 둔 예비 키카드.','잃어버리지 마. 다시 만드는 거 귀찮으니까.',['hotel','utility'],'NEUTRAL',{'charlie-morningstar':'LIKED'}],
['bandage-pack','소형 응급 붕대팩','✚','COMMON',20,'항상 챙겨 두던 휴대용 응급 붕대.','가지고 있어. 여기선 언제 뭐가 터질지 모르잖아.',['medical','utility'],'NEUTRAL',{'charlie-morningstar':'LIKED'}],
['escape-map','접힌 비상대피도','⌖','UNCOMMON',30,'호텔 비상구와 우회 경로를 직접 표시한 대피도.','빨간 선 따라가면 돼. Charlie가 만든 안내도보다 이게 훨씬 알아보기 쉬워.',['hotel','safety'],'NEUTRAL',{}],
['wrist-guard','검은 손목 보호대','▱','UNCOMMON',40,'훈련 때 쓰던 손목 보호대. 사용감은 있지만 단단하다.','난 새 거 있어. 멀쩡하니까 쓰든가.',['training','gear'],'NEUTRAL',{}],
['metal-whistle','작은 금속 호루라기','◈','RARE',50,'호텔 비상용으로 들고 다니던 작은 호루라기.','진짜 위험할 때만 불어. 장난치면 내가 먼저 찾아간다.',['safety','hotel'],'NEUTRAL',{'charlie-morningstar':'LIKED'}],
['work-checklist','수정 투성이 업무 체크리스트','☑','RARE',60,'찰리의 일정까지 함께 정리한 업무 체크리스트.','왜 이걸 갖고 싶어 하는진 모르겠는데… 그래. 가져.',['hotel','work','handwritten'],'NEUTRAL',{'charlie-morningstar':'LIKED'}],
['leather-strap','수선한 가죽 스트랩','⌇','EPIC',70,'오랫동안 쓰고 직접 수선한 가죽 스트랩.','버리려다 말았어. 아직 쓸 수 있거든. 네가 써.',['gear','handmade'],'LIKED',{}],
['training-card','훈련 기록 카드','▲','EPIC',80,'개인 훈련 기록과 작은 메모가 적힌 카드 묶음.','다른 사람한텐 안 보여줘. 내 기록이라서 그래.',['training','personal'],'LIKED',{}],
['charlie-emergency-plan','Charlie용 비상계획 초안','⚑','LEGENDARY',90,'찰리에게 무슨 일이 생길 경우를 대비해 적어 둔 비상계획.','…이거 내가 썼다는 건 Charlie한텐 말하지 마. 걱정할 테니까.',['charlie','family','safety'],'LIKED',{'charlie-morningstar':'LOVED','lucifer-morningstar':'LIKED'}],
['old-red-ribbon','낡은 붉은 리본 조각','⌁','MISTIC',95,'이유를 설명하지 않은 채 오래 보관해온 작은 붉은 리본.','왜 안 버렸는지는 나도 몰라. …그냥 네가 가지고 있어.',['memory','personal'],'LIKED',{'charlie-morningstar':'LOVED'}]
]},
'alastor':{title:'ALASTOR COLLECTION',memo:'방송과 빈티지 취향, 그리고 좀처럼 내주지 않는 개인 기록.',items:[
['frequency-card','낡은 라디오 주파수 카드','⌁','COMMON',10,'오래된 방송용 주파수 표.','기념품이라 생각하시지요. 아직 청구서는 없습니다.',['radio','vintage'],'NEUTRAL',{'vox':'DISLIKED'}],
['brass-dial','황동 라디오 다이얼','◉','COMMON',20,'고장 난 라디오에서 떼어낸 황동 다이얼.','쓸모는 끝났지만 모양은 제법 훌륭하지 않습니까?',['radio','vintage','mechanical'],'NEUTRAL',{'vox':'DISLIKED'}],
['station-matchbox','빈티지 방송국 성냥갑','▰','UNCOMMON',30,'오래전 방송국 광고가 인쇄된 성냥갑.','불을 붙이는 용도보다 장식으로 두시는 편이 오래 가겠군요.',['radio','vintage'],'NEUTRAL',{'rosie':'LIKED'}],
['record-sleeve','낡은 레코드 슬리브','◎','UNCOMMON',40,'내용물 없이 표지만 남은 오래된 음반 슬리브.','음악이 없는 음반이라. 어떤 면에선 더욱 흥미롭지요.',['music','vintage'],'NEUTRAL',{}],
['microphone-pin','붉은 마이크 핀','♬','RARE',50,'작은 붉은색 마이크 장식 핀.','당신에게 어울릴지는… 지켜보면 알겠군요.',['radio','accessory'],'NEUTRAL',{'vox':'HATED'}],
['broadcast-cuesheet','손글씨 방송 큐시트','☷','RARE',60,'방송 순서와 진행 메모가 빼곡한 큐시트.','진행에는 질서가 필요하답니다. 혼란조차도 말이지요.',['radio','handwritten'],'LIKED',{'rosie':'LIKED','vox':'HATED'}],
['needle-case','오래된 축음기 바늘 케이스','♩','EPIC',70,'아주 잘 관리된 축음기 바늘 케이스.','소중히 다루십시오. 요즘 것은 영 품위가 없어서.',['music','vintage'],'LIKED',{}],
['sealed-recipe','봉인된 조리법 카드','♨','EPIC',80,'알래스터가 직접 적은 조리법 카드. 봉투가 단정히 봉인되어 있다.','따라 하셔도 좋습니다. 같은 맛이 날 거라곤 보장 못 하지만요.',['food','handwritten','personal'],'LIKED',{'rosie':'LOVED'}],
['private-script','개인 방송 원고 한 장','¶','LEGENDARY',90,'공개되지 않은 방송 원고 한 장.','낭독은 삼가주시지요. 제 목소리가 아니면 맛이 안 삽니다.',['radio','handwritten','personal'],'LIKED',{'vox':'HATED','rosie':'LIKED'}],
['signoff-card','라디오 방송 종료표','✦','MISTIC',95,'오래전에 사용했던 방송 종료표. 손때가 남아 있다.','추억이라 부르는 건 지나치게 감상적이군요. …그래도 돌려주실 필요는 없습니다.',['radio','memory','personal'],'LIKED',{'vox':'HATED','rosie':'LOVED'}]
]},
'angel-dust':{title:'ANGEL DUST COLLECTION',memo:'화려한 잡동사니에서 점점 개인적인 흔적으로.',items:[
['star-sticker','별 모양 스티커','☆','COMMON',10,'화장대에서 굴러다니던 반짝이 별 스티커.','자기, 공짜야. 나중에 청구 안 할 테니까 표정 풀어.',['fashion','sticker'],'NEUTRAL',{'cherri-bomb':'LIKED'}],
['pink-lighter','분홍 라이터','▮','COMMON',20,'자주 쓰던 것과 똑같은 디자인의 여분 라이터.','잃어버려도 울진 마. …아니, 울면 좀 웃기긴 하겠다.',['personal','fashion'],'NEUTRAL',{'husk':'NEUTRAL','cherri-bomb':'LIKED'}],
['spider-mirror','스파이더 무늬 손거울','◐','UNCOMMON',30,'촬영용으로 쓰던 작은 손거울.','이걸로 나 보지 마. 네 얼굴 보는 데 쓰라고.',['fashion','mirror'],'NEUTRAL',{}],
['glitter-case','반짝이 립밤 케이스','◇','UNCOMMON',40,'내용물은 비었지만 케이스만큼은 화려하다.','내용물은 없어. 케이스가 예쁘잖아. 나처럼.',['fashion','cosmetic'],'NEUTRAL',{}],
['drink-token','클럽 드링크 토큰','●','RARE',50,'오래 주머니에 넣어둔 클럽용 드링크 토큰.','한 잔 값이야. 내가 같이 갈 거란 뜻은 아니고. …아마.',['club','memory'],'NEUTRAL',{'cherri-bomb':'LIKED','husk':'LIKED'}],
['fat-nuggets-photo','Fat Nuggets 사진','▣','RARE',60,'Fat Nuggets의 사진. 뒤에는 Angel의 낙서가 있다.','구겨지면 진짜 화낼 거야. 돼지 사진한테, 아니 너한테.',['photo','fat-nuggets','personal'],'LIKED',{'husk':'LIKED','cherri-bomb':'LIKED'}],
['silk-handkerchief','분홍 실크 손수건','≈','EPIC',70,'Angel이 실제로 쓰던 분홍 실크 손수건.','깨끗한 거야, 미친 생각 하지 마. 이번엔 진짜로.',['fashion','personal'],'LIKED',{}],
['old-callsheet','낡은 촬영 콜시트','▤','EPIC',80,'이름에 여러 번 줄을 그어 놓은 낡은 촬영 콜시트.','좋은 기억은 아니야. 그냥… 버리긴 싫었어.',['work','memory','personal'],'NEUTRAL',{'husk':'LIKED'}],
['photo-booth','작은 사진 부스 사진','▣','LEGENDARY',90,'과장된 포즈가 아닌 평범하게 웃고 있는 사진.','웃지 마. 사진 잘 나온 날도 있다고.',['photo','memory','personal'],'LIKED',{'husk':'LOVED','cherri-bomb':'LOVED'}],
['private-note','직접 쓴 짧은 메모','✎','MISTIC',95,'농담 없이 적은 짧은 개인 메모.','…딴 놈 보여주지 마. 쪽팔리니까.',['handwritten','personal','memory'],'LIKED',{'husk':'LOVED','cherri-bomb':'LIKED'}]
]},
'husk':{title:'HUSK COLLECTION',memo:'바와 도박의 흔적, 말보다 오래 남아 있던 물건들.',items:[
['bar-coaster','호텔 바 코스터','◫','COMMON',10,'호텔 바에서 흔히 쓰는 코스터 한 장.','하나 가져. 어차피 잔뜩 있어.',['bar','hotel'],'NEUTRAL',{'angel-dust':'NEUTRAL'}],
['bottle-opener','낡은 병따개','⌑','COMMON',20,'오래 사용해 손잡이가 닳은 병따개.','새 거 생겼다. 이건 네가 써.',['bar','utility'],'NEUTRAL',{}],
['black-dice','검은 주사위 한 쌍','⚄','UNCOMMON',30,'평범한 카지노용 검은 주사위.','운 시험하고 싶으면 해. 나한테 돈 빌리진 말고.',['gambling','casino'],'NEUTRAL',{}],
['bent-chip','구겨진 포커 칩','●','UNCOMMON',40,'가장자리가 눌린 오래된 카지노 칩.','값은 없어. 그래서 주는 거야.',['gambling','casino'],'NEUTRAL',{'angel-dust':'LIKED'}],
['cocktail-card','칵테일 레시피 카드','♨','RARE',50,'Husk의 짧은 메모가 적힌 칵테일 레시피.','비율 틀리면 내 이름 붙이지 마.',['bar','handwritten'],'LIKED',{'angel-dust':'LIKED'}],
['card-case','낡은 카드 케이스','▣','RARE',60,'테두리가 닳은 오래된 카드 케이스.','카드는 뺐어. 그 정도 양심은 있다.',['gambling','personal'],'NEUTRAL',{}],
['spade-king','스페이드 킹 카드','♠','EPIC',70,'모서리가 접힌 스페이드 킹 한 장.','왜 이 한 장만 남겼는지 묻지 마.',['gambling','memory'],'LIKED',{'angel-dust':'LIKED'}],
['casino-matchbox','오래된 카지노 성냥갑','▰','EPIC',80,'과거의 카지노 로고가 남은 오래된 성냥갑.','…오래 들고 있었네. 이제 네가 가져.',['casino','memory','personal'],'LIKED',{}],
['old-overlord-chip','옛 카지노 칩','◆','LEGENDARY',90,'한때 큰돈과 권력을 상징했던 오래된 칩.','이게 한때 꽤 큰돈이었어. 지금은 그냥 플라스틱이지.',['casino','memory','overlord'],'LIKED',{'angel-dust':'LIKED'}],
['tailored-drink-recipe','손으로 적은 술 레시피','✎','MISTIC',95,'특정 사람의 취향에 맞춰 직접 조정한 술 레시피.','네 취향 맞춰놓은 거야. 특별한 뜻 붙이지 마.',['bar','handwritten','personal'],'LIKED',{'angel-dust':'LOVED'}]
]},
'niffty':{title:'NIFFTY COLLECTION',memo:'청소 도구와 기묘한 수집품. 본인 기준으로는 전부 보물.',items:[
['shiny-button','반짝이는 단추','●','COMMON',10,'청소하다 발견한 반짝이는 단추 하나.','찾았다! 이제 네 거야! 왜인진 몰라!',['found','shiny'],'NEUTRAL',{}],
['mini-duster','미니 먼지털이','≈','COMMON',20,'손바닥만 한 작은 먼지털이.','작아! 귀여워! 먼지도 죽일 수 있어!',['cleaning','tool'],'NEUTRAL',{}],
['stain-chart','얼룩 제거 체크표','☷','UNCOMMON',30,'얼룩 종류와 제거법이 빼곡한 Niffty식 체크표.','피! 소스! 기름! 다 달라! 외워!',['cleaning','handwritten'],'NEUTRAL',{}],
['red-thread','붉은 실뭉치','⌁','UNCOMMON',40,'수선용으로 모아둔 붉은 실뭉치.','묶을 수도 있고 꿰맬 수도 있고— 다른 것도 할 수 있어!',['sewing','craft'],'NEUTRAL',{}],
['roach-doll','바퀴벌레 인형','♣','RARE',50,'직접 만든 기묘한 바퀴벌레 인형.','안 죽어! 가짜니까! 조금 아쉬워!',['roach','handmade'],'NEUTRAL',{}],
['bad-boy-sticker','BAD BOY 스티커','★','RARE',60,'Niffty가 따로 모아두던 BAD BOY 스티커.','넌 아직 아니야. 스티커만 줄게!',['sticker','bad-boy'],'NEUTRAL',{}],
['favorite-brush','작은 청소 솔','║','EPIC',70,'손잡이에 Niffty의 표시가 남은 아끼는 청소 솔.','이건 내 좋은 솔인데! 너니까 하나 줄게!',['cleaning','personal'],'LIKED',{}],
['roach-crown','King Roach 왕관 복제품','♛','EPIC',80,'나뭇가지와 작은 조각으로 만든 바퀴벌레 왕관 복제품.','왕이다! 아니, 넌 왕 아니야. 이건 그냥 왕관이야!',['roach','handmade'],'LIKED',{}],
['secret-box','비밀 수집 상자','▣','LEGENDARY',90,'단추와 실, 정체 모를 작은 조각들이 든 상자.','남자한테서 얻은 것도 있어! 뭐가 뭔지는 비밀!',['collection','personal','found'],'LIKED',{}],
['perfect-cleaning-notes','Niffty의 완벽한 청소 메모','✎','MISTIC',95,'Niffty가 아는 청소법을 정성껏 적은 수기.','내가 아는 거 다 적었어! 거의 다! 위험한 건 뺐어. 조금.',['cleaning','handwritten','personal'],'LIKED',{}]
]},
'sir-pentious':{title:'SIR PENTIOUS COLLECTION',memo:'거창한 발명품 조각과 의외로 솔직한 추억.',items:[
['brass-screw','남는 황동 나사','⚙','COMMON',10,'발명대에서 굴러다니던 황동 나사 하나.','무려 내 발명품에 사용될 수도 있었던 나사다! 영광으로 알게!',['invention','mechanical'],'NEUTRAL',{}],
['small-gear','작은 톱니바퀴','⚙','COMMON',20,'실험용 장치에서 빠진 작은 톱니바퀴.','쓸모없어진 것이 아니다! 단지… 지금은 용도가 없을 뿐!',['invention','mechanical'],'NEUTRAL',{}],
['eggboi-card','Egg Boi 낙서 카드','☻','UNCOMMON',30,'Egg Boiz가 그린 그림을 Pentious가 버리지 못하고 보관한 카드.','내 부하들이 그렸다네. 수준은… 음. 열정은 훌륭하지!',['egg-boi','drawing'],'NEUTRAL',{'charlie-morningstar':'LIKED'}],
['goggle-lens','보호 고글 렌즈','◉','UNCOMMON',40,'교체 후 남겨둔 예비 보호 렌즈.','폭발 실험에는 눈 보호가 중요하다! 내가 배운 교훈이지!',['invention','safety'],'NEUTRAL',{}],
['duck-blueprint-scribble','소형 기계오리 설계 낙서','⌘','RARE',50,'루시퍼의 기계 장치를 보고 영감받아 끄적인 작은 설계 낙서.','그저 연습이다! 위대한 발명은 아직 시작도 안 했네!',['invention','duck','mechanical'],'NEUTRAL',{'lucifer-morningstar':'LIKED'}],
['airship-badge','미니 비행선 배지','✦','RARE',60,'직접 만든 소형 비행선 모양 배지.','나의 위대한 함대를 기념하는 상징이지! 아주 작지만.',['airship','invention'],'LIKED',{'charlie-morningstar':'LIKED'}],
['blueprint-fragment','발명품 청사진 조각','⌑','EPIC',70,'실패한 장치의 청사진 일부. 수정 표시가 빼곡하다.','실패라고 부르지 말게! 미완성 성공작이다!',['invention','blueprint','handwritten'],'LIKED',{}],
['eggboi-photo','Egg Boiz 단체사진','▣','EPIC',80,'Egg Boiz와 함께 찍은 단체사진. 의외로 잘 보관되어 있다.','내 충성스러운 부하들이지. …사진은 잘 보관해주게.',['egg-boi','photo','memory'],'LIKED',{'charlie-morningstar':'LIKED','cherri-bomb':'LIKED'}],
['cherri-dented-gear','Cherri와의 전투에서 찌그러진 기어','⚙','LEGENDARY',90,'Cherri와의 싸움에서 찌그러진 황동 기어.','그 여자가 망가뜨린 거다! 그래서 남긴 것이 절대 아니다!',['cherri','mechanical','memory'],'LIKED',{'cherri-bomb':'LOVED'}],
['thank-you-card','손으로 쓴 감사 카드','♥','MISTIC',95,'문장을 여러 번 고쳐 쓴 흔적이 남은 감사 카드.','읽고 웃으면 안 된다! 아니— 웃는 건 괜찮지만 비웃지는 말게!',['handwritten','personal','memory'],'LIKED',{'cherri-bomb':'LOVED','charlie-morningstar':'LOVED'}]
]},
'cherri-bomb':{title:'CHERRI BOMB COLLECTION',memo:'폭발과 거리의 흔적, 그리고 친구를 향한 애정.',items:[
['red-marker','낙서용 빨간 마커','▮','COMMON',10,'반쯤 사용한 굵은 빨간 마커.','아직 나와. 벽에 쓰든 얼굴에 쓰든 네 맘.',['graffiti','marker'],'NEUTRAL',{'angel-dust':'LIKED'}],
['bomb-sticker','폭탄 모양 스티커','✹','COMMON',20,'실제 폭탄처럼 그려진 장난용 스티커.','진짜인 줄 알고 쫄았냐? 귀엽네.',['bomb','sticker'],'NEUTRAL',{'angel-dust':'LIKED'}],
['club-token','클럽 드링크 토큰','●','UNCOMMON',30,'클럽에서 남은 드링크 토큰.','한 잔 마셔. 나 없을 때 너무 재미없게 놀진 말고.',['club','party'],'NEUTRAL',{'angel-dust':'LIKED'}],
['broken-goggle','깨진 고글 렌즈','◐','UNCOMMON',40,'싸움 중 깨져 한쪽만 남은 고글 렌즈.','나머지 한쪽은 어디 갔는지 몰라. 아마 터졌겠지.',['fight','gear'],'NEUTRAL',{}],
['colored-fuse','컬러 퓨즈 묶음','≈','RARE',50,'화약을 제거해 더는 폭발하지 않는 컬러 퓨즈 묶음.','안 터져. 내가 그렇게 멍청해 보여?',['bomb','craft'],'NEUTRAL',{}],
['graffiti-glove','낡은 그래피티 장갑','✋','RARE',60,'페인트 자국이 잔뜩 남은 작업 장갑.','씻으려 하지 마. 저 얼룩들이 포인트야.',['graffiti','personal'],'LIKED',{'angel-dust':'LIKED'}],
['street-sign-fragment','거리 표지판 조각','↗','EPIC',70,'예전 Turf에서 떼어온 작은 거리 표지판 조각.','저거 떼다가 존나 쫓겼어. 좋은 추억이지.',['street','memory'],'LIKED',{'angel-dust':'LIKED'}],
['mixtape','직접 만든 믹스테이프','♫','EPIC',80,'싸울 때 듣던 곡들을 직접 골라 담은 믹스테이프.','취향 구리다고 하면 다시 뺏는다.',['music','personal'],'LIKED',{'angel-dust':'LOVED'}],
['pentious-gear','찌그러진 황동 기어','⚙','LEGENDARY',90,'Pentious와 싸우던 시절 남긴 찌그러진 기어.','그 늙은 뱀 물건 아니야. …아마 맞긴 한데, 닥쳐.',['pentious','mechanical','memory'],'LIKED',{'sir-pentious':'LOVED','angel-dust':'LIKED'}],
['cherri-charm','작은 체리 폭탄 장식','✹','MISTIC',95,'Cherri가 직접 만든 무해한 체리 폭탄 모양 장식.','이건 안 터져. 네가 날 얼마나 못 믿는지 시험하는 중이냐?',['bomb','handmade','personal'],'LIKED',{'sir-pentious':'LOVED','angel-dust':'LOVED'}]
]}
};
function read(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}}
function save(s){localStorage.setItem(STATE_KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'hotel-collection-pack'}}));window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source:'hotel-collection-pack'}}))}
let s=read();s.collectionItems=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);s.items=s.collectionItems;s.collectionTransferConfig=s.collectionTransferConfig&&typeof s.collectionTransferConfig==='object'?s.collectionTransferConfig:{};s.collectionProfiles=s.collectionProfiles&&typeof s.collectionProfiles==='object'?s.collectionProfiles:{};
for(const [cid,pack] of Object.entries(PACKS)){
  s.collectionProfiles[cid]={title:pack.title,memo:pack.memo,...(s.collectionProfiles[cid]||{})};
  for(const row of pack.items){
    const [slug,name,symbol,rarity,claimMinHeart,desc,claimLine,tags,defaultPreference,characterOverrides]=row,id=`${cid}-collection-${slug}`;
    const base={id,characterId:cid,name,symbol,rarity,condition:`가챠 또는 ${claimMinHeart} Heart 이상에서 캐릭터에게 직접 받기`,desc,gachaEnabled:true};
    const at=s.collectionItems.findIndex(x=>String(x?.id)===id);if(at<0)s.collectionItems.push(base);else s.collectionItems[at]={...base,...s.collectionItems[at],gachaEnabled:true};
    const old=s.collectionTransferConfig[id]||{};s.collectionTransferConfig[id]={claimable:true,claimMinHeart,transferable:true,defaultPreference,tags,claimLine,characterOverrides,...old,claimable:old.claimable??true,transferable:old.transferable??true};
  }
}
s.items=s.collectionItems;save(s);try{localStorage.setItem(VERSION_KEY,String(VERSION))}catch{}
})();