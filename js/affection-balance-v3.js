(()=>{
'use strict';
if(window.__HELLAVERSE_AFFECTION_BALANCE_V3__)return;
window.__HELLAVERSE_AFFECTION_BALANCE_V3__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_affection_balance_v3';
let done=0;try{done=Number(localStorage.getItem(VK)||0)}catch{}if(done>=1)return;
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
const num=v=>Number(v||0);
function dialogueDelta(v){
 const d=num(v);if(!d)return 0;
 if(d>0){if(d<=3)return 1;if(d<=5)return 2;return 3}
 if(d===-1)return-2;if(d===-2)return-4;if(d===-3)return-5;return Math.max(-8,Math.round(d*1.5));
}
function giftDelta(v){
 const d=num(v);if(!d)return 0;
 if(d>0){if(d<=2)return d;if(d<=4)return 3;return Math.min(4,Math.ceil(d*.65))}
 if(d===-1)return-2;if(d===-2)return-3;return Math.max(-6,Math.round(d*1.35));
}
const s=read();
const previous=Number(s.relationshipBalance?.version||0);
let changedChoices=0,changedGifts=0;
for(const sc of Array.isArray(s.dialogues)?s.dialogues:[]){
 // If v2 already ran on this save, only newly added Charlie mega content needs balancing.
 if(previous>=2&&String(sc?.contentPack||'')!=='charlie-mega-content-v1')continue;
 for(const node of Array.isArray(sc?.nodes)?sc.nodes:[]){
  for(const ch of Array.isArray(node?.choices)?node.choices:[]){
   const before=num(ch.affectionDelta),after=dialogueDelta(before);
   if(before!==after){ch.affectionDelta=after;changedChoices++}
  }
 }
}
if(previous<2){
 for(const g of Array.isArray(s.gifts)?s.gifts:[]){
  for(const key of ['affectionDelta','choiceADelta','choiceBDelta']){
   const before=num(g?.[key]),after=giftDelta(before);
   if(before!==after){g[key]=after;changedGifts++}
  }
 }
}
s.relationshipBalance={
 ...(s.relationshipBalance||{}),
 version:3,
 mode:'slower-gain-stronger-loss',
 dialogue:{positive:'1-3→1, 4-5→2, 6+→3',negative:'-1→-2, -2→-4, -3→-5, lower capped at -8'},
 gift:{positive:'kept more generous',negative:'amplified up to -6'},
 appliedAt:new Date().toISOString(),
 previousVersion:previous,
 changedChoices,
 changedGifts
};
try{localStorage.setItem(K,JSON.stringify(s));localStorage.setItem(VK,'1')}catch(e){console.warn('Affection balance v3 save failed',e)}
})();
