# File Map

이 문서는 **현재 `index.html`에서 실제로 로드하는 파일**과 저장소에 남아 있는 legacy 파일을 구분하기 위한 지도입니다.

## Core / Main UI

- `js/core/state-store.js` — 공용 state helper. 새 기능은 가능하면 이 store를 사용합니다.
- `js/hv-stable.js` — 메인 앱 렌더러. 페이지, 캐릭터 방 기본 DOM, Editor/Settings/Collection의 원본 UI를 만듭니다.
- `js/dialogue-ui.js` — 방문 세션, 대화 진행, 로그, ENTRY/EXIT, Conversation 연결을 담당하는 대화 코어입니다.
- `js/site-runtime.js` — 사이트 공통 런타임 보정.

## Dialogue content

현재 콘텐츠 seeder는 renderer보다 먼저 로드됩니다.

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
- `js/hazbin-canon-dialogues.js`
- `js/cast-exclusions.js` — Lilith / Speaker of God / Saint Peter 등 최종 제외 데이터를 정리합니다.
- `js/dialogue-episode-upgrade-all.js` — 모든 콘텐츠 팩 로드 후 episode 형태를 정규화합니다.

## Dialogue runtime / editor

대화 관련 현재 로드 파일은 아래와 같습니다.

- `js/dialogue-ui.js` — **대화 상태의 원본 소유자**. 방문/scene/choice/log/ENTRY/EXIT 흐름.
- `js/dialogue-file-editor.js` — Dialogue File Editor UI.
- `js/dialogue-runtime-cleanup.js` — QUESTION picker, ACTION/CONVERSATION 자동 시작, 방 utility/퇴실 호환.
- `js/dialogue-episode-flow.js` — episode beat/common continuation 데이터 호환.
- `js/dialogue-episode-editor-v2.js` — episode editor 보조.
- `js/dialogue-single-beat-runtime.js` — player-facing one-beat/NEXT 표시와 ASK/ACTION submenu 전환.
- `js/dialogue-mood-indicator.js` — Mood 표시.
- `js/dialogue-foundation-safety.js` — 대화 데이터 안전 보정.

### 중요

`final-ux-cleanup.js`는 더 이상 대화방 DOM을 복제하거나 `state.page='life'`를 강제로 복구하지 않습니다. 대화 상태 전환은 위 dialogue runtime들이 소유합니다.

## Item / Gift / Inventory

현재 플레이 UX는 **Item V2** 기준입니다.

- `js/item-inventory-migration.js`
- `js/item-catalog-rebalance.js`
- `js/satan-paperweight-delivery.js`
- `js/item-system-v2.js` — Inventory / Gift 전달 런타임.
- `js/item-manager-v2.js` — Item Manager.
- `js/item-event-bridge-v2.js` — Event 참조 bridge.
- `css/item-system-v2.css`
- `css/item-manager-v2.css`

`js/item-inventory.js`, `js/item-manager.js`, `js/item-event-bridge.js`, `gift-context-*`, `collection-exchange-system.js`, `lucifer-gift-expansion.js` 등은 **현재 index에서 로드하지 않는 legacy/호환 파일**입니다. 새 수정은 V2 파일에 해야 합니다.

## Collection / Gacha

- `js/hotel-collection-pack.js` — Collection seed.
- `js/gacha-copy-*.js` / `js/gacha-item-copy-pack.js` — Collection/Gacha content seed.
- `js/gacha-collection-addon.js` — Gacha overlay, draw/history, Collection 렌더 확장.
- `js/character-gacha-profiles.js` — 캐릭터별 Gacha profile.
- `js/collection-runtime-repair.js` — 늦은 로딩/누락 데이터 호환.
- `js/collection-emoji-corrections.js` — 기존 저장 데이터의 emoji/설명 정규화.

### 확인이 필요한 구조

`gacha-collection-addon.js`에는 아직 Settings grid 전체를 다시 그리는 legacy `renderSettings()`가 남아 있습니다. `final-ux-cleanup.js`가 그 결과에서 `GACHA SETTINGS`를 제거하고 PLAYER를 복구하고 있으므로 Settings는 아직 중복 소유 상태입니다. 다음 Settings 리팩터링에서 Gacha가 Settings 전체를 덮어쓰지 않게 원본 수정해야 합니다.

## Thoughts

- `js/thought-archive.js` — Thought 데이터, 자동 표시, Archive page.
- `css/thought-archive.css`

### 확인이 필요한 구조

`thought-archive.js`의 legacy `patchNav()`는 아직 `.main-nav.innerHTML`을 교체하는 방식입니다. Gacha/Missions/Settings 버튼과 충돌할 수 있어 `final-ux-cleanup.js`가 nav 복구를 보조하고 있습니다. 다음 Thought 리팩터링에서 기존 nav를 보존하고 THOUGHTS 버튼만 추가하는 방식으로 바꿔야 합니다.

## Missions / Player

- `js/player-game-loop.js` — Player profile + Mission runtime.
- `css/player-game-loop.css` — Mission modal 포함. Mission overlay는 캐릭터 방보다 높은 레이어에서 렌더됩니다.

## Settings / Management

현재 Settings에는 여러 보조 레이어가 있습니다.

- `hv-stable.js` — Settings 원본 렌더.
- `gacha-collection-addon.js` — legacy Settings override가 아직 남아 있음.
- `settings-rescue.js` — Settings가 실제로 사라졌을 때 fallback.
- `settings-management-hub.js` — MANAGEMENT 단일 진입점.
- `js/ux/runtime-diagnostics.js` — Runtime Diagnostics.
- `final-ux-cleanup.js` — 남은 중복 UI 정리.

이 영역은 대화 다음으로 중복 소유가 많은 곳입니다.

## Other active modules

- `js/event-manager.js`
- `js/relationship-editor.js`
- `js/simple-character-profile.js`
- `js/editor-ux-suite.js`
- `js/memory-editor-removal.js`
- `js/ux/runtime-diagnostics.js`
- `js/final-ux-cleanup.js`

## Legacy / currently not loaded

저장소에는 과거 구현이 많이 남아 있지만 `index.html`에서 로드되지 않으면 현재 브라우저 런타임에는 영향을 주지 않습니다. 대표적으로:

- `js/app.js`
- `js/dialogue-app.js`
- `js/vn-overhaul.js`
- `js/game-loop-polish.js`
- `js/gate-click.js`
- `js/item-inventory.js`
- `js/item-manager.js`
- `js/item-event-bridge.js`
- `js/gift-context-system.js`
- `js/gift-context-editor.js`
- `js/collection-exchange-system.js`
- `js/collection-lock-reset.js`
- `js/collection.js`
- `js/lucifer-gift-expansion.js`
- `js/lucifer-memory-event-bridge.js`
- `js/lucifer-memory-event-weave.js`
- `js/ui-entry-playlist.js`

이 파일들은 즉시 삭제하지 말고, 데이터 migration/import 의존성이 없는지 확인한 뒤 기능군별로 `legacy/` 이동 또는 삭제합니다.

## 현재 리팩터링 우선순위

1. Dialogue — 상태 소유자를 `dialogue-ui.js` 중심으로 줄이고 cleanup/single-beat의 역할을 표시 전용으로 제한.
2. Settings — Gacha의 Settings 전체 override 제거.
3. Thoughts — `patchNav()`의 `innerHTML` 전체 교체 제거.
4. Legacy — index 미로드 파일의 migration 의존성 확인 후 정리.
