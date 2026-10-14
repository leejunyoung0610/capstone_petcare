# 🎉 PetCare 프로젝트 시작하기

안녕하세요! PetCare 프로젝트에 오신 것을 환영합니다.

---

## ⚡ 빠른 시작 (5분)

### 1. 저장소 클론
```bash
git clone https://github.com/leejunyoung0610/capstone_petcare.git
cd capstone_petcare
```

### 2. 환경 설정
```bash
# 가상환경
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### 3. 환경변수 설정
```bash
# .env 파일 생성 (프로젝트 루트)
echo "ANTHROPIC_API_KEY=팀장에게_받은_키" > .env

# backend/.env 파일 생성
cp backend/.env.example backend/.env
```

### 4. 필요 파일 다운로드
- **모델 파일**: `dog_best.pth`, `cat_best.pth` (팀장에게 요청)
- 위치: `models/classifier/checkpoints/`

### 5. DB 초기화 & 서버 실행
```bash
# DB 초기화
cd backend && alembic upgrade head && cd ..

# AI 서버 (터미널 1)
PYTHONPATH=. uvicorn api.main:app --reload --port 8000

# 백엔드 서버 (터미널 2)
cd backend && uvicorn app.main:app --reload --port 8001
```

### 6. 확인
- AI 서버: http://localhost:8000/docs ✅
- 백엔드: http://localhost:8001/docs ✅

---

## 📋 개발 시작하기

### 작업 전 필수!
```bash
# 1. 최신 코드 받기
git checkout main
git pull origin main

# 2. 새 브랜치 만들기
git checkout -b feature/내가-만들-기능
```

### 작업 후
```bash
# 1. 저장
git add .
git commit -m "feat: 내가 만든 기능 설명"

# 2. GitHub에 올리기
git push -u origin feature/내가-만들-기능

# 3. GitHub에서 Pull Request 생성
```

---

## 📚 자세한 가이드

### 필수 문서 (꼭 읽어주세요!)
1. **[TEAM_COLLABORATION_GUIDE.md](TEAM_COLLABORATION_GUIDE.md)** ⭐
   - Git 사용법 (브랜치, 커밋, PR)
   - 개발 워크플로우
   - 자주 발생하는 문제 해결

2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)**
   - 환경 설정 상세 가이드
   - 트러블슈팅

3. **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**
   - 프로젝트 전체 문서
   - 기술 스택, API 문서

### 참고 문서
- `api/CLAUDE_API_GUIDE.md` - Claude API 사용법
- `api/PDF_GENERATION_GUIDE.md` - PDF 생성
- `backend/README.md` - 백엔드 상세

---

## 🚨 주의사항

### ❌ 절대 하지 말 것
1. `main` 브랜치에 직접 푸시
2. `.env` 파일 GitHub에 올리기
3. 모델 파일 (`.pth`) GitHub에 올리기
4. 데이터셋 (`eye_data/`) GitHub에 올리기

### ✅ 반드시 할 것
1. 항상 새 브랜치에서 작업
2. 의미 있는 커밋 메시지
3. 작업 완료 후 Pull Request
4. 팀원 코드 리뷰

---

## 💬 소통 채널

- **GitHub Issues**: 버그 리포트, 기능 제안
- **Pull Requests**: 코드 리뷰
- **팀 채팅방**: 일상 소통, 긴급 문의

---

## 🆘 도움이 필요할 때

1. **TEAM_COLLABORATION_GUIDE.md** 확인
2. 팀 채팅방에 질문
3. 팀장에게 연락

---

## 📦 팀장에게 요청할 것

### 필수
- [ ] ANTHROPIC_API_KEY (Claude API)
- [ ] `dog_best.pth` (강아지 모델)
- [ ] `cat_best.pth` (고양이 모델)

### 선택 (필요시)
- [ ] `eye_data/` 데이터셋 (모델 재훈련 시)
- [ ] AWS 계정 정보 (이미지 업로드 시)

---

## 🎯 첫 작업 추천

### 연습용 작업
1. **문서 수정**: README.md에 내 이름 추가
2. **브랜치 실습**: feature/test-내이름 만들어보기
3. **PR 실습**: Pull Request 생성해보기

### 실제 작업
- GitHub Issues에서 할당된 작업 확인
- 팀장/팀원과 상의 후 시작

---

**환영합니다! 함께 좋은 프로젝트 만들어요! 🚀**

문의사항: [팀장 연락처]
