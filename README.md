# Hellaverse Dialogue

개인용 Hellaverse 캐릭터 대화 / 관계 / 선물 / 컬렉션 / 가챠 사이트입니다. GitHub Pages에서 정적 사이트로 동작하며, 대부분의 플레이 데이터는 브라우저 `localStorage`에 저장됩니다.

## Main flow

- HOME: entry dashboard
- HELL LIFE: character interaction rooms
- CHARACTERS: character profile viewer
- COLLECTION: collection archive and owned cards
- GACHA: collection draw / history
- EDITOR: character-centered content editing
- SETTINGS: appearance, backup, runtime diagnostics

## Repository guide

파일이 늘어나면서 기능이 서로 덮어쓰는 문제를 줄이기 위해 새 코드는 역할별 폴더를 사용합니다.

- `js/core/` — 공용 state/event helper
- `js/ux/` — UX, 접근성, runtime diagnostics
- `css/ux/` — UX 전용 style
- `docs/ARCHITECTURE.md` — 로딩 순서, state 규칙, ID 규칙, 리팩터링 정책
- `docs/FILE_MAP.md` — 현재 실제로 로드되는 파일과 역할

기존 `js/*.js` 파일은 한 번에 옮기지 않습니다. 캐시/로드 순서 문제를 피하기 위해 기능을 수정할 때마다 `collection/gacha → gifts → dialogue → editor` 순서로 점진적으로 정리합니다.

## Debugging

SETTINGS 화면 아래의 **RUNTIME DIAGNOSTICS**에서 중복 ID, 잘못된 character reference, orphan collection config, 가챠 weight 오류, 최근 브라우저 runtime error를 확인할 수 있습니다. 문제가 생기면 `COPY REPORT`로 결과를 복사할 수 있습니다.
