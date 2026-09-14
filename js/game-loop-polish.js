(() => {
  if (window.__HELLAVERSE_UNIFIED_ACTIVE__) return;
  window.__HELLAVERSE_UNIFIED_ACTIVE__ = true;

  const STATE_KEY = 'hellaverse_dialogue_state_v1';
  const UI_KEY = 'hellaverse_unified_ui_v1';
  const OLD_UI_KEY = 'hellaverse_game_loop_ui_v1';
  const PATCH_KEY = 'hellaverse_affiliation_music_patch_v1';
  const GATE_KEY = 'hellaverse_gate_open';
  const DB_NAME = 'hellaverse_local_mp3_v1';
  const STORE = 'tracks';
  const NEW_CHARACTERS = [
    { id: 'emily', name: 'Emily', group: 'HEAVEN', affiliations: ['HEAVEN'], label: '' },
    { id: 'baxter', name: 'Baxter', group: 'HELL', affiliations: ['HELL'], label: '' },
    { id: 'zestial', name: 'Zestial', group: 'OVERLORD', affiliations: ['OVERLORD'], label: '' }
  ];
  const BASE_AFFILIATIONS = ['HELL', 'HEAVEN', 'HOTEL', 'OVERLORD', 'SIN', 'ROYALTY'];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (mark) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[mark]));
  const uid = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const today = () => new Date().toLocaleDateString('sv-SE');
  const nowText = () => new Date().toLocaleString('ko-KR');
  const parse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const cleanAff = (value = '') => {
    const text = String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
    if (!text) return '';
    if (text === 'OVERLORDS') return 'OVERLORD';
    if (text === 'SINS' || text === 'SEVEN DEADLY SINS') return 'SIN';
    if (text === 'CORE' || text === 'AU') return 'HELL';
    return text;
  };
  const split = (value = '') => {
    if (Array.isArray(value)) return [...new Set(value.map(cleanAff).filter(Boolean))];
    return [...new Set(String(value || '').split(/[\n,;/|]+/).map(cleanAff).filter(Boolean))];
  };
  const rarity = (value = '') => {
    const text = String(value || 'common').toUpperCase();
    return ['COMMON', 'RARE', 'EPIC', 'SECRET'].includes(text) ? text : 'COMMON';
  };
  const itemTitle = (item = {}) => item.name || item.title || 'Unnamed Item';
  const itemDescription = (item = {}) => item.desc || item.description || item.memo || item.body || '';
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0)));
  const pickLine = (value = '', fallback = '') => {
    const lines = Array.isArray(value) ? value.filter(Boolean) : String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
    return lines.length ? lines[Math.floor(Math.random() * lines.length)] : fallback;
  };

  function readState() {
    const state = parse(STATE_KEY, {});
    normalizeState(state);
    return state;
  }

  function saveState(state) {
    normalizeState(state);
    write(STATE_KEY, state);
  }

  function readUi() {
    const legacy = parse(OLD_UI_KEY, {});
    const ui = parse(UI_KEY, {});
    return {
      openCollections: legacy.openCollections || {},
      ...ui,
      openCollections: ui.openCollections || legacy.openCollections || {}
    };
  }

  function saveUi(ui) {
    write(UI_KEY, ui);
  }

  function normalizeState(state) {
    state.settings = state.settings && typeof state.settings === 'object' ? state.settings : {};
    state.characters = Array.isArray(state.characters) ? state.characters : [];
    state.affection = state.affection && typeof state.affection === 'object' ? state.affection : {};
    state.flags = state.flags && typeof state.flags === 'object' ? state.flags : {};
    state.box = state.box && typeof state.box === 'object' ? state.box : {};
    state.box.history = Array.isArray(state.box.history) ? state.box.history : [];
    state.collectionItems = Array.isArray(state.collectionItems) ? state.collectionItems : (Array.isArray(state.items) ? state.items : []);
    state.items = state.collectionItems;
    state.collectionProfiles = state.collectionProfiles && typeof state.collectionProfiles === 'object' ? state.collectionProfiles : (state.collections || {});
    state.ownedItems = Array.isArray(state.ownedItems) ? state.ownedItems : (Array.isArray(state.owned) ? state.owned : []);
    state.owned = state.ownedItems;
    state.newCollectionItems = Array.isArray(state.newCollectionItems) ? state.newCollectionItems : [];
    state.rewards = Array.isArray(state.rewards) ? state.rewards : [];
    state.dialogues = Array.isArray(state.dialogues) ? state.dialogues : (Array.isArray(state.interactions) ? state.interactions : []);
    state.interactions = Array.isArray(state.interactions) ? state.interactions : [];
    state.gifts = Array.isArray(state.gifts) ? state.gifts : [];
    state.thoughts = Array.isArray(state.thoughts) ? state.thoughts : [];
    state.memories = Array.isArray(state.memories) ? state.memories : [];
    state.conversationHistory = Array.isArray(state.conversationHistory) ? state.conversationHistory : [];
    state.music = state.music && typeof state.music === 'object' ? state.music : {};
    state.music.tracks = Array.isArray(state.music.tracks) ? state.music.tracks : [];
    state.music.volume = Number(state.music.volume ?? state.settings.volume ?? 70);
    state.settings.mysteryBoxMode = state.settings.mysteryBoxMode === 'unlimited' ? 'unlimited' : 'daily';
    state.box.lastDate = state.box.lastDate || state.box.date || '';
    state.box.lastResult = state.box.lastResult || state.box.result || null;
    for (const character of state.characters) normalizeCharacter(character);
    for (const item of NEW_CHARACTERS) {
      if (!state.characters.some((character) => character.id === item.id || character.name === item.name)) {
        state.characters.push({
          id: item.id,
          name: item.name,
          group: item.group,
          affiliations: item.affiliations,
          label: item.label,
          status: '', personality: '', speech: '', story: '', features: '', relations: '',
          sampleLines: [], tags: [], image: '', roomBackground: ''
        });
      }
    }
    return state;
  }

  function normalizeCharacter(character) {
    const group = cleanAff(character.group || character.category || 'HELL') || 'HELL';
    let affiliations = split(character.affiliations);
    if (!affiliations.length) affiliations = split(group);
    if (!affiliations.length) affiliations = ['HELL'];
    character.group = group;
    character.affiliations = affiliations;
    character.tags = Array.isArray(character.tags) ? character.tags : split(character.tags);
    character.sampleLines = Array.isArray(character.sampleLines)
      ? character.sampleLines
      : String(character.sampleLines || '').split('\n').map((line) => line.trim()).filter(Boolean);
    return character;
  }

  function migrateOnce() {
    const state = readState();
    const oldUi = parse(OLD_UI_KEY, {});
    const patch = parse(PATCH_KEY, {});

    const legacyMode = state.settings.mysteryBoxMode || state.box.mode || state.boxMode || oldUi.boxMode || oldUi.mysteryBoxMode;
    state.settings.mysteryBoxMode = legacyMode === 'unlimited' ? 'unlimited' : 'daily';
    delete state.box.mode;
    delete state.boxMode;
    delete state.mysteryBoxMode;

    const patchAffiliations = patch.affiliations || {};
    for (const character of state.characters) {
      const saved = patchAffiliations[character.id];
      const affiliations = split(saved || character.affiliations || character.group);
      if (affiliations.length) character.affiliations = affiliations;
      normalizeCharacter(character);
    }
    state.customAffiliations = allAffiliations(state, patch);

    const patchMusic = patch.music || {};
    const sourceTracks = [
      ...(Array.isArray(state.music?.tracks) ? state.music.tracks : []),
      ...(Array.isArray(patchMusic.tracks) ? patchMusic.tracks : [])
    ];
    const seen = new Set();
    state.music = {
      volume: Number(state.music?.volume ?? patchMusic.volume ?? state.settings.volume ?? 70),
      tracks: sourceTracks.filter((track) => {
        if (!track || !track.id) return false;
        if (seen.has(track.id)) return false;
        seen.add(track.id);
        return true;
      })
    };
    saveState(state);
  }

  function allAffiliations(state = readState(), patch = {}) {
    const set = new Set(BASE_AFFILIATIONS);
    split(state.customAffiliations || state.affiliationsList || []).forEach((item) => set.add(item));
    split(patch.customAffiliations || []).forEach((item) => set.add(item));
    (state.characters || []).forEach((character) => split(character.affiliations?.length ? character.affiliations : character.group).forEach((item) => set.add(item)));
    return [...set].filter(Boolean);
  }

  function character(state, id = activeCharacterId(state)) {
    return state.characters.find((item) => item.id === id) || state.characters[0] || { id: '', name: 'Character' };
  }

  function activeCharacterId(state = readState()) {
    return state.active || state.activeCharacterId || state.characters[0]?.id || '';
  }

  function affection(state, characterId) {
    return clamp(state.affection?.[characterId]?.value || 0);
  }

  function currentPage(state = readState()) {
    return state.page || 'home';
  }

  function showToast(message) {
    let root = $('#unifiedToastRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'unifiedToastRoot';
      document.body.appendChild(root);
    }
    const toast = document.createElement('div');
    toast.className = 'unified-toast';
    toast.textContent = message;
    root.appendChild(toast);
    setTimeout(() => toast.remove(), 1900);
  }

  function modalRoot() {
    let root = $('#unifiedModalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'unifiedModalRoot';
      document.body.appendChild(root);
    }
    return root;
  }

  function closeModal() {
    modalRoot().innerHTML = '';
  }

  function showModal(html) {
    modalRoot().innerHTML = `<div class="unified-modal-backdrop" data-unified-close><section class="unified-modal-card" onclick="event.stopPropagation()">${html}<button class="unified-modal-x" type="button" data-unified-close>×</button></section></div>`;
  }

  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putTrack(track) {
    const db = await database();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(track);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function getTrack(id) {
    const db = await database();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  async function deleteTrackFile(id) {
    const db = await database();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  const audio = new Audio();
  let activeUrl = '';

  async function addMp3(files) {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    const state = readState();
    for (const file of fileList) {
      const id = uid('track');
      await putTrack({ id, name: file.name, type: file.type || 'audio/mpeg', file });
      state.music.tracks.push({ id, name: file.name, type: file.type || 'audio/mpeg', size: file.size, addedAt: new Date().toISOString() });
    }
    saveState(state);
    showToast('Music added');
    renderSettings();
  }

  async function playTrack(id) {
    const track = await getTrack(id);
    if (!track?.file) {
      showToast('MP3 file not found in this browser');
      return;
    }
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    activeUrl = URL.createObjectURL(track.file);
    const state = readState();
    audio.src = activeUrl;
    audio.volume = Number(state.music.volume || 70) / 100;
    audio.play().catch(() => showToast('Playback was blocked'));
    $$('.unified-track').forEach((node) => node.classList.toggle('playing', node.dataset.track === id));
  }

  async function deleteTrack(id) {
    const state = readState();
    state.music.tracks = state.music.tracks.filter((track) => track.id !== id);
    saveState(state);
    await deleteTrackFile(id).catch(() => {});
    if ($(`.unified-track[data-track="${CSS.escape(id)}"]`)?.classList.contains('playing')) {
      audio.pause();
      audio.currentTime = 0;
    }
    showToast('Track deleted');
    renderSettings();
  }

  function setVolume(value) {
    const state = readState();
    state.music.volume = clamp(value, 0, 100);
    audio.volume = state.music.volume / 100;
    saveState(state);
  }

  function renderSettings() {
    const state = readState();
    if (currentPage(state) !== 'settings') return;
    const root = $('#pageRoot') || $('.page.active') || $('.page');
    if (!root) return;
    const mode = state.settings.mysteryBoxMode === 'unlimited' ? 'unlimited' : 'daily';
    root.dataset.unifiedSettings = 'yes';
    root.innerHTML = `<div class="unified-settings">
      <article class="panel unified-settings-card">
        <p class="label">APPEARANCE</p>
        <label>Gold<input id="unifiedGold" type="color" value="${esc(state.settings.gold || '#C8A45D')}"></label>
        <label>Wine<input id="unifiedWine" type="color" value="${esc(state.settings.wine || '#4A1320')}"></label>
        <label>Text size<input id="unifiedSize" type="range" min="13" max="20" value="${esc(state.settings.size || 16)}"></label>
      </article>

      <article class="panel unified-settings-card" data-music-panel>
        <p class="label">MUSIC</p>
        <label class="unified-file-button">ADD MP3<input id="unifiedMp3Input" type="file" accept="audio/mpeg,audio/mp3,audio/*" multiple></label>
        <div class="unified-track-list">
          ${state.music.tracks.length ? state.music.tracks.map((track) => `<div class="unified-track" data-track="${esc(track.id)}"><span>${esc(track.name)}</span><button class="ghost-button" type="button" data-music-play="${esc(track.id)}">PLAY</button><button class="ghost-button" type="button" data-music-delete="${esc(track.id)}">DELETE</button></div>`).join('') : '<p class="empty-state">추가된 MP3가 없습니다.</p>'}
        </div>
        <div class="unified-music-controls">
          <button class="ghost-button" type="button" data-music-pause>PAUSE</button>
          <button class="ghost-button" type="button" data-music-stop>STOP</button>
          <label>Volume<input id="unifiedVolume" type="range" min="0" max="100" value="${esc(state.music.volume)}"></label>
        </div>
      </article>

      <article class="panel unified-settings-card" data-mystery-box-settings>
        <p class="label">MYSTERY BOX</p>
        <p class="muted">Mode</p>
        <div class="unified-mode-row">
          <button class="${mode === 'daily' ? 'gold-button' : 'ghost-button'}" type="button" data-box-mode="daily">DAILY</button>
          <button class="${mode === 'unlimited' ? 'gold-button' : 'ghost-button'}" type="button" data-box-mode="unlimited">TEST MODE</button>
        </div>
        <button class="ghost-button unified-reset-button" type="button" data-reset-mystery-box>RESET MYSTERY BOX</button>
        ${boxHistoryHtml(state)}
      </article>

      <article class="panel unified-settings-card">
        <p class="label">DATA BACKUP</p>
        <div class="button-row"><button class="ghost-button" type="button" data-export-state>EXPORT JSON</button><label class="unified-file-button small">IMPORT JSON<input id="unifiedImportState" type="file" accept="application/json,.json"></label></div>
      </article>

      <article class="panel unified-settings-card danger-zone">
        <p class="label">DANGER ZONE</p>
        <button class="ghost-button unified-reset-button" type="button" data-reset-collection>RESET COLLECTION</button>
      </article>
    </div>`;
    applyAppearance(state);
  }

  function applyAppearance(state = readState()) {
    document.documentElement.style.setProperty('--gold', state.settings.gold || '#C8A45D');
    document.documentElement.style.setProperty('--wine', state.settings.wine || '#4A1320');
    document.documentElement.style.setProperty('--body-size', `${state.settings.size || 16}px`);
  }

  function renderHomeBox() {
    const state = readState();
    if (currentPage(state) !== 'home') return;
    const panels = $$('.panel');
    const card = panels.find((panel) => /DAILY MYSTERY BOX|MYSTERY BOX/i.test(panel.textContent || ''));
    if (!card) return;
    const mode = state.settings.mysteryBoxMode === 'unlimited' ? 'TEST MODE' : 'DAILY';
    const opened = state.settings.mysteryBoxMode !== 'unlimited' && state.box.lastDate === today();
    card.classList.add('unified-home-box');
    card.innerHTML = `<p class="label">DAILY MYSTERY BOX</p><h3>${opened ? 'OPENED TODAY' : 'READY'}</h3><p class="muted">${mode}</p><button class="gold-button" type="button" data-unified-open-box>OPEN</button>`;
  }

  function renderCollection() {
    const state = readState();
    if (currentPage(state) !== 'collection') return;
    const root = $('#pageRoot') || $('.page.active') || $('.page');
    if (!root) return;
    const ui = readUi();
    const groups = state.characters.filter((char) => state.collectionItems.some((item) => item.characterId === char.id) || state.collectionProfiles?.[char.id]);
    root.dataset.unifiedCollection = 'yes';
    if (!groups.length) {
      root.innerHTML = `<div class="unified-collection-page"><section class="unified-empty"><h2>No items yet.</h2><p>EDITOR에서 Collection Item을 추가하면 이곳에 도감처럼 표시됩니다.</p><button class="ghost-button" type="button" data-page="editor">ADD IN EDITOR</button></section></div>`;
      return;
    }
    root.innerHTML = `<div class="unified-collection-page">
      <header class="unified-page-head"><p class="label">COLLECTION</p><h2>Collection Files</h2><button class="ghost-button unified-reset-button" type="button" data-reset-collection>RESET COLLECTION</button></header>
      ${groups.map((char) => collectionGroupHtml(state, ui, char)).join('')}
    </div>`;
  }

  function collectionGroupHtml(state, ui, char) {
    const profile = state.collectionProfiles?.[char.id] || {};
    const items = state.collectionItems.filter((item) => item.characterId === char.id);
    const owned = items.filter((item) => state.ownedItems.includes(item.id));
    const percent = items.length ? Math.round((owned.length / items.length) * 100) : 0;
    const isOpen = !!ui.openCollections[char.id];
    return `<section class="unified-collection-group ${isOpen ? 'open' : ''}">
      <button class="unified-collection-summary" type="button" data-toggle-collection="${esc(char.id)}">
        <span><strong>${esc(char.name)}</strong><small>${esc(profile.title || 'Collection')}</small></span>
        <span class="unified-progress-wrap"><span class="unified-progress"><i style="width:${percent}%"></i></span><small>${owned.length} / ${items.length}</small></span>
        <b>${isOpen ? 'v' : '>'}</b>
      </button>
      ${percent === 100 && items.length ? '<p class="unified-complete">COLLECTION COMPLETE</p>' : ''}
      ${isOpen ? `<div class="unified-item-grid">${items.map((item) => itemCardHtml(state, item)).join('')}</div>` : ''}
    </section>`;
  }

  function itemCardHtml(state, item) {
    const owned = state.ownedItems.includes(item.id);
    const rare = rarity(item.rarity);
    const secretLocked = !owned && rare === 'SECRET';
    const isNew = owned && state.newCollectionItems.includes(item.id);
    return `<button class="unified-item-card rarity-${rare.toLowerCase()} ${owned ? 'owned' : 'locked'} ${isNew ? 'is-new' : ''}" type="button" data-unified-item="${esc(item.id)}">
      ${isNew ? '<em>NEW</em>' : ''}
      <span class="unified-symbol">${esc(secretLocked ? '◆' : (item.symbol || item.icon || '◆'))}</span>
      <strong>${esc(secretLocked ? '???' : itemTitle(item))}</strong>
      <small>${esc(rare)}</small>
      <b>${owned ? 'OWNED' : 'LOCKED'}</b>
    </button>`;
  }

  function openCollectionItem(itemId) {
    const state = readState();
    const item = state.collectionItems.find((entry) => entry.id === itemId);
    if (!item) return;
    const owned = state.ownedItems.includes(item.id);
    const rare = rarity(item.rarity);
    const secretLocked = !owned && rare === 'SECRET';
    if (owned) {
      state.newCollectionItems = state.newCollectionItems.filter((id) => id !== item.id);
      saveState(state);
      renderCollection();
    }
    showModal(`<div class="unified-detail rarity-${rare.toLowerCase()} ${owned ? 'owned' : 'locked'}">
      <p class="label">COLLECTION DETAIL</p>
      <div class="unified-detail-symbol">${esc(secretLocked ? '◆' : (item.symbol || item.icon || '◆'))}</div>
      <h2>${esc(secretLocked ? '???' : itemTitle(item))}</h2>
      <p class="unified-rarity">${esc(rare)}</p>
      <p class="unified-status">${owned ? 'OBTAINED' : 'LOCKED'}</p>
      <p class="unified-detail-body">${esc(owned ? (itemDescription(item) || '설명이 없습니다.') : '아직 획득하지 못한 컬렉션입니다. 획득한 뒤 설명을 볼 수 있습니다.')}</p>
      ${owned && item.condition ? `<section><h3>Obtained from</h3><p>${esc(item.condition)}</p></section>` : ''}
      ${owned ? `<section><h3>Related Character</h3><p>${esc(character(state, item.characterId).name)}</p></section>` : ''}
    </div>`);
  }

  function weightedReward(state) {
    const rewards = state.rewards || [];
    if (!rewards.length) return null;
    const weights = { common: 64, rare: 25, epic: 9, secret: 2 };
    const total = rewards.reduce((sum, reward) => sum + (weights[String(reward.rarity || 'common').toLowerCase()] || 10), 0);
    let roll = Math.random() * Math.max(1, total);
    for (const reward of rewards) {
      roll -= weights[String(reward.rarity || 'common').toLowerCase()] || 10;
      if (roll <= 0) return reward;
    }
    return rewards[0];
  }

  function openMysteryBox() {
    const state = readState();
    const mode = state.settings.mysteryBoxMode === 'unlimited' ? 'unlimited' : 'daily';
    if (mode === 'daily' && state.box.lastDate === today()) {
      showModal(`<div class="unified-box-result"><p class="label">MYSTERY BOX</p><h2>Already opened today.</h2><p>SETTINGS에서 TEST MODE를 선택하면 제한 없이 테스트할 수 있습니다.</p>${boxHistoryHtml(state)}</div>`);
      return;
    }
    const reward = weightedReward(state);
    if (!reward) {
      showModal(`<div class="unified-box-result"><p class="label">MYSTERY BOX</p><h2>No reward yet.</h2><p>EDITOR에서 Mystery Box Reward를 추가하면 이곳에서 뽑을 수 있습니다.</p></div>`);
      return;
    }
    showModal(`<div class="unified-box-opening"><p class="label">MYSTERY BOX</p><h2>Opening...</h2><div class="unified-box-light"></div></div>`);
    setTimeout(() => revealReward(reward), 560);
  }

  function revealReward(reward) {
    const state = readState();
    const item = reward.itemId ? state.collectionItems.find((entry) => entry.id === reward.itemId) : null;
    const duplicate = !!item && state.ownedItems.includes(item.id);
    const isNew = !!item && !duplicate;
    if (item && !duplicate) {
      state.ownedItems.push(item.id);
      state.owned = state.ownedItems;
      if (!state.newCollectionItems.includes(item.id)) state.newCollectionItems.push(item.id);
    }
    const rare = rarity(item?.rarity || reward.rarity);
    const title = item ? itemTitle(item) : (reward.title || 'Mystery Reward');
    const char = character(state, reward.characterId || item?.characterId || activeCharacterId(state));
    state.box.lastDate = today();
    state.box.date = today();
    state.box.lastResult = { id: uid('box-result'), rewardId: reward.id || '', itemId: item?.id || '', title, rarity: rare, duplicate, isNew, date: nowText() };
    state.box.history.unshift({ id: uid('box'), rewardId: reward.id || '', itemId: item?.id || '', characterId: char.id, title, rarity: rare, duplicate, isNew, date: nowText() });
    state.box.history = state.box.history.slice(0, 20);
    saveState(state);
    showRewardModal(state, reward, item, { duplicate, isNew });
    renderHomeBox();
  }

  function showRewardModal(state, reward, item, meta = {}) {
    const rare = rarity(item?.rarity || reward.rarity);
    const title = item ? itemTitle(item) : (reward.title || 'Mystery Reward');
    const char = character(state, reward.characterId || item?.characterId || activeCharacterId(state));
    const message = pickLine(reward.body, reward.body || '');
    const description = item ? itemDescription(item) : '';
    showModal(`<div class="unified-box-result rarity-${rare.toLowerCase()}">
      <p class="label">MYSTERY BOX</p>
      <p class="unified-rarity">${esc(rare)}</p>
      <h2>${esc(title)}</h2>
      <p class="unified-character-name">${esc(char.name || '')}</p>
      ${message ? `<blockquote>${esc(message)}</blockquote>` : ''}
      ${description ? `<p class="unified-detail-body">${esc(description)}</p>` : ''}
      <p class="unified-status">${meta.duplicate ? 'DUPLICATE · Already in your collection.' : meta.isNew ? 'NEW COLLECTION ITEM' : 'REWARD'}</p>
      <div class="button-row"><button class="gold-button" type="button" data-view-collection>VIEW COLLECTION</button><button class="ghost-button" type="button" data-unified-close>CLOSE</button></div>
      ${boxHistoryHtml(state)}
    </div>`);
  }

  function boxHistoryHtml(state) {
    const history = state.box?.history || [];
    if (!history.length) return '';
    return `<section class="unified-box-history"><h3>MYSTERY BOX HISTORY</h3>${history.slice(0, 12).map((entry) => `<p><small>${esc(entry.date || '')}</small><span>${esc(entry.title || 'Reward')} · ${esc(entry.rarity || '')}${entry.duplicate ? ' · DUPLICATE' : ''}</span></p>`).join('')}</section>`;
  }

  function resetMysteryBox() {
    const state = readState();
    state.box.lastDate = '';
    state.box.date = '';
    state.box.lastResult = null;
    state.box.result = null;
    state.box.history = [];
    saveState(state);
    const check = readState();
    if (check.box.lastDate || check.box.lastResult || check.box.history.length) {
      showToast('Reset failed. Please try again.');
      return;
    }
    showToast('Mystery Box reset');
    renderSettings();
    renderHomeBox();
  }

  function resetCollection() {
    const ok = confirm('Collection 획득 상태만 초기화할까요? Mystery Box 기록은 유지됩니다.');
    if (!ok) return;
    const state = readState();
    state.ownedItems = [];
    state.owned = state.ownedItems;
    state.newCollectionItems = [];
    saveState(state);
    const ui = readUi();
    ui.seenCollectionItems = [];
    saveUi(ui);
    showToast('Collection reset');
    renderCollection();
  }

  function setBoxMode(mode) {
    const state = readState();
    state.settings.mysteryBoxMode = mode === 'unlimited' ? 'unlimited' : 'daily';
    if (state.box) delete state.box.mode;
    delete state.boxMode;
    delete state.mysteryBoxMode;
    saveState(state);
    showToast('Mystery Box mode saved');
    renderSettings();
    renderHomeBox();
  }

  function exportState() {
    const state = readState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hellaverse-backup-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importState(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        saveState(data);
        showToast('Backup restored');
        setTimeout(() => location.reload(), 350);
      } catch {
        showToast('Invalid backup file');
      }
    };
    reader.readAsText(file);
  }

  function updateAppearance() {
    const state = readState();
    const gold = $('#unifiedGold')?.value;
    const wine = $('#unifiedWine')?.value;
    const size = $('#unifiedSize')?.value;
    if (gold) state.settings.gold = gold;
    if (wine) state.settings.wine = wine;
    if (size) state.settings.size = Number(size);
    saveState(state);
    applyAppearance(state);
  }

  function afterRender() {
    migrateOnce();
    const state = readState();
    applyAppearance(state);
    if (currentPage(state) === 'settings') renderSettings();
    if (currentPage(state) === 'collection') renderCollection();
    if (currentPage(state) === 'home') renderHomeBox();
  }

  function handleGate(event) {
    const gateTarget = event.target.closest?.('#gate, [data-enter]');
    if (!gateTarget) return false;
    const gate = $('#gate');
    const shell = $('#shell');
    if (!gate || gate.hidden) return false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    localStorage.setItem(GATE_KEY, 'yes');
    if (shell) shell.hidden = false;
    gate.classList.add('unified-gate-out');
    setTimeout(() => { gate.hidden = true; afterRender(); }, 520);
    return true;
  }

  document.addEventListener('click', (event) => {
    if (handleGate(event)) return;

    const close = event.target.closest?.('[data-unified-close]');
    if (close) { closeModal(); return; }

    const boxOpen = event.target.closest?.('[data-unified-open-box], [data-open-box]');
    if (boxOpen) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openMysteryBox();
      return;
    }

    const modeButton = event.target.closest?.('[data-box-mode]');
    if (modeButton) {
      setBoxMode(modeButton.dataset.boxMode);
      return;
    }

    if (event.target.closest?.('[data-reset-mystery-box]')) { resetMysteryBox(); return; }
    if (event.target.closest?.('[data-reset-collection]')) { resetCollection(); return; }

    const toggle = event.target.closest?.('[data-toggle-collection]');
    if (toggle) {
      const ui = readUi();
      const characterId = toggle.dataset.toggleCollection;
      ui.openCollections[characterId] = !ui.openCollections[characterId];
      saveUi(ui);
      renderCollection();
      return;
    }

    const item = event.target.closest?.('[data-unified-item]');
    if (item) { openCollectionItem(item.dataset.unifiedItem); return; }

    const viewCollection = event.target.closest?.('[data-view-collection]');
    if (viewCollection) {
      const state = readState();
      state.page = 'collection';
      saveState(state);
      closeModal();
      location.reload();
      return;
    }

    const play = event.target.closest?.('[data-music-play]');
    if (play) { playTrack(play.dataset.musicPlay); return; }
    const del = event.target.closest?.('[data-music-delete]');
    if (del) { deleteTrack(del.dataset.musicDelete); return; }
    if (event.target.closest?.('[data-music-pause]')) { audio.pause(); return; }
    if (event.target.closest?.('[data-music-stop]')) { audio.pause(); audio.currentTime = 0; return; }
    if (event.target.closest?.('[data-export-state]')) { exportState(); return; }

    if (event.target.closest?.('[data-page], [data-room], [data-profile], [data-action-kind], .nav-button, .character-chip')) {
      setTimeout(afterRender, 30);
      setTimeout(afterRender, 160);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    const gate = $('#gate');
    if (gate && !gate.hidden && !['Shift', 'Alt', 'Control', 'Meta', 'Tab'].includes(event.key)) {
      handleGate({
        target: gate,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
        stopImmediatePropagation: () => event.stopImmediatePropagation()
      });
    }
  }, true);

  document.addEventListener('input', (event) => {
    if (event.target.id === 'unifiedVolume') setVolume(event.target.value);
    if (['unifiedGold', 'unifiedWine', 'unifiedSize'].includes(event.target.id)) updateAppearance();
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'unifiedMp3Input') addMp3(event.target.files);
    if (event.target.id === 'unifiedImportState') importState(event.target.files?.[0]);
  });

  migrateOnce();
  document.addEventListener('DOMContentLoaded', () => {
    afterRender();
    setTimeout(afterRender, 100);
    setTimeout(afterRender, 450);
  });
  window.addEventListener('pageshow', afterRender);
})();