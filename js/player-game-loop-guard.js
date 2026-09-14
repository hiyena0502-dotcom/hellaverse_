(()=>{
if(window.__HELLAVERSE_PLAYER_GAME_LOOP_GUARD_V1__)return;
window.__HELLAVERSE_PLAYER_GAME_LOOP_GUARD_V1__=1;

const NativeMutationObserver=window.MutationObserver;
if(!NativeMutationObserver)return;

function isIntroNode(node){
  if(!node)return false;
  if(node.nodeType===1){
    const el=node;
    return el.id==='hvPlayerSetup'||!!el.closest?.('#hvPlayerSetup');
  }
  return !!node.parentElement?.closest?.('#hvPlayerSetup');
}
function introOnly(record){
  if(isIntroNode(record.target))return true;
  const changed=[...(record.addedNodes||[]),...(record.removedNodes||[])];
  return changed.length>0&&changed.every(isIntroNode);
}

class GuardedMutationObserver{
  constructor(callback){
    this._inner=new NativeMutationObserver((records,observer)=>{
      const useful=records.filter(record=>!introOnly(record));
      if(useful.length)callback(useful,this);
    });
  }
  observe(...args){return this._inner.observe(...args)}
  disconnect(){return this._inner.disconnect()}
  takeRecords(){return this._inner.takeRecords().filter(record=>!introOnly(record))}
}

window.MutationObserver=GuardedMutationObserver;
setTimeout(()=>{if(window.MutationObserver===GuardedMutationObserver)window.MutationObserver=NativeMutationObserver},0);
})();