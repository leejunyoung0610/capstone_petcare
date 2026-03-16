# 👥 팀 협업 가이드

팀원들을 위한 Git 협업 및 개발 워크플로우 가이드입니다.

---

## 🚀 처음 시작하기 (팀원용)

### 1️⃣ 프로젝트 클론

```bash
# 저장소 클론
git clone https://github.com/leejunyoung0610/capstone_petcare.git
cd capstone_petcare
```

### 2️⃣ 개발 환경 설정

```bash
# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
.\venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### 3️⃣ 환경변수 설정

#### AI 서버 환경변수 (`.env`)

프로젝트 루트에 `.env` 파일 생성:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

> ⚠️ **팀장에게 API 키 요청**: Claude API 키를 팀장에게 받아서 입력하세요.

#### 백엔드 환경변수 (`backend/.env`)

```bash
DATABASE_URL=sqlite:///./petcare.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AI_SERVER_URL=http://localhost:8000
CORS_ORIGINS=["http://localhost:3000","http://localhost:8001"]
```

### 4️⃣ 모델 파일 다운로드

> 💡 **팀장에게 요청**: `dog_best.pth`, `cat_best.pth` 파일을 받아서 아래 경로에 넣으세요.

```bash
models/classifier/checkpoints/
├── dog_best.pth
└── cat_best.pth
```

### 5️⃣ 데이터베이스 초기화

```bash
cd backend
alembic upgrade head
cd ..
```

### 6️⃣ 서버 실행 테스트

**터미널 1 - AI 서버**:
```bash
source venv/bin/activate
PYTHONPATH=. uvicorn api.main:app --reload --port 8000
```

**터미널 2 - 백엔드 서버**:
```bash
source venv/bin/activate
cd backend
uvicorn app.main:app --reload --port 8001
```

**확인**:
- AI 서버: http://localhost:8000/docs
- 백엔드 서버: http://localhost:8001/docs

---

## 📝 개발 워크플로우

### 기본 원칙

1. ✅ **절대 `main` 브랜치에 직접 작업하지 않기**
2. ✅ **항상 새로운 브랜치를 만들어서 작업**
3. ✅ **작업 완료 후 Pull Request 생성**
4. ✅ **팀원 리뷰 후 merge**

---

## 🌿 브랜치 전략

### 브랜치 네이밍 규칙

```
feature/기능명       # 새로운 기능 개발
fix/버그명          # 버그 수정
docs/문서명         # 문서 수정
refactor/내용      # 리팩토링
test/테스트명      # 테스트 추가
```

**예시**:
- `feature/user-profile` - 사용자 프로필 기능
- `feature/image-upload` - 이미지 업로드 기능
- `fix/jwt-token-error` - JWT 토큰 에러 수정
- `docs/api-documentation` - API 문서 작성

---

## 💻 작업 시작하기

### Step 1: 최신 코드 받아오기

```bash
# main 브랜치로 이동
git checkout main

# 최신 코드 가져오기
git pull origin main
```

### Step 2: 새로운 브랜치 만들기

```bash
# 새 브랜치 생성 및 이동
git checkout -b feature/your-feature-name

# 예시
git checkout -b feature/user-profile
```

### Step 3: 작업하기

```bash
# 코드 작성...
# 파일 수정...

# 변경사항 확인
git status
```

---

## 💾 변경사항 저장하기

### Step 1: 변경사항 확인

```bash
# 어떤 파일이 변경되었는지 확인
git status

# 변경 내용 자세히 보기
git diff
```

### Step 2: 파일 추가 (Staging)

```bash
# 특정 파일만 추가
git add api/main.py
git add backend/app/routers/pets.py

# 또는 모든 변경사항 추가
git add .

# 추가된 파일 확인
git status
```

### Step 3: 커밋하기

```bash
# 커밋 메시지와 함께 저장
git commit -m "feat: 사용자 프로필 페이지 추가"

# 또는 더 자세한 메시지
git commit -m "feat: 사용자 프로필 페이지 추가

- 프로필 조회 API 구현
- 프로필 수정 기능 추가
- 프로필 이미지 업로드 기능 추가"
```

#### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드, 설정 파일 수정
```

**좋은 예시**:
```bash
git commit -m "feat: 반려동물 이미지 업로드 API 추가"
git commit -m "fix: JWT 토큰 만료 시간 오류 수정"
git commit -m "docs: API 문서에 인증 방법 추가"
```

**나쁜 예시**:
```bash
git commit -m "수정"
git commit -m "asdf"
git commit -m "작업중"
```

---

## ☁️ GitHub에 올리기

### Step 1: 브랜치 푸시

```bash
# 처음 푸시할 때
git push -u origin feature/your-feature-name

# 이후부터는
git push
```

### Step 2: Pull Request 만들기

1. **GitHub 웹사이트 접속**: https://github.com/leejunyoung0610/capstone_petcare

2. **"Compare & pull request" 버튼 클릭**

3. **PR 작성**:
   ```
   제목: [기능] 사용자 프로필 페이지 추가
   
   ## 변경사항
   - 사용자 프로필 조회 API 추가
   - 프로필 수정 기능 구현
   - 프로필 이미지 업로드 기능 추가
   
   ## 테스트 방법
   1. 서버 실행
   2. POST /api/users/profile 호출
   3. 프로필 정보 확인
   
   ## 스크린샷
   (필요한 경우 추가)
   ```

4. **Reviewers 지정**: 팀원 지정

5. **"Create pull request" 클릭**

### Step 3: 코드 리뷰 반영

```bash
# 리뷰 의견 반영 후 추가 커밋
git add .
git commit -m "refactor: 리뷰 의견 반영 - 에러 핸들링 추가"
git push

# PR에 자동으로 반영됨
```

### Step 4: Merge

- 팀장 또는 다른 팀원이 승인하면 **"Merge pull request"** 클릭
- 브랜치 삭제: **"Delete branch"** 클릭

---

## 🔄 다른 팀원의 변경사항 가져오기

### 방법 1: main 브랜치 업데이트

```bash
# main 브랜치로 이동
git checkout main

# 최신 코드 가져오기
git pull origin main
```

### 방법 2: 작업 중인 브랜치에 최신 코드 반영

```bash
# 현재 브랜치에서
git checkout feature/your-feature

# main의 최신 코드 가져오기
git pull origin main

# 또는
git fetch origin
git merge origin/main
```

### 충돌 해결

충돌이 발생하면:

```bash
# 충돌 파일 확인
git status

# 충돌 파일 열어서 수동으로 수정
# (<<<<<<, =======, >>>>>>> 표시 제거)

# 수정 후
git add .
git commit -m "merge: main 브랜치 병합 및 충돌 해결"
git push
```

---

## 📋 일일 작업 체크리스트

### 작업 시작 전
- [ ] `git checkout main`
- [ ] `git pull origin main`
- [ ] `git checkout -b feature/new-feature`

### 작업 중
- [ ] 주기적으로 커밋 (`git commit`)
- [ ] 의미 있는 단위로 나눠서 커밋

### 작업 완료 후
- [ ] `git status`로 변경사항 확인
- [ ] `git add .`
- [ ] `git commit -m "적절한 메시지"`
- [ ] `git push -u origin feature/new-feature`
- [ ] GitHub에서 Pull Request 생성
- [ ] 팀원에게 리뷰 요청

### 리뷰 완료 후
- [ ] Merge
- [ ] 로컬에서 main 업데이트
- [ ] 작업 완료된 브랜치 삭제

---

## 🎯 실전 시나리오

### 시나리오 1: 새로운 API 추가

```bash
# 1. 최신 코드 받기
git checkout main
git pull origin main

# 2. 새 브랜치 생성
git checkout -b feature/diagnosis-report-api

# 3. 코드 작성
# backend/app/routers/diagnosis.py 수정...

# 4. 변경사항 확인
git status
git diff backend/app/routers/diagnosis.py

# 5. 커밋
git add backend/app/routers/diagnosis.py
git commit -m "feat: 진단 리포트 다운로드 API 추가"

# 6. 푸시
git push -u origin feature/diagnosis-report-api

# 7. GitHub에서 PR 생성
```

### 시나리오 2: 버그 수정

```bash
# 1. 버그 발견 이슈 확인
# GitHub Issues에서 #42 "JWT 토큰 만료 오류"

# 2. 브랜치 생성
git checkout main
git pull origin main
git checkout -b fix/jwt-token-expiry

# 3. 버그 수정
# backend/app/core/security.py 수정...

# 4. 테스트
# 서버 실행해서 확인

# 5. 커밋 및 푸시
git add backend/app/core/security.py
git commit -m "fix: JWT 토큰 만료 시간 설정 오류 수정

- ACCESS_TOKEN_EXPIRE_MINUTES 적용 안 되던 문제 해결
- 테스트 완료: 30분 후 정상적으로 만료됨
Fixes #42"

git push -u origin fix/jwt-token-expiry

# 6. PR 생성 및 이슈 링크
```

### 시나리오 3: 문서 업데이트

```bash
git checkout main
git pull origin main
git checkout -b docs/update-api-guide

# README.md 수정...

git add README.md
git commit -m "docs: API 인증 가이드 업데이트"
git push -u origin docs/update-api-guide

# PR 생성
```

---

## ⚠️ 주의사항

### ❌ 하지 말아야 할 것

1. **main 브랜치에 직접 푸시**
   ```bash
   # 절대 하지 마세요!
   git checkout main
   git add .
   git commit -m "작업"
   git push origin main
   ```

2. **너무 큰 커밋**
   - 한 번에 너무 많은 파일 변경 ❌
   - 기능별로 나눠서 커밋 ✅

3. **의미 없는 커밋 메시지**
   ```bash
   git commit -m "ㅇㅇ"  # ❌
   git commit -m "수정"  # ❌
   git commit -m "feat: 사용자 로그인 API 추가"  # ✅
   ```

4. **`.env` 파일 커밋**
   - `.gitignore`에 포함되어 있으므로 자동 제외
   - 절대 GitHub에 올리면 안 됨!

### ✅ 좋은 습관

1. **자주 커밋하기**
   - 작은 단위로 자주 저장
   - 나중에 되돌리기 쉬움

2. **명확한 커밋 메시지**
   - 무엇을 왜 변경했는지 명확히

3. **정기적으로 main과 동기화**
   ```bash
   git checkout feature/your-feature
   git pull origin main
   ```

4. **Push 전에 테스트**
   - 서버 실행해서 에러 없는지 확인
   - 기능 정상 작동 확인

---

## 🆘 자주 발생하는 문제

### 문제 1: "브랜치가 뒤처져 있습니다"

```bash
# 해결법
git pull origin main
```

### 문제 2: "변경사항이 커밋되지 않았습니다"

```bash
# 확인
git status

# 커밋 또는 임시 저장
git add .
git commit -m "작업 중"

# 또는
git stash  # 임시 저장
git checkout main
git stash pop  # 다시 가져오기
```

### 문제 3: "파일 충돌 발생"

```bash
# 충돌 파일 확인
git status

# 파일 열어서 수정
# <<<<<<< HEAD
# 내 변경사항
# =======
# 다른 사람 변경사항
# >>>>>>> origin/main

# 충돌 해결 후
git add .
git commit -m "merge: 충돌 해결"
```

### 문제 4: "실수로 main에 커밋했어요!"

```bash
# 아직 푸시 안 했다면
git reset HEAD~1  # 마지막 커밋 취소
git checkout -b feature/correct-branch
git add .
git commit -m "올바른 커밋 메시지"
```

### 문제 5: "로컬과 원격이 달라요"

```bash
# 강제로 원격과 동기화 (주의!)
git fetch origin
git reset --hard origin/main

# 또는 안전하게
git fetch origin
git merge origin/main
```

---

## 📞 도움 요청하기

### 막혔을 때

1. **에러 메시지 캡처**: 스크린샷 또는 텍스트 복사
2. **상황 설명**: 무엇을 하려고 했는지
3. **팀 채팅방에 질문**: 팀원들에게 도움 요청
4. **GitHub Issues 생성**: 버그나 문제 보고

### 리뷰 요청할 때

- PR 설명을 자세히 작성
- 테스트 방법 명시
- 스크린샷 첨부 (UI 변경 시)

---

## 🎓 Git 명령어 치트시트

### 기본 명령어

```bash
git status              # 현재 상태 확인
git log                 # 커밋 히스토리
git log --oneline       # 커밋 히스토리 (간단)
git diff                # 변경사항 확인
git branch              # 브랜치 목록
git branch -a           # 모든 브랜치 (원격 포함)
```

### 브랜치 관리

```bash
git checkout main              # main 브랜치로 이동
git checkout -b feature/new    # 새 브랜치 생성 및 이동
git branch -d feature/old      # 브랜치 삭제 (로컬)
git push origin --delete old   # 브랜치 삭제 (원격)
```

### 되돌리기

```bash
git checkout -- file.py    # 파일 변경사항 취소
git reset HEAD file.py     # Staging 취소
git reset HEAD~1           # 마지막 커밋 취소 (변경사항 유지)
git reset --hard HEAD~1    # 마지막 커밋 취소 (변경사항 삭제)
```

### 임시 저장

```bash
git stash               # 변경사항 임시 저장
git stash list          # 저장 목록
git stash pop           # 가장 최근 저장 복원
git stash drop          # 저장 삭제
```

---

## 📚 추가 학습 자료

- **Git 공식 문서**: https://git-scm.com/doc
- **GitHub 가이드**: https://guides.github.com/
- **Git 브랜치 시각화**: https://learngitbranching.js.org/

---

**작성자**: 이준영  
**마지막 업데이트**: 2026.03.16  
**버전**: 1.0.0
