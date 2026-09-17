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
- `js/hazbin-canon-dialogues.js`
- `js/hazbin-room-exits.js` — Hazbin 캐릭터별 EXIT/헤어짐 장면.
- `js/cast-exclusions.js` — Lilith / Speaker of God / Saint Peter 등 제외 데이터 최종 정리.
- `js/dialogue-episode-upgrade-all.js` — 모든 content pack 이후 episode 형태 정규화.

## Dialogue runtime / editor

- `js/dialogue-ui.js` — **대화 상태의 원본 소유자**.
- `js/dialogue-file-editor.js` — Dialogue File Editor.
- `js/dialogue-runtime-cleanup.js` — QUESTION picker, ACTION/CONVERSATION 자동 시작, room utility/퇴실 연결.
- `js/dialogue-episode-flow.js` — beat/common continuation 데이터 호환.
- `js/dialogue-episode-editor-v2.js` — episode editor 보조.
- `js/dialogue-single-beat-runtime.js` — one-beat/NEXT 표시와 ASK/ACTION submenu 전환.
- `js/dialogue-mood-indicator.js` — Mood 표시.
- `js/dialogue-foundation-safety.js` — 대화 데이터 안전 보정.

`final-ux-cleanup.js`는 더 이상 이전 방 DOM을 복제하거나 `state.page='life'`로 강제 복귀시키지 않습니다.

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
- `js/collection-runtime-repair.js`
- `js/collection-emoji-corrections.js`

### 남은 구조 이슈

`gacha-collection-addon.js`의 `renderSettings()`는 아직 `.settings-grid` 전체를 다시 그립니다. 현재 Settings 중복 소유의 가장 큰 원인이라 추후 원본에서 제거해야 합니다.

## Thoughts

- `js/thought-archive.js`
- `css/thought-archive.css`

### 남은 구조 이슈

`thought-archive.js`의 `patchNav()`는 아직 `.main-nav.innerHTML`을 통째로 교체합니다. GACHA/MISSIONS/SETTINGS와 충돌 가능성이 있어 원본 리팩터링 대상입니다.

## Missions / Player

- `js/player-game-loop.js`
- `css/player-game-loop.css`

## Settings / Management

- `hv-stable.js` — Settings 원본 렌더.
- `gacha-collection-addon.js` — 아직 legacy Settings override 존재.
- `settings-rescue.js` — 실제 Settings가 없을 때만 fallback.
- `settings-management-hub.js` — MANAGEMENT 단일 진입점.
- `js/ux/runtime-diagnostics.js` — Runtime Diagnostics.
- `final-ux-cleanup.js` — 표시 정리만 담당.

## Other active modules

- `js/event-manager.js`
- `js/relationship-editor.js`
- `js/simple-character-profile.js`
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

`tests/`와 문서 파일은 런타임에 로드되지 않으므로 유지합니다.

## 현재 리팩터링 우선순위

1. Dialogue — 상태 소유자를 `dialogue-ui.js` 중심으로 더 줄이기.
2. Settings — Gacha의 Settings 전체 override 제거.
3. Thoughts — `patchNav()`의 nav 전체 교체 제거.
4. Core defaults — 삭제된 기본 캐릭터가 원본 seed에 다시 들어가지 않도록 정리.
