# PET EYE AI — 프로덕션 배포 가이드

실제 서비스(`https://ganadi.site`) 배포 절차입니다.  
체크리스트 전체는 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md)를 참고하세요.

---

## 1. 사전 준비

### 서버
- Docker + Docker Compose v2
- SSL 인증서: `/etc/ssl/ganadi/ganadi.pem`, `ganadi.key`
- RDS MySQL 8.0 (`ganadi_local` DB, `ganadi_user` 계정)
- AI 모델 파일 (Git 미포함): `backend/models/classifier/checkpoints/` 에 배치 → `ai` 컨테이너에 읽기 전용 마운트
  - 기본 `INFERENCE_BACKEND=onnx_int8` → `{dog,cat}_best_random_split_int8.onnx` (`onnx` 는 FP32 `.onnx`, `pytorch` 는 `.pth`)
  - 생성 방법: [`models/classifier/checkpoints/README.md`](../models/classifier/checkpoints/README.md)

### 외부 콘솔
| 서비스 | 설정 |
|--------|------|
| 카카오 | Web 도메인 `https://ganadi.site`, Redirect `https://ganadi.site/auth/kakao/callback`, JS 키 |
| 토스 | 클라이언트/시크릿 키, 웹훅 URL `https://ganadi.site/api/payments/toss/webhook` |
| SMTP | 네이버/Gmail 등 — `EMAIL_DEV_EXPOSE_LINK=false` |

---

## 2. 환경변수

```bash
cd backend
cp .env.production.example .env
cp api/.env.example api/.env   # AI 서버: ANTHROPIC_API_KEY, INFERENCE_BACKEND
# SECRET_KEY: openssl rand -hex 32
# RDS, Kakao, SMTP, Toss, VAPID 등 채우기
# AI_INTERNAL_TOKEN: openssl rand -hex 32 (backend·ai 컨테이너 공용)
```

프론트 빌드 변수는 `backend/.env`에 함께 두거나 CI secret으로 주입:

```bash
VITE_KAKAO_MAP_KEY=...
RDS_ENDPOINT=your-db.xxxx.ap-northeast-2.rds.amazonaws.com
DB_PASSWORD=...
```

---

## 3. 배포 전 검사

```bash
cd backend
chmod +x scripts/*.sh
./scripts/check_production_env.sh
```

`ENVIRONMENT=production` 일 때 서버 기동 시에도 동일 검사가 실행됩니다.  
치명적 misconfiguration(약한 `SECRET_KEY`, dev 재설정 링크 노출 등)은 **프로세스가 종료**됩니다.

---

## 4. 배포

```bash
cd backend
./scripts/deploy-prod.sh
```

수동 실행 (`docker-compose.prod.yml` 은 오버라이드라 단독 실행 불가 — 반드시 두 파일을 함께 지정):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

프론트 빌드 context 는 기본 `../frontend`(모노레포의 `frontend/`)입니다. 조직 레포를 형제 폴더로 따로 clone 했다면 `FRONTEND_CONTEXT=../GANADI-frontend` 처럼 지정합니다.

백엔드 컨테이너는 시작 시 `alembic upgrade head` 후 uvicorn을 띄웁니다.

---

## 5. Smoke test

```bash
./scripts/smoke-test.sh https://ganadi.site
```

수동 E2E: [LAUNCH_READINESS.md §5](./LAUNCH_READINESS.md#5-배포-당일-smoke-test-약-10분)

---

## 6. 프로덕션 보안 요약

| 항목 | 동작 |
|------|------|
| `ENVIRONMENT=production` | OpenAPI `/docs` 비활성, LAN CORS regex 비활성 |
| Rate limit | 로그인 20/min, 비밀번호 찾기 5/5min |
| CSP | Kakao + Toss 도메인 허용 (`nginx.prod.conf`) |
| Health | `/api/health` — DB·SMTP·토스·VAPID 상태 |
| AI 서버 | 외부 미노출 — nginx `/ai/` 프록시·호스트 포트 없음, 백엔드만 compose 내부망(`http://ai:8000`)으로 호출 |
| AI 내부 토큰 | `AI_INTERNAL_TOKEN`(선택, `backend/.env`) 설정 시 `/api/ai/*` 는 `X-Internal-Token` 헤더 필수 |
| AI CORS | 기본 브라우저 origin 미허용(`AI_CORS_ORIGINS` 로만 명시적 허용, `*`·credentials 불가) |

---

## 7. 롤백

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
# 이전 이미지 태그로 checkout 후 재배포
git checkout <previous-tag>
./scripts/deploy-prod.sh
```

RDS는 `alembic downgrade` 전 **스냅샷** 권장.

---

## 8. 로컬 Docker (개발)

```bash
cd backend
cp .env.example .env   # ENVIRONMENT=development
docker compose up -d --build
```

MySQL은 compose 내 컨테이너, 프론트 context는 `../frontend` (`FRONTEND_CONTEXT` 로 변경 가능).

---

*최종 갱신: 2026-05-19*
