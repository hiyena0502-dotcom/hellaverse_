const STATE_KEY = 'hellaverse_dialogue_state_v1';
const UI_KEY = 'hellaverse_game_loop_ui_v1';

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (mark) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[mark]));
const parse = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return fallback; }
};
const saveState = (state) => localStorage.setItem(STATE_KEY, JSON.stringify(state));
const saveUi = (ui) => localStorage.setItem(UI_KEY, JSON.stringify(ui));

function readState() {
  const state = parse(STATE_KEY, {});
  state.characters = Array.isArray(state.characters) ? state.characters : [];
  state.collectionItems = Array.isArray(state.collectionItems) ? state.collectionItems : (Array.isArray(state.items) ? state.items : []);
  state.items = state.collectionItems;
  state.ownedItems = Array.isArray(state.ownedItems) ? state.ownedItems : (Array.isArray(state.owned) ? state.owned : []);
  state.owned = state.ownedItems;
  state.newCollectionItems = Array.isArray(state.newCollectionItems) ? state.newCollectionItems : [];
  state.box = state.box && typeof state.box === 'object' ? state.box : {};
  state.box.history = Array.isArray(state.box.history) ? state.box.history : [];
  return state;
}

function readUi() {
  const ui = parse(UI_KEY, {});
  ui.openCollections = ui.openCollections || {};
  ui.seenCollectionItems = Array.isArray(ui.seenCollectionItems) ? ui.seenCollectionItems : [];
  return ui;
}

function rarity(value = '') {
  const text = String(value || 'common').toUpperCase();
  return ['COMMON', 'RARE', 'EPIC', 'SECRET'].includes(text) ? text : 'COMMON';
}
function itemTitle(item = {}) { return item.name || item.title || 'Unnamed Item'; }
function itemDescription(item = {}) { return item.desc || item.description || item.memo || item.body || ''; }
function characterName(state, characterId) {
  return state.characters.find((character) => character.id === characterId)?.name || 'Unknown Character';
}

function modalRoot() {
  let root = qs('#collectionLockModalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'collectionLockModalRoot';
    document.body.appendChild(root);
  }
  return root;
}
function closeModal() { modalRoot().innerHTML = ''; }
function showModal(html) {
  modalRoot().innerHTML = `<div class="loop-modal-backdrop lock-reset-backdrop" data-lock-reset-close><section class="loop-modal-card lock-reset-card" onclick="event.stopPropagation()">${html}<button class="loop-modal-x" type="button" data-lock-reset-close>×</button></section></div>`;
}
function toast(message) {
  let root = qs('#collectionResetToastRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'collectionResetToastRoot';
    document.body.appendChild(root);
  }
  const item = document.createElement('div');
  item.className = 'collection-reset-toast';
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => item.remove(), 1800);
}

function openCollectionDetail(itemId) {
  const state = readState();
  const item = state.collectionItems.find((entry) => entry.id === itemId);
  if (!item) return;

  const owned = state.ownedItems.includes(item.id);
  const rare = rarity(item.rarity);
  const shouldHide = !owned;
  const secretLocked = shouldHide && rare === 'SECRET';

  if (owned) {
    state.newCollectionItems = state.newCollectionItems.filter((id) => id !== item.id);
    const ui = readUi();
    if (!ui.seenCollectionItems.includes(item.id)) ui.seenCollectionItems.push(item.id);
    saveUi(ui);
    saveState(state);
  }

  const title = secretLocked ? '???' : itemTitle(item);
  const symbol = secretLocked ? '◆' : (item.symbol || item.icon || '◆');
  const body = owned
    ? (itemDescription(item) || '설명이 없습니다.')
    : '아직 획득하지 못한 컬렉션입니다. 획득한 뒤 설명을 볼 수 있습니다.';

  showModal(`<div class="loop-detail locked-detail rarity-${rare.toLowerCase()} ${owned ? 'owned' : 'locked'}">
    <p class="label">COLLECTION DETAIL</p>
    <div class="loop-detail-symbol">${esc(symbol)}</div>
    <h2>${esc(title)}</h2>
    <p class="loop-rarity">${esc(rare)}</p>
    <p class="loop-status">${owned ? 'OBTAINED' : 'LOCKED'}</p>
    <p class="loop-detail-body">${esc(body)}</p>
    ${owned && item.condition ? `<section><h3>Obtained from</h3><p>${esc(item.condition)}</p></section>` : ''}
    ${owned ? `<section><h3>Related Character</h3><p>${esc(characterName(state, item.characterId))}</p></section>` : ''}
  </div>`);
}

function resetCollectionProgress() {
  const state = readState();
  state.ownedItems = [];
  state.owned = state.ownedItems;
  state.newCollectionItems = [];
  state.box.lastResult = null;
  state.box.lastDate = '';
  state.box.date = '';
  state.box.history = [];
  saveState(state);

  const ui = readUi();
  ui.seenCollectionItems = [];
  saveUi(ui);

  toast('Collection progress reset');
  closeModal();
  setTimeout(() => location.reload(), 350);
}

function showResetConfirm() {
  showModal(`<div class="collection-reset-confirm">
    <p class="label">COLLECTION RESET</p>
    <h2>획득 상태를 초기화할까요?</h2>
    <p>Collection Editor에 작성한 아이템, 설명, 보상 데이터는 지우지 않습니다.</p>
    <p>초기화되는 항목: OWNED 상태, NEW 표시, Mystery Box 최근 결과와 기록</p>
    <div class="button-row">
      <button class="gold-button" type="button" data-confirm-collection-reset>RESET COLLECTION</button>
      <button class="ghost-button" type="button" data-lock-reset-close>CANCEL</button>
    </div>
  </div>`);
}

function addResetButton() {
  const collectionPage = qs('.loop-collection-page');
  if (collectionPage && !qs('[data-open-collection-reset]', collectionPage)) {
    const head = qs('.loop-page-head', collectionPage) || collectionPage;
    head.insertAdjacentHTML('beforeend', '<button class="ghost-button collection-reset-button" type="button" data-open-collection-reset>RESET COLLECTION</button>');
  }

  const settingsGrid = qs('.settings-grid');
  if (settingsGrid && !qs('[data-settings-collection-reset]', settingsGrid)) {
    const danger = qsa('.panel', settingsGrid).find((panel) => /DANGER|RESET|초기화/i.test(panel.textContent || '')) || settingsGrid.lastElementChild;
    if (danger) {
      danger.insertAdjacentHTML('beforeend', '<button class="ghost-button collection-reset-button danger" type="button" data-open-collection-reset data-settings-collection-reset>RESET COLLECTION</button>');
    }
  }
}

function patchLockedCards() {
  const state = readState();
  qsa('[data-loop-item]').forEach((card) => {
    const item = state.collectionItems.find((entry) => entry.id === card.dataset.loopItem);
    if (!item) return;
    const owned = state.ownedItems.includes(item.id);
    const rare = rarity(item.rarity);
    if (!owned) {
      card.classList.add('description-locked');
      card.setAttribute('title', '획득한 뒤 설명을 볼 수 있습니다.');
      if (rare === 'SECRET') {
        const name = card.querySelector('strong');
        if (name) name.textContent = '???';
      }
    }
  });
}

function enhance() {
  addResetButton();
  patchLockedCards();
}

window.addEventListener('click', (event) => {
  const itemButton = event.target.closest?.('[data-loop-item]');
  if (itemButton) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openCollectionDetail(itemButton.dataset.loopItem);
    return;
  }
}, true);

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-lock-reset-close]')) closeModal();
  if (event.target.closest('[data-open-collection-reset]')) showResetConfirm();
  if (event.target.closest('[data-confirm-collection-reset]')) resetCollectionProgress();
});

new MutationObserver(() => requestAnimationFrame(enhance)).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('DOMContentLoaded', enhance);
setTimeout(enhance, 250);
setTimeout(enhance, 900);
