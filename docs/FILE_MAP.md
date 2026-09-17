# File Map

이 문서는 **현재 `index.html`에서 실제로 로드되는 파일**과 유지해야 할 비런타임 문서만 기준으로 정리합니다. 삭제된 legacy 파일은 목록에 남기지 않습니다.

## Core / Main UI

- `js/hv-stable.js` — 메인 앱 렌더러. 페이지, 캐릭터 방 기본 DOM, Editor/Settings/Collection 원본 UI.
- `js/dialogue-ui.js` — 방문 세션, Scene/Choice/LOG/ENTRY/EXIT의 대화 코어.
- `js/site-runtime.js` — 사이트 공통 런타임 보정.

현재 별도의 `js/core/state-store.js` 또는 `window.HVState` 공용 wrapper는 사용하지 않습니다. 각 런타임이 `hellaverse_dialogue_state_v1`에서 자신이 소유한 필드만 수정합니다.

## Dialogue content

- `js/base-dialogues.js`
- `js/character-dialogues.js`
- `js/hellaverse-cast-dialogues.js` — 캐릭터/대화 seed만 담당하며 삭제 정책은 소유하지 않음.
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
- `js/hazbin-room-exits.js`
- `js/cast-exclusions.js` — 삭제 대상 캐릭터 및 관련 state를 중앙 정리.
- `js/dialogue-episode-upgrade-all.js` — 모든 content pack 이후 `dialogueFileMap`, `sceneRole`, `kind`를 canonical 형태로 정규화.

과거 `js/dialogue-files/dialogue-file-migration.js`는 `dialogue-episode-upgrade-all`과 역할이 겹쳐 삭제했습니다.

## Dialogue runtime / editor

- `js/dialogue-ui.js` — **방문/Scene/Choice/LOG/ENTRY/EXIT 상태의 코어 소유자**.
- `js/dialogue-file-editor.js` — Dialogue File Editor.
- `js/dialogue-runtime-cleanup.js` — QUESTION/ACTION 서브메뉴와 퇴실 navigation bridge 보조.
- `js/dialogue-episode-flow.js` — beat/common continuation 데이터 + 표시 호환.
- `js/dialogue-episode-editor-v2.js` — branch/continuation beat editor 보조.
- `js/dialogue-single-beat-runtime.js` — beat/NEXT 표시, LOG 외부 레이어, 플레이어 선택문 echo 제거.
- `js/dialogue-mood-indicator.js` — Mood 표시.
- `js/dialogue-foundation-safety.js` — 대화 접근성 및 중복 클릭 방지. Editor cleanup은 담당하지 않음.
- `css/dialogue-stability.css` — 대화 전환 깜빡임/애니메이션 안정화.
- `css/dialogue-foundation.css` — 대화 로그 스크롤/접근성 레이아웃.

## Editor UX

- `js/hv-stable.js` — 캐릭터 Profile/Editor 원본 소유자. Profile은 `description` 기반 ABOUT 한 섹션만 렌더하고, 수동 Memory Editor 탭/markup/handler는 원본에서 제거했습니다.
- `js/editor-ux-suite.js` — Gift/Event Editor의 표시 구조만 보조합니다. 캐릭터 Profile이나 Memory Editor를 뒤에서 다시 고치지 않습니다.
- `css/app.css` — 단순 Profile ABOUT 표시 스타일을 포함합니다.
- `css/editor-ux-suite.css` — Gift/Event Editor UX 스타일만 담당합니다.

과거 `js/simple-character-profile.js`, `js/memory-editor-removal.js`, 그리고 이후 `editor-ux-suite.js`에 임시 통합했던 Profile/Memory 보정 로직은 모두 원본 `hv-stable.js`로 흡수했습니다.

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

옛 `gift-system.js`, Item/Gift/Collection manager 구현, `gift-context`, `collection-exchange`, 별도 Lucifer gift expansion 파일은 저장소에서 제거했습니다. 삭제된 `gift-system.js`를 직접 실행하던 `tests/gift-state-flow.cjs`도 더 이상 유효하지 않아 삭제했습니다.

## Collection / Gacha

- `js/hotel-collection-pack.js`
- `js/gacha-copy-lucifer-1.js` ~ `4.js`
- `js/gacha-copy-hotel-1.js`, `2.js`
- `js/gacha-item-copy-pack.js`
- `js/gacha-collection-addon.js`
- `js/character-gacha-profiles.js`
- `js/collection-runtime-repair.js` — 호텔 Collection pack 누락 복구/초기 그룹 공개 보정.
- `js/collection-emoji-corrections.js`
- `css/gacha-collection-addon.css`
- `css/character-gacha-profiles.css`

## Thoughts

- `js/thought-archive.js`
- `css/thought-archive.css`

Thought nav는 기존 `.main-nav`를 교체하지 않고 THOUGHTS 버튼만 증분 추가합니다.

## Missions / Player

- `js/player-game-loop.js`
- `css/player-game-loop.css`

## Settings / Management

- `js/hv-stable.js` — Settings 원본 렌더.
- `js/settings-management-hub.js` — MANAGEMENT 단일 진입점 + 두 column stack 배치.
- `css/settings-management-hub.css`
- `js/ux/runtime-diagnostics.js` — Runtime Diagnostics.
- `css/ux/runtime-diagnostics.css`
- `js/final-ux-cleanup.js` — player-facing 표시 정리만 담당.
- `css/final-ux-cleanup.css`

과거 `settings-rescue.js`는 Gacha/Thought의 Settings 덮어쓰기 문제가 원본에서 해결된 뒤 삭제했습니다.

## Other active modules

- `js/event-manager.js`
- `css/event-manager.css`
- `js/relationship-editor.js`
- `css/relationship-editor.css`
- `js/collection-emoji-corrections.js`
- `js/final-ux-cleanup.js`

## Non-runtime files

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/FILE_MAP.md`
- `.nojekyll`

비어 있던 미래 구조용 `js/features/README.md`는 현재 구조와 맞지 않고 삭제된 `window.HVState` 사용을 안내하고 있어 삭제했습니다.

## Repository cleanup status — 2026-09-17

삭제 완료:

- old app/dialogue/vn/game-loop implementations
- old Item / Gift / Collection manager implementations
- `js/lucifer-gift-expansion.js`
- `js/lucifer-memory-event-bridge.js`
- `js/lucifer-memory-event-weave.js`
- `js/affiliation-music.js`
- `css/affiliation-music.css`
- `js/settings-rescue.js`
- `js/dialogue-files/dialogue-file-migration.js`
- `js/core/state-store.js`
- `js/simple-character-profile.js`
- `js/memory-editor-removal.js`
- `js/features/README.md`
- `tests/gift-state-flow.cjs`

추가 통합/정리 완료:

- Gacha Settings 전체 override 제거
- Thought nav 전체 교체 제거
- 대화 utility/submenu 중복 소유 축소
- Collection Item legacy gift launcher 제거
- Character Profile ABOUT/description 렌더·저장을 `hv-stable.js` 원본으로 흡수
- 수동 Memory Editor tab/markup/save handler를 `hv-stable.js` 원본에서 제거
- 삭제 대상 캐릭터를 `hv-stable.js` 기본 seed에서 제거하고 기존 저장 데이터 정리는 `cast-exclusions.js`만 담당
- `hellaverse-cast-dialogues.js`의 중복 `cleanRemoved()` 삭제
- Editor suite의 옛 health-check/Profile/Memory DOM cleanup 삭제

## 현재 남은 구조 정리 우선순위

1. **Dialogue compatibility reduction** — `dialogue-runtime-cleanup.js`, `dialogue-single-beat-runtime.js`의 남은 역할 중 실제 코어 상태 머신으로 옮길 수 있는 부분을 기능별로 검증합니다.
2. **Collection repair retirement** — `collection-runtime-repair.js`가 복구하는 누락 원인을 원본 seed/load 순서에서 완전히 없앤 뒤 repair 파일 제거 가능 여부를 검증합니다.
