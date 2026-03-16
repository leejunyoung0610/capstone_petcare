# 🐾 반려동물 안구 질환 AI 진단 시스템

**프로젝트명**: PetCare - AI 기반 반려동물 안구 질환 스크리닝 서비스  
**개발 기간**: 2026.01 ~ 2026.03  
**상태**: Backend & AI 서버 완료 (2026.03.16)

---

## 📑 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [완료된 기능](#완료된-기능)
4. [기술 스택](#기술-스택)
5. [설치 및 실행](#설치-및-실행)
6. [API 문서](#api-문서)
7. [테스트 결과](#테스트-결과)
8. [향후 계획](#향후-계획)

---

## 🎯 프로젝트 개요

### 목적
반려동물 보호자가 스마트폰으로 촬영한 반려동물의 안구 이미지를 AI로 분석하여 안구 질환을 조기 발견하고, 수의사 방문 긴급도를 판단하는 서비스

### 주요 특징
- ✅ **멀티태스크 AI 모델**: 10개 질환 동시 분석 (강아지), 5개 질환 (고양이)
- ✅ **Claude AI 소견서**: 자연어로 이해하기 쉬운 AI 리포트 자동 생성
- ✅ **PDF 다운로드**: 병원 방문 시 활용 가능한 전문 리포트
- ✅ **의료법 준수**: "진단" 표현 회피, "AI 스크리닝 소견" 사용
- ✅ **진단 이력 관리**: 반려동물별 안구 건강 추적

### 분석 가능 질환

**강아지 (10개)**
- 결막염, 궤양성각막질환, 백내장, 비궤양성각막질환
- 색소침착성각막염, 안검내반증, 안검염, 안검종양, 유루증, 핵경화

**고양이 (5개)**
- 결막염, 각막부골편, 각막궤양, 비궤양성각막염, 안검염

---

## 🏗️ 시스템 아키텍처

```
┌─────────────┐
│   사용자    │
│  (브라우저)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Backend API Server              │
│            (port 8001)                  │
│  ┌───────────────────────────────────┐ │
│  │ • 사용자 인증 (JWT)                │ │
│  │ • 반려동물 관리                    │ │
│  │ • 진단 이력 관리                   │ │
│  └───────────────────────────────────┘ │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│          AI Server (port 8000)          │
│  ┌───────────────────────────────────┐ │
│  │ EfficientNet-B3 멀티태스크 모델   │ │
│  │ • Dog Model (10 diseases)         │ │
│  │ • Cat Model (5 diseases)          │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Claude API (Sonnet 4)             │ │
│  │ • AI 스크리닝 소견서 생성          │ │
│  │ • 수의사 방문 긴급도 판단          │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ ReportLab PDF Generator           │ │
│  │ • 한글 폰트 지원                   │ │
│  │ • 전문 리포트 레이아웃             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│         Database (SQLite)               │
│  • users (사용자)                        │
│  • vets (수의사)                         │
│  • pets (반려동물)                       │
│  • diagnosis_results (진단 결과)        │
└─────────────────────────────────────────┘
```

---

## ✅ 완료된 기능

### 1. AI 모델 개발

#### 1.1 데이터 전처리
- **데이터셋**: 153.반려동물_안구질환_데이터
  - Training: 강아지 176,804장, 고양이 22,294장
  - Validation: 별도 분리
- **전처리**:
  - 한글 파일명 NFD/NFC 정규화
  - Bounding Box 검증 (w>0.95, h>0.95 제외)
  - 클래스별 균등 샘플링 (dog: 3000, cat: 1000)
- **데이터 증강** (Albumentations):
  ```python
  - RandomRotate90
  - HorizontalFlip
  - ColorJitter (brightness, contrast, saturation)
  - GaussNoise
  - Resize to 224x224
  ```

#### 1.2 모델 아키텍처
- **백본**: EfficientNet-B3 (pretrained on ImageNet)
- **멀티태스크 학습**:
  - 공유 백본 (feature extraction)
  - 질환별 독립 헤드 (classification)
- **훈련 설정**:
  ```python
  - Optimizer: AdamW (lr=1e-4, weight_decay=1e-4)
  - Scheduler: CosineAnnealingLR
  - Loss: CrossEntropyLoss (per disease)
  - Early Stopping: patience=5
  - Device: MPS (Apple Silicon) / CUDA / CPU
  ```

#### 1.3 모델 성능
- **강아지 모델**: `models/classifier/checkpoints/dog_best.pth`
  - 10개 질환 동시 분류
  - 이진분류 정확도 (유/무): 평균 85%+
- **고양이 모델**: `models/classifier/checkpoints/cat_best.pth`
  - 5개 질환 동시 분류
  - 백본 freeze → full fine-tuning 전략

#### 1.4 모델 해석성 (GradCAM)
- **시각화**: `models/classifier/gradcam.py`
- 질환별 히트맵 생성
- Target Layer: `model.backbone.blocks[-1][-1]`

---

### 2. AI 서버 (FastAPI)

#### 2.1 엔드포인트

**`POST /api/ai/analyze`** - 이미지 분석
```bash
curl -X POST "http://localhost:8000/api/ai/analyze" \
  -F "file=@image.jpg" \
  -F "animal_type=dog"
```

**Response:**
```json
{
  "predictions": {
    "결막염": {"label": "유", "confidence": 87.3},
    "백내장": {"label": "무", "confidence": 95.2},
    ...
  },
  "main_disease": "결막염",
  "main_confidence": 87.3,
  "is_normal": false
}
```

**`POST /api/ai/report`** - Claude AI 소견서 생성
```bash
curl -X POST "http://localhost:8000/api/ai/report" \
  -H "Content-Type: application/json" \
  -d '{
    "animal_type": "dog",
    "pet_name": "몽이",
    "predictions": {...}
  }'
```

**Response:**
```json
{
  "summary": "몽이의 AI 스크리닝 소견상 결막염이 검출되었습니다...",
  "disease_analysis": {
    "결막염": "높은 확신도로 결막염 소견이 발견되었습니다..."
  },
  "visit_urgency": "1주 이내",
  "vet_required": true,
  "precautions": [
    "눈을 비비지 않도록 엘리자베스 칼라 착용",
    "생리식염수로 눈 주변 청결 유지",
    "증상 악화 시 즉시 병원 내원"
  ]
}
```

**`POST /api/ai/pdf`** - PDF 리포트 생성
```bash
curl -X POST "http://localhost:8000/api/ai/pdf" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_name": "몽이",
    "animal_type": "dog",
    "predictions": {...},
    "report": {...}
  }' --output report.pdf
```

#### 2.2 주요 기능
- **모델 캐싱**: 서버 시작 시 dog/cat 모델 사전 로드
- **디바이스 자동 선택**: MPS → CUDA → CPU
- **한글 폰트 지원**:
  - AppleGothic (macOS)
  - NanumGothic (설치 권장)
  - URL 인코딩으로 한글 파일명 처리
- **에러 핸들링**: 상세한 에러 메시지 및 로깅

#### 2.3 Claude API 설정
- **모델**: claude-sonnet-4-20250514
- **Max Tokens**: 2000
- **Temperature**: 0.7
- **의료법 준수**: "진단" 표현 금지, "AI 스크리닝 소견" 사용

---

### 3. 백엔드 서버 (FastAPI)

#### 3.1 인증 시스템 (JWT)

**사용자 회원가입**
```bash
POST /api/auth/user/register
{
  "email": "user@test.com",
  "password": "test1234",
  "name": "테스트사용자",
  "phone": "01012345678"
}
```

**로그인**
```bash
POST /api/auth/user/login
{
  "email": "user@test.com",
  "password": "test1234"
}
→ JWT 토큰 발급
```

**수의사 계정**
- 별도 엔드포인트 (`/api/auth/vet/*`)
- 병원명 추가 필드

#### 3.2 반려동물 관리

**등록**
```bash
POST /api/pets
Authorization: Bearer <token>
{
  "name": "몽이",
  "species": "dog",
  "breed": "포메라니안",
  "age": 3,
  "gender": "male"
}
```

**조회/수정/삭제**
- `GET /api/pets` - 내 반려동물 목록
- `GET /api/pets/{pet_id}` - 상세 조회
- `PUT /api/pets/{pet_id}` - 정보 수정
- `DELETE /api/pets/{pet_id}` - 삭제

#### 3.3 AI 진단 통합

**분석 요청**
```bash
POST /api/diagnosis/analyze?pet_id=1
Authorization: Bearer <token>
Content-Type: multipart/form-data
- image: (binary)
```

**플로우**:
1. 반려동물 소유자 확인
2. AI 서버로 이미지 + animal_type 전송
3. 결과 데이터베이스 저장
4. JSON 응답 반환

**진단 이력**
- `GET /api/diagnosis/history/{pet_id}` - 반려동물별 이력
- `GET /api/diagnosis/{diagnosis_id}` - 상세 조회

#### 3.4 데이터베이스 스키마

**users**
```sql
- id (PK)
- email (unique)
- password_hash
- name
- phone
- kakao_id (nullable)
- created_at, updated_at
```

**pets**
```sql
- id (PK)
- owner_id (FK → users.id)
- name
- species (dog/cat)
- breed, age, gender
- profile_image_url
- created_at, updated_at
```

**diagnosis_results**
```sql
- id (PK)
- pet_id (FK → pets.id)
- image_url
- animal_type
- predictions (JSON)
- main_disease
- main_confidence
- is_normal
- report_pdf_url
- created_at
```

---

## 🛠️ 기술 스택

### AI & ML
- **PyTorch** 2.0+ (MPS 지원)
- **timm** (EfficientNet-B3)
- **Albumentations** (데이터 증강)
- **grad-cam** (GradCAM 시각화)

### Backend
- **FastAPI** 0.109.0
- **SQLAlchemy** 2.0.25 (ORM)
- **Alembic** (마이그레이션)
- **python-jose** (JWT)
- **passlib[bcrypt]** (비밀번호 해싱)

### AI Integration
- **Anthropic Claude** Sonnet 4
- **ReportLab** (PDF 생성)
- **httpx** (비동기 HTTP)

### Database
- **SQLite** (개발 환경)
- **MySQL** 8.0 (프로덕션 준비)

### Dev Tools
- **uvicorn** (ASGI 서버)
- **python-dotenv** (환경변수)
- **tqdm** (진행률 표시)

---

## 🚀 설치 및 실행

### 1. 환경 설정

```bash
# 저장소 클론
cd ~/capstone_petcare

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경변수 설정

**AI 서버** (`.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**백엔드 서버** (`backend/.env`)
```bash
DATABASE_URL=sqlite:///./petcare.db
SECRET_KEY=your-secret-key-change-in-production
AI_SERVER_URL=http://localhost:8000
```

### 3. 데이터베이스 초기화

```bash
cd backend
alembic upgrade head
```

### 4. 서버 실행

**AI 서버**
```bash
cd ~/capstone_petcare
source venv/bin/activate
PYTHONPATH=. uvicorn api.main:app --reload --port 8000
```

**백엔드 서버**
```bash
cd ~/capstone_petcare/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

### 5. API 문서 확인

- AI 서버: http://localhost:8000/docs
- 백엔드 서버: http://localhost:8001/docs

---

## 📖 API 문서

### AI 서버 (port 8000)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/analyze` | 이미지 분석 |
| POST | `/api/ai/report` | Claude 리포트 생성 |
| POST | `/api/ai/pdf` | PDF 다운로드 |
| GET | `/health` | 헬스체크 |

### 백엔드 서버 (port 8001)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/auth/user/register` | 사용자 회원가입 | ❌ |
| POST | `/api/auth/user/login` | 사용자 로그인 | ❌ |
| POST | `/api/auth/vet/register` | 수의사 회원가입 | ❌ |
| POST | `/api/auth/vet/login` | 수의사 로그인 | ❌ |
| GET | `/api/pets` | 내 반려동물 목록 | ✅ |
| POST | `/api/pets` | 반려동물 등록 | ✅ |
| GET | `/api/pets/{pet_id}` | 반려동물 상세 | ✅ |
| PUT | `/api/pets/{pet_id}` | 반려동물 수정 | ✅ |
| DELETE | `/api/pets/{pet_id}` | 반려동물 삭제 | ✅ |
| POST | `/api/diagnosis/analyze` | AI 분석 요청 | ✅ |
| GET | `/api/diagnosis/history/{pet_id}` | 진단 이력 | ✅ |
| GET | `/api/diagnosis/{diagnosis_id}` | 진단 상세 | ✅ |
| GET | `/health` | 헬스체크 | ❌ |

---

## ✅ 테스트 결과

### 전체 플로우 테스트 (2026.03.16)

**시나리오**: 회원가입 → 로그인 → 반려동물 등록 → AI 분석 → 이력 조회

1. ✅ **회원가입**: user@test.com 생성 성공
2. ✅ **로그인**: JWT 토큰 발급 성공
3. ✅ **반려동물 등록**: 몽이 (포메라니안, 3세) 등록 성공
4. ✅ **AI 분석**: 
   - 이미지 업로드 성공
   - AI 서버 분석 완료 (10초)
   - 결과 DB 저장 성공
5. ✅ **진단 이력 조회**: 몽이의 진단 기록 조회 성공

**샘플 분석 결과**:
- **주요 질환**: 핵경화 (100% 확신도)
- **기타 검출**: 결막염, 색소침착성각막염, 안검염, 안검내반증, 안검종양, 유루증
- **상태**: 이상 소견 (is_normal: false)

### Claude API 테스트

**입력**:
- 반려동물: 몽이 (dog)
- 결막염: 유 (100%)
- 안검염: 유 (87.3%)

**출력**:
```
✅ 종합 소견: 명확하고 이해하기 쉬운 한글 소견
✅ 질환별 분석: 각 질환의 위험도 평가
✅ 수의사 방문: "1주 이내" (정확한 긴급도 판단)
✅ 보호자 주의사항: 3가지 구체적 조언
✅ 의료법 준수: "진단" 표현 없음
```

### PDF 생성 테스트

**결과**:
- ✅ 파일 크기: 55KB
- ✅ 한글 표시: 정상 (AppleGothic 폰트)
- ✅ 레이아웃: 표, 텍스트, 색상 코딩 정상
- ✅ 다운로드: 한글 파일명 지원 (URL 인코딩)

---

## 📈 성능 지표

### 모델 추론 속도
- **MPS (Apple M4)**: ~200ms/image
- **CPU**: ~1-2s/image
- **배치 처리**: 32 images/batch

### API 응답 시간
- `/api/ai/analyze`: ~10초 (모델 추론 + 후처리)
- `/api/ai/report`: ~3-5초 (Claude API 호출)
- `/api/ai/pdf`: ~2초 (PDF 생성)
- 백엔드 CRUD: <100ms

### 동시 처리
- **AI 서버**: 모델 캐싱으로 동시 요청 처리
- **백엔드**: SQLite (개발) → MySQL (프로덕션)

---

## 🔒 보안

### 구현된 보안 기능
- ✅ JWT 토큰 인증
- ✅ 비밀번호 bcrypt 해싱
- ✅ CORS 정책 설정
- ✅ 환경변수로 민감 정보 관리
- ✅ 소유자 확인 (반려동물/진단 접근 시)

### TODO
- [ ] HTTPS 설정
- [ ] Rate Limiting
- [ ] API 키 관리
- [ ] 입력 검증 강화

---

## 📁 프로젝트 구조

```
capstone_petcare/
├── api/                          # AI 서버
│   ├── main.py                   # FastAPI 앱
│   ├── test_client.py           # 테스트 클라이언트
│   ├── CLAUDE_API_GUIDE.md      # Claude API 가이드
│   ├── PDF_GENERATION_GUIDE.md  # PDF 생성 가이드
│   └── KOREAN_FONT_SETUP.md     # 한글 폰트 설정
├── backend/                      # 백엔드 서버
│   ├── app/
│   │   ├── main.py              # FastAPI 앱
│   │   ├── database.py          # DB 연결
│   │   ├── models/              # SQLAlchemy 모델
│   │   ├── schemas/             # Pydantic 스키마
│   │   ├── routers/             # API 라우터
│   │   │   ├── auth.py          # 인증
│   │   │   ├── pets.py          # 반려동물
│   │   │   ├── diagnosis.py    # 진단
│   │   │   └── dependencies.py # 의존성
│   │   └── core/
│   │       ├── config.py        # 설정
│   │       └── security.py      # JWT, 해싱
│   ├── alembic/                 # 마이그레이션
│   ├── requirements.txt
│   └── README.md
├── models/
│   └── classifier/
│       ├── train.py             # 모델 훈련
│       ├── model.py             # 모델 정의
│       ├── dataset.py           # 데이터셋
│       ├── gradcam.py           # GradCAM
│       └── checkpoints/         # 모델 체크포인트
│           ├── dog_best.pth
│           └── cat_best.pth
├── eye_data/                    # 데이터셋
├── requirements.txt
├── .env                         # 환경변수 (AI 서버)
└── README.md
```

---

## 🔧 트러블슈팅

### 1. MySQL 연결 오류
**문제**: `ERROR 1045 (28000): Access denied`  
**해결**: SQLite로 전환 (`DATABASE_URL=sqlite:///./petcare.db`)

### 2. bcrypt 버전 호환성
**문제**: `ValueError: password cannot be longer than 72 bytes`  
**해결**: bcrypt 4.0.1로 다운그레이드

### 3. 한글 폰트 오류
**문제**: `'latin-1' codec can't encode characters`  
**해결**: 
- 서버 시작 시 한글 폰트 등록
- URL 인코딩으로 파일명 처리
- NanumGothic 설치 권장

### 4. email-validator 누락
**문제**: `ModuleNotFoundError: No module named 'email_validator'`  
**해결**: `pip install email-validator`

---

## 🎯 향후 계획

### Phase 1: 필수 (2-3주)
1. **프론트엔드 개발** (React/Next.js)
   - 랜딩 페이지
   - 회원가입/로그인
   - 반려동물 관리
   - AI 분석 페이지
   - 진단 결과/이력

2. **이미지 저장**
   - AWS S3 연동
   - 또는 로컬 파일 시스템

3. **보안 강화**
   - HTTPS
   - Rate Limiting
   - 입력 검증

### Phase 2: 완성 (1-2주)
4. **테스트**
   - 단위 테스트
   - 통합 테스트
   - E2E 테스트

5. **배포**
   - Docker 컨테이너화
   - CI/CD 파이프라인
   - 클라우드 배포

6. **문서화**
   - 사용자 매뉴얼
   - 발표 자료
   - 최종 보고서

### Phase 3: 최종 (1주)
7. **최적화**
   - 모델 경량화
   - 성능 튜닝
   - UX 개선

8. **최종 점검**
   - 전체 테스트
   - 보안 점검
   - 문서 검토

---

## 👥 팀 정보

**개발자**: 이준영  
**프로젝트 유형**: 캡스톤 디자인  
**멘토**: [멘토명]  
**기관**: [학교명]

---

## 📄 라이선스

MIT License

---

## 📞 문의

- **GitHub**: [저장소 URL]
- **Email**: [이메일]

---

**Last Updated**: 2026.03.16  
**Version**: 1.0.0-beta
