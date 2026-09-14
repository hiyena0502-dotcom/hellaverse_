const STATE_KEY = 'hellaverse_dialogue_state_v1';
const GATE_KEY = 'hellaverse_gate_open';
let idleTimer = null;
let lastRoomId = '';
let lastStage = '';

const readState = () => {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
  catch { return {}; }
};
const lines = (value = '') => String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
const pick = (items = []) => items.length ? items[Math.floor(Math.random() * items.length)] : '';
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (mark) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[mark]));
const stageName = (value = 0) => value < 20 ? 'STRANGER' : value < 40 ? 'ACQUAINTANCE' : value < 60 ? 'FAMILIAR' : value < 80 ? 'CLOSE' : value < 100 ? 'TRUSTED' : 'SPECIAL';
const affinity = (state, characterId) => Math.max(0, Math.min(100, Number(state.affection?.[characterId]?.value || 0)));
const activeCharacter = (state = readState()) => (state.characters || []).find((item) => item.id === (state.active || state.activeCharacterId)) || (state.characters || [])[0];

function enterSite() {
  const gate = document.querySelector('.gate');
  const shell = document.querySelector('.site-shell');
  if (!gate || gate.hidden || localStorage.getItem(GATE_KEY) === 'yes') return;
  gate.classList.add('gate-exiting');
  window.setTimeout(() => {
    localStorage.setItem(GATE_KEY, 'yes');
    gate.hidden = true;
    if (shell) shell.hidden = false;
  }, 520);
}

function patchGate() {
  const gate = document.querySelector('.gate');
  if (!gate) return;
  gate.setAttribute('tabindex', '0');
  gate.setAttribute('role', 'button');
  gate.setAttribute('aria-label', 'Enter Hellaverse');
  const overline = gate.querySelector('.overline');
  const copy = gate.querySelector('.gate-card p:not(.overline)');
  if (overline) overline.textContent = 'PRIVATE ROOM';
  if (copy) copy.textContent = 'Click or type to enter';
}

function updateBodyState() {
  const state = readState();
  document.body.classList.add('vn-enhanced');
  document.body.dataset.page = state.page || 'home';
  document.body.classList.toggle('vn-dialogue-active', !!document.querySelector('.modal-backdrop'));
  patchGate();
  patchChoiceNumbers();
  patchSideStatus();
  patchRoomAccent();
  patchCharacterDirectory();
  startIdleTimer();
}

function patchChoiceNumbers() {
  document.querySelectorAll('.choice-option').forEach((choice, index) => {
    if (!choice.querySelector('.choice-num')) {
      choice.insertAdjacentHTML('afterbegin', `<span class="choice-num">${String(index + 1).padStart(2, '0')}</span>`);
    }
    choice.style.animationDelay = `${120 + index * 55}ms`;
  });
  document.querySelectorAll('.dialogue-line').forEach((line) => {
    const strong = line.querySelector('strong');
    const text = strong?.textContent?.trim().toLowerCase() || '';
    if (text.includes('narration') || text.includes('system')) line.classList.add('narration-line');
  });
}

function patchSideStatus() {
  document.querySelectorAll('.side-status').forEach((panel) => {
    if (panel.dataset.vnCleaned === 'yes') return;
    panel.dataset.vnCleaned = 'yes';
    [...panel.children].forEach((child) => {
      const text = child.textContent.trim().toLowerCase();
      if (text === 'thought' || child.classList.contains('quote-line')) child.classList.add('vn-soft-hidden');
    });
  });
}

function patchRoomAccent() {
  const state = readState();
  const character = activeCharacter(state);
  if (!character) return;
  const room = document.querySelector('.room-panel-main');
  if (!room) return;
  if (character.roomBackground) {
    room.classList.add('room-bg');
    room.style.backgroundImage = `linear-gradient(90deg,rgba(11,8,10,.96),rgba(11,8,10,.55),rgba(11,8,10,.96)),url("${String(character.roomBackground).replace(/"/g, '%22')}")`;
  }
  const nextId = character.id;
  if (nextId !== lastRoomId) {
    lastRoomId = nextId;
    room.classList.remove('vn-room-switch');
    void room.offsetWidth;
    room.classList.add('vn-room-switch');
  }
  const nowStage = `${character.id}:${stageName(affinity(state, character.id))}`;
  if (lastStage && nowStage !== lastStage && lastStage.split(':')[0] === character.id) {
    flashRelationship(stageName(affinity(state, character.id)));
  }
  lastStage = nowStage;
}

function patchCharacterDirectory() {
  document.querySelectorAll('.character-chip').forEach((chip) => {
    if (chip.dataset.vnDirectory === 'yes') return;
    chip.dataset.vnDirectory = 'yes';
    const small = chip.querySelector('small, span + span');
    if (small) small.classList.add('directory-meta');
  });
}

function thoughtPool(characterId) {
  const state = readState();
  const value = affinity(state, characterId);
  const mood = String((state.moods || state.mood || {})[characterId] || 'NORMAL').toUpperCase();
  return (state.thoughts || [])
    .filter((item) => item.characterId === characterId)
    .filter((item) => value >= Number(item.requiredAffection ?? item.required ?? 0))
    .filter((item) => !item.requiredMood || item.requiredMood === 'ANY' || String(item.requiredMood).toUpperCase() === mood)
    .flatMap((item) => lines(item.text || item.body));
}

function showFloatingLine(text, anchor) {
  if (!text) return;
  document.querySelectorAll('.vn-floating-line').forEach((node) => node.remove());
  const rect = anchor?.getBoundingClientRect?.() || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0 };
  const bubble = document.createElement('div');
  bubble.className = 'vn-floating-line';
  bubble.textContent = text;
  bubble.style.left = `${Math.min(window.innerWidth - 390, Math.max(18, rect.left + rect.width * .56))}px`;
  bubble.style.top = `${Math.min(window.innerHeight - 110, Math.max(18, rect.top + 42))}px`;
  document.body.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), 3400);
}

function triggerThought(target, force = false) {
  const characterId = target?.dataset?.thought;
  if (!characterId) return;
  if (!force && Math.random() > .35) return;
  showFloatingLine(pick(thoughtPool(characterId)), target);
}

function idlePool() {
  const state = readState();
  const character = activeCharacter(state);
  if (!character) return [];
  const idleScenes = (state.dialogues || state.interactions || [])
    .filter((scene) => scene.characterId === character.id)
    .filter((scene) => String(scene.kind || '').toUpperCase() === 'IDLE')
    .flatMap((scene) => [scene.opening, scene.response, scene.text, ...(scene.nodes || []).map((node) => node.text)].flatMap(lines));
  return idleScenes.length ? idleScenes : [];
}

function startIdleTimer() {
  clearTimeout(idleTimer);
  if ((readState().page || '') !== 'life' || document.querySelector('.modal-backdrop')) return;
  idleTimer = setTimeout(() => {
    const portrait = document.querySelector('.room-panel-main [data-thought], .room-panel-main .portrait-large');
    showFloatingLine(pick(idlePool()), portrait);
    startIdleTimer();
  }, 26000);
}

function flashRelationship(stage) {
  if (!stage) return;
  const flash = document.createElement('div');
  flash.className = 'relationship-flash';
  flash.innerHTML = `<div><strong>RELATIONSHIP UPDATED</strong><span>${esc(stage)}</span></div>`;
  document.body.appendChild(flash);
  window.setTimeout(() => flash.remove(), 1800);
}

function showAffectionFloat(delta, anchor) {
  if (!delta) return;
  const node = document.createElement('div');
  node.className = 'affection-float';
  node.textContent = `♥ ${delta > 0 ? '+' : ''}${delta}`;
  const rect = anchor?.getBoundingClientRect?.() || { left: window.innerWidth / 2, top: window.innerHeight / 2 };
  node.style.left = `${Math.max(20, rect.left + 24)}px`;
  node.style.top = `${Math.max(20, rect.top + 20)}px`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 1050);
}

let beforeAffection = {};
function snapshotAffection() {
  const state = readState();
  beforeAffection = { ...(state.affection || {}) };
}
function compareAffection(anchor) {
  setTimeout(() => {
    const state = readState();
    const character = activeCharacter(state);
    if (!character) return;
    const before = Number(beforeAffection[character.id]?.value || 0);
    const after = affinity(state, character.id);
    const delta = after - before;
    if (delta) showAffectionFloat(delta, anchor || document.querySelector('.room-title'));
  }, 80);
}

const observer = new MutationObserver(() => requestAnimationFrame(updateBodyState));
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('DOMContentLoaded', updateBodyState);
window.addEventListener('load', updateBodyState);
setTimeout(updateBodyState, 200);
setTimeout(updateBodyState, 900);

document.addEventListener('click', (event) => {
  if (event.target.closest('.gate')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    enterSite();
    return;
  }
  if (event.target.closest('[data-room]')) {
    document.body.classList.add('vn-changing-character');
    setTimeout(() => document.body.classList.remove('vn-changing-character'), 520);
  }
  if (event.target.closest('[data-run-interaction], [data-give-gift], .choice-option')) {
    snapshotAffection();
    compareAffection(event.target.closest('.choice-option, .choice-card, button'));
  }
  const thought = event.target.closest('[data-thought]');
  if (thought) triggerThought(thought, true);
}, true);

document.addEventListener('keydown', (event) => {
  if (document.querySelector('.gate:not([hidden])')) {
    event.preventDefault();
    enterSite();
  }
});
document.addEventListener('mouseover', (event) => {
  const thought = event.target.closest('[data-thought]');
  if (thought) triggerThought(thought);
});
document.addEventListener('pointerdown', () => startIdleTimer(), true);
document.addEventListener('input', () => startIdleTimer(), true);
