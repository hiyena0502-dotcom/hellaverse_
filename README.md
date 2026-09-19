# Hellaverse

개인용 Hellaverse 캐릭터 대화 / 관계 / 선물 / 컬렉션 / 가챠 사이트입니다. GitHub Pages에서 정적 사이트로 동작하며 플레이와 편집 데이터는 브라우저 `localStorage`에 저장됩니다.

## Current main flow

- **HOME** — 선택한 캐릭터의 메인 로비
- **HELL LIFE** — Pride / Wrath / Greed / Gluttony / Lust / Envy / Sloth 링 탐색 및 지역 캐릭터 진입
- **CHARACTERS** — 검색 / 출신 / 링 / 즐겨찾기 기반 캐릭터 디렉터리
- **ROOM** — TALK / ASK / INVENTORY, 대화 로그와 관계 상태
- **GACHA** — 현재 획득 가능한 희귀도만 기준으로 정규화된 확률의 아이템 추첨
- **THOUGHT** — 발견한 캐릭터 Thought 아카이브
- **COLLECTION** — 획득 / SECRET / 선물 반응 아카이브
- **DATA** — 자동 저장, 3개 수동 세이브 슬롯, 안전 스냅샷, JSON 내보내기/가져오기, 진행도 초기화
- **EDITOR** — 캐릭터 / 이벤트 / ASK / 아이템 / 가챠 / Thought / Collection 편집, CHECK, UNDO/REDO, 저장 전 RESTORE

## Active runtime

현재 GitHub Pages 진입점은 다음 두 파일만 직접 로드합니다.

- `js/site-runtime.js`
- `css/app.css`

저장 키:

- 현재 프로젝트/플레이 데이터: `hellaverse-studio-state-v2`
- 플레이 환경설정: `hellaverse-studio-prefs-v2`
- 세이브 슬롯/안전 백업: `hellaverse-studio-backups-v2`
- EDITOR 저장 전 복구 지점: `hellaverse-studio-editor-snapshot-v2`

브라우저에 현재 키가 없고 옛 `hellaverse_dialogue_state_v1`만 있으면 원본 legacy 데이터는 지우지 않은 채 새 구조로 한 번 가져옵니다.

## Save behavior

호감도, 감정, 일반 변수, 대화 로그를 포함한 플레이 상태는 새로고침 뒤에도 유지됩니다. EDITOR 저장 전에는 자동 안전 백업과 별도의 EDITOR 복구 지점을 생성합니다. 중요한 변경 전에는 DATA에서 수동 슬롯 또는 JSON 백업을 추가로 만드는 것을 권장합니다.

## Legacy files

저장소의 다른 `js/*.js`, `css/*.css` 중 일부는 이전 런타임/실험 기록입니다. 현재 `index.html`에서 로드하지 않으며 배포 런타임 소유자로 취급하지 않습니다. 재사용할 때는 먼저 `index.html`의 실제 로드 여부와 현재 `site-runtime.js`와의 상태 충돌 여부를 확인합니다.
