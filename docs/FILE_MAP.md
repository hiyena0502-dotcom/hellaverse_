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
- `js/hazbin-canon-dialogues.js` — v2부터 Lilith / Speaker of God / Saint Peter를 팩 자체에서 만들지 않습니다.
- `js/hazbin-room-exits.js` — Hazbin 캐릭터별 EXIT/헤어짐 장면.
- `js/cast-exclusions.js` — 삭제 캐릭터와 기존 localStorage 잔여 데이터를 최종 정리.
- `js/dialogue-episode-upgrade-all.js` — 모든 content pack 이후 episode 형태 정규화.

## Dialogue runtime / editor

- `js/dialogue-ui.js` — **대화 상태의 코어 소유자**.
- `js/dialogue-file-editor.js` — Dialogue File Editor.
- `js/dialogue-runtime-cleanup.js` — QUESTION picker, ACTION/CONVERSATION 자동 시작, room utility, ASK/ACTION/RETURN/INVENTORY 전환, 퇴실 연결을 소유합니다.
- `js/dialogue-episode-flow.js` — beat/common continuation 데이터 호환.
- `js/dialogue-episode-editor-v2.js` — episode editor 보조.
- `js/dialogue-single-beat-runtime.js` — one-beat/NEXT 표시, LOG 외부 레이어, 플레이어 선택문 echo 제거만 담당합니다. v11부터 utility와 ASK/ACTION submenu 상태를 만들지 않습니다.
- `js/dialogue-mood-indicator.js` — Mood 표시.
- `js/dialogue-foundation-safety.js` — 대화 데이터 안전 보정.
- `css/dialogue-stability.css` — 대화 전환 깜빡임/애니메이션 안정화의 단일 CSS 소유자.

`final-ux-cleanup.js`는 더 이상 이전 방 DOM 복제, 강제 `state.page='life'` 복귀, dialogue stability CSS 동적 삽입, Thought nav HTML snapshot 저장/복구를 하지 않습니다.

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

`gacha-collection-addon.js`는 Gacha overlay / draw / history / Collection만 담당합니다. legacy `settingsMarkup()` / `renderSettings()`와 Gacha Settings 전체 override는 제거되어 Settings DOM을 교체하지 않습니다.

## Thoughts

- `js/thought-archive.js`
- `css/thought-archive.css`

`thought-archive.js` v42의 `patchNav()`는 더 이상 `.main-nav.innerHTML`을 교체하지 않습니다. 기존 HOME / CHARACTERS / GACHA / COLLECTION / MISSIONS / SETTINGS를 보존하고 THOUGHTS 버튼만 증분 추가·활성화합니다. 기존 legacy MYSTERY BOX nav 버튼은 제거합니다.

Thought Settings는 Settings DOM 삽입 순서에 의존하지 않습니다. Settings Management V3에서 **MANAGEMENT → PLAYER(전체 폭)** 아래를 두 개의 독립 stack으로 만들고, 왼쪽은 **APPEARANCE → DANGER ZONE → RUNTIME DIAGNOSTICS**, 오른쪽은 **THOUGHT SETTINGS**로 배치합니다. 카드 사이에 큰 빈 row가 생기지 않으며 모바일/좁은 화면에서만 한 열로 바뀝니다.

## Missions / Player

- `js/player-game-loop.js`
- `css/player-game-loop.css`

## Settings / Management

- `hv-stable.js` — Settings 원본 렌더. 기본 `.settings-grid`는 데스크톱 2열, 모바일 1열입니다.
- `settings-rescue.js` — 실제 Settings가 사라졌을 때만 사용하는 fallback. 현재도 의도적으로 유지합니다.
- `settings-management-hub.js` — MANAGEMENT 단일 진입점 + 두 column stack 배치 소유자.
- `css/settings-management-hub.css` — Settings column/카드 배치.
- `js/ux/runtime-diagnostics.js` — Runtime Diagnostics.
- `final-ux-cleanup.js` — player-facing 표시 정리만 담당합니다.
- `css/final-ux-cleanup.css` — Settings 레이아웃을 더 이상 강제하지 않습니다.

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

추가로 삭제/통합한 stale code:

- Gacha의 Settings 전체 override 및 Gacha Settings accordion
- `final-ux-cleanup.js`의 Player Settings 재삽입/Gacha Settings 제거 로직
- `final-ux-cleanup.css`의 Settings 1열 강제 및 옛 Player 복구 CSS
- `final-ux-cleanup.js`의 `dialogue-stability.css` 중복 동적 삽입
- `final-ux-cleanup.js`의 Thought nav sessionStorage snapshot 저장/복구
- `dialogue-single-beat-runtime.js`의 중복 room utility 생성 및 ASK/ACTION/RETURN 상태 전환
- Hazbin canon 팩의 Saint Peter 재생성/대화/질문 잔여 코드

`tests/`와 문서 파일은 런타임에 로드되지 않으므로 유지합니다.

## 현재 리팩터링 우선순위

1. Dialogue — `dialogue-ui.js`와 `dialogue-runtime-cleanup.js` 사이의 남은 상태 소유 경계를 더 줄이기. 현재 utility/submenu 중복은 제거 완료했습니다.
2. Core defaults — 삭제된 기본 캐릭터가 `hv-stable.js` seed에 다시 들어가는지 점검하고 원본 seed에서 제거.
3. Repair modules — `collection-runtime-repair.js`, `dialogue-foundation-safety.js`, `settings-rescue.js`는 현재 실제 역할이 있으므로 즉시 삭제하지 말고, 원본 기능으로 완전히 흡수된 시점에만 제거합니다.
