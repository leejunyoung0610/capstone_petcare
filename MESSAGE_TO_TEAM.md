# 📧 팀원들에게 보낼 메시지

---

## 🎉 PetCare 프로젝트 시작!

안녕하세요, 팀원 여러분!

PetCare 프로젝트 코드를 GitHub에 업로드했습니다. 🚀

### 📍 저장소
https://github.com/leejunyoung0610/capstone_petcare

---

## ⚡ 시작하는 방법

### 1️⃣ 코드 다운로드
```bash
git clone https://github.com/leejunyoung0610/capstone_petcare.git
cd capstone_petcare
```

### 2️⃣ 가이드 문서 확인
프로젝트 폴더에서 아래 파일들을 **반드시** 읽어주세요:

1. **GETTING_STARTED.md** ⭐ (제일 먼저!)
   - 5분 안에 환경 설정하는 방법
   
2. **TEAM_COLLABORATION_GUIDE.md** ⭐⭐ (필수!)
   - Git 사용법 (브랜치, 커밋, PR)
   - 개발 워크플로우
   - 실수하지 않는 방법

3. **SETUP_GUIDE.md**
   - 환경 설정 상세 가이드
   - 트러블슈팅

4. **PROJECT_DOCUMENTATION.md**
   - 프로젝트 전체 설명
   - 완료된 기능, 기술 스택

---

## 📦 필요한 파일들

코드만으로는 실행이 안 됩니다! 아래 파일들이 추가로 필요해요:

### 1. API 키 (필수!)
**ANTHROPIC_API_KEY** - Claude AI API 키
- 저한테 요청해주세요 (개인 메시지로)
- `.env` 파일에 넣어야 합니다

### 2. 모델 파일 (필수!)
- `dog_best.pth` (강아지 모델, ~200MB)
- `cat_best.pth` (고양이 모델, ~200MB)
- 위치: `models/classifier/checkpoints/` 폴더

📥 **다운로드**: [구글 드라이브 링크] 또는 저한테 요청

### 3. 데이터셋 (선택)
- 모델 재훈련할 경우에만 필요
- `eye_data/` 폴더 (~50GB)
- 필요하면 말씀해주세요

---

## 🚀 빠른 체크리스트

- [ ] Git clone 완료
- [ ] GETTING_STARTED.md 읽음
- [ ] TEAM_COLLABORATION_GUIDE.md 읽음
- [ ] Python 3.9+ 설치 확인
- [ ] 가상환경 생성 (`python3 -m venv venv`)
- [ ] 의존성 설치 (`pip install -r requirements.txt`)
- [ ] API 키 받아서 `.env` 파일 생성
- [ ] 모델 파일 다운로드 및 배치
- [ ] DB 초기화 (`cd backend && alembic upgrade head`)
- [ ] 서버 실행 테스트
  - AI 서버: http://localhost:8000/docs
  - 백엔드: http://localhost:8001/docs

---

## 📋 개발 규칙 (중요!)

### ✅ 꼭 지켜주세요
1. **절대 `main` 브랜치에 직접 작업 금지!**
   - 항상 새 브랜치 만들기: `git checkout -b feature/기능명`
   
2. **작업 전에 최신 코드 받기**
   ```bash
   git checkout main
   git pull origin main
   ```

3. **작업 완료 후 Pull Request**
   - GitHub에서 PR 생성
   - 다른 팀원에게 리뷰 요청

4. **의미 있는 커밋 메시지**
   ```bash
   git commit -m "feat: 사용자 프로필 기능 추가"
   git commit -m "fix: 로그인 버그 수정"
   ```

### ❌ 절대 하지 마세요
- `.env` 파일 GitHub에 올리기
- 모델 파일 (`.pth`) GitHub에 올리기
- 데이터셋 (`eye_data/`) GitHub에 올리기
- 의미 없는 커밋 메시지 ("ㅇㅇ", "수정" 등)

---

## 💬 소통 방법

### 질문/도움 요청
1. **TEAM_COLLABORATION_GUIDE.md** 먼저 확인
2. 팀 채팅방에 질문
3. 저한테 직접 연락

### 버그 발견
- GitHub Issues에 등록: https://github.com/leejunyoung0610/capstone_petcare/issues

### 코드 리뷰
- Pull Request에 댓글로 피드백

---

## 🎯 다음 단계

### 1. 환경 설정 완료 (이번 주)
- 위 체크리스트 완료
- 서버 실행 테스트 성공

### 2. Git 워크플로우 연습 (이번 주)
- 테스트 브랜치 만들어보기
- 간단한 수정 후 PR 연습

### 3. 실제 개발 시작 (다음 주부터)
- GitHub Issues에서 작업 확인
- 할당된 기능 개발 시작

---

## 📞 연락처

- **긴급**: [전화번호]
- **일반**: [이메일] 또는 팀 채팅방
- **GitHub**: @leejunyoung0610

---

## 🙋 자주 묻는 질문 (FAQ)

**Q: Python 버전이 맞지 않아요**
A: Python 3.9 이상 필요합니다. `python3 --version` 확인

**Q: 모델 파일이 없다고 나와요**
A: 저한테 구글 드라이브 링크 요청하세요

**Q: 서버가 안 켜져요**
A: SETUP_GUIDE.md의 트러블슈팅 섹션 확인

**Q: Git 사용법을 모르겠어요**
A: TEAM_COLLABORATION_GUIDE.md 정독 + 저한테 질문

**Q: 브랜치를 어떻게 만들어요?**
A: `git checkout -b feature/내기능명`

**Q: Pull Request는 뭔가요?**
A: TEAM_COLLABORATION_GUIDE.md 확인! 자세히 설명되어 있습니다.

---

## 🎊 마무리

프로젝트 시작이 어려울 수 있지만, 가이드 문서를 차근차근 따라하시면 됩니다!

모르는 것은 언제든 물어보세요. 함께 좋은 프로젝트 만들어봅시다! 💪

**화이팅!** 🚀

---

*작성: 이준영*  
*날짜: 2026.03.16*
