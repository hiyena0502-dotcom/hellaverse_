(()=>{
'use strict';
if(window.__HELLAVERSE_MULTISTAGE_UPGRADER_V2__)return;
window.__HELLAVERSE_MULTISTAGE_UPGRADER_V2__=1;
window.__HELLAVERSE_MULTISTAGE_UPGRADER_V1__=1;

const K='hellaverse_dialogue_state_v1',MAX=5;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const clean=v=>String(v??'').trim();
const GENERIC_PROMPTS=new Set([
  '조금 더 듣는다','다른 쪽으로 물어본다','마지막으로 한마디 더 듣는다','여기까지 듣는다',
  '조금 더 물어본다','다른 각도에서 다시 묻는다','반응을 더 지켜본다','말을 건다',
  '그 얘기 더 해줘요.','그렇게 생각한 이유가 있어요?'
]);

function roleOf(sc,map){
  let r=String(sc?.sceneRole||map?.[sc?.id]||'').toUpperCase();
  if(r==='TALK')r='CONVERSATION';
  if(!r){
    if(sc?.kind==='ASK')r='QUESTION';
    else if(sc?.kind==='TALK')r='CONVERSATION';
    else r=String(sc?.kind||'').toUpperCase();
  }
  return r;
}

function looksLikeV1Auto(sc){
  if(Number(sc?.multiStageVersion||0)===1)return true;
  const prefix=`${sc.id}-stage-`;
  const autoNodes=(Array.isArray(sc?.nodes)?sc.nodes:[]).filter(n=>String(n?.id||'').startsWith(prefix));
  if(!autoNodes.length)return false;
  return autoNodes.some(n=>(n.choices||[]).some(ch=>GENERIC_PROMPTS.has(clean(ch?.text||ch?.playerLine))));
}

function restoreV1AutoStages(sc){
  if(!looksLikeV1Auto(sc))return false;
  const prefix=`${sc.id}-stage-`;
  const originalNodes=(Array.isArray(sc.nodes)?sc.nodes:[]).filter(n=>!String(n?.id||'').startsWith(prefix));
  if(!originalNodes.length)return false;

  const first=originalNodes.find(n=>String(n?.id||'')===String(sc.openingNodeId||''))||originalNodes[0];
  first.choices=Array.isArray(first.choices)?first.choices:[];
  first.choices=first.choices.filter(ch=>{
    const id=String(ch?.id||'');
    const text=clean(ch?.text||ch?.playerLine);
    const inventedId=id===`${sc.id}-open-a`||id===`${sc.id}-open-b`;
    return !(inventedId&&GENERIC_PROMPTS.has(text));
  });

  for(const ch of first.choices){
    const next=String(ch?.nextNodeId||'');
    if(next.startsWith(prefix)){
      ch.nextNodeId='';
      ch.endConversation=true;
    }
  }

  sc.nodes=originalNodes;
  sc.openingNodeId=first.id||sc.openingNodeId||'';
  delete sc.multiStageVersion;
  delete sc.multiStageTarget;
  return true;
}

function fixIds(sc){
  let changed=false;
  const nodeSeen=new Set();
  sc.nodes=Array.isArray(sc.nodes)?sc.nodes:[];
  for(let i=0;i<sc.nodes.length;i++){
    const n=sc.nodes[i]||{};
    let id=clean(n.id)||`${sc.id}-node-${i+1}`;
    if(nodeSeen.has(id))id=`${sc.id}-node-${i+1}`;
    if(id!==n.id){n.id=id;changed=true}
    nodeSeen.add(id);
    n.choices=Array.isArray(n.choices)?n.choices:[];
    const choiceSeen=new Set();
    for(let j=0;j<n.choices.length;j++){
      const ch=n.choices[j]||{};
      let cid=clean(ch.id)||`${sc.id}-${id}-choice-${j+1}`;
      if(choiceSeen.has(cid))cid=`${sc.id}-${id}-choice-${j+1}`;
      if(cid!==ch.id){ch.id=cid;changed=true}
      choiceSeen.add(cid);
      n.choices[j]=ch;
    }
    sc.nodes[i]=n;
  }
  return changed;
}

function validateAuthoredGraph(sc){
  let changed=false;
  const nodes=Array.isArray(sc.nodes)?sc.nodes:[];
  const map=new Map(nodes.map(n=>[String(n?.id||''),n]));
  if(!map.has(String(sc.openingNodeId||''))){
    sc.openingNodeId=nodes[0]?.id||'';
    changed=true;
  }
  const walk=(id,depth,path)=>{
    const n=map.get(String(id));
    if(!n)return;
    for(const ch of n.choices||[]){
      const to=clean(ch?.nextNodeId);
      if(!to)continue;
      if(depth>=MAX||!map.has(to)||path.has(to)){
        ch.nextNodeId='';
        ch.endConversation=true;
        changed=true;
        continue;
      }
      ch.endConversation=false;
      walk(to,depth+1,new Set([...path,to]));
    }
  };
  if(sc.openingNodeId)walk(sc.openingNodeId,1,new Set([sc.openingNodeId]));
  return changed;
}

const s=read();
s.dialogues=Array.isArray(s.dialogues)?s.dialogues:[];
s.dialogueFileMap=s.dialogueFileMap&&typeof s.dialogueFileMap==='object'?s.dialogueFileMap:{};
let restored=0,repaired=0,changed=0;

for(const sc of s.dialogues){
  if(!sc?.id)continue;
  const role=roleOf(sc,s.dialogueFileMap);
  if(!['CONVERSATION','QUESTION','ACTION'].includes(role))continue;
  if(/^hv-runtime-v2-/i.test(sc.id))continue;
  let touched=false;
  if(restoreV1AutoStages(sc)){restored++;touched=true}
  if(fixIds(sc)){repaired++;touched=true}
  if(validateAuthoredGraph(sc)){repaired++;touched=true}
  if(touched)changed++;
}

s.dialogueMultiStage={
  version:2,
  mode:'authored-only',
  maxSteps:MAX,
  restoredAutoV1:restored,
  repaired,
  updatedAt:new Date().toISOString()
};

try{
  localStorage.setItem(K,JSON.stringify(s));
  if(changed||restored)window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'dialogue-multistage-v2',changed,restored,repaired}}));
}catch(e){console.warn('Authored multistage repair save failed',e)}
})();