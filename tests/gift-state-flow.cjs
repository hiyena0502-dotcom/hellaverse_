const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

class FakeTarget {
  constructor(){ this.listeners = new Map(); }
  addEventListener(type, fn){ const rows=this.listeners.get(type)||[]; rows.push(fn); this.listeners.set(type, rows); }
  dispatchEvent(event){ for(const fn of this.listeners.get(event.type)||[]) fn(event); return true; }
}
class FakeElement extends FakeTarget {
  constructor(){ super(); this.id=''; this.className=''; this.dataset={}; this.innerHTML=''; this.isConnected=true; this.fields=new Map(); }
  remove(){ this.isConnected=false; if(this.id) elements.delete(`#${this.id}`); }
  appendChild(node){ if(node.id) elements.set(`#${node.id}`,node); return node; }
  querySelector(selector){ return this.fields.get(selector)||null; }
  querySelectorAll(){ return []; }
}
class FakeEvent { constructor(type, init={}){ this.type=type; Object.assign(this,init); } }

const elements = new Map();
const local = new Map();
const document = new FakeTarget();
document.readyState='loading';
document.body=new FakeElement();
document.createElement=()=>new FakeElement();
document.querySelector=selector=>elements.get(selector)||null;
document.querySelectorAll=()=>[];
const window = new FakeTarget();
window.dispatchEvent=FakeTarget.prototype.dispatchEvent.bind(window);
const localStorage={
  getItem:key=>local.has(key)?local.get(key):null,
  setItem:(key,value)=>local.set(key,String(value)),
  removeItem:key=>local.delete(key)
};
const sandbox={window,document,localStorage,CustomEvent:FakeEvent,StorageEvent:FakeEvent,Element:FakeElement,console,setTimeout,clearTimeout,requestAnimationFrame:fn=>fn()};

let source=fs.readFileSync('js/gift-system.js','utf8');
source=source.replace(
  'window.HVGiftInventory={renderGiftMenu,openManager,readState:read};',
  'window.HVGiftInventory={renderGiftMenu,openManager,readState:read,__test:{acquireFromChoice,giveItem,availableForTarget,allChoices,saveManager,setSelected(id){selectedItemId=id;managerDraft=defaultDraft(read(),collectionItem(read(),id))}}};'
);
vm.runInNewContext(source,sandbox,{filename:'gift-system.js'});

const state={
  active:'satan',
  characters:[
    {id:'satan',name:'Satan'},
    {id:'lucifer-morningstar',name:'Lucifer Morningstar'}
  ],
  collectionItems:[{id:'satan-letter',characterId:'lucifer-morningstar',name:'사탄의 독촉장',symbol:'✉',gachaEnabled:false,gachaLine:'독촉장 아니야. 그냥 굉장히 공격적인 편지야.'}],
  dialogues:[{id:'satan-paperwork',characterId:'satan',kind:'TALK',nodes:[{id:'start',choices:[{id:'take-letter',type:'action',text:'봉투를 받아든다',unlockItemId:''}]}]}],
  giftInventory:{version:1,ownedCounts:{},acquiredChoiceIds:{},history:[]},
  giftInventoryConfig:{version:1,items:{}},
  ownedItems:[],newCollectionItems:[],affection:{},flags:{},visits:{},memories:[],conversationHistory:[],
  gifts:[{id:'legacy-gift',name:'보존할 기존 선물'}],giftContextConfig:{legacy:{enabled:true}},collectionTransferConfig:{legacy:{transferable:true}},sentinel:{keep:true}
};
localStorage.setItem('hellaverse_dialogue_state_v1',JSON.stringify(state));

const api=window.HVGiftInventory;
assert.doesNotMatch(api.renderGiftMenu('lucifer-morningstar'),/data-hvgift-give/,'locked gift must not be visible');
const managerRoot=new FakeElement();
managerRoot.id='hvGiftManager';
elements.set('#hvGiftManager',managerRoot);
const field=(selector,value,checked=false)=>managerRoot.fields.set(selector,{value,checked});
field('#hvgiftEnabled','',true);
field('#hvgiftSource','satan');
field('#hvgiftTarget','lucifer-morningstar');
field('#hvgiftScene','satan-paperwork');
field('#hvgiftChoice','take-letter');
field('#hvgiftReaction','');
field('#hvgiftPreference','LIKED');
field('#hvgiftDelta','3');
field('#hvgiftDialogueOnly','',true);
field('#hvgiftRepeatable','',false);
api.__test.setSelected('satan-letter');
api.__test.saveManager();
let saved=api.readState();
assert.equal(saved.giftInventoryConfig.items['satan-letter'].enabled,true);
assert.equal(saved.dialogues[0].nodes[0].choices[0].unlockItemId,'satan-letter');
assert.equal(saved.collectionItems[0].gachaEnabled,false);
api.__test.acquireFromChoice('satan-letter','take-letter');
let after=api.readState();
assert.equal(after.giftInventory.ownedCounts['satan-letter'],1);
assert.ok(after.ownedItems.includes('satan-letter'));
assert.match(api.renderGiftMenu('lucifer-morningstar'),/data-hvgift-give="satan-letter"/);
api.__test.acquireFromChoice('satan-letter','take-letter');
after=api.readState();
assert.equal(after.giftInventory.ownedCounts['satan-letter'],1,'one-time choice must not duplicate inventory');
api.__test.giveItem('satan-letter','lucifer-morningstar');
after=api.readState();
assert.equal(after.giftInventory.ownedCounts['satan-letter'],0);
assert.equal(after.affection['lucifer-morningstar'].value,3);
assert.ok(after.ownedItems.includes('satan-letter'),'collection record must remain after gifting');
assert.equal(after.conversationHistory[0].sceneTitle,'Gift: 사탄의 독촉장');
assert.equal(after.sentinel.keep,true,'unknown state must survive migration');
assert.equal(after.gifts[0].id,'legacy-gift','legacy gift data must be preserved');
assert.equal(after.giftContextConfig.legacy.enabled,true,'legacy gift context must be preserved');
assert.equal(after.collectionTransferConfig.legacy.transferable,true,'legacy transfer data must be preserved');
assert.doesNotMatch(api.renderGiftMenu('lucifer-morningstar'),/data-hvgift-give/,'consumed gift must disappear');
assert.match(document.querySelector('#hvGiftNotice').innerHTML,/독촉장 아니야/,'item reaction fallback must be used');

console.log(JSON.stringify({ok:true,inventory:after.giftInventory.ownedCounts['satan-letter'],heart:after.affection['lucifer-morningstar'].value,collectionOwned:after.ownedItems.includes('satan-letter')},null,2));
