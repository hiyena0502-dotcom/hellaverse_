# File Map

현재 `index.html`에서 실제로 로드하는 파일을 기능별로 정리한 지도입니다.

## Core / Main UI

- `js/core/state-store.js` — 공용 state read/write/update helper. 새 기능은 이 파일 사용 권장.
- `js/hv-stable.js` — 메인 앱 렌더러, EDITOR, COLLECTION, 캐릭터 방 기본 동작.
- `js/dialogue-ui.js` — 대화 UI 후처리.
- `js/site-runtime.js` — 현재 사이트 런타임 보정과 추가 UI.

## Character / Dialogue Content

- `js/base-dialogues.js` — 기본 대화 데이터.
- `js/character-dialogues.js` — 캐릭터별 대화 데이터.
- `js/lucifer-content.js` — Lucifer 메인 콘텐츠.
- `js/lucifer-s12-addon.js` — Lucifer 시즌 1/2 확장.
- `js/character-dialogue-rules.js` — 캐릭터 대화 규칙.
- `js/dialogue-mood-indicator.js` — 대화 중 Mood 표시.

## Gift

- `js/gift-system.js` — 독립 Gift Manager, 대화 선택지 획득, 선물 인벤토리, 캐릭터 전달 UI를 한 파일에서 관리.
- `css/gift-system.css` — Gift Manager, 획득/전달 결과, 방 안 GIFT 목록 스타일.
- 과거 `gift-context-*`, `collection-exchange-system`, `lucifer-gift-expansion` 파일은 데이터 호환을 위해 저장소에 남아 있지만 `index.html`에서는 로드하지 않음.

## Collection / Gacha

- `js/hotel-collection-pack.js` — 호텔 핵심 캐릭터 8명의 컬렉션 데이터 팩.
- `js/gacha-collection-addon.js` — 가챠 화면, draw, history, collection 통합 UI.
- `js/character-gacha-profiles.js` — 캐릭터별 이모지/설명/Reveal Line/Gacha Editor.
- `js/collection-runtime-repair.js` — 늦은 로딩/누락 데이터 복구 호환 코드.
- `js/collection-emoji-corrections.js` — 기존 localStorage 아이템의 이모지/설명 동기화.
- `css/gacha-collection-addon.css`
- `css/character-gacha-profiles.css`

## Other Feature Modules

- `js/event-manager.js` — event/flag 관리.
- `js/thought-archive.js` — 속마음 archive.
- `js/relationship-editor.js` — relationship editor 확장.

## UX / Diagnostics

- `js/ux/runtime-diagnostics.js` — 브라우저 오류 수집 + state 구조 검사 + Settings 진단 카드.
- `css/ux/runtime-diagnostics.css` — 진단 카드 UI.

## CSS Base

- `css/app.css` — 메인 UI.
- `css/dialogue.css` — 대화 화면.
- `css/dialogue-stability.css` — 대화 flicker/transition 안정화.
- `css/dialogue-mood.css` — mood UI.
- `css/thought-archive.css`
- `css/relationship-editor.css`
- `css/event-manager.css`
- `css/collection-exchange-system.css`

## 주의: 기존 루트 파일

`js/` 안에는 과거 버전이나 현재 `index.html`에서 직접 로드하지 않는 파일도 남아 있을 수 있습니다. 이 파일들은 즉시 삭제하지 않고, 실제 의존 관계를 확인한 뒤 기능군별로 `js/features/` 또는 `legacy/`로 정리합니다.

새 파일을 추가할 때는 먼저 이 문서에서 가장 가까운 기능군을 고르고, 가능하면 루트 `js/`에 또 하나의 독립 파일을 만들기보다 `js/core/`, `js/ux/`, 향후 `js/features/<feature>/`를 사용합니다.
