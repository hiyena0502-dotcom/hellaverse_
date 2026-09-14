const STORAGE_KEY = 'hellaverse_dialogue_state_v1';

const defaultCharacters = [
  ['lucifer-morningstar', 'Lucifer Morningstar', 'KING OF HELL'],
  ['lilith-morningstar', 'Lilith Morningstar', 'QUEEN OF HELL'],
  ['charlie-morningstar', 'Charlie Morningstar', 'PRINCESS OF HELL'],
  ['michael', 'Michael', 'ARCHANGEL'],
  ['gabriel', 'Gabriel', 'ARCHANGEL'],
  ['sera', 'Sera', 'HIGH SERAPHIM'],
  ['adam', 'Adam', 'FIRST MAN'],
  ['lute', 'Lute', 'EXORCIST'],
  ['alastor', 'Alastor', 'RADIO DEMON'],
  ['vox', 'Vox', 'OVERLORD']
];

const pages = ['home', 'life', 'characters', 'collection', 'editor', 'settings'];
const editorFiles = [
  ['profile', '프로필'],
  ['affection', '호감도'],
  ['dialogue', '대화'],
  ['gifts', '선물'],
  ['collection', '컬렉션'],
  ['rewards', '보상'],
  ['thoughts', '속마음']
];
const actionKinds = ['TALK', 'ASK', 'GIFT'];
const todayKey = () => new Date().toLocaleDateString('sv-SE');

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const byId = (id) => document.getElementById(id);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (mark) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[mark]));
const uid = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0)));
const lines = (value = '') => String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
const pickLine = (value = '', fallback = '') => {
  const pool = lines(value);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : fallback;
};
const shortText = (value = '', limit = 140) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

function blankCharacter(id, name, label = '') {
  return {
    id,
    name,
    label,
    group: 'core',
    status: '',
    personality: '',
    speech: '',
    story: '',
    features: '',
    relations: '',
    sampleLines: [],
    tags: [],
    image: ''
  };
}

function defaultState() {
  return {
    version: 1,
    page: 'home',
    activeCharacterId: 'lucifer-morningstar',
    profileCharacterId: '',
    actionKind: 'TALK',
    editorFile: 'profile',
    points: 2,
    player: {
      name: '',
      role: '',
      location: 'Pride Ring',
      status: 'Normal',
      memo: ''
    },
    characters: defaultCharacters.map(([id, name, label]) => blankCharacter(id, name, label)),
    affection: {},
    interactions: [],
    gifts: [],
    collectionProfiles: {},
    collectionItems: [],
    ownedItems: [],
    rewards: [],
    thoughts: [],
    logs: [],
    box: {
      lastDate: '',
      lastResult: null
    },
    settings: {
      gold: '#C8A45D',
      wine: '#4A1320',
      size: 16
    }
  };
}

function normalize(raw = {}) {
  const base = defaultState();
  const state = { ...base, ...raw };
  state.player = { ...base.player, ...(raw.player || {}) };
  state.settings = { ...base.settings, ...(raw.settings || {}) };
  state.box = { ...base.box, ...(raw.box || {}) };
  state.characters = Array.isArray(raw.characters) ? raw.characters : base.characters;
  for (const fallback of base.characters) {
    if (!state.characters.some((item) => item.id === fallback.id)) state.characters.push(fallback);
  }
  state.characters = state.characters.map((item) => ({ ...blankCharacter(item.id || uid('char'), item.name || 'Unnamed'), ...item, sampleLines: Array.isArray(item.sampleLines) ? item.sampleLines : lines(item.sampleLines), tags: Array.isArray(item.tags) ? item.tags : lines(String(item.tags || '').replaceAll(',', '\n')) }));
  state.affection = raw.affection && typeof raw.affection === 'object' ? raw.affection : {};
  state.interactions = Array.isArray(raw.interactions) ? raw.interactions : [];
  state.gifts = Array.isArray(raw.gifts) ? raw.gifts : [];
  state.collectionProfiles = raw.collectionProfiles && typeof raw.collectionProfiles === 'object' ? raw.collectionProfiles : {};
  state.collectionItems = Array.isArray(raw.collectionItems) ? raw.collectionItems : [];
  state.ownedItems = Array.isArray(raw.ownedItems) ? raw.ownedItems : [];
  state.rewards = Array.isArray(raw.rewards) ? raw.rewards : [];
  state.thoughts = Array.isArray(raw.thoughts) ? raw.thoughts : [];
  state.logs = Array.isArray(raw.logs) ? raw.logs : [];
  if (!pages.includes(state.page)) state.page = 'home';
  if (!editorFiles.some(([key]) => key === state.editorFile)) state.editorFile = 'profile';
  if (!state.characters.some((item) => item.id === state.activeCharacterId)) state.activeCharacterId = state.characters[0]?.id || '';
  if (!state.characters.some((item) => item.id === state.profileCharacterId)) state.profileCharacterId = '';
  state.points = Number(state.points || 0);
  return state;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return normalize(saved ? JSON.parse(saved) : {});
  } catch {
    return normalize({});
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(state)));
}

let state = loadState();

function character(id = state.activeCharacterId) {
  return state.characters.find((item) => item.id === id) || state.characters[0];
}

function characterName(id) {
  return character(id)?.name || '캐릭터';
}

function affinity(id) {
  return clamp(state.affection[id]?.value || 0);
}

function setAffinity(id, value) {
  state.affection[id] = { ...(state.affection[id] || {}), value: clamp(value) };
}

function collectionCounts(id) {
  const items = state.collectionItems.filter((item) => item.characterId === id);
  const owned = items.filter((item) => state.ownedItems.includes(item.id));
  return { total: items.length, owned: owned.length };
}

function addLog(title, body = '') {
  state.logs.unshift({ id: uid('log'), title, body, date: new Date().toLocaleString('ko-KR') });
  state.logs = state.logs.slice(0, 120);
}

function applyTheme() {
  document.documentElement.style.setProperty('--gold', state.settings.gold || '#C8A45D');
  document.documentElement.style.setProperty('--gold-soft', state.settings.gold || '#C8A45D');
  document.documentElement.style.setProperty('--wine', state.settings.wine || '#4A1320');
  document.documentElement.style.setProperty('--body-size', `${state.settings.size || 16}px`);
}

function navButton(page, label) {
  return `<button class="nav-button ${state.page === page ? 'active' : ''}" type="button" data-page="${page}">${label}</button>`;
}

function render() {
  state = normalize(state);
  applyTheme();
  const app = byId('app');
  if (!app) return;
  app.innerHTML = `
    <div class="gate" id="gate">
      <div class="gate-card">
        <p class="overline">PRIVATE HELLAVERSE DIALOGUE</p>
        <h1>HELLAVERSE</h1>
        <p>캐릭터 대화와 관계를 정리하는 개인 공간</p>
        <button class="gold-button" type="button" data-enter>ENTER</button>
      </div>
    </div>
    <main class="site-shell" id="shell">
      <header class="hero-panel compact-hero">
        <div>
          <p class="overline">HELLAVERSE CONVERSATION SPACE</p>
          <h1>${state.page === 'life' ? 'HELL LIFE' : state.page === 'editor' ? 'EDITOR' : 'HELLAVERSE'}</h1>
          <p>${heroCopy()}</p>
        </div>
      </header>
      <nav class="main-nav mode-nav" aria-label="Main menu">
        ${navButton('home', 'HOME')}
        ${navButton('life', 'HELL LIFE')}
        ${navButton('characters', 'CHARACTERS')}
        ${navButton('collection', 'COLLECTION')}
        ${navButton('editor', 'EDITOR')}
        ${navButton('settings', 'SETTINGS')}
      </nav>
      <section class="page active" id="pageRoot">${renderPage()}</section>
    </main>
    <div id="modalRoot"></div>
  `;
  byId('shell').hidden = localStorage.getItem('hellaverse_gate_open') !== 'yes';
  byId('gate').hidden = localStorage.getItem('hellaverse_gate_open') === 'yes';
}

function heroCopy() {
  const copy = {
    home: '필요한 메뉴만 먼저 보이도록 정리했습니다.',
    life: '캐릭터를 만나고 대화 선택지를 실행하는 공간입니다.',
    characters: '캐릭터 설정을 읽는 프로필 공간입니다.',
    collection: '획득한 수집품을 캐릭터별로 확인합니다.',
    editor: '캐릭터 하나를 고르고 필요한 파일을 작성합니다.',
    settings: '테마, 백업, 데이터 관리만 모았습니다.'
  };
  return copy[state.page] || '';
}

function renderPage() {
  if (state.page === 'home') return renderHome();
  if (state.page === 'life') return renderLife();
  if (state.page === 'characters') return renderCharacters();
  if (state.page === 'collection') return renderCollection();
  if (state.page === 'editor') return renderEditor();
  return renderSettings();
}

function renderHome() {
  const top = [...state.characters].sort((a, b) => affinity(b.id) - affinity(a.id)).slice(0, 3);
  return `
    <div class="home-layout">
      <article class="panel home-hero">
        <p class="label">WELCOME BACK TO HELL</p>
        <h2>${escapeHtml(state.player.name || 'Visitor')}</h2>
        <p>${escapeHtml(state.player.location || 'Pride Ring')} · ${escapeHtml(state.player.status || 'Normal')}</p>
        <div class="button-row">
          <button class="gold-button" type="button" data-page="life">MEET A CHARACTER</button>
          <button class="ghost-button" type="button" data-page="characters">VIEW PROFILES</button>
        </div>
      </article>
      <article class="panel">
        <p class="label">DAILY MYSTERY BOX</p>
        <h3>${state.points} POINT</h3>
        <p class="muted">캐릭터와 대화하면 가끔 포인트를 얻습니다.</p>
        <button class="gold-button" type="button" data-open-box>OPEN</button>
        ${state.box.lastResult ? `<p class="result-line">${escapeHtml(state.box.lastResult.title || '')}</p>` : ''}
      </article>
      <article class="panel">
        <p class="label">RECENT CONNECTIONS</p>
        <div class="mini-list clean-list">
          ${top.map((item) => `<button class="link-card" type="button" data-room="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><span>${affinity(item.id)}</span></button>`).join('') || '<p class="empty-state">캐릭터가 없습니다.</p>'}
        </div>
      </article>
      <article class="panel wide-panel">
        <p class="label">RECENT LOG</p>
        ${renderLogList(6)}
      </article>
    </div>
  `;
}

function imageBlock(char, className = 'portrait-large') {
  if (char?.image) return `<div class="${className}"><img src="${escapeHtml(char.image)}" alt="${escapeHtml(char.name)}"></div>`;
  const initials = (char?.name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="${className} placeholder-portrait">${escapeHtml(initials)}</div>`;
}

function renderLife() {
  const selected = character();
  if (!selected) return '<div class="empty-state">캐릭터를 추가해 주세요.</div>';
  const thoughts = state.thoughts.filter((item) => item.characterId === selected.id && affinity(selected.id) >= Number(item.required || 0)).slice(0, 3);
  const counts = collectionCounts(selected.id);
  const logs = state.logs.filter((log) => log.characterId === selected.id || log.title.includes(selected.name)).slice(0, 4);
  return `
    <div class="life-grid">
      <aside class="panel character-picker">
        <p class="label">MEET</p>
        ${state.characters.map((item) => `<button class="character-chip ${item.id === selected.id ? 'active' : ''}" type="button" data-room="${escapeHtml(item.id)}">${escapeHtml(item.name)}<span>${affinity(item.id)}</span></button>`).join('')}
      </aside>
      <article class="panel room-panel-main">
        <div class="room-hero">
          ${imageBlock(selected)}
          <div class="room-title">
            <p class="label">INTERACTION ROOM</p>
            <h2>${escapeHtml(selected.name)}</h2>
            <p>${escapeHtml(selected.status || selected.label || '상태 미작성')}</p>
            <div class="affinity-meter"><span style="width:${affinity(selected.id)}%"></span></div>
            <strong>호감도 ${affinity(selected.id)}</strong>
          </div>
        </div>
        <div class="primary-actions">
          ${actionKinds.map((kind) => `<button class="${state.actionKind === kind ? 'gold-button' : 'ghost-button'}" type="button" data-action-kind="${kind}">${kind}</button>`).join('')}
        </div>
        ${renderActionArea(selected)}
      </article>
      <article class="panel side-status">
        <p class="label">CHARACTER STATUS</p>
        <p><strong>Thought</strong></p>
        ${thoughts.length ? thoughts.map((item) => `<p class="quote-line">${escapeHtml(pickLine(item.body || item.text, item.body || item.text))}</p>`).join('') : '<p class="muted">발견한 속마음이 없습니다.</p>'}
        <p><strong>Collection</strong></p>
        <p>${counts.owned} / ${counts.total}</p>
        <button class="ghost-button" type="button" data-profile="${escapeHtml(selected.id)}">VIEW PROFILE</button>
      </article>
      <article class="panel wide-panel">
        <p class="label">RECENT ACTIVITY</p>
        ${logs.length ? `<div class="mini-list">${logs.map((log) => `<article class="log-card"><strong>${escapeHtml(log.title)}</strong><p>${escapeHtml(shortText(log.body, 120))}</p></article>`).join('')}</div>` : '<p class="empty-state">아직 활동 기록이 없습니다.</p>'}
      </article>
    </div>
  `;
}

function renderActionArea(char) {
  if (state.actionKind === 'GIFT') {
    const gifts = state.gifts.filter((item) => item.characterId === char.id);
    return `
      <div class="action-area">
        <h3>GIVE GIFT</h3>
        ${gifts.length ? gifts.map((gift) => `<article class="choice-card"><div><strong>${escapeHtml(gift.name)}</strong><p>${escapeHtml(gift.type || '')} · 호감도 ${Number(gift.delta || gift.affinity || 0) >= 0 ? '+' : ''}${escapeHtml(String(gift.delta || gift.affinity || 0))}</p></div><button class="gold-button" type="button" data-give-gift="${escapeHtml(gift.id)}">GIVE</button></article>`).join('') : '<p class="empty-state">EDITOR에서 선물을 추가해 주세요.</p>'}
      </div>
    `;
  }
  const wanted = state.actionKind === 'TALK' ? ['대화', 'TALK'] : ['질문', 'ASK'];
  const actions = state.interactions.filter((item) => item.characterId === char.id && wanted.includes(item.kind));
  return `
    <div class="action-area">
      <h3>${state.actionKind}</h3>
      ${actions.length ? actions.map((item) => `<article class="choice-card"><div><strong>${escapeHtml(item.title || '선택지')}</strong><p>${escapeHtml(shortText(item.prompt || item.response, 120))}</p><small>필요 호감도 ${Number(item.required || 0)} · 변화 ${Number(item.delta || 0)}</small></div><button class="gold-button" type="button" data-run-interaction="${escapeHtml(item.id)}">RUN</button></article>`).join('') : '<p class="empty-state">EDITOR에서 대화 선택지를 추가해 주세요.</p>'}
    </div>
  `;
}

function renderCharacters() {
  if (state.profileCharacterId) return renderProfile(state.profileCharacterId);
  return `
    <div class="section-title-row"><div><p class="label">CHARACTERS</p><h2>Character Profiles</h2></div></div>
    <div class="character-grid simple-grid">
      ${state.characters.map((item) => `
        <button class="profile-card" type="button" data-profile="${escapeHtml(item.id)}">
          ${imageBlock(item, 'portrait-card')}
          <span class="label">${escapeHtml(item.label || item.group || 'CHARACTER')}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>호감도 ${affinity(item.id)}</small>
        </button>
      `).join('')}
    </div>
  `;
}

function renderProfile(id) {
  const char = character(id);
  if (!char) return '<p class="empty-state">캐릭터를 찾을 수 없습니다.</p>';
  const fields = [
    ['지위 / 역할', char.status],
    ['성격', char.personality],
    ['말투', char.speech],
    ['서사', char.story],
    ['특징', char.features],
    ['관계', char.relations],
    ['대사 예시', (char.sampleLines || []).join('\n')],
    ['태그', (char.tags || []).join(', ')]
  ];
  return `
    <article class="panel profile-view">
      <button class="ghost-button" type="button" data-back-profiles>BACK</button>
      <div class="profile-head">
        ${imageBlock(char)}
        <div>
          <p class="label">CHARACTER PROFILE</p>
          <h2>${escapeHtml(char.name)}</h2>
          <p>${escapeHtml(char.label || '')}</p>
          <div class="button-row">
            <button class="gold-button" type="button" data-room="${escapeHtml(char.id)}">ENTER HELL LIFE</button>
            <button class="ghost-button" type="button" data-edit-character="${escapeHtml(char.id)}">EDIT</button>
          </div>
        </div>
      </div>
      <div class="profile-fields">
        ${fields.map(([label, value]) => `<section><h3>${escapeHtml(label)}</h3><p>${escapeHtml(value || '미작성')}</p></section>`).join('')}
      </div>
    </article>
  `;
}

function renderCollection() {
  return `
    <div class="section-title-row"><div><p class="label">COLLECTION</p><h2>All Collections</h2></div></div>
    <div class="collection-overview">
      ${state.characters.map((char) => {
        const profile = state.collectionProfiles[char.id] || {};
        const items = state.collectionItems.filter((item) => item.characterId === char.id);
        const counts = collectionCounts(char.id);
        return `
          <article class="panel collection-group">
            <div class="collection-head">
              ${imageBlock(char, 'portrait-mini')}
              <div><h3>${escapeHtml(char.name)}</h3><p>${escapeHtml(profile.title || 'Collection')}</p><strong>${counts.owned} / ${counts.total}</strong></div>
            </div>
            <div class="item-grid">
              ${items.length ? items.map((item) => `<div class="item-card ${state.ownedItems.includes(item.id) ? 'owned' : ''}"><strong>${escapeHtml(item.symbol || 'ITEM')}</strong><span>${escapeHtml(item.name)}</span><small>${state.ownedItems.includes(item.id) ? 'OWNED' : 'LOCKED'}</small></div>`).join('') : '<p class="empty-state">등록된 아이템이 없습니다.</p>'}
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderEditor() {
  const char = character(state.activeCharacterId);
  return `
    <div class="editor-layout">
      <aside class="panel editor-sidebar">
        <p class="label">EDITOR</p>
        <label>캐릭터
          <select id="editorCharacterSelect">
            ${state.characters.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === char?.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
          </select>
        </label>
        <div class="file-tabs">
          ${editorFiles.map(([key, label]) => `<button class="file-tab ${state.editorFile === key ? 'active' : ''}" type="button" data-editor-file="${key}">${label}</button>`).join('')}
        </div>
      </aside>
      <section class="editor-main">
        ${renderEditorFile(char)}
      </section>
    </div>
  `;
}

function renderEditorFile(char) {
  if (!char) return '<div class="empty-state">캐릭터를 추가해 주세요.</div>';
  if (state.editorFile === 'profile') return renderProfileEditor(char);
  if (state.editorFile === 'affection') return renderAffectionEditor(char);
  if (state.editorFile === 'dialogue') return renderDialogueEditor(char);
  if (state.editorFile === 'gifts') return renderGiftEditor(char);
  if (state.editorFile === 'collection') return renderCollectionEditor(char);
  if (state.editorFile === 'rewards') return renderRewardEditor(char);
  return renderThoughtEditor(char);
}

function renderProfileEditor(char) {
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / PROFILE FILE</p>
      <div class="form-grid">
        <label>이름<input id="editName" value="${escapeHtml(char.name)}"></label>
        <label>분류<select id="editGroup">${['core','heaven','au','oc'].map((value) => `<option value="${value}" ${char.group === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
        <label>라벨<input id="editLabel" value="${escapeHtml(char.label || '')}"></label>
        <label>지위 / 역할<input id="editStatus" value="${escapeHtml(char.status || '')}"></label>
        <label class="full">프로필 이미지 URL<input id="editImage" value="${escapeHtml(char.image || '')}" placeholder="이미지 주소 또는 아래 파일 선택"></label>
        <label class="full import-label">이미지 파일 선택<input id="imageFile" type="file" accept="image/*"></label>
        <label class="full">성격<textarea id="editPersonality" rows="4">${escapeHtml(char.personality || '')}</textarea></label>
        <label class="full">말투<textarea id="editSpeech" rows="4">${escapeHtml(char.speech || '')}</textarea></label>
        <label class="full">서사<textarea id="editStory" rows="5">${escapeHtml(char.story || '')}</textarea></label>
        <label class="full">특징<textarea id="editFeatures" rows="4">${escapeHtml(char.features || '')}</textarea></label>
        <label class="full">관계<textarea id="editRelations" rows="4">${escapeHtml(char.relations || '')}</textarea></label>
        <label class="full">대사 예시<textarea id="editSampleLines" rows="5" placeholder="한 줄에 하나씩">${escapeHtml((char.sampleLines || []).join('\n'))}</textarea></label>
        <label class="full">태그<input id="editTags" value="${escapeHtml((char.tags || []).join(', '))}" placeholder="쉼표로 구분"></label>
      </div>
      <div class="button-row"><button class="gold-button" type="button" data-save-profile>캐릭터 저장</button><button class="ghost-button" type="button" data-add-character>새 캐릭터 추가</button></div>
    </article>
  `;
}

function renderAffectionEditor(char) {
  const data = state.affection[char.id] || {};
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / AFFECTION FILE</p>
      <label>현재 호감도<input id="affectionValue" type="number" min="0" max="100" value="${affinity(char.id)}"></label>
      <label>관계 단계<textarea id="affectionStages" rows="6" placeholder="한 줄에 하나씩">${escapeHtml((data.stages || []).join('\n'))}</textarea></label>
      <button class="gold-button" type="button" data-save-affection>호감도 저장</button>
    </article>
  `;
}

function renderDialogueEditor(char) {
  const list = state.interactions.filter((item) => item.characterId === char.id);
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / DIALOGUE FILE</p>
      <div class="form-grid">
        <label>종류<select id="dialogueKind"><option>대화</option><option>질문</option><option>이벤트</option><option>비밀</option></select></label>
        <label>필요 호감도<input id="dialogueRequired" type="number" min="0" max="100" value="0"></label>
        <label>호감도 변화<input id="dialogueDelta" type="number" min="-100" max="100" value="1"></label>
        <label>선택지 이름<input id="dialogueTitle" placeholder="예: 말을 건다"></label>
        <label class="full">선택지 / 상황<textarea id="dialoguePrompt" rows="3"></textarea></label>
        <label class="full">캐릭터 답장<textarea id="dialogueResponse" rows="5" placeholder="한 줄에 하나씩 적으면 랜덤 출력"></textarea></label>
        <label class="full">해금 메모<textarea id="dialogueUnlocks" rows="2"></textarea></label>
      </div>
      <button class="gold-button" type="button" data-save-dialogue>대화 저장</button>
    </article>
    ${renderSavedList('저장된 대화', list, 'dialogue')}
  `;
}

function renderGiftEditor(char) {
  const list = state.gifts.filter((item) => item.characterId === char.id);
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / GIFT FILE</p>
      <div class="form-grid">
        <label>선물 이름<input id="giftName" placeholder="예: Apple Tart"></label>
        <label>분류<select id="giftType"><option value="like">좋아함</option><option value="hate">싫어함</option><option value="special">특별</option></select></label>
        <label>호감도 변화<input id="giftDelta" type="number" min="-100" max="100" value="2"></label>
        <label class="full">반응<textarea id="giftResponse" rows="4" placeholder="한 줄에 하나씩 적으면 랜덤 출력"></textarea></label>
      </div>
      <button class="gold-button" type="button" data-save-gift>선물 저장</button>
    </article>
    ${renderSavedList('저장된 선물', list, 'gift')}
  `;
}

function renderCollectionEditor(char) {
  const profile = state.collectionProfiles[char.id] || {};
  const list = state.collectionItems.filter((item) => item.characterId === char.id);
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / COLLECTION FILE</p>
      <div class="form-grid">
        <label>컬렉션 이름<input id="collectionTitle" value="${escapeHtml(profile.title || '')}" placeholder="예: Duck Collection"></label>
        <label class="full">설명<textarea id="collectionMemo" rows="3">${escapeHtml(profile.memo || '')}</textarea></label>
      </div>
      <button class="gold-button" type="button" data-save-collection-profile>컬렉션 저장</button>
    </article>
    <article class="panel wide-panel">
      <p class="label">ITEM</p>
      <div class="form-grid">
        <label>아이템 이름<input id="itemName"></label>
        <label>표시 문자<input id="itemSymbol" maxlength="8" placeholder="짧은 표시"></label>
        <label>희귀도<select id="itemRarity"><option value="common">일반</option><option value="rare">희귀</option><option value="epic">매우 희귀</option><option value="secret">비밀</option></select></label>
        <label>획득 조건<input id="itemCondition"></label>
        <label class="full">설명<textarea id="itemDesc" rows="3"></textarea></label>
      </div>
      <button class="gold-button" type="button" data-save-item>아이템 저장</button>
    </article>
    ${renderSavedList('저장된 아이템', list, 'item')}
  `;
}

function renderRewardEditor(char) {
  const items = state.collectionItems.filter((item) => item.characterId === char.id);
  const list = state.rewards.filter((item) => item.characterId === char.id);
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / MYSTERY BOX REWARD</p>
      <div class="form-grid">
        <label>보상 종류<select id="rewardType"><option value="message">특별 메시지</option><option value="quote">대사</option><option value="card">캐릭터 카드</option><option value="image">사진</option><option value="collection">컬렉션 아이템</option><option value="miss">꽝</option></select></label>
        <label>희귀도<select id="rewardRarity"><option value="common">일반</option><option value="rare">희귀</option><option value="epic">매우 희귀</option><option value="secret">비밀</option></select></label>
        <label>연결 아이템<select id="rewardItem"><option value="">없음</option>${items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label>
        <label class="full">제목<input id="rewardTitle"></label>
        <label class="full">내용<textarea id="rewardBody" rows="4" placeholder="한 줄에 하나씩 적으면 랜덤 출력"></textarea></label>
      </div>
      <button class="gold-button" type="button" data-save-reward>보상 저장</button>
    </article>
    ${renderSavedList('저장된 보상', list, 'reward')}
  `;
}

function renderThoughtEditor(char) {
  const list = state.thoughts.filter((item) => item.characterId === char.id);
  return `
    <article class="panel wide-panel">
      <p class="label">${escapeHtml(char.name)} / THOUGHT FILE</p>
      <div class="form-grid">
        <label>종류<select id="thoughtCategory"><option value="daily">일상</option><option value="mood">기분</option><option value="about">다른 캐릭터 생각</option><option value="past">과거</option><option value="rare">희귀</option></select></label>
        <label>필요 호감도<input id="thoughtRequired" type="number" min="0" max="100" value="0"></label>
        <label class="full">속마음<textarea id="thoughtBody" rows="4" placeholder="한 줄에 하나씩 적으면 랜덤 출력"></textarea></label>
      </div>
      <button class="gold-button" type="button" data-save-thought>속마음 저장</button>
    </article>
    ${renderSavedList('저장된 속마음', list, 'thought')}
  `;
}

function renderSavedList(title, list, type) {
  return `
    <article class="panel wide-panel saved-panel">
      <p class="label">${escapeHtml(title)}</p>
      <div class="mini-list">
        ${list.length ? list.map((item) => `<article class="saved-card"><strong>${escapeHtml(item.title || item.name || item.body || '저장 항목')}</strong><p>${escapeHtml(shortText(item.prompt || item.response || item.body || item.memo || item.desc || '', 130))}</p><button class="ghost-button danger" type="button" data-delete-type="${type}" data-delete-id="${escapeHtml(item.id)}">삭제</button></article>`).join('') : '<p class="empty-state">아직 저장된 항목이 없습니다.</p>'}
      </div>
    </article>
  `;
}

function renderSettings() {
  return `
    <div class="settings-grid">
      <article class="panel">
        <p class="label">APPEARANCE</p>
        <label>Gold<input id="setGold" type="color" value="${escapeHtml(state.settings.gold)}"></label>
        <label>Wine<input id="setWine" type="color" value="${escapeHtml(state.settings.wine)}"></label>
        <label>Text size<input id="setSize" type="range" min="14" max="20" value="${escapeHtml(state.settings.size)}"></label>
        <button class="gold-button" type="button" data-save-settings>저장</button>
      </article>
      <article class="panel">
        <p class="label">DATA</p>
        <button class="gold-button" type="button" data-export>백업 파일 만들기</button>
        <label class="import-label">백업 불러오기<input id="importFile" type="file" accept="application/json"></label>
        <button class="ghost-button danger" type="button" data-reset>전체 초기화</button>
      </article>
    </div>
  `;
}

function renderLogList(limit = 10) {
  const list = state.logs.slice(0, limit);
  return list.length ? `<div class="mini-list">${list.map((log) => `<article class="log-card"><strong>${escapeHtml(log.title)}</strong><p>${escapeHtml(shortText(log.body || log.date, 130))}</p></article>`).join('')}</div>` : '<p class="empty-state">아직 기록이 없습니다.</p>';
}

function selectPage(page) {
  state.page = page;
  state.profileCharacterId = page === 'characters' ? state.profileCharacterId : '';
  saveState(state);
  render();
}

function openRoom(id) {
  state.activeCharacterId = id;
  state.page = 'life';
  state.profileCharacterId = '';
  saveState(state);
  render();
}

function openProfile(id) {
  state.profileCharacterId = id;
  state.page = 'characters';
  saveState(state);
  render();
}

function saveCharacterProfile() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  char.name = byId('editName')?.value.trim() || char.name;
  char.group = byId('editGroup')?.value || 'core';
  char.label = byId('editLabel')?.value.trim() || '';
  char.status = byId('editStatus')?.value.trim() || '';
  char.image = byId('editImage')?.value.trim() || '';
  char.personality = byId('editPersonality')?.value || '';
  char.speech = byId('editSpeech')?.value || '';
  char.story = byId('editStory')?.value || '';
  char.features = byId('editFeatures')?.value || '';
  char.relations = byId('editRelations')?.value || '';
  char.sampleLines = lines(byId('editSampleLines')?.value || '');
  char.tags = String(byId('editTags')?.value || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  addLog(`${char.name} 프로필 저장`, '캐릭터 프로필이 업데이트되었습니다.');
  saveState(state);
  render();
}

function addCharacter() {
  const name = prompt('새 캐릭터 이름');
  if (!name) return;
  const id = `char-${Date.now()}`;
  state.characters.push(blankCharacter(id, name.trim(), 'CUSTOM'));
  state.activeCharacterId = id;
  state.editorFile = 'profile';
  addLog(`${name.trim()} 추가`, '새 캐릭터가 생성되었습니다.');
  saveState(state);
  render();
}

function saveAffection() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  state.affection[char.id] = {
    value: clamp(byId('affectionValue')?.value || 0),
    stages: lines(byId('affectionStages')?.value || '')
  };
  addLog(`${char.name} 호감도 저장`, `현재 호감도 ${state.affection[char.id].value}`);
  saveState(state);
  render();
}

function saveDialogue() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  const item = {
    id: uid('dialogue'),
    characterId: char.id,
    kind: byId('dialogueKind')?.value || '대화',
    required: clamp(byId('dialogueRequired')?.value || 0),
    delta: Number(byId('dialogueDelta')?.value || 0),
    title: byId('dialogueTitle')?.value.trim() || '이름 없는 대화',
    prompt: byId('dialoguePrompt')?.value || '',
    response: byId('dialogueResponse')?.value || '',
    unlocks: byId('dialogueUnlocks')?.value || ''
  };
  state.interactions.unshift(item);
  addLog(`${char.name} 대화 저장`, item.title);
  saveState(state);
  render();
}

function saveGift() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  const item = {
    id: uid('gift'),
    characterId: char.id,
    name: byId('giftName')?.value.trim() || '이름 없는 선물',
    type: byId('giftType')?.value || 'like',
    delta: Number(byId('giftDelta')?.value || 0),
    response: byId('giftResponse')?.value || ''
  };
  state.gifts.unshift(item);
  addLog(`${char.name} 선물 저장`, item.name);
  saveState(state);
  render();
}

function saveCollectionProfile() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  state.collectionProfiles[char.id] = {
    title: byId('collectionTitle')?.value.trim() || '',
    memo: byId('collectionMemo')?.value || ''
  };
  addLog(`${char.name} 컬렉션 저장`, state.collectionProfiles[char.id].title || 'Collection');
  saveState(state);
  render();
}

function saveItem() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  const item = {
    id: uid('item'),
    characterId: char.id,
    name: byId('itemName')?.value.trim() || '이름 없는 아이템',
    symbol: byId('itemSymbol')?.value.trim() || 'ITEM',
    rarity: byId('itemRarity')?.value || 'common',
    condition: byId('itemCondition')?.value || '',
    desc: byId('itemDesc')?.value || ''
  };
  state.collectionItems.unshift(item);
  addLog(`${char.name} 아이템 저장`, item.name);
  saveState(state);
  render();
}

function saveReward() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  const item = {
    id: uid('reward'),
    characterId: char.id,
    type: byId('rewardType')?.value || 'message',
    rarity: byId('rewardRarity')?.value || 'common',
    itemId: byId('rewardItem')?.value || '',
    title: byId('rewardTitle')?.value.trim() || '이름 없는 보상',
    body: byId('rewardBody')?.value || ''
  };
  state.rewards.unshift(item);
  addLog(`${char.name} 보상 저장`, item.title);
  saveState(state);
  render();
}

function saveThought() {
  const char = character(state.activeCharacterId);
  if (!char) return;
  const item = {
    id: uid('thought'),
    characterId: char.id,
    category: byId('thoughtCategory')?.value || 'daily',
    required: clamp(byId('thoughtRequired')?.value || 0),
    body: byId('thoughtBody')?.value || ''
  };
  state.thoughts.unshift(item);
  addLog(`${char.name} 속마음 저장`, shortText(item.body, 80));
  saveState(state);
  render();
}

function runInteraction(id) {
  const item = state.interactions.find((entry) => entry.id === id);
  if (!item) return;
  const char = character(item.characterId);
  const current = affinity(item.characterId);
  if (current < Number(item.required || 0)) {
    addLog(`${char.name} 대화 실패`, `필요 호감도 ${item.required}, 현재 ${current}`);
    saveState(state);
    render();
    return;
  }
  const response = pickLine(item.response, item.response || item.prompt || '...');
  const before = current;
  const after = clamp(before + Number(item.delta || 0));
  setAffinity(item.characterId, after);
  let pointText = '';
  if (Math.random() < 0.33) {
    state.points += 1;
    pointText = '대화 포인트 +1';
  }
  addLog(`${char.name}와 대화함`, [response, `호감도 ${before} → ${after}`, pointText].filter(Boolean).join('\n'));
  saveState(state);
  render();
}

function giveGift(id) {
  const gift = state.gifts.find((entry) => entry.id === id);
  if (!gift) return;
  const char = character(gift.characterId);
  const before = affinity(gift.characterId);
  const after = clamp(before + Number(gift.delta || 0));
  setAffinity(gift.characterId, after);
  const response = pickLine(gift.response, `${char.name}에게 ${gift.name}을/를 주었습니다.`);
  addLog(`${char.name}에게 ${gift.name} 선물`, `${response}\n호감도 ${before} → ${after}`);
  saveState(state);
  render();
}

function openBox() {
  if (state.box.lastDate === todayKey()) {
    addLog('오늘의 보상은 이미 열었습니다', '내일 다시 열 수 있습니다.');
    saveState(state);
    render();
    return;
  }
  if (state.points < 1) {
    addLog('포인트가 부족합니다', '캐릭터와 대화하면 가끔 포인트를 얻습니다.');
    saveState(state);
    render();
    return;
  }
  if (!state.rewards.length) {
    addLog('보상이 없습니다', 'EDITOR에서 보상을 먼저 추가해 주세요.');
    saveState(state);
    render();
    return;
  }
  state.points -= 1;
  const reward = weightedPick(state.rewards);
  const char = character(reward.characterId);
  const body = pickLine(reward.body, reward.body || reward.title || '보상');
  if (reward.type === 'collection' && reward.itemId && !state.ownedItems.includes(reward.itemId)) {
    state.ownedItems.push(reward.itemId);
  }
  state.box.lastDate = todayKey();
  state.box.lastResult = { title: reward.title, body };
  addLog(`Mystery Box: ${reward.title}`, `${char.name} · ${body}`);
  saveState(state);
  render();
}

function weightedPick(list) {
  const weights = { common: 65, rare: 25, epic: 8, secret: 2 };
  const total = list.reduce((sum, item) => sum + (weights[item.rarity] || 10), 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= weights[item.rarity] || 10;
    if (roll <= 0) return item;
  }
  return list[0];
}

function deleteItem(type, id) {
  const map = {
    dialogue: 'interactions',
    gift: 'gifts',
    item: 'collectionItems',
    reward: 'rewards',
    thought: 'thoughts'
  };
  const key = map[type];
  if (!key || !confirm('삭제할까요?')) return;
  state[key] = state[key].filter((item) => item.id !== id);
  if (type === 'item') state.ownedItems = state.ownedItems.filter((itemId) => itemId !== id);
  saveState(state);
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hellaverse-dialogue-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const enter = event.target.closest('[data-enter]');
    if (enter) { localStorage.setItem('hellaverse_gate_open', 'yes'); render(); return; }

    const page = event.target.closest('[data-page]')?.dataset.page;
    if (page) { selectPage(page); return; }

    const room = event.target.closest('[data-room]')?.dataset.room;
    if (room) { openRoom(room); return; }

    const profile = event.target.closest('[data-profile]')?.dataset.profile;
    if (profile) { openProfile(profile); return; }

    if (event.target.closest('[data-back-profiles]')) { state.profileCharacterId = ''; saveState(state); render(); return; }
    if (event.target.closest('[data-edit-character]')) { state.activeCharacterId = event.target.closest('[data-edit-character]').dataset.editCharacter; state.page = 'editor'; state.editorFile = 'profile'; saveState(state); render(); return; }

    const actionKind = event.target.closest('[data-action-kind]')?.dataset.actionKind;
    if (actionKind) { state.actionKind = actionKind; saveState(state); render(); return; }

    const editorFile = event.target.closest('[data-editor-file]')?.dataset.editorFile;
    if (editorFile) { state.editorFile = editorFile; saveState(state); render(); return; }

    if (event.target.closest('[data-save-profile]')) saveCharacterProfile();
    if (event.target.closest('[data-add-character]')) addCharacter();
    if (event.target.closest('[data-save-affection]')) saveAffection();
    if (event.target.closest('[data-save-dialogue]')) saveDialogue();
    if (event.target.closest('[data-save-gift]')) saveGift();
    if (event.target.closest('[data-save-collection-profile]')) saveCollectionProfile();
    if (event.target.closest('[data-save-item]')) saveItem();
    if (event.target.closest('[data-save-reward]')) saveReward();
    if (event.target.closest('[data-save-thought]')) saveThought();
    if (event.target.closest('[data-open-box]')) openBox();
    if (event.target.closest('[data-export]')) exportData();
    if (event.target.closest('[data-save-settings]')) {
      state.settings.gold = byId('setGold')?.value || '#C8A45D';
      state.settings.wine = byId('setWine')?.value || '#4A1320';
      state.settings.size = Number(byId('setSize')?.value || 16);
      saveState(state); render();
    }
    if (event.target.closest('[data-reset]') && confirm('전체 데이터를 초기화할까요?')) {
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      saveState(state);
      render();
    }

    const runId = event.target.closest('[data-run-interaction]')?.dataset.runInteraction;
    if (runId) runInteraction(runId);
    const giftId = event.target.closest('[data-give-gift]')?.dataset.giveGift;
    if (giftId) giveGift(giftId);
    const del = event.target.closest('[data-delete-type]');
    if (del) deleteItem(del.dataset.deleteType, del.dataset.deleteId);
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'editorCharacterSelect') {
      state.activeCharacterId = event.target.value;
      saveState(state);
      render();
    }
    if (event.target.id === 'imageFile') {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const input = byId('editImage');
        if (input) input.value = reader.result;
      };
      reader.readAsDataURL(file);
    }
    if (event.target.id === 'importFile') {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state = normalize(JSON.parse(reader.result));
          saveState(state);
          render();
        } catch {
          alert('백업 파일을 읽지 못했습니다.');
        }
      };
      reader.readAsText(file);
    }
  });
}

bindEvents();
render();
