(()=>{
'use strict';
if(window.__HELLAVERSE_CHARLIE_MEGA_BALANCE_V1__)return;window.__HELLAVERSE_CHARLIE_MEGA_BALANCE_V1__=1;
const K='hellaverse_dialogue_state_v1',VK='hellaverse_charlie_mega_balance_v1';let v=0;try{v=Number(localStorage.getItem(VK)||0)}catch{}if(v>=1)return;
let s={};try{s=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{s={}};
const map=d=>{d=Number(d||0);if(d===-1)return-2;if(d===-2)return-4;if(d===-3)return-5;return d};
for(const sc of Array.isArray(s.dialogues)?s.dialogues:[]){if(!String(sc?.id||'').startsWith('charlie-mega-'))continue;for(const n of sc.nodes||[])for(const c of n.choices||[])c.affectionDelta=map(c.affectionDelta)}
try{localStorage.setItem(K,JSON.stringify(s));localStorage.setItem(VK,'1')}catch(e){console.warn('Charlie mega affection balance save failed',e)}
})();