# File Map

이 문서는 **현재 `index.html`에서 실제로 로드되는 파일만 기준**으로 정리합니다. 삭제된 legacy 파일은 목록에 남기지 않습니다.

## Core / Main UI

- `js/core/state-store.js` — 공용 state helper.
- `js/hv-stable.js` — 메인 앱 렌더러. 페이지, 캐릭터 방 기본 DOM, Editor/Settings/Collection 원본 UI.
- `js/dialogue-ui.js` — 방문 세션, Scene/Choice/LOG/ENTRY/EXIT의 대화 코어.
- `js/site-runtime.js` — 사이트 공통 런타임 보정.

## Dialogue content

- `js/base-dialogues.js`
- `js/character-dialogues.js`
- `js/hellaverse-cast-dialogues.js`
- `js/lucifer-content.js`
- `js/lucifer-s12-addon.js`
- `js/lucifer-room-entry-exit.js`
- `js/lucifer-room-talks.js`
- `js/lucifer-room-monologues.js`
- `js/dialogue-files/lucifer-conversation.js`
- `js/dialogue-files/lucifer-question.js`
- `js/dialogue-files/lucifer-action.js`
- `js/lucifer-conversation-chains.js`
- `js/character-dialogue-rules.js`
- `js/hazbin-canon-dialogues.js` — Lilith / Speaker of God / Saint Peter를 팩 자체에서 만들지 않음.
- `js/hazbin-room-exits.js` — Hazbin 캐릭터별 EXIT/헤어짐 장면.
- `js/cast-exclusions.js` — V3. Lilith / Speaker of God / Michael / Gabriel / Azrael / Saint Peter 계열 삭제와 기존 localStorage 잔여 데이터를 중앙 정리.
- `js/dialogue-episode-upgrade-all.js` — V3. 모든 content pack 이후 `dialogueFileMap`, `sceneRole`, `kind`를 canonical 형태로 정규화.

과거 `js/dialogue-files/dialogue-file-migration.js`는 `dialogue-episode-upgrade-all V3`와 역할이 겹쳐 삭제했습니다.

## Dialogue runtime / editor

- `js/dialogue-ui.js` — **방문/Scene/Choice/LOG/ENTRY/EXIT 상태의 코어 소유자**.
- `js/dialogue-file-editor.js` — Dialogue File Editor.
- `js/dialogue-runtime-cleanup.js` — V12. QUESTION picker, ACTION 자동 시작, ASK/ACTION/RETURN/INVENTORY 전환과 CHARACTERS/LEAVE ROOM 퇴실 연결 담당. 더 이상 render meta에 scene role을 복사하지 않으며 기존 utility DOM을 통째로 교체하지 않습니다.
- `js/dialogue-episode-flow.js` — beat/common continuation 데이터 + 표시 호환.
- `js/dialogue-episode-editor-v2.js` — branch/continuation beat editor 보조.
- `js/dialogue-single-beat-runtime.js` — V12. one-beat/NEXT 표시, LOG 외부 레이어, 플레이어 선택문 echo 제거만 담당. 과거 quiet synthetic dialogue 자동 재시작 코드는 삭제했습니다.
- `js/dialogue-mood-indicator.js` — Mood 표시.
- `js/dialogue-foundation-safety.js` — 중복 클릭 방지와 접근성/기본 안전 보정.
- `css/dialogue-stability.css` — 대화 전환 깜빡임/애니메이션 안정화의 단일 CSS 소유자.

`final-ux-cleanup.js`는 이전 방 DOM 복제, 강제 `state.page='life'` 복귀, dialogue stability CSS 동적 삽입, Thought nav HTML snapshot 저장/복구를 하지 않습니다.

## Item / Gift / Inventory

현재 플레이 UX는 **Item V2**만 사용합니다.

- `js/item-inventory-migration.js`
- `js/item-catalog-rebalance.js`
- `js/satan-paperweight-delivery.js`
- `js/item-system-v2.js`
- `js/item-manager-v2.js`
- `js/item-event-bridge-v2.js`
- `css/item-system-v2.css`
- `css/item-manager-v2.css`

옛 `item-inventory`, `item-manager`, `gift-context`, `collection-exchange`, 별도 Lucifer gift expansion 파일은 저장소에서 제거했습니다.

## Collection / Gacha

- `js/hotel-collection-pack.js`
- `js/gacha-copy-lucifer-1.js` ~ `4.js`
- `js/gacha-copy-hotel-1.js`, `2.js`
- `js/gacha-item-copy-pack.js`
- `js/gacha-collection-addon.js`
- `js/character-gacha-profiles.js`
- `js/collection-runtime-repair.js` — V4. 호텔 Collection pack 누락 복구/초기 그룹 공개만 담당. 예전 Collection Item 선물 버튼 주입 코드는 삭제했습니다.
- `js/collection-emoji-corrections.js`

`gacha-collection-addon.js`는 Gacha overlay / draw / history / Collection만 담당합니다. legacy `settingsMarkup()` / `renderSettings()`와 Gacha Settings 전체 override는 제거되어 Settings DOM을 교체하지 않습니다.

## Thoughts

- `js/thought-archive.js`
- `css/thought-archive.css`

`thought-archive.js`의 `patchNav()`는 `.main-nav.innerHTML`을 교체하지 않습니다. 기존 nav를 보존하고 THOUGHTS 버튼만 증분 추가·활성화합니다.

Thought Settings는 Settings DOM 삽입 순서에 의존하지 않습니다. Settings Management V3에서 **MANAGEMENT → PLAYER(전체 폭)** 아래를 두 개의 독립 stack으로 만들고, 왼쪽은 **APPEARANCE → DANGER ZONE → RUNTIME DIAGNOSTICS**, 오른쪽은 **THOUGHT SETTINGS**로 배치합니다. 모바일/좁은 화면에서만 한 열로 바뀝니다.

## Missions / Player

- `js/player-game-loop.js`
- `css/player-game-loop.css`

## Settings / Management

- `hv-stable.js` — Settings 원본 렌더.
- `settings-management-hub.js` — MANAGEMENT 단일 진입점 + 두 column stack 배치 소유자.
- `css/settings-management-hub.css` — Settings column/카드 배치.
- `js/ux/runtime-diagnostics.js` — Runtime Diagnostics.
- `final-ux-cleanup.js` — player-facing 표시 정리만 담당.
- `css/final-ux-cleanup.css` — Settings 레이아웃을 강제하지 않음.

과거 `settings-rescue.js`는 Gacha/Thought의 Settings 덮어쓰기 문제가 원본에서 해결된 뒤 역할이 끝나 삭제했습니다.

## Other active modules

- `js/event-manager.js`
- `js/relationship-editor.js`
- `js/simple-character-profile.js` — V2. state update source를 자체 source로 사용.
- `js/editor-ux-suite.js`
- `js/memory-editor-removal.js`
- `js/ux/runtime-diagnostics.js`
- `js/final-ux-cleanup.js`

## Repository cleanup status

2026-09-17 기준으로 런타임에서 사용하지 않던 다음 legacy 구현은 삭제했습니다.

- old app/dialogue/vn/game-loop implementations
- old Item / Gift / Collection manager implementations
- `js/lucifer-gift-expansion.js`
- `js/lucifer-memory-event-bridge.js`
- `js/lucifer-memory-event-weave.js`
- `js/affiliation-music.js`
- `css/affiliation-music.css`
- `js/settings-rescue.js`
- `js/dialogue-files/dialogue-file-migration.js`

추가로 삭제/통합한 stale code:

- Gacha의 Settings 전체 override 및 Gacha Settings accordion
- `final-ux-cleanup.js`의 Player Settings 재삽입/Gacha Settings 제거 로직
- `final-ux-cleanup.css`의 Settings 1열 강제 및 옛 Player 복구 CSS
- `final-ux-cleanup.js`의 `dialogue-stability.css` 중복 동적 삽입
- `final-ux-cleanup.js`의 Thought nav sessionStorage snapshot 저장/복구
- `dialogue-runtime-cleanup.js`의 render-meta sceneRole 중복 동기화와 utility 전체 교체
- `dialogue-single-beat-runtime.js`의 utility/submenu 중복 소유와 quiet fallback 자동 재클릭
- `collection-runtime-repair.js`의 legacy Collection Item gift launcher
- Hazbin canon 팩의 Saint Peter 재생성/대화/질문 잔여 코드

`tests/`와 문서 파일은 런타임에 로드되지 않으므로 유지합니다.

## 현재 남은 구조 정리 우선순위

1. **Core defaults** — `hv-stable.js`의 `DEF`에는 아직 과거 삭제 대상이 남아 있습니다. 현재 `deletedDefaultCharacters` + `cast-exclusions` 때문에 플레이 상태에는 복구되지 않지만, 최종적으로 원본 seed에서도 삭제해야 합니다.
2. **Cast pack duplicate cleanup** — `hellaverse-cast-dialogues.js` 안의 과거 `cleanRemoved()`는 1번이 끝나면 제거하고 `cast-exclusions.js` 한 곳만 삭제 정책을 소유하게 합니다.
3. **Dialogue ownership** — 현재 `dialogue-ui.js`가 core state machine, cleanup이 QUESTION/ACTION 메뉴와 퇴실 navigation bridge를 담당합니다. 다음 단계에서는 utility markup 자체도 core로 흡수하면 cleanup을 더 줄일 수 있습니다.
4. **Core editor cleanup** — `memory-editor-removal.js`, `simple-character-profile.js`처럼 core Editor를 뒤에서 숨기는 보정은 `hv-stable.js` 원본 Editor를 정리한 뒤 제거합니다.
