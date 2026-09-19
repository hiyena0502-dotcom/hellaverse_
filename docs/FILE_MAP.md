# Current File Map

이 문서는 **현재 GitHub Pages 배포에서 실제로 사용되는 진입 파일**만 active로 분류합니다.

## Active

### `index.html`
앱 shell과 시작 화면, 상단 navigation, EDITOR shell을 정의합니다.

현재 navigation:

- HOME
- HELL LIFE
- CHARACTERS
- GACHA
- THOUGHT
- COLLECTION

HUD tools:

- DATA
- EDITOR
- PROFILE

### `js/site-runtime.js`
현재 앱의 단일 JavaScript runtime입니다.

소유 기능:

- profile/start
- HOME character lobby
- HELL LIFE seven rings
- CHARACTERS search/filter/favorites
- ROOM dialogue / ASK / inventory
- affection / emotion / variables / log persistence
- item acquisition / gift reactions
- GACHA
- THOUGHT
- COLLECTION
- DATA save slots / safety snapshots / import-export
- EDITOR / validation / undo-redo / restore
- legacy `hellaverse_dialogue_state_v1` one-time import

### `css/app.css`
현재 앱 전체 기본 스타일입니다.

포함 영역:

- start / HUD / HOME
- HELL LIFE
- character directory
- ROOM desktop/mobile
- GACHA / THOUGHT / COLLECTION
- DATA manager
- EDITOR desktop/mobile
- validation / interaction / acquisition UI

## Documentation

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/FILE_MAP.md`
- `.nojekyll`

## Legacy / inactive repository files

그 외 루트 `js/*.js`, `css/*.css`, 하위 legacy/ux 파일 중 `index.html`에서 불러오지 않는 파일은 현재 배포 실행 경로에 포함되지 않습니다.

이 파일들은 과거 구현/실험 기록으로 남아 있을 수 있으므로 파일 이름만 보고 현재 기능 소유자로 판단하지 않습니다. 삭제 또는 재통합 전에는 Git history와 참조를 확인합니다.

## Cache version

현재 active asset query version: `v=217`.
