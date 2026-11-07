#!/usr/bin/env bash
# Commit staged changes and push with rebase retries. JSON ledgers that conflict are union-merged (arrays concatenated,
# objects merged) instead of failing the job — long renders otherwise lose the race against the 4x/day publisher.
set -e
MSG="${1:-update}"
git config user.name dankoff-hub; git config user.email 345066702+dankoff-hub@users.noreply.github.com
git commit -qm "$MSG" || { echo "nothing to commit"; exit 0; }
for i in 1 2 3 4 5; do
  git fetch -q origin main
  if git rebase origin/main; then :; else
    for f in $(git diff --name-only --diff-filter=U); do
      case "$f" in *.json)
        node -e '
          const fs=require("fs"),f=process.argv[1],src=fs.readFileSync(f,"utf8");
          const ours=JSON.parse(src.replace(/<<<<<<<[^\n]*\n([\s\S]*?)=======\n[\s\S]*?>>>>>>>[^\n]*\n?/g,"$1"));
          const theirs=JSON.parse(src.replace(/<<<<<<<[^\n]*\n[\s\S]*?=======\n([\s\S]*?)>>>>>>>[^\n]*\n?/g,"$1"));
          const merge=(a,b)=>Array.isArray(a)&&Array.isArray(b)?[...a,...b.filter(x=>!a.some(y=>JSON.stringify(y)===JSON.stringify(x)))]:(a&&b&&typeof a==="object"&&typeof b==="object")?Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].map(k=>[k,k in a&&k in b?merge(a[k],b[k]):(k in b?b[k]:a[k])])):b;
          fs.writeFileSync(f,JSON.stringify(merge(ours,theirs),null,1));' "$f" || git checkout --theirs "$f"
        git add "$f";;
      *) git checkout --theirs "$f"; git add "$f";;
      esac
    done
    GIT_EDITOR=true git rebase --continue || { git rebase --abort; sleep $((i*7)); continue; }
  fi
  git push -q origin HEAD:main && exit 0
  sleep $((i*5))
done
echo "push failed after retries"; exit 1
