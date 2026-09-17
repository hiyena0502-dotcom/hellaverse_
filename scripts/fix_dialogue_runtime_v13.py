from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 exact match, found {count}')
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=0):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 regex match, found {count}')
    return out

# dialogue-runtime-cleanup.js
path = 'js/dialogue-runtime-cleanup.js'
text = read(path)
text = text.replace('__HELLAVERSE_DIALOGUE_RUNTIME_CLEANUP_V12__', '__HELLAVERSE_DIALOGUE_RUNTIME_CLEANUP_V13__')

text = once(
    text,
    "const up=v=>String(v||'').trim().toUpperCase();\nlet queued=false,pendingMode='',navigationBridge=false,leaveFlow=null,specialTransition=false,coreReturnBridge=false;",
    "const up=v=>String(v||'').trim().toUpperCase();\nconst runtimeMode=()=>{try{return up(sessionStorage.getItem(RKEY)||'')}catch{return''}};\nconst rememberMode=mode=>{try{sessionStorage.setItem(RKEY,up(mode))}catch{}};\nconst forgetMode=()=>{try{sessionStorage.removeItem(RKEY)}catch{}};\nlet queued=false,pendingMode='',navigationBridge=false,leaveFlow=null,specialTransition=false,coreReturnBridge=false;",
    'add safe runtime mode storage helpers'
)

text = once(
    text,
    "return '<div class=\"dialogue-utility hv-stable-dialogue-utility\" style=\"display:flex;gap:14px;align-items:center;justify-content:flex-end;flex-wrap:wrap\" data-stable-utility=\"LOG|ASK|ACTION|INVENTORY|LEAVE ROOM\"><button type=\"button\" data-vn-log>LOG</button><button type=\"button\" data-action=\"ASK\" data-dialogue-file-runtime=\"QUESTION\">ASK</button><button type=\"button\" data-action=\"TALK\" data-dialogue-file-runtime=\"ACTION\">ACTION</button><button type=\"button\" data-inventory-open>INVENTORY</button><button type=\"button\" data-runtime-leave>LEAVE ROOM</button></div>';",
    "return '<div class=\"dialogue-utility hv-stable-dialogue-utility\" style=\"display:flex;gap:14px;align-items:center;justify-content:flex-end;flex-wrap:wrap\" data-stable-utility=\"LOG|ASK|ACTION|INVENTORY|LEAVE ROOM\" data-hv-runtime-actions-allowed=\"1\" data-hv-runtime-leave-allowed=\"1\"><button type=\"button\" data-vn-log>LOG</button><button type=\"button\" data-action=\"ASK\" data-dialogue-file-runtime=\"QUESTION\">ASK</button><button type=\"button\" data-action=\"TALK\" data-dialogue-file-runtime=\"ACTION\">ACTION</button><button type=\"button\" data-inventory-open>INVENTORY</button><button type=\"button\" data-runtime-leave>LEAVE ROOM</button></div>';",
    'mark runtime-created utility capabilities'
)

new_ensure = r'''function ensureRoomUtility(box){
 if(!box)return;
 let current=$('.dialogue-utility',box);
 if(!current){box.insertAdjacentHTML('afterbegin',roomUtility());return}
 const selection=box.classList.contains('session-select')||!!$('[data-scene],[data-gift]',box);
 const hadSpecial=selection||!!$('[data-vn-ask],[data-vn-gift],[data-dialogue-file-runtime]',current);
 const hadLeave=!!$('[data-vn-leave],[data-runtime-leave]',current);
 if(!current.hasAttribute('data-hv-runtime-actions-allowed'))current.dataset.hvRuntimeActionsAllowed=hadSpecial?'1':'0';
 if(!current.hasAttribute('data-hv-runtime-leave-allowed'))current.dataset.hvRuntimeLeaveAllowed=hadLeave?'1':'0';
 const allowSpecial=current.dataset.hvRuntimeActionsAllowed==='1';
 const allowLeave=current.dataset.hvRuntimeLeaveAllowed==='1';
 current.classList.add('hv-stable-dialogue-utility');
 current.style.display='flex';current.style.gap='14px';current.style.alignItems='center';current.style.justifyContent='flex-end';current.style.flexWrap='wrap';
 for(const gift of $$('[data-vn-gift]',current))gift.remove();
 let log=$('[data-vn-log]',current);if(!log){log=makeButton('LOG',{'data-vn-log':''});current.appendChild(log)}
 let ask=null,action=null,inventory=null;
 if(allowSpecial){
  ask=$('[data-dialogue-file-runtime="QUESTION"]',current)||$('[data-vn-ask]',current);
  if(!ask){ask=makeButton('ASK',{'data-action':'ASK','data-dialogue-file-runtime':'QUESTION'});current.appendChild(ask)}
  ask.removeAttribute('data-vn-ask');ask.dataset.action='ASK';ask.dataset.dialogueFileRuntime='QUESTION';ask.textContent='ASK';
  action=$('[data-dialogue-file-runtime="ACTION"]',current);
  if(!action){action=makeButton('ACTION',{'data-action':'TALK','data-dialogue-file-runtime':'ACTION'});current.appendChild(action)}
  action.dataset.action='TALK';action.dataset.dialogueFileRuntime='ACTION';action.textContent='ACTION';
  inventory=$('[data-inventory-open]',current);if(!inventory){inventory=makeButton('INVENTORY',{'data-inventory-open':''});current.appendChild(inventory)}
  inventory.textContent='INVENTORY';
 }else{
  for(const extra of $$('[data-dialogue-file-runtime],[data-vn-ask],[data-inventory-open]',current))extra.remove();
 }
 let leave=$('[data-runtime-leave]',current)||$('[data-vn-leave]',current);
 if(allowLeave){
  if(!leave){leave=makeButton('LEAVE ROOM',{'data-runtime-leave':''});current.appendChild(leave)}
  leave.removeAttribute('data-vn-leave');leave.dataset.runtimeLeave='1';leave.textContent='LEAVE ROOM';
 }else if(leave){leave.remove();leave=null}
 for(const b of [log,ask,action,inventory,leave])if(b)current.appendChild(b);
 current.dataset.stableUtility=[log&&'LOG',ask&&'ASK',action&&'ACTION',inventory&&'INVENTORY',leave&&'LEAVE ROOM'].filter(Boolean).join('|');
}
function ensureRuntimeReturn'''
text = regex_once(text, r"function ensureRoomUtility\(box\)\{.*?\n\}\nfunction ensureRuntimeReturn", new_ensure, 'preserve core utility capability boundaries', flags=re.S)

text = text.replace('sessionStorage.removeItem(RKEY);', 'forgetMode();')
text = text.replace("up(sessionStorage.getItem(RKEY)||'')", 'runtimeMode()')
text = text.replace('sessionStorage.setItem(RKEY,normalized)', 'rememberMode(normalized)')
text = text.replace('sessionStorage.setItem(RKEY,mode);', 'rememberMode(mode);')
write(path, text)

# dialogue-single-beat-runtime.js
path = 'js/dialogue-single-beat-runtime.js'
text = read(path)
text = text.replace('__HELLAVERSE_SINGLE_BEAT_RUNTIME_V12__', '__HELLAVERSE_SINGLE_BEAT_RUNTIME_V13__')
text = once(
    text,
    "function actualChoices(host){\n const list=choiceList(host);if(!list)return[];\n return $$('[data-choice],[data-gc]',list).filter(b=>!b.disabled&&!b.classList.contains('locked'));\n}\nfunction hasActualChoices(host){return actualChoices(host).length>0}",
    "function choiceButtons(host){\n const list=choiceList(host);if(!list)return[];\n return $$('[data-choice],[data-gc]',list);\n}\nfunction actualChoices(host){return choiceButtons(host).filter(b=>!b.disabled&&!b.classList.contains('locked'))}\nfunction hasChoiceOptions(host){return choiceButtons(host).length>0}",
    'separate visible choice options from enabled choices'
)
text = once(
    text,
    "const choiceSig=actualChoices(host).map(b=>b.dataset.choice||b.dataset.gc||b.textContent).join(',');",
    "const choiceSig=choiceButtons(host).map(b=>`${b.dataset.choice||b.dataset.gc||b.textContent}:${b.disabled?'locked':'open'}`).join(',');",
    'include locked choices in pagination signature'
)
text = text.replace('if(hasActualChoices(host)){', 'if(hasChoiceOptions(host)){')
text = text.replace('if(hasActualChoices(host))showChoices(host);', 'if(hasChoiceOptions(host))showChoices(host);')
write(path, text)

# index cache bust
path = 'index.html'
text = read(path)
text = once(text, 'js/dialogue-runtime-cleanup.js?v=12', 'js/dialogue-runtime-cleanup.js?v=13', 'bump runtime cleanup cache')
text = once(text, 'js/dialogue-single-beat-runtime.js?v=12', 'js/dialogue-single-beat-runtime.js?v=13', 'bump single beat cache')
write(path, text)

# documentation note
path = 'docs/FILE_MAP.md'
text = read(path)
text = once(
    text,
    '- `js/dialogue-runtime-cleanup.js` — QUESTION/ACTION 서브메뉴와 퇴실 navigation bridge 보조.\n',
    '- `js/dialogue-runtime-cleanup.js` — QUESTION/ACTION 서브메뉴와 퇴실 navigation bridge 보조. 코어가 의도적으로 숨긴 특수 액션은 다시 강제 생성하지 않습니다.\n',
    'document runtime capability boundary'
)
text = once(
    text,
    '- `js/dialogue-single-beat-runtime.js` — beat/NEXT 표시, LOG 외부 레이어, 플레이어 선택문 echo 제거.\n',
    '- `js/dialogue-single-beat-runtime.js` — beat/NEXT 표시, LOG 외부 레이어, 플레이어 선택문 echo 제거. 잠금 선택지만 남아도 목록을 표시해 dead-end를 만들지 않습니다.\n',
    'document locked-choice dead-end fix'
)
write(path, text)
