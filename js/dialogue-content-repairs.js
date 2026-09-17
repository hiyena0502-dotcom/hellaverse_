(()=>{
'use strict';
if(window.__HELLAVERSE_DIALOGUE_CONTENT_REPAIRS_V1__)return;
window.__HELLAVERSE_DIALOGUE_CONTENT_REPAIRS_V1__=1;

const KEY='hellaverse_dialogue_state_v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function write(state){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{return false}}

const state=read();
if(!Array.isArray(state.dialogues))return;
const scene=state.dialogues.find(x=>x&&x.id==='lucifer-early-02');
if(!scene||scene._repairLuciferEarly02V1)return;

const start=(scene.nodes||[]).find(n=>n&&n.id==='start')||(scene.nodes||[])[0];
if(!start||!Array.isArray(start.choices))return;

const endings={
  'lucifer-early-02-start-1':{
    response:'[[CHARACTER]] 좋아. 협조적인 손님. 기억하기 쉬운 유형이군.\n[[NARRATION]] 당신이 이름을 다시 말하자 그는 한 번 천천히 따라 말한다.\n[[CHARACTER]] 됐어. 이번엔 저장 완료.',
    affectionDelta:1,
    moodChange:'',setFlags:'',removeFlags:''
  },
  'lucifer-early-02-start-2':{
    response:'[[CHARACTER]] 벌써라니. 전략적으로 기억을 재정렬하는 중이었어.\n[[NARRATION]] 그는 당신 이름을 일부러 과장되게 한 번 발음하고는 만족스럽게 고개를 끄덕인다.\n[[CHARACTER]] 됐어. 이제 안 잊어.',
    affectionDelta:1,
    moodChange:'',setFlags:'',removeFlags:''
  },
  'lucifer-early-02-start-3':{
    response:'[[NARRATION]] 그가 눈썹을 든다.\n[[CHARACTER]] 새 손님이 꽤 빠르게 공격적으로 나오네.\n[[NARRATION]] 잠깐 당신을 바라보던 루시퍼가 결국 이름을 정확하게 한 번 부른다.\n[[CHARACTER]] 됐어. 기억했어.',
    affectionDelta:-1,
    moodChange:'ANNOYED',setFlags:'lucifer.player_offended_him',removeFlags:''
  }
};

let changed=false;
start.choices=start.choices.map(choice=>{
  const patch=endings[choice?.id];
  if(!patch)return choice;
  changed=true;
  return {
    ...choice,
    ...patch,
    nextNodeId:'',
    endConversation:true
  };
});

if(!changed)return;
// This scene is intentionally one-shot. Removing the intermediate branch nodes avoids
// stale choice DOM from being reused by the legacy renderer after a selection.
scene.nodes=[start];
scene.openingNodeId=start.id||'start';
scene.repeatable=false;
scene._repairLuciferEarly02V1=true;
scene._repairAppliedAt=new Date().toISOString();
write(state);
})();
