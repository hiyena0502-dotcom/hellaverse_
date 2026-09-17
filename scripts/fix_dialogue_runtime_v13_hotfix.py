from pathlib import Path

p=Path('js/dialogue-runtime-cleanup.js')
s=p.read_text(encoding='utf-8')
old="const runtimeMode=()=>{try{return runtimeMode()}catch{return''}};"
new="const runtimeMode=()=>{try{return up(sessionStorage.getItem(RKEY)||'')}catch{return''}};"
if s.count(old)!=1:
    raise SystemExit(f'expected one recursive runtimeMode helper, found {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
