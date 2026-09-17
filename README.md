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

현재 런타임은 별도의 공용 state wrapper를 두지 않습니다. 각 기능이 `hellaverse_dialogue_state_v1`을 읽고 자신이 소유한 필드만 수정하며, 화면 갱신이 필요하면 `hellaverse:state-updated` 이벤트를 사용합니다.

- `js/*.js` — 현재 기능/콘텐츠 런타임. 기존 로딩 순서와 localStorage 마이그레이션 의존성 때문에 임의로 파일을 이동하지 않습니다.
- `js/ux/` — UX/runtime diagnostics
- `css/*.css` — 현재 기능 스타일
- `css/ux/` — 진단 UI 스타일
- `docs/ARCHITECTURE.md` — 로딩 순서, state 규칙, ID 규칙, 리팩터링 정책
- `docs/FILE_MAP.md` — 현재 실제로 로드되는 파일과 역할

새 보정 파일을 계속 추가하기보다 기존 기능 소유자에 통합하는 것을 우선합니다. `repair`, `cleanup`, `migration`, `safety` 파일은 실제 역할이 사라지면 로더와 파일을 함께 제거합니다.

## Debugging

SETTINGS 화면 아래의 **RUNTIME DIAGNOSTICS**에서 중복 ID, 잘못된 character reference, orphan collection config, 가챠 weight 오류, 최근 브라우저 runtime error를 확인할 수 있습니다. 문제가 생기면 `COPY REPORT`로 결과를 복사할 수 있습니다.
