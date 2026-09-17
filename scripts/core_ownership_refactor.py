from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 exact match, found {count}')
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=0):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 regex match, found {count}')
    return out


# 1) hv-stable.js becomes the source of truth for core character profile/editor behavior.
path = 'js/hv-stable.js'
hv = read(path)

for token, label in [
    (r'\nlilith-morningstar|Lilith Morningstar|ROYALTY|QUEEN OF HELL', 'remove Lilith default seed'),
    (r'\nmichael|Michael|HEAVEN|ARCHANGEL', 'remove Michael default seed'),
    (r'\ngabriel|Gabriel|HEAVEN|ARCHANGEL', 'remove Gabriel default seed'),
    (r'\nsaint-peter|Saint Peter|HEAVEN|', 'remove Saint Peter default seed'),
]:
    if hv.count(token) != 1:
        raise SystemExit(f'{label}: expected 1 seed token, found {hv.count(token)}')
    hv = hv.replace(token, '', 1)

hv = once(
    hv,
    "SECS=['profile','dialogue','relationship','memory','extras']",
    "SECS=['profile','dialogue','relationship','extras']",
    'remove manual memory editor section',
)
hv = once(
    hv,
    "label,status:'',personality:'',speech:'',story:'',features:'',relations:'',sampleLines:[],tags:[],image:'',roomBackground:'',hidden:false",
    "label,description:'',status:'',personality:'',speech:'',story:'',features:'',relations:'',sampleLines:[],tags:[],image:'',roomBackground:'',hidden:false",
    'add description to core character shape',
)

profile = """function profile(cid){let c=C(cid),description=String(c.description||'').trim();return`<article class="character-file"><button class="text-link" data-back>‹ BACK</button><div class="file-layout">${art(c,'profile-art character-art',1)}<section class="file-copy"><p class="file-number">CHARACTER ${String(S.characters.findIndex(x=>x.id===c.id)+1).padStart(3,'0')}</p><h1>${esc(c.name)}</h1><p class="role-line">${esc(c.label||c.group)}</p><div class="chip-row">${ca(c).map(t=>`<span>${esc(t)}</span>`).join('')}</div><p class="relationship-line">♥ ${aff(c.id)} · ${esc(stage(c.id))}</p><div class="file-actions"><button class="action-link primary" data-room="${esc(c.id)}">ENTER ROOM</button><button class="action-link" data-memories="${esc(c.id)}">MEMORIES</button>${S.settings.showEditorShortcuts?`<button class="text-link" data-edit-char="${esc(c.id)}">EDIT</button>`:''}</div><div class="file-sections"><section class="hv-simple-description-section"><h3>ABOUT</h3><p>${description?esc(description):'<span class="empty-state">아직 한 줄 설명이 없습니다.</span>'}</p></section></div></section></div></article>`}
function collection"""
hv = regex_once(hv, r"function profile\(cid\)\{[^\n]*\}\nfunction collection", profile, 'replace public profile renderer')

hv = once(
    hv,
    "s==='relationship'?'RELATIONSHIP':s==='memory'?'MEMORY':'EXTRAS'",
    "s==='relationship'?'RELATIONSHIP':'EXTRAS'",
    'remove memory tab label branch',
)
hv = once(
    hv,
    "map={scene:S.dialogues,gift:S.gifts,item:S.collectionItems,thought:S.thoughts,reward:S.rewards,memory:S.memories}",
    "map={scene:S.dialogues,gift:S.gifts,item:S.collectionItems,thought:S.thoughts,reward:S.rewards}",
    'remove manual memory draft map',
)
hv = once(
    hv,
    "S.section==='relationship'?editRel(c):S.section==='memory'?editMem(c):editExtras(c)",
    "S.section==='relationship'?editRel(c):editExtras(c)",
    'remove manual memory editor routing',
)

edit_profile = """function editProfile(c){return`<article class="editor-card"><p class="label">${esc(c.name)} / PROFILE</p><div class="form-grid"><label>Name<input id="pName" value="${esc(c.name)}"></label><label>Primary Category<select id="pGroup">${GROUPS.map(x=>`<option ${c.group===x?'selected':''}>${x}</option>`).join('')}</select></label>${affiliationPicker(c)}<label>Label<input id="pLabel" value="${esc(c.label)}"></label><label class="full hv-simple-description-input">Character Description<input id="pDescription" maxlength="180" placeholder="캐릭터를 한 줄로 설명하세요" value="${esc(c.description||'')}"><small>프로필에는 이 한 줄 설명만 표시됩니다.</small></label><label class="checkline"><input id="pHidden" type="checkbox" ${c.hidden?'checked':''}> Hide from play screens</label><label class="full">Image URL<input id="pImg" value="${esc(c.image)}"></label><label class="full">Room Background URL<input id="pBg" value="${esc(c.roomBackground)}"></label></div><div class="button-row"><button class="gold-button" data-save-profile>SAVE</button><button class="ghost-button" data-add-char>NEW CHARACTER</button></div><p class="muted">큰 이미지는 assets URL을 쓰는 것이 가장 안정적입니다.</p></article>`}
function choiceInputs"""
hv = regex_once(hv, r"function editProfile\(c\)\{[^\n]*\}\nfunction choiceInputs", edit_profile, 'replace profile editor markup')
hv = regex_once(hv, r"function editMem\(c\)\{[^\n]*\}\nfunction editExtras", 'function editExtras', 'remove manual memory editor markup')

save_profile = """function saveProfile(){let c=C();c.name=id('pName').value.trim()||c.name;c.group=gr(id('pGroup').value);c.affiliations=affs(id('pAff').value||c.group);if(!c.affiliations.includes(c.group))c.affiliations.unshift(c.group);S.affiliationCatalog=[...new Set([...AFFILIATION_DEFAULTS,...(S.affiliationCatalog||[]),...c.affiliations])];c.label=id('pLabel').value;c.description=id('pDescription')?.value.trim()||'';c.hidden=!!id('pHidden')?.checked;c.image=id('pImg').value;c.roomBackground=id('pBg').value;dirty=false;save();render();toast('SAVED')}function allow"""
hv = regex_once(hv, r"function saveProfile\(\)\{.*?\}function allow", save_profile, 'replace profile save handler', flags=re.S)

old_mem_save = "if(t.closest('[data-save-mem]')){let c=C(),old=d('memory',()=>mem({characterId:c.id})),m=mem({...old,id:old.id||uid('memory'),characterId:c.id,title:id('mTitle').value,summary:id('mSum').value,importance:id('mImp').value,tags:split(id('mTags').value)});upsert(S.memories,m);S.draft.memory=m.id;dirty=false;save();render();return}"
hv = once(hv, old_mem_save, '', 'remove manual memory save handler')
hv = once(hv, ",memory:'memories'", '', 'remove manual memory delete map entry')
write(path, hv)

# 2) editor-ux-suite now owns only Gift/Event presentation enhancements.
path = 'js/editor-ux-suite.js'
suite = read(path)
if suite.count('__HELLAVERSE_EDITOR_UX_SUITE_V4__') != 2:
    raise SystemExit(f'editor suite guard: expected 2 matches, found {suite.count("__HELLAVERSE_EDITOR_UX_SUITE_V4__")}')
suite = suite.replace('__HELLAVERSE_EDITOR_UX_SUITE_V4__', '__HELLAVERSE_EDITOR_UX_SUITE_V5__')
suite = once(suite, "const STATE_KEY='hellaverse_dialogue_state_v1';\n", '', 'remove editor compatibility state key')
suite = regex_once(suite, r"function readState\(\).*?\nfunction move", 'function move', 'remove editor compatibility state helpers', flags=re.S)
suite = regex_once(suite, r"function characterFromProfile\(.*?\nfunction enhanceGift", 'function enhanceGift', 'remove profile and memory DOM compatibility patch', flags=re.S)
suite = regex_once(
    suite,
    r"function cleanRemovedValidationUI\(\).*?\nfunction enhance\(\)\{\n  cleanRemovedValidationUI\(\);\n  enhanceLegacyCoreEditor\(\);\n  enhanceGift\(\);\n  enhanceEventModal\(\);\n\}",
    "function enhance(){\n  enhanceGift();\n  enhanceEventModal();\n}",
    'remove stale validation and core editor cleanup',
    flags=re.S,
)
suite = regex_once(suite, r"\ndocument\.addEventListener\('click',event=>\{.*?\},true\);\n\nnew MutationObserver", '\nnew MutationObserver', 'remove legacy editor click bridge', flags=re.S)
write(path, suite)

# 3) move core profile styling out of the Editor UX stylesheet.
path = 'css/editor-ux-suite.css'
suite_css = read(path)
rows = suite_css.splitlines()
if len(rows) < 3 or rows[0] != '.editor-tabs [data-sec="memory"]{display:none!important}' or not rows[1].startswith('.hv-simple-description-section{'):
    raise SystemExit('editor css: expected legacy memory/profile compatibility rules at top')
profile_css = rows[1]
write(path, '\n'.join(rows[2:]) + '\n')

path = 'css/app.css'
app_css = read(path)
if '.hv-simple-description-section{' in app_css:
    raise SystemExit('app css already contains core profile styles unexpectedly')
app_css = app_css.rstrip() + '\n\n/* Core character profile */\n' + profile_css + '\n'
write(path, app_css)

# 4) cast-exclusions is the single owner of removed-cast cleanup.
path = 'js/hellaverse-cast-dialogues.js'
cast = read(path)
cast = once(cast, "const K='hellaverse_dialogue_state_v1',P='hellaverse_conversation_progress_v1',PACK='hellaverse-cast-dialogues-v1';", "const K='hellaverse_dialogue_state_v1',PACK='hellaverse-cast-dialogues-v1';", 'remove cast progress key')
cast = regex_once(cast, r"const REMOVED=new Set\([^\n]*\);\n", '', 'remove duplicate removed-cast set')
cast = regex_once(cast, r"function cleanRemoved\(s\)\{[^\n]*\}\n", '', 'remove duplicate removed-cast cleanup function')
cast = once(cast, 'cleanRemoved(state);', '', 'remove duplicate removed-cast cleanup call')
cast = once(cast, ',removed:[...REMOVED]', '', 'remove duplicate removed-cast migration metadata')
write(path, cast)

# 5) loader cache versions and ownership comments.
path = 'index.html'
index = read(path)
index = once(index, 'css/app.css?v=50', 'css/app.css?v=51', 'bump app css cache')
index = once(index, 'css/editor-ux-suite.css?v=2', 'css/editor-ux-suite.css?v=3', 'bump editor css cache')
index = once(index, 'js/hellaverse-cast-dialogues.js?v=1', 'js/hellaverse-cast-dialogues.js?v=2', 'bump cast pack cache')
index = once(index, 'js/hv-stable.js?v=55', 'js/hv-stable.js?v=56', 'bump core cache')
index = once(index, 'js/editor-ux-suite.js?v=4', 'js/editor-ux-suite.js?v=5', 'bump editor suite cache')
index = once(index, '<!-- DIALOGUE / EDITOR: consolidated editor compatibility + player episode runtime. -->', '<!-- DIALOGUE / EDITOR: core Editor markup lives in hv-stable; suite only enhances Gift/Event presentation. -->', 'update editor ownership comment')
write(path, index)

# 6) documentation follows the new ownership boundaries.
path = 'docs/FILE_MAP.md'
doc = read(path)
old_editor = """## Editor UX

- `js/editor-ux-suite.js` — Gift/Event Editor UX와 legacy core Editor 보정의 단일 후처리 소유자.
  - 단순 캐릭터 프로필 ABOUT 표시와 `description` 저장
  - 사용하지 않는 옛 Profile 필드 숨김
  - 사용하지 않는 수동 Memory Editor 진입 차단/정리
  - 옛 health-check DOM 잔여 정리
- `css/editor-ux-suite.css` — 위 Editor 보정과 UX 스타일.

과거 `js/simple-character-profile.js`와 `js/memory-editor-removal.js`는 각각 별도 MutationObserver로 같은 Editor DOM을 후처리해 중복 렌더와 state overwrite 위험이 있어 `editor-ux-suite.js`로 통합 후 삭제했습니다.
"""
new_editor = """## Editor UX

- `js/hv-stable.js` — 캐릭터 Profile/Editor 원본 소유자. Profile은 `description` 기반 ABOUT 한 섹션만 렌더하고, 수동 Memory Editor 탭/markup/handler는 원본에서 제거했습니다.
- `js/editor-ux-suite.js` — Gift/Event Editor의 표시 구조만 보조합니다. 캐릭터 Profile이나 Memory Editor를 뒤에서 다시 고치지 않습니다.
- `css/app.css` — 단순 Profile ABOUT 표시 스타일을 포함합니다.
- `css/editor-ux-suite.css` — Gift/Event Editor UX 스타일만 담당합니다.

과거 `js/simple-character-profile.js`, `js/memory-editor-removal.js`, 그리고 이후 `editor-ux-suite.js`에 임시 통합했던 Profile/Memory 보정 로직은 모두 원본 `hv-stable.js`로 흡수했습니다.
"""
doc = once(doc, old_editor, new_editor, 'rewrite editor ownership docs')
doc = once(doc, '- `js/hellaverse-cast-dialogues.js`\n', '- `js/hellaverse-cast-dialogues.js` — 캐릭터/대화 seed만 담당하며 삭제 정책은 소유하지 않음.\n', 'document cast content ownership')
old_extra = """추가 통합/정리 완료:

- Gacha Settings 전체 override 제거
- Thought nav 전체 교체 제거
- 대화 utility/submenu 중복 소유 축소
- Collection Item legacy gift launcher 제거
- Dialogue safety와 Editor suite가 중복으로 health-check DOM을 지우던 코드 제거
- Character description 저장을 Editor suite에 통합하고 저장 후 core state가 오래된 값으로 되덮는 경로를 차단
"""
new_extra = """추가 통합/정리 완료:

- Gacha Settings 전체 override 제거
- Thought nav 전체 교체 제거
- 대화 utility/submenu 중복 소유 축소
- Collection Item legacy gift launcher 제거
- Character Profile ABOUT/description 렌더·저장을 `hv-stable.js` 원본으로 흡수
- 수동 Memory Editor tab/markup/save handler를 `hv-stable.js` 원본에서 제거
- 삭제 대상 캐릭터를 `hv-stable.js` 기본 seed에서 제거하고 기존 저장 데이터 정리는 `cast-exclusions.js`만 담당
- `hellaverse-cast-dialogues.js`의 중복 `cleanRemoved()` 삭제
- Editor suite의 옛 health-check/Profile/Memory DOM cleanup 삭제
"""
doc = once(doc, old_extra, new_extra, 'update cleanup completion list')
doc = regex_once(doc, r"## 현재 남은 구조 정리 우선순위\n\n[\s\S]*$", """## 현재 남은 구조 정리 우선순위

1. **Dialogue compatibility reduction** — `dialogue-runtime-cleanup.js`, `dialogue-single-beat-runtime.js`의 남은 역할 중 실제 코어 상태 머신으로 옮길 수 있는 부분을 기능별로 검증합니다.
2. **Collection repair retirement** — `collection-runtime-repair.js`가 복구하는 누락 원인을 원본 seed/load 순서에서 완전히 없앤 뒤 repair 파일 제거 가능 여부를 검증합니다.
""", 'rewrite remaining priorities')
write(path, doc)

print('Core ownership refactor patches applied')
