# PET EYE AI — 프로덕션 배포 가이드

실제 서비스(`https://ganadi.site`) 배포 절차입니다.  
체크리스트 전체는 [LAUNCH_READINESS.md](./LAUNCH_READINESS.md)를 참고하세요.

---

## 1. 사전 준비

### 서버
- Docker + Docker Compose v2
- SSL 인증서: `/etc/ssl/ganadi/ganadi.pem`, `ganadi.key`
- RDS MySQL 8.0 (`ganadi_local` DB, `ganadi_user` 계정)
- AI 체크포인트: `backend/models/classifier/checkpoints/*.pth` (호스트 마운트)

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
# SECRET_KEY: openssl rand -hex 32
# RDS, Kakao, SMTP, Toss, VAPID 등 채우기
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

수동 실행:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

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

MySQL은 compose 내 컨테이너, 프론트 context는 `../frontend`.

---

*최종 갱신: 2026-05-19*
