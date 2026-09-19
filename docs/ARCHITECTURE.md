# Hellaverse Architecture

## 1. Runtime ownership

현재 배포 앱의 단일 런타임 소유자는 `js/site-runtime.js`, 단일 기본 스타일 소유자는 `css/app.css`입니다. `index.html`은 이 두 파일만 직접 로드합니다.

과거의 `hv-stable.js`, 대화 compatibility 파일, Item/Gift runtime 파일 등이 저장소에 남아 있어도 현재 진입점에서 로드되지 않으면 active runtime으로 간주하지 않습니다.

## 2. Storage

현재 키:

- `hellaverse-studio-state-v2` — 프로젝트 설정 + 플레이 진행
- `hellaverse-studio-prefs-v2` — 텍스트 속도 / AUTO / stage click
- `hellaverse-studio-backups-v2` — 3개 수동 슬롯 + 자동 안전 백업
- `hellaverse-studio-editor-snapshot-v2` — 마지막 EDITOR 저장 전 복구 지점

Legacy 키 `hellaverse_dialogue_state_v1`은 새 키가 없을 때만 읽습니다. 마이그레이션은 legacy 원본을 삭제하거나 덮어쓰지 않습니다.

## 3. State model

`state`는 다음 주요 영역을 가집니다.

- profile
- favoriteCharacterIds
- playState
  - variables
  - affection
  - emotions
  - log
- characters
- events / variables
- asks
- items / inventory / itemHistory
- discovered gift reaction state
- interaction history
- thoughts / discoveredThoughtIds
- collectionSettings
- gacha

플레이 진행 상태는 별도 임시 세션으로 동작하되 `saveState()` 시 `playState`에 동기화합니다. 따라서 새로고침 또는 EDITOR 저장 뒤에도 진행도가 유지됩니다.

## 4. Pages

`currentPage` 기준:

- home
- world
- characters
- gacha
- thought
- collection
- room

HELL LIFE는 일곱 링 메타데이터와 캐릭터의 `ring` 필드를 사용합니다. 기존 저장 데이터에 `ring`이 없으면 캐릭터 이름/역할을 기준으로 대표 Sin 캐릭터를 추론하고 나머지 지옥 캐릭터는 Pride로 기본 배치합니다. 천국 캐릭터는 링이 없습니다.

## 5. Editor safety

EDITOR는 실제 저장 전 `editorDraft`에서만 수정합니다.

- UNDO / REDO: 편집 중 draft 스냅샷
- RESTORE: 마지막 EDITOR 저장 직전 state
- CHECK: 참조/빈 콘텐츠/설정 충돌 검사
- 삭제: 확인창 뒤 실행
- 닫기: 미저장 변경이 있으면 확인
- 저장: 자동 안전 백업 + EDITOR 복구 지점 생성 후 state 반영

## 6. Gacha probability

가챠 확률 표시는 현재 획득 가능한 아이템이 존재하는 희귀도만 사용해 가중치를 재정규화합니다. 현재 존재하는 희귀도의 설정 가중치가 모두 0이면 해당 희귀도들 사이에 균등 분배합니다. 이 규칙은 화면의 RATES와 실제 추첨에 동일하게 적용합니다.

## 7. Change policy

새 기능은 우선 `site-runtime.js`와 `app.css`의 현재 소유 영역에 통합합니다. 임시 repair/cleanup 파일을 새로 추가해 같은 상태나 DOM을 두 런타임이 동시에 소유하게 하지 않습니다.

기존 legacy 파일을 다시 로드하려면 반드시:

1. 현재 `index.html` 로드 목록 확인
2. storage key와 state schema 충돌 확인
3. DOM selector / event handler 중복 확인
4. 현 runtime에 필요한 부분만 통합
5. 캐시 버전 갱신
