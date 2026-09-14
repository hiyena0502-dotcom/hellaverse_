(function missionRuntime(){
  if(window.__HELLAVERSE_MISSION_SYSTEM_V1__)return;
  window.__HELLAVERSE_MISSION_SYSTEM_V1__=1;

  const K='hellaverse_dialogue_state_v1';
  const LUCIFER='lucifer-morningstar';
  const ORIGINS={
    HELLBORN:{realm:'HELL',label:'HELLBORN',desc:'지옥에서 태어난 평범한 주민. 왕족도 귀족도 아닌 토박이.'},
    SINNER:{realm:'HELL',label:'SINNER',desc:'죽은 뒤 지옥에 온 평범한 죄인. 생전에도 유명인은 아니었다.'},
    ANGEL:{realm:'HEAVEN',label:'ANGEL',desc:'천국의 평범한 천사. 세라핌·엑소시스트 같은 고위직은 아니다.'},
    WINNER:{realm:'HEAVEN',label:'WINNER',desc:'죽은 뒤 천국에 온 평범한 인간 영혼. 특별한 지위는 없다.'}
  };
  const DATE_EVENT_IDS=new Set([
    'lucifer.daily_errand_shared',
    'lucifer.daily_work_comfort',
    'lucifer.daily_quiet_shared'
  ]);
  const DATE_ONLY_FLAGS=[
    'lucifer.daily_errand_shared',
    'lucifer.daily_work_comfort',
    'lucifer.daily_quiet_shared',
    'player.helped_charlie_at_hotel',
    'player.story_letter_v2_migrated'
  ];
  const MISSIONS=[
    {id:'visit-lucifer',title:'루시퍼의 방 방문',desc:'루시퍼의 방에 한 번 들어가세요.',metric:'visits',target:1,reward:1},
    {id:'talk-lucifer',title:'첫 대화',desc:'루시퍼와 대화를 한 번 끝까지 나누세요.',metric:'conversations',target:1,reward:1},
    {id:'talk-more',title:'조금 더 알아가기',desc:'루시퍼와 대화를 세 번 완료하세요.',metric:'conversations',target:3,reward:2},
    {id:'gift-lucifer',title:'첫 선물',desc:'루시퍼에게 선물을 한 번 건네세요.',metric:'gifts',target:1,reward:2},
    {id:'find-memories',title:'기억 수집',desc:'루시퍼의 MEMORY를 다섯 개 발견하세요.',metric:'memories',target:5,reward:2},
    {id:'build-trust',title:'관계 쌓기',desc:'루시퍼의 호감도를 30까지 올리세요.',metric:'affection',target:30,reward:3}
  ];

  let missionOpen=false;
  let queued=false;
  let flash='';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function read(){
    try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}
    catch{return{}}
  }

  function write(state){
    try{
      const value=JSON.stringify(state);
      localStorage.setItem(K,value);
      window.dispatchEvent(new CustomEvent('hellaverse:state-updated',{
        detail:{source:'thought-archive',clearDirty:false}
      }));
      return true;
    }catch(error){
      console.warn('Could not save mission progress',error);
      return false;
    }
  }

  function currentOrigin(state){
    const key=String(state.player?.origin||'').toUpperCase();
    return ORIGINS[key]?key:'';
  }

  function ensureMissionState(state){
    const old=state.missionProgress;
    if(old&&typeof old==='object'&&!Array.isArray(old)){
      old.version=1;
      old.claimed=old.claimed&&typeof old.claimed==='object'&&!Array.isArray(old.claimed)?old.claimed:{};
      return false;
    }
    state.missionProgress={version:1,claimed:{}};
    return true;
  }

  function cleanupDateState(state){
    let changed=false;
    if(Object.prototype.hasOwnProperty.call(state,'game')){
      delete state.game;
      changed=true;
    }
    if(state.flags&&typeof state.flags==='object'){
      for(const key of DATE_ONLY_FLAGS){
        if(Object.prototype.hasOwnProperty.call(state.flags,key)){
          delete state.flags[key];
          changed=true;
        }
      }
    }
    for(const key of ['events','eventCatalog']){
      if(!Array.isArray(state[key]))continue;
      const next=state[key].filter(event=>!DATE_EVENT_IDS.has(String(event?.id||'')));
      if(next.length!==state[key].length){
        state[key]=next;
        changed=true;
      }
    }
    return changed;
  }

  function ensureOriginFlags(state){
    const origin=currentOrigin(state);
    if(!state.player?.profileSetup||!origin)return false;
    state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};
    const needed=[
      `player.origin.${origin.toLowerCase()}`,
      `player.realm.${ORIGINS[origin].realm.toLowerCase()}`,
      'player.role.extra'
    ];
    let changed=false;
    for(const key of needed){
      if(!state.flags[key]){
        state.flags[key]=true;
        changed=true;
      }
    }
    return changed;
  }

  function clearOriginFlags(state){
    state.flags=state.flags&&typeof state.flags==='object'?state.flags:{};
    for(const key of Object.keys(state.flags)){
      if(key.startsWith('player.origin.')||key.startsWith('player.realm.'))delete state.flags[key];
    }
  }

  function ensureOriginMemory(state,origin){
    state.memories=Array.isArray(state.memories)?state.memories:[];
    const realm=ORIGINS[origin].realm;
    const tags=['player-origin',`player-origin:${origin.toLowerCase()}`,`player-realm:${realm.toLowerCase()}`];
    let memory=state.memories.find(item=>item?.sourceType==='player-origin'||item?.sourceId==='player-origin');
    const data={
      characterId:LUCIFER,
      type:'event',
      title:'루시퍼가 내 출신을 알게 됨',
      summary:`루시퍼가 내가 ${origin} 출신이라는 사실을 알고 있다.`,
      tags,
      sourceType:'player-origin',
      sourceId:'player-origin',
      importance:'normal',
      pinned:false,
      hidden:false
    };
    if(memory){
      Object.assign(memory,data);
      return;
    }
    state.memories.unshift({
      id:`player-origin-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt:new Date().toISOString()
    });
  }

  function setPlayerProfile(name,origin){
    const state=read();
    const data=ORIGINS[origin];
    if(!data)return;
    clearOriginFlags(state);
    state.player={
      ...(state.player||{}),
      name:name.trim(),
      origin,
      realm:data.realm,
      role:'EXTRA',
      profileSetup:true,
      profileVersion:2,
      setupAt:state.player?.setupAt||new Date().toISOString()
    };
    state.flags[`player.origin.${origin.toLowerCase()}`]=true;
    state.flags[`player.realm.${data.realm.toLowerCase()}`]=true;
    state.flags['player.role.extra']=true;
    ensureOriginMemory(state,origin);
    cleanupDateState(state);
    ensureMissionState(state);
    if(write(state)){
      $('#hvPlayerSetup')?.remove();
      schedule();
    }
  }

  function originButton(key,current){
    const origin=ORIGINS[key];
    return `<button type="button" class="hv-origin-card ${current===key?'selected':''}" data-player-origin="${key}"><strong>${origin.label}</strong><span>${origin.desc}</span></button>`;
  }

  function renderIntro(){
    const state=read();
    if(state.player?.profileSetup&&currentOrigin(state)){
      $('#hvPlayerSetup')?.remove();
      return;
    }
    if($('#hvPlayerSetup'))return;
    const root=document.createElement('div');
    root.id='hvPlayerSetup';
    root.className='hv-player-intro';
    const current=currentOrigin(state);
    root.dataset.selected=current;
    const currentName=state.player?.name&&state.player.name!=='Hiyena'?state.player.name:'';
    root.innerHTML=`<section class="hv-player-card">
      <p class="hv-kicker">HELLAVERSE / PLAYER FILE</p>
      <h1>WHO ARE YOU?</h1>
      <p class="hv-intro-copy">이 세계에서 당신은 선택받은 존재도 유명인도 아닙니다. 이름과 출신만 정하면 바로 시작됩니다.</p>
      <label class="hv-player-name"><span>NAME</span><input id="hvPlayerName" maxlength="30" autocomplete="off" placeholder="이름을 입력하세요" value="${esc(currentName)}"></label>
      <p class="hv-origin-label">ORIGIN</p>
      <div class="hv-origin-groups">
        <section class="hv-origin-group"><strong>HELL</strong><div class="hv-origin-options">${originButton('HELLBORN',current)}${originButton('SINNER',current)}</div></section>
        <section class="hv-origin-group"><strong>HEAVEN</strong><div class="hv-origin-options">${originButton('ANGEL',current)}${originButton('WINNER',current)}</div></section>
      </div>
      <p class="hv-role-lock"><b>ROLE · EXTRA / LOW PROFILE</b><br>특별한 권력이나 예언 없이 캐릭터들과 천천히 관계를 쌓습니다.</p>
      <p class="hv-player-error" id="hvPlayerError"></p>
      <button type="button" class="hv-player-start" data-player-start ${current&&currentName?'':'disabled'}>ENTER HELLAVERSE</button>
    </section>`;
    document.body.appendChild(root);
  }

  function selectOrigin(key){
    const root=$('#hvPlayerSetup');
    if(!root||!ORIGINS[key])return;
    root.dataset.selected=key;
    $$('[data-player-origin]',root).forEach(button=>{
      button.classList.toggle('selected',button.dataset.playerOrigin===key);
    });
    validateIntro();
  }

  function validateIntro(){
    const root=$('#hvPlayerSetup');
    if(!root)return;
    const name=$('#hvPlayerName',root)?.value.trim()||'';
    const origin=root.dataset.selected||'';
    const button=$('[data-player-start]',root);
    if(button)button.disabled=!(name&&ORIGINS[origin]);
    const error=$('#hvPlayerError',root);
    if(error)error.textContent='';
  }

  function historyFor(state){
    return Array.isArray(state.conversationHistory)?state.conversationHistory.filter(item=>item?.characterId===LUCIFER):[];
  }

  function metrics(state){
    const visit=state.visits?.[LUCIFER]||{};
    const history=historyFor(state);
    const conversations=history.filter(item=>!/^Gift:/i.test(String(item?.sceneTitle||''))).length;
    const gifts=history.filter(item=>/^Gift:/i.test(String(item?.sceneTitle||''))).length;
    const affectionRaw=state.affection?.[LUCIFER];
    return{
      visits:Math.max(Number(visit.visitCount||0),visit.firstMet?1:0),
      conversations:Math.max(Number(visit.conversationsCount||0),conversations),
      gifts:Math.max(Number(visit.giftsCount||0),gifts),
      memories:(Array.isArray(state.memories)?state.memories:[]).filter(item=>item?.characterId===LUCIFER&&!item?.hidden).length,
      affection:Math.max(0,Math.min(100,Number(affectionRaw?.value??affectionRaw??0)))
    };
  }

  function missionRows(state){
    const values=metrics(state);
    const claimed=state.missionProgress?.claimed||{};
    return MISSIONS.map(mission=>{
      const value=Math.max(0,Number(values[mission.metric]||0));
      return{
        ...mission,
        value,
        done:value>=mission.target,
        claimed:!!claimed[mission.id]
      };
    });
  }

  function missionCount(state){
    return missionRows(state).filter(row=>row.done).length;
  }

  function missionButton(host,state){
    let button=$('[data-hv-missions]',host);
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.dataset.hvMissions='1';
      button.className=host.matches('.main-nav')?'nav-button hv-mission-open':'hv-mission-open hv-room-mission';
      const admin=$('[data-admin]',host);
      if(admin)host.insertBefore(button,admin);
      else host.appendChild(button);
    }
    button.innerHTML=`MISSIONS <span>${missionCount(state)}/${MISSIONS.length}</span>`;
  }

  function decorateMissionButtons(state){
    $$('.game-hud .main-nav, .room-hud').forEach(host=>missionButton(host,state));
  }

  function missionCard(row){
    const shown=Math.min(row.value,row.target);
    const percent=Math.min(100,Math.round(shown/row.target*100));
    const action=row.claimed
      ?'<span class="hv-mission-claimed">CLAIMED</span>'
      :row.done
        ?`<button type="button" data-hv-mission-claim="${row.id}">CLAIM · ♥ +${row.reward}</button>`
        :`<span class="hv-mission-progress-text">${shown} / ${row.target}</span>`;
    return `<article class="hv-mission-card ${row.done?'complete':''} ${row.claimed?'claimed':''}">
      <div class="hv-mission-copy"><small>${row.done?'MISSION COMPLETE':'IN PROGRESS'}</small><h3>${esc(row.title)}</h3><p>${esc(row.desc)}</p></div>
      <div class="hv-mission-track"><i style="width:${percent}%"></i></div>
      <div class="hv-mission-meta"><span>${shown} / ${row.target}</span><span>REWARD · ♥ +${row.reward}</span></div>
      <div class="hv-mission-action">${action}</div>
    </article>`;
  }

  function modalMarkup(state){
    const rows=missionRows(state);
    const claimed=rows.filter(row=>row.claimed).length;
    return `<div class="hv-mission-backdrop" id="hvMissionModal" data-hv-mission-backdrop>
      <section class="hv-mission-panel" role="dialog" aria-modal="true" aria-labelledby="hvMissionTitle">
        <header><div><p>PERMANENT PROGRESS</p><h2 id="hvMissionTitle">MISSIONS</h2></div><button type="button" data-hv-mission-close aria-label="닫기">×</button></header>
        <p class="hv-mission-intro">날짜 제한과 초기화가 없는 일회성 미션입니다. 평소처럼 대화하고 선물을 주면 자동으로 진행됩니다.</p>
        ${flash?`<p class="hv-mission-flash">${esc(flash)}</p>`:''}
        <div class="hv-mission-summary"><strong>${claimed}</strong><span>/ ${MISSIONS.length} REWARDS CLAIMED</span></div>
        <div class="hv-mission-list">${rows.map(missionCard).join('')}</div>
      </section>
    </div>`;
  }

  function renderMissionModal(){
    $('#hvMissionModal')?.remove();
    if(!missionOpen)return;
    document.body.insertAdjacentHTML('beforeend',modalMarkup(read()));
  }

  function claimMission(id){
    const definition=MISSIONS.find(mission=>mission.id===id);
    if(!definition)return;
    const state=read();
    ensureMissionState(state);
    const row=missionRows(state).find(mission=>mission.id===id);
    if(!row?.done||row.claimed)return;
    state.missionProgress.claimed[id]=new Date().toISOString();
    state.affection=state.affection&&typeof state.affection==='object'?state.affection:{};
    const old=state.affection[LUCIFER];
    const before=Math.max(0,Math.min(100,Number(old?.value??old??0)));
    state.affection[LUCIFER]={
      ...(old&&typeof old==='object'?old:{}),
      value:Math.min(100,before+definition.reward)
    };
    flash=`${definition.title} 보상으로 호감도 ${definition.reward}을 받았습니다.`;
    if(write(state))renderMissionModal();
  }

  function decorate(){
    const state=read();
    if(!state.player?.profileSetup||!currentOrigin(state)){
      renderIntro();
      return;
    }
    $('#hvPlayerSetup')?.remove();
    decorateMissionButtons(state);
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      decorate();
    });
  }

  function boot(){
    const state=read();
    let changed=cleanupDateState(state);
    changed=ensureMissionState(state)||changed;
    changed=ensureOriginFlags(state)||changed;
    if(changed)write(state);
    renderIntro();
    schedule();
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const origin=target.closest('[data-player-origin]')?.dataset.playerOrigin;
    if(origin){
      event.preventDefault();
      selectOrigin(origin);
      return;
    }
    if(target.closest('[data-player-start]')){
      event.preventDefault();
      const root=$('#hvPlayerSetup');
      const name=$('#hvPlayerName',root)?.value.trim()||'';
      const key=root?.dataset.selected||'';
      if(!name||!ORIGINS[key]){
        const error=$('#hvPlayerError',root);
        if(error)error.textContent='이름과 출신을 하나 선택해 주세요.';
        return;
      }
      setPlayerProfile(name,key);
      return;
    }
    if(target.closest('[data-hv-missions]')){
      event.preventDefault();
      event.stopImmediatePropagation();
      missionOpen=true;
      flash='';
      renderMissionModal();
      return;
    }
    const claim=target.closest('[data-hv-mission-claim]')?.dataset.hvMissionClaim;
    if(claim){
      event.preventDefault();
      claimMission(claim);
      return;
    }
    if(target.closest('[data-hv-mission-close]')||target.matches('[data-hv-mission-backdrop]')){
      event.preventDefault();
      missionOpen=false;
      flash='';
      renderMissionModal();
    }
  },true);

  document.addEventListener('input',event=>{
    if(event.target?.id==='hvPlayerName')validateIntro();
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&missionOpen){
      missionOpen=false;
      flash='';
      renderMissionModal();
    }
  });

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hellaverse:state-updated',schedule);
  window.addEventListener('storage',event=>{if(event.key===K)schedule()});
  window.addEventListener('load',schedule);
  document.addEventListener('DOMContentLoaded',schedule);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();