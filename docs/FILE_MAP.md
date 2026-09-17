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

- `js/editor-ux-suite.js` — Gift/Event Editor UX와 legacy core Editor 보정의 단일 후처리 소유자.
  - 단순 캐릭터 프로필 ABOUT 표시와 `description` 저장
  - 사용하지 않는 옛 Profile 필드 숨김
  - 사용하지 않는 수동 Memory Editor 진입 차단/정리
  - 옛 health-check DOM 잔여 정리
- `css/editor-ux-suite.css` — 위 Editor 보정과 UX 스타일.

과거 `js/simple-character-profile.js`와 `js/memory-editor-removal.js`는 각각 별도 MutationObserver로 같은 Editor DOM을 후처리해 중복 렌더와 state overwrite 위험이 있어 `editor-ux-suite.js`로 통합 후 삭제했습니다.

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
- Dialogue safety와 Editor suite가 중복으로 health-check DOM을 지우던 코드 제거
- Character description 저장을 Editor suite에 통합하고 저장 후 core state가 오래된 값으로 되덮는 경로를 차단

## 현재 남은 구조 정리 우선순위

1. **Core defaults** — `hv-stable.js`의 `DEF`에는 아직 `cast-exclusions.js`가 즉시 제거하는 과거 기본 캐릭터가 일부 남아 있습니다. 런타임 오류는 막혀 있지만 최종적으로 seed 자체에서 제거하는 것이 맞습니다.
2. **Cast pack duplicate cleanup** — `hellaverse-cast-dialogues.js`의 과거 `cleanRemoved()`는 중앙 `cast-exclusions.js`와 삭제 정책이 겹칩니다. 대형 content pack을 수정할 때 중앙 정책만 남기도록 정리합니다.
3. **Core Editor cleanup** — 현재 `editor-ux-suite.js`가 옛 Profile/Memory UI를 한 곳에서만 보정합니다. 다음 단계에서는 `hv-stable.js` 원본 Editor에서 사용하지 않는 markup/handler 자체를 제거하면 이 보정도 더 줄일 수 있습니다.
4. **Dialogue compatibility reduction** — `dialogue-runtime-cleanup.js`, `dialogue-single-beat-runtime.js`의 남은 역할을 코어에 흡수할 수 있는지 기능별로 계속 검증합니다.
