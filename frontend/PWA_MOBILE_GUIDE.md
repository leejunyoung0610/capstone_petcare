# PWA · 휴대폰 검증 가이드

> 이 문서는 GANADI 프론트엔드를 **PWA (Progressive Web App)** 로 전환하면서 추가된
> 설정과, **휴대폰에서 같은 앱을 직접 사용하면서 모바일 UX 를 점검** 하기 위한
> 운영 가이드입니다. 1\~2주차의 이미 끝난 작업 기록은 `PROGRESS_WEEK1_2.md` 를 참고하세요.

---

## 1. 무엇을 했나 (요약)

### 1.1 vite-plugin-pwa 도입
- `vite-plugin-pwa`, `workbox-window`, `terser`, `sharp` (icon 빌드용) 의존성 추가
- `vite.config.ts` 에 `VitePWA` 플러그인 등록
  - `generateSW` 전략 + Workbox 런타임 캐시
  - API: NetworkFirst (5초 timeout, 5분 만료)
  - 카카오맵 SDK/타일: StaleWhileRevalidate
  - Pretendard / Google Fonts: CacheFirst (1년)
- `server.host: true` 로 LAN 휴대폰 접속 허용

### 1.2 매니페스트 / 아이콘
- `public/icon-192.png` (192×192)
- `public/icon-512.png` (512×512)
- `public/icon-maskable-512.png` (512×512, maskable safe-area 80%)
- `public/apple-touch-icon.png` (180×180, iOS 홈화면)
- `npm run pwa:icons` 로 `favicon.svg` 에서 위 아이콘 4종 자동 생성
  (스크립트: `frontend/scripts/generate-pwa-icons.mjs`)

### 1.3 Service Worker 등록 + 업데이트 토스트
- `frontend/src/app/components/PWAUpdatePrompt.tsx` 추가
- 새 빌드가 배포되면 우측 하단 토스트로 "새 버전 → 새로고침" 안내
- 처음 오프라인 사용 가능 상태가 되면 5초간 "오프라인 사용 가능" 안내 후 자동 닫힘

### 1.4 모바일 메타 태그 보강 (`index.html`)
- `viewport-fit=cover`, `theme-color=#7e14ff`
- `apple-mobile-web-app-capable`, `apple-mobile-web-app-title=GANADI`
- `apple-touch-icon`, 192/512 PNG 파비콘 추가

### 1.5 동적 API Base URL (`frontend/src/api/client.js`)
PC 와 휴대폰을 같은 코드로 동작시키기 위해, **현재 브라우저 호스트 기반 자동 감지**:

| 접속 위치 | 자동 결정되는 base URL |
|---|---|
| PC `http://localhost:5173` | `http://localhost:8001/api` |
| 휴대폰 `http://172.16.x.x:5173` | `http://172.16.x.x:8001/api` |

`.env` 의 `VITE_API_URL` 은 주석 처리되어 있고, 명시값이 있으면 그게 우선입니다.
관련 파일에서 `apiBaseURL` / `serverOrigin` 을 import 해서 사용 중입니다
(`Login.tsx`, `Login.jsx`, `AdminDashboard.tsx`, `KakaoCallback.tsx`).

### 1.6 백엔드 CORS 사설망 자동 허용 (`backend/app/main.py`)
LAN 사설 대역 origin 을 정규식으로 허용:

```
^https?://(localhost|127.0.0.1|10.x.x.x|192.168.x.x|172.16~31.x.x)(:\d+)?$
```

`.env` 의 `CORS_ORIGINS` 는 그대로 유지하면서, 위 정규식이 추가로 허용됩니다.

### 1.7 카카오 OAuth `redirect_uri` 동적화 (`backend/app/routers/auth.py`)
- `_resolve_redirect_uri(request, explicit)` 헬퍼 추가
- 결정 우선순위: ① POST body 의 `redirect_uri` → ② Referer origin → ③ `.env` fallback
- `KakaoCallbackRequest` 에 optional `redirect_uri` 추가
- 프론트 `KakaoCallback.tsx` 가 `window.location.origin + /auth/kakao/callback` 을 명시적으로 같이 보냄
- **로컬에서 콘솔 등록이 번거로우면** `.env` 에 `KAKAO_REDIRECT_USE_REFERER=false` → 인가 요청 시 항상 `KAKAO_REDIRECT_URI` 만 사용 (항상 `http://localhost:5173/...` 같은 **한 주소**로만 접속할 때 유효)

이렇게 해서 **PC (localhost) / 휴대폰 (LAN IP) 동일 코드** 로 카카오 로그인 동작.

---

## 2. 휴대폰에서 검증하는 법

### 2.1 같은 와이파이에서 LAN 접속 (가장 빠름)

#### ① PC LAN IP 확인
```bash
ipconfig getifaddr en0    # macOS, 와이파이
# 예: 172.16.100.133
```

#### ② 백엔드 / 프론트 띄우기 (각각 다른 터미널)
```bash
# 터미널 ①
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# 터미널 ②
cd frontend && npm run dev
```
콘솔 출력 예:
```
Local:   http://localhost:5173/
Network: http://172.16.100.133:5173/
```

#### ③ 휴대폰에서 접속
- PC 와 **같은 와이파이**
- 사파리/크롬 주소창: `http://172.16.100.133:5173`
- 카카오 로그인 / 일반 로그인 동작 확인

#### ④ 홈 화면 설치 (PWA)
- **iOS 사파리**: 하단 공유 버튼 → "홈 화면에 추가"
- **Android 크롬**: 우상단 ⋮ → "앱 설치" 또는 "홈 화면에 추가"
- 보라색 GANADI 아이콘 + 주소창 없이 standalone 실행 확인

### 2.2 한계 — Service Worker 는 dev 에선 비활성

진짜 PWA 동작 (오프라인 / 업데이트 토스트) 을 검증하려면 프로덕션 빌드 사용:
```bash
npm run build
npm run preview -- --host 0.0.0.0
# 휴대폰: http://172.16.100.133:4173
```

### 2.3 더 깔끔한 방법 — HTTPS 터널 (강력 권장)

LAN IP 는 와이파이 바뀔 때마다 새로 잡히고 카카오 콘솔에 매번 등록해야 하는 단점이 있습니다.
`cloudflared` (무료, 로그인 불필요) 또는 `ngrok` 으로 **고정 HTTPS 도메인** 한 개 발급해
카카오에 등록해두면 어디서나 동일하게 동작 + PWA HTTPS 환경 검증 가능.

```bash
# cloudflared 임시 터널
brew install cloudflared
cloudflared tunnel --url http://localhost:5173
# → https://random-name-xxx.trycloudflare.com 발급
```

---

## 3. 카카오 Developers 콘솔 — 필수 추가 작업

> 팀 공통 앱 키 (`b715c846bf27f856fd510acbd5a39ef3`) 를 모두 사용 중이므로,
> **앱 소유 팀원이 한 번만 등록하면 모든 팀원에게 즉시 적용** 됩니다.

카카오 Developers → 내 애플리케이션 → 가나디 앱 으로 들어가 아래 3 군데 모두 추가:

| 위치 | 등록 값 (LAN 예시) |
|---|---|
| 앱 설정 → 플랫폼 → Web → **사이트 도메인** | `http://172.16.100.133:5173` |
| 카카오 로그인 → **Redirect URI** | `http://172.16.100.133:5173/auth/kakao/callback` |
| 앱 설정 → 플랫폼 → JavaScript 키 → **JavaScript SDK 도메인** | `http://172.16.100.133:5173` |

> 기존 `http://localhost:5173` 은 그대로 두고 **추가** 만 하세요.
> cloudflared/ngrok 터널을 쓰면 발급받은 HTTPS 도메인 하나만 등록하면 됩니다.

### 3.1 카카오 로그인 동작 흐름 (현재)

```
[휴대폰 사파리]                   [백엔드]                     [카카오]
http://172.16.x.x:5173/login
       │ 카카오 로그인 클릭
       ▼
GET /api/auth/kakao         ── Referer 헤더 확인 ──▶
                            redirect_uri =
                              http://172.16.x.x:5173/auth/kakao/callback
                                    │
                                    ▼
                            302 Redirect to
                            kauth.kakao.com/oauth/authorize?...
                                                       │
                                                       ▼
                                              카카오 인증 페이지
                                                       │ 사용자 동의
                                                       ▼
                                              code 발급 → redirect_uri 로 이동
       ◀──────────────────────────────────────────────┘
GET /auth/kakao/callback?code=xxx (휴대폰)
       │
       │ axios POST /api/auth/kakao/callback
       │ body: { code, redirect_uri }
       ▼
       ─────▶  토큰 교환 (redirect_uri 일치 확인) ─────▶ 카카오
                                            ◀───── access_token
       ─────▶  사용자 정보 조회 ─────────────────▶ 카카오
                                            ◀───── user_info
       ◀─── JWT { access_token, refresh_token, user }
```

### 3.2 카카오맵 (`OPEN_MAP_AND_LOCAL` 서비스)
- LAN IP 에서도 카카오맵 SDK 가 401/403 으로 막히면, **JS SDK 도메인 등록** 누락이 1순위 의심.
- 그래도 `App disabled OPEN_MAP_AND_LOCAL service` 가 뜨면 카카오맵 자체 서비스 비활성 상태.
  → 카카오 비즈 앱 등록 후 `제품 설정 → 카카오맵 → 활성화` 필요.
  팀에 사업자 등록 가능한 분이 있으면 비즈 앱 신청, 아니면 OpenStreetMap/네이버맵 대안 검토.

---

## 4. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm run dev` 후 휴대폰에서 접속 안 됨 | 같은 와이파이가 아님 / Mac 방화벽 | 같은 SSID 확인 → 방화벽 일시 OFF 후 재시도 |
| 카카오 로그인 클릭 시 카카오 페이지에서 `KOE006` | redirect_uri 미등록 | 카카오 콘솔 Redirect URI 에 LAN IP 추가 |
| 카카오 로그인 후 `localhost:5173` 으로 끊김 | 옛 캐시 / vite 재시작 누락 | vite dev 종료 후 재시작 + 휴대폰 사파리 캐시 삭제 |
| 카카오맵 SDK 401 | JS SDK 도메인 미등록 | 카카오 콘솔 JavaScript SDK 도메인에 LAN IP 추가 |
| API 호출 시 CORS 에러 | LAN regex 미반영 | 백엔드 재시작 후 origin 이 `172.16.x.x` / `192.168.x.x` 인지 확인 |
| `Service worker registration failed` | dev 모드는 SW 비활성이 의도된 동작 | `npm run build && npm run preview` 로 검증 |
| 빌드 시 `terser renderChunk` hang | workbox-build + terser worker 이슈 | `vite.config.ts` 의 `workbox.mode: 'development'` 유지 (이미 적용) |
| iOS PWA 푸시 알림 안 됨 | iOS 16.4+ 일부만 지원, 추가 설정 필요 | 4주차 (푸시 알림) 에서 본격 다룸 |

---

## 5. 다음 단계 (Phase B / C)

- **Phase B — 모바일 반응형 점검**
  1. `Header` — 햄버거 / 하단 탭바
  2. `VetSearch` — 지도/리스트 토글 또는 모바일은 stack
  3. `Diagnosis` — 카메라 직접 촬영 (`<input capture="environment">`)
  4. 폼 입력 시 키보드 가림 방지

- **Phase C — 모바일 전용 UX**
  1. 하단 고정 탭바
  2. Pull-to-refresh, Skeleton UI
  3. 터치 hit area ≥ 44px

- **5주차 — Capacitor 로 네이티브 쉘 감싸 앱스토어 출시 준비**
  PWA 코드 99% 재사용. 인증서/심사만 추가.

---

## 6. 작업 체크리스트 (휴대폰 첫 검증 시)

- [ ] PC LAN IP 확인 (`ipconfig getifaddr en0`)
- [ ] 백엔드 8001 LISTEN 확인 (`curl localhost:8001/`)
- [ ] 프론트 5173 LISTEN 확인 (`curl localhost:5173/`)
- [ ] 휴대폰 같은 와이파이
- [ ] 휴대폰 사파리 → `http://<PC_IP>:5173` 접속
- [ ] 카카오 콘솔 — 사이트 도메인 / Redirect URI / JS SDK 도메인 LAN IP 추가
- [ ] 휴대폰에서 카카오 로그인 → 정상 콜백
- [ ] 휴대폰 홈 화면 추가 → 보라 GANADI 아이콘 standalone 실행
- [ ] 어떤 페이지가 모바일에서 깨지는지 메모 → Phase B 입력
