# GANADI Frontend

GANADI(반려동물 안구질환 AI 스크리닝) 서비스의 모바일 웹(PWA) 프론트엔드입니다.
보호자 · 수의사 · 관리자 화면을 하나의 React 앱으로 제공합니다.

전체 소개·아키텍처는 [루트 README](../README.md)를 참고하세요.

## 기술 스택

React 18 · Vite · TypeScript/JavaScript 혼용 · Tailwind CSS · Zustand · React Router ·
vite-plugin-pwa(`injectManifest`, Web Push용 `src/sw.ts`) · Kakao Map / OAuth

## 로컬 실행

```bash
npm ci
cp .env.example .env   # VITE_KAKAO_MAP_KEY 등 설정
npm run dev            # http://localhost:5173
```

- 개발 서버는 `/api`, `/uploads` 를 백엔드(`http://127.0.0.1:8001`)로 프록시합니다 (`vite.config.ts`).
- 브라우저는 AI 서버를 직접 호출하지 않습니다. AI 스크리닝·리포트·PDF 는 모두 백엔드 `/api/diagnosis/*` 를 거칩니다.
- 백엔드·AI 서버까지 함께 띄우는 방법: [docs/GANADI_LOCAL_RUN.md](../docs/GANADI_LOCAL_RUN.md)

## 환경 변수

| 변수 | 설명 |
|------|------|
| `VITE_API_URL` | 백엔드 API 주소. 비우면 같은 origin 의 `/api` 사용 (권장) |
| `VITE_KAKAO_MAP_KEY` | 카카오 JavaScript 키 (카카오 개발자 콘솔에서 발급, 커밋 금지) |

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (`dist/`, 서비스 워커 포함) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |

## 배포

`Dockerfile` 은 Node 20 에서 빌드한 뒤 `nginx:alpine`(포트 80, `nginx.conf`: SPA fallback·CSP·캐시 정책)으로 서빙합니다.
프로덕션에서는 `backend/docker-compose.yml` + `docker-compose.prod.yml` 이 이 디렉터리를 빌드하고,
리버스 프록시 nginx 가 `/` 요청을 이 컨테이너로 전달합니다. 자세한 절차: [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)

## 디렉터리

```
src/
├── app/          # 앱 셸·라우트(routes.tsx)·TSX 페이지(보호자·수의사·관리자)
├── pages/        # JSX 페이지 (반려동물·AI 스크리닝·이력 등)
├── components/   # 공용 레이아웃·UI 컴포넌트
├── api/          # 백엔드 API 클라이언트 (axios)
├── stores/       # Zustand 상태
├── lib/          # 카카오맵·푸시·PDF 다운로드 유틸
└── sw.ts         # 서비스 워커 (precache + Web Push)
```
