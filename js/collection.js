(() => {
  if (window.__HELLAVERSE_COLLECTION_MODULE__) return;
  window.__HELLAVERSE_COLLECTION_MODULE__ = true;

  const STATE_KEY = 'hellaverse_dialogue_state_v1';
  const UI_KEY = 'hellaverse_collection_ui_v1';
  const EXTRA_CHARACTERS = [
    { id: 'emily', name: 'Emily', group: 'HEAVEN', affiliations: ['HEAVEN'], label: '' },
    { id: 'baxter', name: 'Baxter', group: 'HELL', affiliations: ['HELL'], label: '' },
    { id: 'zestial', name: 'Zestial', group: 'OVERLORD', affiliations: ['OVERLORD'], label: '' }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (mark) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[mark]));
  const parse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return fallback; }
  };
  const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const todayText = () => new Date().toLocaleString('ko-KR');

  function normalizeState(state) {
    state.characters = Array.isArray(state.characters) ? state.characters : [];
    state.collectionItems = Array.isArray(state.collectionItems) ? state.collectionItems : (Array.isArray(state.items) ? state.items : []);
    state.items = state.collectionItems;
    state.collectionProfiles = state.collectionProfiles && typeof state.collectionProfiles === 'object' ? state.collectionProfiles : (state.collections || {});
    state.ownedItems = Array.isArray(state.ownedItems) ? state.ownedItems : (Array.isArray(state.owned) ? state.owned : []);
    state.owned = state.ownedItems;
    state.newCollectionItems = Array.isArray(state.newCollectionItems) ? state.newCollectionItems : [];
    state.settings = state.settings && typeof state.settings === 'object' ? state.settings : {};
    for (const character of state.characters) {
      if (!Array.isArray(character.affiliations) || !character.affiliations.length) character.affiliations = [character.group || 'HELL'];
    }
    for (const character of EXTRA_CHARACTERS) {
      if (!state.characters.some((item) => item.id === character.id || item.name === character.name)) {
        state.characters.push({ status: '', personality: '', speech: '', story: '', features: '', relations: '', sampleLines: [], tags: [], image: '', roomBackground: '', ...character });
      }
    }
    return state;
  }
  function readState() { return normalizeState(parse(STATE_KEY, {})); }
  function saveState(state) { saveJson(STATE_KEY, normalizeState(state)); }
  function readUi() {
    const ui = parse(UI_KEY, {});
    ui.openCollections = ui.openCollections || {};
    ui.seenCollectionItems = Array.isArray(ui.seenCollectionItems) ? ui.seenCollectionItems : [];
    return ui;
  }
  function saveUi(ui) { saveJson(UI_KEY, ui); }

  function rarity(value = '') {
    const text = String(value || 'COMMON').toUpperCase();
    return ['COMMON', 'RARE', 'EPIC', 'SECRET'].includes(text) ? text : 'COMMON';
  }
  function itemTitle(item = {}) { return item.name || item.title || 'Unnamed Item'; }
  function itemBody(item = {}) { return item.desc || item.description || item.memo || item.body || ''; }
  function characterName(state, characterId) { return state.characters.find((character) => character.id === characterId)?.name || 'Unknown Character'; }
  function collectionTitle(state, characterId) {
    const profile = state.collectionProfiles?.[characterId] || {};
    return profile.title || 'Collection';
  }
  function counts(state, characterId) {
    const all = state.collectionItems.filter((item) => item.characterId === characterId);
    const owned = all.filter((item) => state.ownedItems.includes(item.id));
    return { all: all.length, owned: owned.length, percent: all.length ? Math.round((owned.length / all.length) * 100) : 0 };
  }

  function modalRoot() {
    let root = $('#collectionModalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'collectionModalRoot';
      document.body.appendChild(root);
    }
    return root;
  }
  function showModal(html) {
    modalRoot().innerHTML = `<div class="modal-backdrop collection-modal-backdrop" data-collection-close><article class="modal-card collection-modal-card" onclick="event.stopPropagation()">${html}<button class="modal-close" type="button" data-collection-close>×</button></article></div>`;
  }
  function closeModal() { modalRoot().innerHTML = ''; }
  function toast(text) {
    let root = $('#collectionToastRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'collectionToastRoot';
      document.body.appendChild(root);
    }
    const box = document.createElement('div');
    box.className = 'toast collection-toast';
    box.textContent = text;
    root.appendChild(box);
    setTimeout(() => box.remove(), 1800);
  }

  function renderCollectionPage() {
    const state = readState();
    const ui = readUi();
    const groups = state.characters.filter((character) => state.collectionItems.some((item) => item.characterId === character.id) || state.collectionProfiles[character.id]);
    if (!groups.length) {
      return `<div class="collection-module-page" data-collection-root>
        <section class="panel collection-empty"><p class="label">COLLECTION</p><h2>No items yet.</h2><p>EDITOR에서 Collection Item을 추가하면 여기에서 도감처럼 볼 수 있습니다.</p></section>
      </div>`;
    }
    return `<div class="collection-module-page" data-collection-root>
      <div class="section-title-row collection-title-row">
        <div><p class="label">COLLECTION</p><h2>Collected Files</h2><p>획득한 아이템만 상세 설명을 볼 수 있습니다.</p></div>
        <button class="ghost-button danger" type="button" data-reset-collection>RESET COLLECTION</button>
      </div>
      ${groups.map((character) => {
        const count = counts(state, character.id);
        const isOpen = !!ui.openCollections[character.id];
        const items = state.collectionItems.filter((item) => item.characterId === character.id);
        return `<section class="panel collection-character ${isOpen ? 'open' : ''}">
          <button class="collection-summary" type="button" data-toggle-collection="${esc(character.id)}">
            <span><strong>${esc(character.name)}</strong><small>${esc(collectionTitle(state, character.id))}</small></span>
            <span class="collection-progress-area"><i><b style="width:${count.percent}%"></b></i><small>${count.owned} / ${count.all}</small></span>
            <em>${isOpen ? 'v' : '>'}</em>
          </button>
          ${count.percent === 100 && count.all ? '<p class="collection-complete">COLLECTION COMPLETE</p>' : ''}
          ${isOpen ? `<div class="collection-item-grid">${items.map((item) => itemCard(state, item)).join('')}</div>` : ''}
        </section>`;
      }).join('')}
    </div>`;
  }
  function itemCard(state, item) {
    const owned = state.ownedItems.includes(item.id);
    const rare = rarity(item.rarity);
    const secretLocked = !owned && rare === 'SECRET';
    const isNew = owned && state.newCollectionItems.includes(item.id);
    return `<button class="collection-item-card rarity-${rare.toLowerCase()} ${owned ? 'owned' : 'locked'} ${isNew ? 'is-new' : ''}" type="button" data-collection-item="${esc(item.id)}">
      ${isNew ? '<span class="new-badge">NEW</span>' : ''}
      <span class="item-symbol">${esc(secretLocked ? '◆' : (item.symbol || item.icon || '◆'))}</span>
      <strong>${esc(secretLocked ? '???' : itemTitle(item))}</strong>
      <small>${esc(rare)}</small>
      <b>${owned ? 'OWNED' : 'LOCKED'}</b>
    </button>`;
  }
  function openItem(itemId) {
    const state = readState();
    const item = state.collectionItems.find((entry) => entry.id === itemId);
    if (!item) return;
    const owned = state.ownedItems.includes(item.id);
    const rare = rarity(item.rarity);
    const secretLocked = !owned && rare === 'SECRET';
    if (owned) {
      state.newCollectionItems = state.newCollectionItems.filter((id) => id !== item.id);
      saveState(state);
      const ui = readUi();
      if (!ui.seenCollectionItems.includes(item.id)) ui.seenCollectionItems.push(item.id);
      saveUi(ui);
    }
    showModal(`<div class="collection-detail rarity-${rare.toLowerCase()} ${owned ? 'owned' : 'locked'}">
      <p class="label">COLLECTION DETAIL</p>
      <div class="collection-detail-symbol">${esc(secretLocked ? '◆' : (item.symbol || item.icon || '◆'))}</div>
      <h2>${esc(secretLocked ? '???' : itemTitle(item))}</h2>
      <p class="rarity-label">${esc(rare)}</p>
      <p class="status-label">${owned ? 'OBTAINED' : 'LOCKED'}</p>
      <p class="collection-description">${esc(owned ? (itemBody(item) || '설명이 없습니다.') : '아직 획득하지 못한 컬렉션입니다. 획득한 뒤 설명을 볼 수 있습니다.')}</p>
      ${owned && item.condition ? `<section><h3>Obtained from</h3><p>${esc(item.condition)}</p></section>` : ''}
      ${owned ? `<section><h3>Related Character</h3><p>${esc(characterName(state, item.characterId))}</p></section>` : ''}
    </div>`);
  }
  function confirmResetCollection() {
    showModal(`<div class="collection-reset-confirm"><p class="label">RESET COLLECTION</p><h2>컬렉션 획득 상태만 초기화할까요?</h2><p>Collection Item, 설명, 보상 데이터는 유지됩니다. Mystery Box 기록은 건드리지 않습니다.</p><div class="button-row"><button class="gold-button" type="button" data-confirm-reset-collection>RESET COLLECTION</button><button class="ghost-button" type="button" data-collection-close>CANCEL</button></div></div>`);
  }
  function resetCollection() {
    const state = readState();
    state.ownedItems = [];
    state.owned = state.ownedItems;
    state.newCollectionItems = [];
    saveState(state);
    const ui = readUi();
    ui.seenCollectionItems = [];
    saveUi(ui);
    closeModal();
    afterRender();
    toast('Collection reset');
  }
  function afterRender() {
    const state = readState();
    if ((state.page || '') !== 'collection') return;
    const page = $('.page.active');
    if (!page) return;
    if (page.querySelector('[data-collection-root]')) return;
    page.innerHTML = renderCollectionPage();
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-toggle-collection]');
    if (toggle) {
      event.preventDefault();
      const ui = readUi();
      ui.openCollections[toggle.dataset.toggleCollection] = !ui.openCollections[toggle.dataset.toggleCollection];
      saveUi(ui);
      const page = $('.page.active');
      if (page) page.innerHTML = renderCollectionPage();
      return;
    }
    const item = event.target.closest('[data-collection-item]');
    if (item) {
      event.preventDefault();
      openItem(item.dataset.collectionItem);
      return;
    }
    if (event.target.closest('[data-reset-collection]')) {
      event.preventDefault();
      confirmResetCollection();
      return;
    }
    if (event.target.closest('[data-confirm-reset-collection]')) {
      event.preventDefault();
      resetCollection();
      return;
    }
    if (event.target.closest('[data-collection-close]')) {
      event.preventDefault();
      closeModal();
      return;
    }
    setTimeout(afterRender, 0);
  }, true);

  window.addEventListener('DOMContentLoaded', afterRender);
  window.addEventListener('pageshow', afterRender);
  setTimeout(afterRender, 0);
  setTimeout(afterRender, 120);
})();
