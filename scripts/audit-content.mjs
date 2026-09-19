import fs from 'node:fs';
import zlib from 'node:zlib';

const parts=[];
for(let i=1;i<=11;i++) parts.push(fs.readFileSync('js/default-content/default-content-v2.part'+i+'.txt','utf8').trim());
const data=JSON.parse(zlib.inflateSync(Buffer.from(parts.join('').replace(/\s+/g,''),'base64')).toString('utf8'));
const chars=Array.isArray(data.characters)?data.characters:[];
const dialogues=Array.isArray(data.dialogues)?data.dialogues:[];
const items=Array.isArray(data.collectionItems)?data.collectionItems:[];
const gifts=Array.isArray(data.gifts)?data.gifts:[];
const rewards=Array.isArray(data.rewards)?data.rewards:[];
const thoughts=Array.isArray(data.thoughts)?data.thoughts:[];
const validIds=new Set(chars.map(c=>String(c.id||'')).filter(Boolean));
const aliases=new Map([
 ['lucifer-morningstar',['루시퍼','Lucifer']],['charlie-morningstar',['찰리','Charlie']],['vaggie',['바기','배기','Vaggie']],
 ['alastor',['알래스터','Alastor']],['angel-dust',['엔젤','Angel Dust','Angel']],['husk',['허스크','Husk']],['niffty',['니프티','Niffty']],
 ['sir-pentious',['펜셔스','Pentious','Sir Pentious']],['cherri-bomb',['체리','Cherri']],['sera',['세라','Sera']],['emily',['에밀리','Emily']],
 ['lute',['류트','Lute']],['adam',['아담','Adam']],['vox',['복스','Vox']],['valentino',['발렌티노','Valentino']],['velvette',['벨벳','Velvette']],
 ['carmilla-carmine',['카밀라','Carmilla']],['rosie',['로지','Rosie']],['zestial',['제스티얼','Zestial']],['baxter',['백스터','Baxter']],['abel',['아벨','Abel']],
 ['blitzo',['블리츠','Blitzø','Blitzo']],['paimon',['파이몬','Paimon']],['satan',['사탄','Satan']],['mammon',['마몬','Mammon']],
 ['asmodeus',['아스모데우스','오지','Asmodeus']],['beelzebub',['비엘제붑','퀸비','Beelzebub']],['belphegor',['벨페고르','Belphegor']],['leviathan',['레비아탄','Leviathan']],
 ['stolas',['스토라스','Stolas']],['loona',['루나','Loona']],['moxxie',['목시','Moxxie']],['millie',['밀리','Millie']],['fizzarolli',['피자로리','Fizzarolli','Fizz']],['octavia',['옥타비아','Octavia']]
]);
const orderedIds=[...validIds].sort((a,b)=>b.length-a.length);
const issues=[],warnings=[];
const add=(type,entity,id,detail)=>issues.push({type,entity,id,detail});
const warn=(type,entity,id,detail)=>warnings.push({type,entity,id,detail});
const dupIds=arr=>{const m=new Map();for(const x of arr){const id=String(x?.id||'');if(id)m.set(id,(m.get(id)||0)+1)}return [...m].filter(([,n])=>n>1).map(([id,count])=>({id,count}))};
const strongIdOwner=id=>{id=String(id||'');for(const cid of orderedIds){if(id.startsWith(cid+'-collection-')||id.startsWith('ambient100-'+cid+'-')||id.startsWith(cid+'-'))return cid}return ''};
const leadingSpeaker=text=>{text=String(text||'').trim().replace(/^\[\[(?:NARRATION|CHARACTER|PLAYER)\]\]\s*/i,'');for(const [cid,arr] of aliases){for(const name of arr){const esc=name.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');const re=new RegExp('^[“"‘’]*(?:'+esc+')(?:가|이|는|은|\\s|:|：)','i');if(re.test(text))return cid}}return ''};

for(const d of dupIds(dialogues)) add('DUPLICATE_DIALOGUE_ID','dialogue',d.id,'count '+d.count);
for(const d of dupIds(items)) add('DUPLICATE_ITEM_ID','collection',d.id,'count '+d.count);

for(const sc of dialogues){
 const id=String(sc?.id||''),cid=String(sc?.characterId||'');
 if(!validIds.has(cid)) add('INVALID_DIALOGUE_CHARACTER','dialogue',id,'characterId='+cid);
 const implied=strongIdOwner(id); if(implied&&cid&&implied!==cid) add('DIALOGUE_ID_OWNER_MISMATCH','dialogue',id,'id=>'+implied+', characterId=>'+cid);
 const k=String(sc?.kind||'').toUpperCase(); if(k&&!['TALK','ASK','ENTRY','EXIT','IDLE','HOME'].includes(k)) warn('UNKNOWN_DIALOGUE_KIND','dialogue',id,k);
 const sp=leadingSpeaker(sc?.opening||''); if(sp&&cid&&sp!==cid) warn('OPENING_SPEAKER_MISMATCH','dialogue',id,'opening starts with '+sp+', owner '+cid);
 for(const n of Array.isArray(sc?.nodes)?sc.nodes:[]) for(const ch of Array.isArray(n?.choices)?n.choices:[]){const rs=leadingSpeaker(ch?.response||'');if(rs&&cid&&rs!==cid)warn('RESPONSE_SPEAKER_MISMATCH','dialogue',id,'choice '+String(ch?.id||'')+': '+rs+' vs '+cid)}
}

for(const it of items){
 const id=String(it?.id||''),cid=String(it?.characterId||'');
 if(!validIds.has(cid)) add('INVALID_ITEM_CHARACTER','collection',id,'characterId='+cid);
 const implied=strongIdOwner(id); if(implied&&cid&&implied!==cid) add('ITEM_ID_OWNER_MISMATCH','collection',id,'id=>'+implied+', characterId=>'+cid);
 const ds=String(it?.dialogueSourceCharacterId||''); if(ds&&!validIds.has(ds)) add('INVALID_ITEM_DIALOGUE_SOURCE','collection',id,'dialogueSourceCharacterId='+ds);
 const rs=leadingSpeaker(it?.gachaLine||it?.revealLine||it?.claimLine||''); if(rs&&cid&&rs!==cid) warn('ITEM_REVEAL_SPEAKER_MISMATCH','collection',id,'line starts with '+rs+', owner '+cid);
 if(JSON.stringify(it).includes('배기')) warn('VAGGIE_TRANSLITERATION','collection',id,'contains 배기');
}

for(const [label,arr] of [['gift',gifts],['reward',rewards],['thought',thoughts]]) for(const x of arr){const cid=String(x?.characterId||'');if(cid&&!validIds.has(cid))add('INVALID_'+label.toUpperCase()+'_CHARACTER',label,String(x?.id||''),'characterId='+cid)}

const nameMap=new Map();
for(const it of items){const n=String(it?.name||it?.title||'').trim().toLowerCase();if(!n)continue;const a=nameMap.get(n)||[];a.push({id:it.id,characterId:it.characterId});nameMap.set(n,a)}
for(const [name,rows] of nameMap){const owners=[...new Set(rows.map(r=>String(r.characterId||'')))];if(rows.length>1&&owners.length>1)warn('SAME_ITEM_NAME_DIFFERENT_OWNERS','collection',name,rows)}

let vaggieHits=0;
const scan=x=>{if(typeof x==='string'){if(x.includes('배기'))vaggieHits++;return}if(Array.isArray(x)){x.forEach(scan);return}if(x&&typeof x==='object')Object.values(x).forEach(scan)};
scan({dialogues,collectionItems:items,rewards,thoughts,gifts});
if(vaggieHits) warn('VAGGIE_TRANSLITERATION_TOTAL','all','배기','count '+vaggieHits);

const report={counts:{characters:chars.length,dialogues:dialogues.length,collectionItems:items.length,gifts:gifts.length,rewards:rewards.length,thoughts:thoughts.length},issues,warnings,summary:{issueCount:issues.length,warningCount:warnings.length}};
console.log('HELLAVERSE_CONTENT_AUDIT='+JSON.stringify(report));
