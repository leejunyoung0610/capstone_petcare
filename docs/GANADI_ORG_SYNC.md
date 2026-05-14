# GANADI-Capstone 조직 레포 동기화 가이드

개인 모노레포(`capstone_petcare`)에 푸시한 내용은 조직 저장소에 **자동으로 가지 않습니다**. 아래 URL 각각에 맞는 폴더만 골라 반영해야 합니다.

| 조직 레포 | URL | 이 모노레포에서 대응하는 경로 |
|-----------|-----|------------------------------|
| 프론트 | [GANADI-frontend](https://github.com/GANADI-Capstone/GANADI-frontend) | `frontend/` 루트 내용 → 조직 레포 **루트** |
| 백엔드 | [GANADI-backend](https://github.com/GANADI-Capstone/GANADI-backend) | `backend/` 루트 내용 → 조직 레포 **루트** |
| AI | [GANADI-AI](https://github.com/GANADI-Capstone/GANADI-AI) | `api/` + `models/` (+ 조직 레포에 있는 루트 파일들과 맞추기) |

## 전제

- [GANADI-Capstone](https://github.com/orgs/GANADI-Capstone/repositories) 저장소에 **푸시 권한**이 있어야 합니다.
- 조직 `main`과 히스토리가 많이 다르면 `--force`로 정리해야 할 수 있어, **팀과 합의** 후 진행하는 것이 안전합니다.

## 방법 1: 프론트·백엔드 (`subtree`)

조직 `main`과 모노레포 히스토리가 갈라져 있으면 `git subtree push`만으로는 거절될 수 있습니다. 그때는 **분리 브랜치 후 강제 푸시**(모노레포 내용을 기준으로 조직 레포를 덮어씀)가 필요합니다.

```bash
cd /path/to/capstone_petcare

git remote add ganadi-frontend https://github.com/GANADI-Capstone/GANADI-frontend.git  # 없을 때만
git remote add ganadi-backend https://github.com/GANADI-Capstone/GANADI-backend.git

# 시도 1: 일반 푸시
git subtree push --prefix=frontend ganadi-frontend main
git subtree push --prefix=backend ganadi-backend main

# 거절되면 시도 2: split 후 force (⚠️ 조직 main 이력이 바뀜)
git subtree split -P frontend -b _sync/ganadi-frontend
git push ganadi-frontend _sync/ganadi-frontend:main --force

git subtree split -P backend -b _sync/ganadi-backend
git push ganadi-backend _sync/ganadi-backend:main --force
```

작업 후 로컬 분리 브랜치는 필요 없으면 `git branch -D _sync/ganadi-frontend _sync/ganadi-backend` 로 지워도 됩니다.

## 방법 2: AI 레포 (`GANADI-AI`)

`api/`와 `models/` 두 트리를 한 레포에 넣어야 하므로, 조직 레포를 **임시 클론**한 뒤 rsync로 맞추는 방식이 안전합니다.

모노레포의 `api/` 안에 중복으로 들어 있는 **`api/api/`, `api/models/`** 는 GANADI-AI 구조와 맞지 않으므로 **복사 후 삭제**합니다.

```bash
WORKDIR=/path/to/capstone_petcare/temp_repos/ganadi-ai-sync
git clone https://github.com/GANADI-Capstone/GANADI-AI.git "$WORKDIR"
rsync -a --delete --exclude='.git' /path/to/capstone_petcare/api/ "$WORKDIR/api/"
rsync -a --delete --exclude='.git' /path/to/capstone_petcare/models/ "$WORKDIR/models/"
rm -rf "$WORKDIR/api/api" "$WORKDIR/api/models"
cp /path/to/capstone_petcare/api/requirements.txt "$WORKDIR/requirements.txt"
cp /path/to/capstone_petcare/api/.env.example "$WORKDIR/.env.example"
cd "$WORKDIR"
git add -A && git commit -m "sync: 모노레포 api·models 반영" && git push origin main
rm -rf "$WORKDIR"
```

## 참고

- 개인 원격은 보통 `origin` → 모노레포 한 곳입니다.
- `ganadi-frontend`, `ganadi-backend`, `ganadi-ai` 원격은 **로컬 `.git/config`에만** 저장됩니다. 다른 PC에서는 같은 `git remote add`를 다시 하면 됩니다.
