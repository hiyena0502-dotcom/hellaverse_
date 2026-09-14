const STATE_KEY = 'hellaverse_dialogue_state_v1';
const GATE_KEY = 'hellaverse_gate_open';
const PATCH_KEY = 'hellaverse_affiliation_music_patch_v1';
const DB_NAME = 'hellaverse_local_mp3_v1';
const STORE = 'tracks';
const EXTRA_AFFILIATIONS = [
  'HELL','HEAVEN','HOTEL','OVERLORD','SIN','ROYALTY','SEVEN DEADLY SINS','MORNINGSTAR FAMILY','SERAPHIM','EXORCISTS','ARCHANGELS','GOETIA','VEE','CANNIBAL TOWN','HOTEL STAFF','FALLEN ANGEL','ANGEL','DEMON','SINNER','WINNER','FAMILY','OC'
];
const QUICK_TAGS = ['main','side','secret','past','family','romance','friendship','rival','comfort','conflict','memory','gift','heaven','hell','hotel','royalty','angel','demon','overlord','sin','mood','event','one-time','repeatable','important','favorite'];
let audio = new Audio();
let url = '';
let nowId = '';

function parse(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function readState() { return parse(localStorage.getItem(STATE_KEY), {}); }
function writeState(state) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function readPatch() { return parse(localStorage.getItem(PATCH_KEY), { affiliations: {}, customAffiliations: [], music: { tracks: [], volume: 70 } }); }
function writePatch(patch) { localStorage.setItem(PATCH_KEY, JSON.stringify(patch)); }
function esc(value = '') { return String(value ?? '').replace(/[&<>"']/g, (mark) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[mark])); }
function clean(value = '') { return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase(); }
function uniq(list) { return [...new Set((list || []).map(clean).filter(Boolean))]; }

function openGate() {
  localStorage.setItem(GATE_KEY, 'yes');
  const gate = document.getElementById('gate') || document.querySelector('.gate');
  const shell = document.getElementById('shell') || document.querySelector('.site-shell');
  if (gate) gate.hidden = true;
  if (shell) shell.hidden = false;
}
function bindIntro() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('.gate')) {
      event.preventDefault();
      openGate();
    }
  }, true);
  document.addEventListener('keydown', () => {
    const gate = document.querySelector('.gate:not([hidden])');
    if (gate) openGate();
  }, true);
}

function upgradeData() {
  const state = readState();
  const patch = readPatch();
  patch.customAffiliations = uniq([...(patch.customAffiliations || []), ...(state.customAffiliations || []), ...EXTRA_AFFILIATIONS]);
  state.customAffiliations = patch.customAffiliations;
  if (Array.isArray(state.characters)) {
    for (const character of state.characters) {
      const fromPatch = patch.affiliations?.[character.id];
      const base = Array.isArray(character.affiliations) ? character.affiliations : [character.group];
      const merged = uniq([...(fromPatch || []), ...base]);
      if (merged.length) character.affiliations = merged;
    }
  }
  patch.music = patch.music || state.music || { tracks: [], volume: 70 };
  patch.music.tracks = Array.isArray(patch.music.tracks) ? patch.music.tracks : [];
  patch.music.volume = Number(patch.music.volume ?? 70);
  state.music = patch.music;
  writePatch(patch);
  writeState(state);
}

function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveTrack(track) {
  const database = await db();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(track);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  database.close();
}
async function readTrack(trackId) {
  const database = await db();
  const track = await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(trackId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  database.close();
  return track;
}
async function removeTrack(trackId) {
  const database = await db();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(trackId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  database.close();
}
function music() {
  const patch = readPatch();
  patch.music = patch.music || { tracks: [], volume: 70 };
  patch.music.tracks = Array.isArray(patch.music.tracks) ? patch.music.tracks : [];
  patch.music.volume = Number(patch.music.volume ?? 70);
  return patch.music;
}
function saveMusic(next) {
  const patch = readPatch();
  patch.music = next;
  writePatch(patch);
  const state = readState();
  state.music = next;
  writeState(state);
}
async function addMp3(files) {
  const selected = Array.from(files || []).filter((file) => file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3'));
  if (!selected.length) return;
  const data = music();
  for (const file of selected) {
    const id = `track-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await saveTrack({ id, name: file.name.replace(/\.mp3$/i, ''), type: file.type || 'audio/mpeg', file });
    data.tracks.push({ id, name: file.name.replace(/\.mp3$/i, ''), addedAt: new Date().toISOString() });
  }
  saveMusic(data);
  renderPlaylist();
}
async function play(trackId) {
  const track = await readTrack(trackId);
  if (!track?.file) return;
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(track.file);
  nowId = trackId;
  audio.src = url;
  audio.volume = music().volume / 100;
  await audio.play().catch(() => {});
  renderPlaylist();
}
async function deleteTrack(trackId) {
  if (!confirm('이 음악을 목록에서 삭제할까요?')) return;
  if (trackId === nowId) { audio.pause(); audio.currentTime = 0; nowId = ''; }
  await removeTrack(trackId);
  const data = music();
  data.tracks = data.tracks.filter((track) => track.id !== trackId);
  saveMusic(data);
  renderPlaylist();
}
function renderPlaylist() {
  const settings = document.querySelector('.settings-grid');
  if (!settings) return;
  removeOldAudioPanels(settings);
  let panel = document.querySelector('[data-hv-playlist]');
  const data = music();
  if (!panel) {
    panel = document.createElement('article');
    panel.className = 'panel hv-playlist-panel';
    panel.dataset.hvPlaylist = 'yes';
    const dataPanel = Array.from(settings.children).find((child) => /DATA|백업/.test(child.textContent));
    settings.insertBefore(panel, dataPanel || settings.lastElementChild);
  }
  panel.innerHTML = `
    <p class="label">MUSIC PLAYLIST</p>
    <label class="import-label hv-add-mp3">ADD MP3<input id="hvMp3Input" type="file" accept="audio/mpeg,audio/mp3,audio/*" multiple></label>
    <div class="hv-playlist-list">
      ${data.tracks.length ? data.tracks.map((track, index) => `
        <div class="hv-playlist-card ${track.id === nowId ? 'active' : ''}">
          <div class="hv-track-line"><span class="hv-track-title">${String(index + 1).padStart(2, '0')} · ${esc(track.name)}</span><button class="gold-button" type="button" data-hv-play="${esc(track.id)}">PLAY</button></div>
          <div class="hv-mini-controls"><button class="ghost-button" type="button" data-hv-pause>PAUSE</button><button class="ghost-button" type="button" data-hv-stop>STOP</button><button class="ghost-button danger" type="button" data-hv-delete-track="${esc(track.id)}">DELETE</button></div>
        </div>
      `).join('') : '<p class="empty-state">아직 추가된 MP3가 없습니다.</p>'}
    </div>
    <div class="hv-mini-controls"><span class="hv-now-playing">${nowId ? 'Now playing' : 'Ready'}</span><label>Volume<input id="hvVolume" type="range" min="0" max="100" value="${esc(data.volume)}"></label></div>
  `;
}
function removeOldAudioPanels(settings = document.querySelector('.settings-grid')) {
  if (!settings) return;
  Array.from(settings.children).forEach((panel) => {
    if (panel.matches('[data-hv-playlist]')) return;
    const text = panel.textContent || '';
    if (/^\s*AUDIO\s*/i.test(text) || text.includes('음악 파일 자체는 백업에 포함되지 않습니다') || text.includes('MP3 파일 자체는 브라우저 저장소')) {
      panel.remove();
    }
  });
  document.querySelectorAll('[data-mp3-backup-note], .patch-mp3-backup-note').forEach((node) => node.remove());
  Array.from(document.querySelectorAll('p,.muted,small')).forEach((node) => {
    const text = node.textContent || '';
    if (text.includes('음악 파일 자체는 백업에 포함되지 않습니다') || text.includes('MP3 파일 자체는 브라우저 저장소') || text.includes('백업에는 글과 설정 데이터가 포함됩니다')) node.remove();
  });
}

function enhanceTags() {
  const tagInput = document.getElementById('editTags');
  if (!tagInput || document.querySelector('[data-file-tag-helper]')) return;
  const helper = document.createElement('section');
  helper.className = 'file-tag-helper';
  helper.dataset.fileTagHelper = 'yes';
  helper.innerHTML = `
    <p class="label">FILE TAGS</p>
    <p class="muted">필요한 태그를 여러 개 눌러 붙이거나 직접 입력할 수 있습니다.</p>
    <div class="file-tag-row">${QUICK_TAGS.map((tag) => `<button class="file-tag-chip" type="button" data-add-tag="${esc(tag)}">${esc(tag)}</button>`).join('')}</div>
    <div class="patch-add-row"><input id="customFileTag" placeholder="직접 태그 입력"><button class="ghost-button" type="button" data-add-custom-tag>ADD TAG</button></div>
  `;
  tagInput.closest('label')?.insertAdjacentElement('afterend', helper);
}
function addTag(value) {
  const input = document.getElementById('editTags');
  if (!input) return;
  const current = String(input.value || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  const next = String(value || '').trim();
  if (next && !current.includes(next)) current.push(next);
  input.value = current.join(', ');
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
function enhanceAffiliationInput() {
  const input = document.getElementById('patchNewAffiliation');
  const wrapper = document.querySelector('[data-affiliation-editor]');
  if (!input || !wrapper || wrapper.querySelector('[data-aff-preset-row]')) return;
  const row = document.createElement('div');
  row.className = 'file-tag-row';
  row.dataset.affPresetRow = 'yes';
  row.innerHTML = EXTRA_AFFILIATIONS.map((tag) => `<button class="file-tag-chip" type="button" data-add-aff-preset="${esc(tag)}">${esc(tag)}</button>`).join('');
  input.closest('.patch-add-row')?.insertAdjacentElement('beforebegin', row);
}
function polishIntroText() {
  const gate = document.querySelector('.gate:not([hidden]) .gate-card');
  if (!gate) return;
  const small = gate.querySelector('.overline');
  const p = Array.from(gate.querySelectorAll('p')).at(-1);
  if (small) small.textContent = 'PRIVATE ENTRANCE';
  if (p) p.textContent = 'Click or type to enter';
}
function repaint() {
  polishIntroText();
  enhanceTags();
  enhanceAffiliationInput();
  renderPlaylist();
  removeOldAudioPanels();
}

upgradeData();
bindIntro();
new MutationObserver(() => requestAnimationFrame(repaint)).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('DOMContentLoaded', repaint);
setTimeout(repaint, 300);
setTimeout(repaint, 1000);

document.addEventListener('click', (event) => {
  const tag = event.target.closest('[data-add-tag]');
  if (tag) { event.preventDefault(); addTag(tag.dataset.addTag); return; }
  if (event.target.closest('[data-add-custom-tag]')) { event.preventDefault(); addTag(document.getElementById('customFileTag')?.value || ''); return; }
  const aff = event.target.closest('[data-add-aff-preset]');
  if (aff) { event.preventDefault(); const input = document.getElementById('patchNewAffiliation'); if (input) input.value = aff.dataset.addAffPreset || ''; return; }
  const playBtn = event.target.closest('[data-hv-play]');
  if (playBtn) { event.preventDefault(); play(playBtn.dataset.hvPlay); return; }
  if (event.target.closest('[data-hv-pause]')) { event.preventDefault(); audio.pause(); return; }
  if (event.target.closest('[data-hv-stop]')) { event.preventDefault(); audio.pause(); audio.currentTime = 0; return; }
  const del = event.target.closest('[data-hv-delete-track]');
  if (del) { event.preventDefault(); deleteTrack(del.dataset.hvDeleteTrack); }
}, true);

document.addEventListener('change', (event) => {
  if (event.target.id === 'hvMp3Input') addMp3(event.target.files);
}, true);
document.addEventListener('input', (event) => {
  if (event.target.id === 'hvVolume') {
    const data = music();
    data.volume = Number(event.target.value || 70);
    audio.volume = data.volume / 100;
    saveMusic(data);
  }
}, true);
