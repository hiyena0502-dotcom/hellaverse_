(()=>{
'use strict';
const K='hellaverse_dialogue_state_v1';
const SOURCE='gacha-item-copy-pack-v1';
const norm=v=>String(v||'').normalize('NFKC').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
function read(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}}
function rowsByCharacter(){const merged={};for(const part of window.__HV_GACHA_COPY_PARTS__||[]){for(const [cid,rows] of Object.entries(part||{})){merged[cid]=[...(merged[cid]||[]),...(Array.isArray(rows)?rows:[])]}}return merged}
function apply(){
 const s=read();
 const items=Array.isArray(s.collectionItems)?s.collectionItems:(Array.isArray(s.items)?s.items:[]);
 if(!items.length)return false;
 const byChar=new Map();
 for(const item of items){const cid=String(item?.characterId||'');if(!byChar.has(cid))byChar.set(cid,[]);byChar.get(cid).push(item)}
 let changed=false,matched=0;
 for(const [cid,rows] of Object.entries(rowsByCharacter())){
   const lookup=new Map((byChar.get(cid)||[]).map(item=>[norm(item?.name||item?.title),item]));
   for(const row of rows){
     const [name,desc,line]=row,item=lookup.get(norm(name));if(!item)continue;matched++;
     if(desc){if(String(item.gachaDescription||'')!==desc){item.gachaDescription=desc;changed=true}}
     else if(!String(item.gachaDescription||'').trim()){
       const fallback=String(item.desc||item.description||item.memo||'').trim();
       if(fallback){item.gachaDescription=fallback;changed=true}
     }
     if(String(item.gachaLine||'')!==String(line||'')){item.gachaLine=String(line||'');changed=true}
   }
 }
 if(!changed)return false;
 s.collectionItems=items;s.items=items;
 try{localStorage.setItem(K,JSON.stringify(s))}catch{return false}
 window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{detail:{source:SOURCE,matched}}));
 window.dispatchEvent(new CustomEvent('hellaverse:gacha-updated',{detail:{source:SOURCE,matched}}));
 return true;
}
function boot(){apply();setTimeout(apply,180);setTimeout(apply,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('pageshow',()=>setTimeout(apply,0));
})();
