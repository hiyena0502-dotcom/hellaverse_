# Hellaverse Dialogue Architecture

이 문서는 파일이 늘어나도 기능이 서로 덮어쓰지 않도록 유지하기 위한 기준입니다.

## 1. 핵심 원칙

- 메인 저장소 키는 `hellaverse_dialogue_state_v1` 하나를 기준으로 합니다.
- 기능 파일은 모르는 필드를 삭제하지 않고 기존 state를 보존한 채 필요한 필드만 추가/수정합니다.
- 저장 후에는 가능하면 `hellaverse:state-updated` 이벤트를 발생시킵니다.
- DOM 후처리 기능은 같은 UI를 매번 새로 만들지 말고, 이미 만들어진 요소인지 확인한 뒤 idempotent하게 동작해야 합니다.
- MutationObserver 안에서 DOM을 수정할 때는 signature/guard를 사용해 무한 렌더 루프를 방지합니다.
- 새 기능은 가능하면 `js/core`, `js/features`, `js/ux`처럼 역할이 드러나는 폴더에 둡니다.

## 2. 권장 폴더 구조

```text
/
├─ index.html
├─ docs/
│  ├─ ARCHITECTURE.md
│  └─ FILE_MAP.md
├─ js/
│  ├─ core/        공용 저장/이벤트/검증
│  ├─ ux/          UX, 접근성, 진단 UI
│  ├─ features/    앞으로 기능별 코드 이동 예정
│  └─ *.js         기존 호환 파일
└─ css/
   ├─ ux/          UX 전용 스타일
   └─ *.css         기존 기능 스타일
```

현재 기존 파일은 한 번에 옮기지 않습니다. GitHub Pages 캐시와 로딩 순서 때문에 대규모 이동이 더 큰 오류를 만들 수 있으므로, 새 코드부터 위 구조를 사용하고 기존 코드는 기능별로 천천히 이동합니다.

## 3. 로딩 순서

`index.html`은 다음 순서를 지켜야 합니다.

1. Core utilities
2. Base content / character content
3. Feature seeders (gift, collection pack)
4. Main renderers (`hv-stable`, `dialogue-ui`)
5. Feature runtime modules (dialogue-acquired gift inventory, event, collection, gacha)
6. Repair/sync compatibility modules
7. UX / diagnostics

초기 데이터를 만드는 seeder와 그것을 화면에 표시하는 renderer의 순서가 뒤바뀌면 컬렉션이 사라지거나 다음 새로고침까지 보이지 않는 문제가 생길 수 있습니다.

## 4. State 작성 규칙

새 기능은 가능하면 `window.HVState`를 사용합니다.

```js
HVState.update(state => {
  state.example = state.example || {};
  state.example.enabled = true;
  return state;
}, { source: 'example-feature' });
```

기존 파일은 아직 직접 localStorage를 사용하는 부분이 많습니다. 새 기능부터 공용 store로 맞추고, 기존 코드는 수정할 일이 생겼을 때 단계적으로 전환합니다.

## 5. ID 규칙

- character: `charlie-morningstar`, `angel-dust`
- collection item: `<characterId>-collection-<slug>`
- dialogue: `<characterId>-talk-*`, `<characterId>-ask-*`
- gift: `<characterId>-gift-*` 또는 확장 기능의 명확한 namespace
- flag: `<characterId>.<topic>.<event>` 형태 권장

ID는 화면 이름보다 중요합니다. 이모지/가챠/선물 전달 설정은 대부분 ID로 연결되기 때문에 이름을 바꿔도 ID는 가능한 유지합니다.

## 6. UX와 오류 진단

`js/ux/runtime-diagnostics.js`는 브라우저 오류와 데이터 구조 문제를 감지합니다.

검사 대상:
- 중복 ID
- 존재하지 않는 characterId 참조
- orphan collection transfer config
- 잘못된 gacha weight
- collection item 아이콘 누락
- JS error / unhandled promise rejection

Settings 화면의 Runtime Diagnostics 카드에서 검사 결과와 복사용 리포트를 볼 수 있습니다.

## 7. 리팩터링 정책

기존 파일을 옮길 때는 한 번에 하나의 기능군만 처리합니다.

권장 순서:
1. collection / gacha
2. dialogue-acquired gift inventory
3. dialogue runtime
4. editor extensions
5. legacy/unused 파일 정리

기존 파일을 삭제하기 전에는 `index.html`에서 더 이상 로드하지 않는지 확인합니다.

## 8. Gift Inventory 기준

- 선물로 사용할 원본은 `collectionItems`입니다. 별도의 공개 선물 목록을 다시 만들지 않습니다.
- 실제 전달 가능 수량은 `giftInventory.ownedCounts`에만 저장합니다. `ownedItems`는 컬렉션 해금 기록이므로 선물을 건네도 유지됩니다.
- `giftInventoryConfig.items[itemId]`가 획득 캐릭터, 대화, 선택지, 전달 대상, 반응을 연결합니다.
- 연결된 선택지는 기존 `unlockItemId`를 사용해 컬렉션도 함께 해금합니다.
- GIFT 메뉴에는 활성화된 설정 중 현재 수량이 1개 이상이고 현재 캐릭터가 전달 대상인 항목만 표시합니다.
- 예전 `gifts`, `giftContextConfig`, `collectionTransferConfig` 데이터는 백업 호환을 위해 삭제하지 않지만 현재 플레이 UX에서는 사용하지 않습니다.
