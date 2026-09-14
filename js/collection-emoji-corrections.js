(()=>{
'use strict';
if(window.__HELLAVERSE_COLLECTION_EMOJI_SYNC_V2__)return;
window.__HELLAVERSE_COLLECTION_EMOJI_SYNC_V2__=1;
const K='hellaverse_dialogue_state_v1';
const MAP={
'charlie-morningstar-collection-welcome-sticker':'🏨','charlie-morningstar-collection-paper-star':'⭐','charlie-morningstar-collection-hotel-keychain':'🔑','charlie-morningstar-collection-redemption-card':'✅','charlie-morningstar-collection-messy-schedule':'🗓️','charlie-morningstar-collection-hotel-ribbon':'🎀','charlie-morningstar-collection-unfinished-score':'🎼','charlie-morningstar-collection-group-photo':'📸','charlie-morningstar-collection-happy-hotel-brochure':'📕','charlie-morningstar-collection-private-encouragement':'💌',
'vaggie-collection-spare-keycard':'🪪','vaggie-collection-bandage-pack':'🩹','vaggie-collection-escape-map':'🗺️','vaggie-collection-wrist-guard':'🥊','vaggie-collection-metal-whistle':'📣','vaggie-collection-work-checklist':'📋','vaggie-collection-leather-strap':'🪢','vaggie-collection-training-card':'🥋','vaggie-collection-charlie-emergency-plan':'🚨','vaggie-collection-old-red-ribbon':'🎀',
'alastor-collection-frequency-card':'📻','alastor-collection-brass-dial':'🎛️','alastor-collection-station-matchbox':'🔥','alastor-collection-record-sleeve':'💿','alastor-collection-microphone-pin':'🎙️','alastor-collection-broadcast-cuesheet':'📜','alastor-collection-needle-case':'🎵','alastor-collection-sealed-recipe':'🍲','alastor-collection-private-script':'📄','alastor-collection-signoff-card':'📻',
'angel-dust-collection-star-sticker':'✨','angel-dust-collection-pink-lighter':'🔥','angel-dust-collection-spider-mirror':'🪞','angel-dust-collection-glitter-case':'💄','angel-dust-collection-drink-token':'🍸','angel-dust-collection-fat-nuggets-photo':'🐷','angel-dust-collection-silk-handkerchief':'🧣','angel-dust-collection-old-callsheet':'🎬','angel-dust-collection-photo-booth':'📷','angel-dust-collection-private-note':'💌',
'husk-collection-bar-coaster':'🥃','husk-collection-bottle-opener':'🍾','husk-collection-black-dice':'🎲','husk-collection-bent-chip':'🎰','husk-collection-cocktail-card':'🍸','husk-collection-card-case':'🃏','husk-collection-spade-king':'♠️','husk-collection-casino-matchbox':'🔥','husk-collection-old-overlord-chip':'🎰','husk-collection-tailored-drink-recipe':'🥃',
'niffty-collection-shiny-button':'🔘','niffty-collection-mini-duster':'🪶','niffty-collection-stain-chart':'🧼','niffty-collection-red-thread':'🧵','niffty-collection-roach-doll':'🪳','niffty-collection-bad-boy-sticker':'😈','niffty-collection-favorite-brush':'🧹','niffty-collection-roach-crown':'👑','niffty-collection-secret-box':'📦','niffty-collection-perfect-cleaning-notes':'✨',
'sir-pentious-collection-brass-screw':'🔩','sir-pentious-collection-small-gear':'⚙️','sir-pentious-collection-eggboi-card':'🥚','sir-pentious-collection-goggle-lens':'🥽','sir-pentious-collection-duck-blueprint-scribble':'🦆','sir-pentious-collection-airship-badge':'🚀','sir-pentious-collection-blueprint-fragment':'📐','sir-pentious-collection-eggboi-photo':'📸','sir-pentious-collection-cherri-dented-gear':'⚙️','sir-pentious-collection-thank-you-card':'💌',
'cherri-bomb-collection-red-marker':'🖍️','cherri-bomb-collection-bomb-sticker':'💣','cherri-bomb-collection-club-token':'🍸','cherri-bomb-collection-broken-goggle':'🥽','cherri-bomb-collection-colored-fuse':'🧨','cherri-bomb-collection-graffiti-glove':'🧤','cherri-bomb-collection-street-sign-fragment':'🚧','cherri-bomb-collection-mixtape':'🎧','cherri-bomb-collection-pentious-gear':'⚙️','cherri-bomb-collection-cherri-charm':'🍒'
};
let queued=false;
function run(){
  let s;try{s=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return}
  const items=Array.isArray(s.collectionItems)?s.collectionItems:[];let changed=false;
  for(const item of items){const id=String(item?.id||''),emoji=MAP[id];if(!emoji)continue;if(item.symbol!==emoji){item.symbol=emoji;changed=true}if(item.gachaEnabled==null){item.gachaEnabled=true;changed=true}if(!String(item.gachaDescription||'').trim()){const d=String(item.desc||item.description||item.memo||'').trim();if(d){item.gachaDescription=d;changed=true}}}
  if(!changed)return;localStorage.setItem(K,JSON.stringify(s));window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:'collection-emoji-sync-v2'}}));window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source:'collection-emoji-sync-v2'}}));
}
function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;run()},30)}
window.addEventListener('hellaverse:state-updated',e=>{if(e.detail?.source!=='collection-emoji-sync-v2')schedule()});
window.addEventListener('pageshow',schedule);window.addEventListener('load',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();