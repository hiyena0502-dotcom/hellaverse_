# Hellaverse Dialogue Architecture

이 문서는 파일이 늘어나도 기능이 서로 덮어쓰지 않도록 유지하기 위한 기준입니다.

## 1. 핵심 원칙

- 메인 저장소 키는 `hellaverse_dialogue_state_v1` 하나를 기준으로 합니다.
- 현재 런타임은 각 기능이 localStorage state를 읽고 필요한 필드만 수정합니다. 별도의 미사용 공용 state wrapper는 두지 않습니다.
- 기능 파일은 모르는 필드를 삭제하지 않고 기존 state를 보존한 채 필요한 필드만 추가/수정합니다.
- 저장 후에는 가능하면 `hellaverse:state-updated` 이벤트를 발생시킵니다.
- DOM 후처리 기능은 같은 UI를 매번 새로 만들지 말고, 이미 만들어진 요소인지 확인한 뒤 idempotent하게 동작해야 합니다.
- MutationObserver 안에서 DOM을 수정할 때는 signature/guard를 사용해 무한 렌더 루프를 방지합니다.
- 같은 화면/상태를 두 파일이 동시에 소유하지 않도록 합니다. 보정 파일은 코어 원본이 해결되면 제거합니다.

## 2. 현재 주요 구조

```text
/
├─ index.html
├─ docs/
│  ├─ ARCHITECTURE.md
│  └─ FILE_MAP.md
├─ js/
│  ├─ ux/          진단 UI
│  └─ *.js         현재 기능/콘텐츠 런타임
└─ css/
   ├─ ux/          진단 UI 스타일
   └─ *.css         현재 기능 스타일
```

대규모 파일 이동은 하지 않습니다. GitHub Pages 캐시와 로딩 순서 때문에 파일 이동 자체가 오류를 만들 수 있으므로, 먼저 역할 중복을 제거한 뒤 필요할 때만 구조를 바꿉니다.

## 3. 로딩 순서

`index.html`은 다음 순서를 지켜야 합니다.

1. Base content / character content
2. Feature seeders (collection, dialogue pack 등)
3. Cast exclusions / dialogue normalization
4. Main renderers (`dialogue-ui`, `hv-stable`)
5. Feature runtime modules (item, collection, gacha, missions)
6. Dialogue/editor compatibility modules
7. UX / diagnostics / final display cleanup

초기 데이터를 만드는 seeder와 그것을 화면에 표시하는 renderer의 순서가 뒤바뀌면 컬렉션이나 대화가 다음 새로고침까지 보이지 않을 수 있습니다.

## 4. State 작성 규칙

- `hellaverse_dialogue_state_v1`을 읽은 뒤 필요한 필드만 수정합니다.
- 기존 배열/객체를 통째로 새 구조로 덮어쓰지 않습니다.
- 기능별 삭제 정책은 가능한 한 한 파일에서만 관리합니다.
- 저장 뒤 UI 갱신이 필요하면 `hellaverse:state-updated`를 발생시킵니다.
- 이벤트의 `detail.source`는 실제 수정한 모듈 이름을 사용합니다.

## 5. ID 규칙

- character: `charlie-morningstar`, `angel-dust`
- collection item: `<characterId>-collection-<slug>`
- dialogue: `<characterId>-talk-*`, `<characterId>-ask-*`
- flag: `<characterId>.<topic>.<event>` 형태 권장

ID는 화면 이름보다 중요합니다. 가챠/컬렉션/이벤트/대화 연결은 대부분 ID를 기준으로 하므로 이름을 바꿔도 ID는 가능한 유지합니다.

## 6. Dialogue 상태 소유

- `dialogue-ui.js` — 방문 세션, Scene/Choice/LOG/ENTRY/EXIT의 코어 상태 머신.
- `dialogue-runtime-cleanup.js` — QUESTION/ACTION 서브메뉴와 퇴실 navigation bridge만 보조.
- `dialogue-single-beat-runtime.js` — beat/NEXT 표시, LOG 외부 레이어, 플레이어 선택문 echo 제거.
- `dialogue-episode-upgrade-all.js` — `dialogueFileMap`, `sceneRole`, `kind` canonical 정규화.

새 Dialogue 수정은 먼저 `dialogue-ui.js`가 이미 소유하는 상태인지 확인하고, 같은 상태를 cleanup/runtime 파일에 다시 만들지 않습니다.

## 7. UX와 오류 진단

`js/ux/runtime-diagnostics.js`는 브라우저 오류와 데이터 구조 문제를 감지합니다.

검사 대상:
- 중복 ID
- 존재하지 않는 characterId 참조
- orphan collection/gacha profile
- 잘못된 데이터 참조
- JS error / unhandled promise rejection

Settings의 Runtime Diagnostics 카드에서 검사 결과와 복사용 리포트를 확인합니다.

## 8. 리팩터링 정책

기존 파일을 삭제하기 전에는 반드시:

1. `index.html` 로드 여부 확인
2. 저장소 전체 참조 검색
3. 같은 기능을 대체한 새 원본 확인
4. 로더 제거 후 파일 삭제
5. 문서/캐시 버전 정리

`repair`, `cleanup`, `safety`, `migration` 이름의 파일은 이름만 보고 유지하지 않습니다. 실제 역할이 남아 있는지 기준으로 판단합니다.

## 9. Item / Gift 기준

- 현재 플레이 UX는 Item V2를 기준으로 합니다.
- `collectionItems`는 발견/아카이브 기록입니다.
- 실제 보유 수량과 전달은 Item V2 inventory 설정이 담당합니다.
- 옛 Gift/Collection 전달 런타임은 다시 로드하지 않습니다.
