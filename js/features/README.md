# Feature modules

앞으로 새 기능은 가능하면 이 폴더 아래 기능 단위로 둡니다.

권장 예시:

```text
js/features/
├─ collection/
├─ gacha/
├─ gifts/
├─ dialogue/
└─ editor/
```

기존 `js/*.js`는 현재 로딩 순서와 localStorage 마이그레이션 의존성이 있어 한 번에 이동하지 않습니다. 해당 기능을 크게 수정하는 시점에 하나씩 이 폴더로 옮기고 `index.html`과 `docs/FILE_MAP.md`를 함께 갱신합니다.

새 기능 파일은 다음 규칙을 따릅니다.

1. 가능하면 `window.HVState`를 통해 state를 읽고 저장합니다.
2. 알 수 없는 기존 state 필드를 삭제하지 않습니다.
3. DOM patch는 여러 번 실행해도 결과가 중복되지 않도록 작성합니다.
4. MutationObserver가 자신이 만든 DOM을 다시 감지해 무한 루프를 만들지 않도록 guard/signature를 둡니다.
5. 캐릭터/아이템 연결은 화면 이름이 아니라 고정 ID를 사용합니다.
