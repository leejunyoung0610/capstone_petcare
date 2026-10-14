# 🚀 PetCare 프로젝트 설정 가이드

팀원들을 위한 빠른 시작 가이드입니다.

---

## 📋 사전 요구사항

### 필수 설치
- **Python 3.9+** (3.10 권장)
- **Git**
- **ANTHROPIC_API_KEY** (Claude API, AI 리포트 생성용)

### 권장 사항
- **macOS/Linux**: NanumGothic 폰트 설치 (PDF 한글 지원)
- **GPU**: CUDA 또는 Apple Silicon (MPS) - CPU도 가능하지만 느림

---

## 🔧 초기 설정 (5분)

### 1. 저장소 클론

```bash
git clone https://github.com/leejunyoung0610/capstone_petcare.git
cd capstone_petcare
```

### 2. 가상환경 생성 및 활성화

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate  # macOS/Linux
# 또는
.\venv\Scripts\activate   # Windows
```

### 3. 의존성 설치

```bash
# AI 서버 및 모델 의존성
pip install -r requirements.txt

# 백엔드 서버 의존성
pip install -r backend/requirements.txt
```

**예상 시간**: 2-3분 (네트워크 속도에 따라 다름)

### 4. 환경변수 설정

#### AI 서버 환경변수

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env 파일 생성
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
EOF
```

> ⚠️ **중요**: `ANTHROPIC_API_KEY`를 실제 키로 변경하세요!  
> Claude API 키는 https://console.anthropic.com 에서 발급받을 수 있습니다.

#### 백엔드 환경변수

`backend/.env` 파일 생성:

```bash
cat > backend/.env << 'EOF'
DATABASE_URL=sqlite:///./petcare.db
SECRET_KEY=your-secret-key-change-in-production-use-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AI_SERVER_URL=http://localhost:8000
CORS_ORIGINS=["http://localhost:3000","http://localhost:8001"]
EOF
```

> 📝 **참고**: 
> - `SECRET_KEY`는 프로덕션에서 랜덤 문자열로 변경하세요
> - SQLite는 개발용이므로, 프로덕션은 MySQL 사용 권장

### 5. 데이터베이스 초기화

```bash
cd backend
alembic upgrade head
cd ..
```

---

## ▶️ 서버 실행

### 터미널 1: AI 서버

```bash
cd ~/capstone_petcare
source venv/bin/activate
PYTHONPATH=. uvicorn api.main:app --reload --port 8000
```

**확인**: http://localhost:8000/docs (Swagger UI)

### 터미널 2: 백엔드 서버

```bash
cd ~/capstone_petcare/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

**확인**: http://localhost:8001/docs (Swagger UI)

---

## 🧪 빠른 테스트

### 1. AI 서버 테스트

```bash
# 헬스체크
curl http://localhost:8000/health

# 이미지 분석 (샘플 이미지 필요)
curl -X POST "http://localhost:8000/api/ai/analyze" \
  -F "file=@sample_image.jpg" \
  -F "animal_type=dog"
```

### 2. 백엔드 서버 테스트

```bash
# 헬스체크
curl http://localhost:8001/health

# 회원가입
curl -X POST "http://localhost:8001/api/auth/user/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234",
    "name": "테스트",
    "phone": "01012345678"
  }'

# 로그인
curl -X POST "http://localhost:8001/api/auth/user/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }'
```

---

## 📁 프로젝트 구조

```
capstone_petcare/
├── api/                    # AI 서버
│   ├── main.py            # FastAPI 앱
│   └── test_client.py     # 테스트 클라이언트
├── backend/               # 백엔드 서버
│   ├── app/
│   │   ├── main.py       # FastAPI 앱
│   │   ├── models/       # DB 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   └── routers/      # API 라우터
│   └── alembic/          # DB 마이그레이션
├── models/
│   └── classifier/       # AI 모델 코드
│       ├── train.py      # 훈련 스크립트
│       ├── model.py      # 모델 정의
│       └── checkpoints/  # 모델 체크포인트 (Git 제외)
├── requirements.txt      # AI 서버 의존성
├── backend/requirements.txt  # 백엔드 의존성
├── .env                  # AI 서버 환경변수 (Git 제외)
└── backend/.env          # 백엔드 환경변수 (Git 제외)
```

---

## ⚠️ 자주 발생하는 문제

### 1. 모델 파일이 없음

**증상**: `FileNotFoundError: models/classifier/checkpoints/dog_best.pth`

**해결**:
- 모델 파일은 용량이 커서 Git에 포함되지 않습니다
- 팀 공유 드라이브에서 다운로드하거나
- 직접 훈련: `python models/classifier/train.py`

```bash
# 모델 파일 다운로드 (팀 공유 링크)
mkdir -p models/classifier/checkpoints
# dog_best.pth와 cat_best.pth를 checkpoints/ 폴더에 넣기
```

### 2. 데이터셋 없음

**증상**: `eye_data/` 폴더가 없음

**해결**:
- 데이터셋은 `.gitignore`에 포함되어 Git에서 제외됩니다
- AI-Hub에서 "153.반려동물_안구질환_데이터" 다운로드
- 또는 팀 공유 드라이브에서 받기

```bash
# 데이터셋 다운로드 후
# eye_data/ 폴더를 프로젝트 루트에 배치
```

### 3. 한글 폰트 오류 (PDF)

**증상**: PDF 생성 시 한글이 깨짐

**해결 (macOS)**:
```bash
# NanumGothic 설치
cd ~/Library/Fonts
curl -O https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Regular.ttf
```

**해결 (Linux)**:
```bash
sudo apt-get install fonts-nanum
```

**해결 (Windows)**:
- NanumGothic.ttf 다운로드 후 설치

### 4. ANTHROPIC_API_KEY 오류

**증상**: Claude API 호출 실패

**해결**:
1. `.env` 파일이 존재하는지 확인
2. `ANTHROPIC_API_KEY`가 올바른지 확인
3. API 키 유효성 확인: https://console.anthropic.com

### 5. 포트 이미 사용 중

**증상**: `Address already in use`

**해결**:
```bash
# 프로세스 찾기
lsof -ti:8000  # AI 서버
lsof -ti:8001  # 백엔드 서버

# 프로세스 종료
kill -9 $(lsof -ti:8000)
kill -9 $(lsof -ti:8001)
```

### 6. bcrypt 오류

**증상**: `ValueError: password cannot be longer than 72 bytes`

**해결**:
```bash
pip install 'bcrypt==4.0.1'
```

---

## 🔍 디버깅 팁

### 로그 확인

**AI 서버**:
- 터미널 출력 확인
- 모델 로딩 상태, 추론 시간 등

**백엔드 서버**:
- 터미널 출력 확인
- DB 쿼리, JWT 검증 등

### API 문서 활용

- AI 서버: http://localhost:8000/docs
- 백엔드 서버: http://localhost:8001/docs
- Swagger UI에서 직접 테스트 가능

### 데이터베이스 확인

```bash
# SQLite DB 열기
sqlite3 backend/petcare.db

# 테이블 목록
.tables

# 사용자 조회
SELECT * FROM users;

# 종료
.quit
```

---

## 📞 도움이 필요할 때

1. **에러 메시지 확인**: 터미널 출력을 자세히 읽기
2. **API 문서 참고**: `/docs` 엔드포인트 활용
3. **팀원에게 문의**: [팀 채팅방 링크]
4. **이슈 등록**: GitHub Issues 활용

---

## 📚 추가 문서

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**: 전체 프로젝트 문서
- **[api/CLAUDE_API_GUIDE.md](api/CLAUDE_API_GUIDE.md)**: Claude API 가이드
- **[api/PDF_GENERATION_GUIDE.md](api/PDF_GENERATION_GUIDE.md)**: PDF 생성 가이드
- **[api/KOREAN_FONT_SETUP.md](api/KOREAN_FONT_SETUP.md)**: 한글 폰트 설정
- **[backend/README.md](backend/README.md)**: 백엔드 상세 문서

---

**마지막 업데이트**: 2026.03.16  
**버전**: 1.0.0
