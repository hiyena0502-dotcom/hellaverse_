const KEY = 'hellaverse_dialogue_state_v1';
const PATCH_KEY = 'hellaverse_affiliation_music_patch_v1';
const DB_NAME = 'hellaverse_local_mp3_v1';
const STORE = 'tracks';
const NEW_CHARACTERS = [
  { id: 'emily', name: 'Emily', group: 'HEAVEN', affiliations: ['HEAVEN'], label: '' },
  { id: 'baxter', name: 'Baxter', group: 'HELL', affiliations: ['HELL'], label: '' },
  { id: 'zestial', name: 'Zestial', group: 'OVERLORD', affiliations: ['OVERLORD'], label: '' }
];
const BASE_AFFILIATIONS = ['HELL', 'HEAVEN', 'HOTEL', 'OVERLORD', 'SIN', 'ROYALTY'];
const FILTER_KEY = 'hellaverse_current_affiliation_filter';
let audio = new Audio();
let activeUrl = '';

const nativeSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = (key, value) => {
  if (key === KEY) value = mergeProtectedData(value);
  nativeSetItem(key, value);
};

function parse(value, fallback = {}) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}
function readState() { return parse(localStorage.getItem(KEY), {}); }
function writeState(state) { nativeSetItem(KEY, JSON.stringify(state)); }
function readPatch() { return parse(localStorage.getItem(PATCH_KEY), { affiliations: {}, customAffiliations: [], music: { tracks: [], volume: 70 } }); }
function writePatch(patch) { nativeSetItem(PATCH_KEY, JSON.stringify(patch)); }
function clean(value = '') {
  const text = String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
  if (!text) return '';
  if (text === 'OVERLORDS') return 'OVERLORD';
  if (text === 'SINS' || text === 'SEVEN DEADLY SINS') return 'SIN';
  if (text === 'CORE' || text === 'AU') return 'HELL';
  return text;
}
function split(value = '') {
  if (Array.isArray(value)) return [...new Set(value.map(clean).filter(Boolean))];
  return [...new Set(String(value || '').split(/[\n,;/|]+/).map(clean).filter(Boolean))];
}
function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (mark) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[mark]));
}
function blankCharacter(item) {
  return {
    id: item.id,
    name: item.name,
    label: item.label || '',
    group: item.group || item.affiliations?.[0] || 'HELL',
    affiliations: item.affiliations || [item.group || 'HELL'],
    status: '',
    personality: '',
    speech: '',
    story: '',
    features: '',
    relations: '',
    sampleLines: [],
    tags: [],
    image: '',
    roomBackground: ''
  };
}
function ensureCharacterShape(character) {
  const group = clean(character.group || character.category || 'HELL');
  let affiliations = split(character.affiliations);
  if (!affiliations.length && group) affiliations = [group];
  if (!affiliations.length) affiliations = ['HELL'];
  character.group = group || affiliations[0] || 'HELL';
  character.affiliations = affiliations;
  return character;
}
function ensureCharacters(state) {
  state.characters = Array.isArray(state.characters) ? state.characters : [];
  for (const character of state.characters) ensureCharacterShape(character);
  for (const item of NEW_CHARACTERS) {
    if (!state.characters.some((character) => character.id === item.id || character.name === item.name)) {
      state.characters.push(blankCharacter(item));
    }
  }
  return state;
}
function allAffiliations(state = readState()) {
  const set = new Set(BASE_AFFILIATIONS);
  const patch = readPatch();
  split(state.customAffiliations || state.affiliationsList || []).forEach((item) => set.add(item));
  split(patch.customAffiliations || []).forEach((item) => set.add(item));
  (state.characters || []).forEach((character) => split(character.affiliations?.length ? character.affiliations : character.group).forEach((item) => set.add(item)));
  return [...set].filter(Boolean);
}
function mergeProtectedData(value) {
  const next = parse(value, null);
  if (!next || typeof next !== 'object') return value;
  const before = readState();
  const patch = readPatch();
  next.characters = Array.isArray(next.characters) ? next.characters : [];
  ensureCharacters(next);
  for (const character of next.characters) {
    const old = (before.characters || []).find((item) => item.id === character.id || item.name === character.name);
    const saved = patch.affiliations?.[character.id];
    const affiliations = split(saved || old?.affiliations || character.affiliations || character.group);
    if (affiliations.length) {
      character.affiliations = affiliations;
      character.group = character.group || affiliations[0];
    }
  }
  next.customAffiliations = allAffiliations(next);
  next.music = patch.music || before.music || next.music || { tracks: [], volume: 70 };
  return JSON.stringify(next);
}
function migrate() {
  const state = ensureCharacters(readState());
  const patch = readPatch();
  patch.affiliations = patch.affiliations || {};
  for (const character of state.characters) {
    ensureCharacterShape(character);
    patch.affiliations[character.id] = character.affiliations;
  }
  patch.customAffiliations = allAffiliations(state);
  patch.music = patch.music || state.music || { tracks: [], volume: 70 };
  state.customAffiliations = patch.customAffiliations;
  state.music = patch.music;
  writePatch(patch);
  writeState(state);
}

function currentCharacterId() {
  const select = document.getElementById('editorCharacterSelect');
  if (select?.value) return select.value;
  const state = readState();
  return state.active || state.activeCharacterId || state.characters?.[0]?.id || '';
}
function characterMap() {
  const state = readState();
  const map = new Map();
  (state.characters || []).forEach((character) => map.set(character.id, ensureCharacterShape(character)));
  return map;
}
function getCharacter(characterId) {
  return characterMap().get(characterId);
}
function chipHtml(affiliations) {
  return `<div class="patch-chip-row">${split(affiliations).map((item) => `<span class="patch-chip">${escapeHtml(item)}</span>`).join('')}</div>`;
}

function patchFilterRows() {
  const filter = localStorage.getItem(FILTER_KEY) || 'ALL';
  const affiliations = ['ALL', ...allAffiliations()];
  document.querySelectorAll('.filter-row').forEach((row) => {
    if (row.dataset.patchAffiliationRow === 'yes') return;
    row.dataset.patchAffiliationRow = 'yes';
    row.innerHTML = affiliations.map((item) => `<button class="filter-pill ${filter === item ? 'active' : ''}" type="button" data-patch-aff-filter="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('');
  });
}
function patchProfileChips() {
  const map = characterMap();
  document.querySelectorAll('[data-profile], [data-room]').forEach((node) => {
    const characterId = node.dataset.profile || node.dataset.room;
    const character = map.get(characterId);
    if (!character || node.querySelector(':scope > .patch-chip-row')) return;
    if (node.classList.contains('character-chip')) return;
    const target = node.querySelector('small') || node.querySelector('strong') || node.lastElementChild;
    const holder = document.createElement('div');
    holder.innerHTML = chipHtml(character.affiliations);
    if (target?.parentNode) target.parentNode.insertBefore(holder.firstElementChild, target);
    else node.appendChild(holder.firstElementChild);
  });
  const title = document.querySelector('.profile-head h2, .room-title h2');
  if (title && !title.parentElement.querySelector('.patch-chip-row')) {
    const state = readState();
    const profileId = state.profile || state.profileCharacterId || state.active || state.activeCharacterId;
    const character = map.get(profileId);
    if (character) title.insertAdjacentHTML('afterend', chipHtml(character.affiliations));
  }
}
function applyAffiliationFilter() {
  const filter = localStorage.getItem(FILTER_KEY) || 'ALL';
  const query = String(document.getElementById('characterSearch')?.value || '').toLowerCase().trim();
  const map = characterMap();
  document.querySelectorAll('[data-profile], .character-chip[data-room]').forEach((node) => {
    const characterId = node.dataset.profile || node.dataset.room;
    const character = map.get(characterId);
    if (!character) return;
    const affiliations = split(character.affiliations?.length ? character.affiliations : character.group);
    const text = [character.name, character.label, character.status, ...(character.tags || []), ...affiliations].join(' ').toLowerCase();
    const show = (filter === 'ALL' || affiliations.includes(filter)) && (!query || text.includes(query));
    node.classList.toggle('patch-hidden', !show);
  });
  document.querySelectorAll('[data-patch-aff-filter]').forEach((button) => button.classList.toggle('active', button.dataset.patchAffFilter === filter));
}
function patchEditorAffiliations() {
  const editName = document.getElementById('editName');
  if (!editName || document.querySelector('[data-affiliation-editor]')) return;
  const character = getCharacter(currentCharacterId());
  if (!character) return;
  const wrapper = document.createElement('section');
  wrapper.className = 'patch-affiliation-editor';
  wrapper.dataset.affiliationEditor = 'yes';
  wrapper.innerHTML = `
    <p class="label">AFFILIATIONS</p>
    <p class="muted">소속은 여러 개 선택할 수 있습니다. LABEL, TAG, STATUS와 별도로 저장됩니다.</p>
    <div class="patch-affiliation-grid">
      ${allAffiliations().map((item) => `<label class="patch-check-chip"><input type="checkbox" name="patchAffiliation" value="${escapeHtml(item)}" ${split(character.affiliations).includes(item) ? 'checked' : ''}>${escapeHtml(item)}</label>`).join('')}
    </div>
    <div class="patch-add-row"><input id="patchNewAffiliation" placeholder="새 소속 입력"><button class="ghost-button" type="button" data-patch-add-affiliation>ADD AFFILIATION</button></div>
  `;
  const form = editName.closest('.form-grid') || editName.closest('article') || editName.parentElement;
  form?.appendChild(wrapper);
}
function saveEditorAffiliations() {
  const characterId = currentCharacterId();
  const chosen = Array.from(document.querySelectorAll('input[name="patchAffiliation"]:checked')).map((box) => clean(box.value)).filter(Boolean);
  const typed = clean(document.getElementById('patchNewAffiliation')?.value || '');
  if (typed) chosen.push(typed);
  const affiliations = [...new Set(chosen.length ? chosen : ['HELL'])];
  const patch = readPatch();
  patch.affiliations = patch.affiliations || {};
  patch.affiliations[characterId] = affiliations;
  patch.customAffiliations = [...new Set([...allAffiliations(), ...affiliations])];
  writePatch(patch);
}
function addAffiliationFromEditor() {
  const value = clean(document.getElementById('patchNewAffiliation')?.value || '');
  if (!value) return;
  const patch = readPatch();
  patch.customAffiliations = [...new Set([...allAffiliations(), value])];
  writePatch(patch);
  const state = readState();
  state.customAffiliations = patch.customAffiliations;
  writeState(state);
  repaintPatch();
}

function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function putTrack(track) {
  const database = await db();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(track);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  database.close();
}
async function getTrack(id) {
  const database = await db();
  const result = await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  database.close();
  return result;
}
function musicMeta() {
  const state = readState();
  const patch = readPatch();
  const music = patch.music || state.music || { tracks: [], volume: 70 };
  music.tracks = Array.isArray(music.tracks) ? music.tracks : [];
  music.volume = Number(music.volume ?? 70);
  return music;
}
function saveMusic(music) {
  const patch = readPatch();
  patch.music = music;
  writePatch(patch);
  const state = readState();
  state.music = music;
  writeState(state);
}
function patchMusicPanel() {
  const settings = document.querySelector('.settings-grid');
  if (!settings || document.querySelector('[data-simple-music]')) return;
  const music = musicMeta();
  const panel = document.createElement('article');
  panel.className = 'panel patch-music-panel';
  panel.dataset.simpleMusic = 'yes';
  panel.innerHTML = `
    <p class="label">MUSIC</p>
    <label class="import-label">ADD MP3<input id="patchMp3Input" type="file" accept="audio/mpeg,audio/mp3,audio/*" multiple></label>
    <div class="patch-music-list">
      ${music.tracks.length ? music.tracks.map((track) => `<div class="patch-track"><span>♪ ${escapeHtml(track.name)}</span><button class="ghost-button" type="button" data-patch-play-track="${escapeHtml(track.id)}">PLAY</button></div>`).join('') : '<p class="empty-state">추가된 MP3가 없습니다.</p>'}
    </div>
    <div class="patch-mini-player">
      <button class="ghost-button" type="button" data-patch-pause>PAUSE</button>
      <button class="ghost-button" type="button" data-patch-stop>STOP</button>
      <label>Volume<input id="patchVolume" type="range" min="0" max="100" value="${escapeHtml(music.volume)}"></label>
    </div>
    <p class="muted">MP3 파일 자체는 이 브라우저에만 저장됩니다.</p>
  `;
  const dataPanel = Array.from(settings.children).find((child) => child.textContent.includes('DATA'));
  settings.insertBefore(panel, dataPanel || settings.lastElementChild);
}
async function addMp3(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return;
  const music = musicMeta();
  for (const file of fileList) {
    const id = `track-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await putTrack({ id, name: file.name, type: file.type || 'audio/mpeg', file });
    music.tracks.push({ id, name: file.name, type: file.type || 'audio/mpeg', size: file.size, addedAt: new Date().toISOString() });
  }
  saveMusic(music);
  repaintPatch();
}
async function playTrack(id) {
  const track = await getTrack(id);
  if (!track?.file) return;
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = URL.createObjectURL(track.file);
  audio.src = activeUrl;
  audio.volume = musicMeta().volume / 100;
  audio.play().catch(() => {});
}
function setVolume(value) {
  const music = musicMeta();
  music.volume = Number(value || 70);
  audio.volume = music.volume / 100;
  saveMusic(music);
}
function patchBackupNote() {
  const dataPanel = Array.from(document.querySelectorAll('.panel')).find((panel) => panel.textContent.includes('백업') || panel.textContent.includes('DATA'));
  if (dataPanel && !dataPanel.querySelector('[data-mp3-backup-note]')) {
    dataPanel.insertAdjacentHTML('beforeend', '<p class="muted" data-mp3-backup-note>백업에는 글과 설정 데이터가 포함됩니다. MP3 파일 자체는 브라우저 저장소에 따로 저장됩니다.</p>');
  }
}
function repaintPatch() {
  patchFilterRows();
  patchProfileChips();
  patchEditorAffiliations();
  patchMusicPanel();
  patchBackupNote();
  applyAffiliationFilter();
}

migrate();
new MutationObserver(() => requestAnimationFrame(repaintPatch)).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('DOMContentLoaded', repaintPatch);
setTimeout(repaintPatch, 250);
setTimeout(repaintPatch, 900);

document.addEventListener('click', (event) => {
  const filter = event.target.closest('[data-patch-aff-filter]');
  if (filter) {
    event.preventDefault();
    event.stopPropagation();
    localStorage.setItem(FILTER_KEY, filter.dataset.patchAffFilter || 'ALL');
    applyAffiliationFilter();
    return;
  }
  if (event.target.closest('[data-patch-add-affiliation]')) {
    event.preventDefault();
    event.stopPropagation();
    addAffiliationFromEditor();
    return;
  }
  if (event.target.closest('[data-save-profile]')) saveEditorAffiliations();
  const play = event.target.closest('[data-patch-play-track]');
  if (play) playTrack(play.dataset.patchPlayTrack);
  if (event.target.closest('[data-patch-pause]')) audio.pause();
  if (event.target.closest('[data-patch-stop]')) { audio.pause(); audio.currentTime = 0; }
}, true);

document.addEventListener('input', (event) => {
  if (event.target.id === 'characterSearch') requestAnimationFrame(applyAffiliationFilter);
  if (event.target.id === 'patchVolume') setVolume(event.target.value);
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'patchMp3Input') addMp3(event.target.files);
});
