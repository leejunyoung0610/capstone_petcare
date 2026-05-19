# 변경 이력 (2026-05-19 세션)

비밀번호 재설정, 신고·관리자 메시징, 수의사 상담료, 배포 준비 문서화까지의 작업 요약입니다.

---

## 백엔드

### DB 마이그레이션
- **`g9h0i1j2k3l4`**: `users.suspend_reason`, `vets.opinion_fee_won`, `admin_reports.target_user_id`
- **`h0i1j2k3l4m5`**: `password_reset_tokens`, `report_messages`, `admin_reports.target_vet_id`

### 인증
- `POST /api/auth/password/forgot` — 재설정 메일 발송 (SMTP 또는 dev 링크 노출)
- `POST /api/auth/password/reset` — 토큰 검증 후 비밀번호 변경

### 이메일
- `backend/app/core/email.py` — SMTP(TLS/SSL/plain), Mailpit 호환
- `backend/app/services/mail_templates.py` — 비밀번호 재설정·신고·관리자 안내 템플릿
- `backend/scripts/test_smtp.py` — 발송 테스트 스크립트
- `backend/.env.example` — 네이버 SMTP·Mailpit·토스·재설정 URL 예시 보강

### 수의사
- `PUT /api/vets/profile` — `opinion_fee_won` 설정
- `GET /api/vets/registered`, `match-hospitals` — `opinion_fee_won` 응답 (미설정 시 `OPINION_SERVICE_FEE_WON` 기본값)

### 관리자·신고
- `backend/app/services/report_messaging.py` — 신고 스레드 메시지 CRUD·메일 발송
- `admin.py`, `reports.py` — 정지 사유, 신고 대상·메시지 API 확장

### 설정
- `config.py` — SMTP SSL, `PASSWORD_RESET_URL_BASE`, `EMAIL_DEV_EXPOSE_LINK`, `ADMIN_NOTIFY_EMAIL` 등

---

## 프론트엔드

### 인증
- `ForgotPassword.tsx`, `ResetPassword.tsx` — 비밀번호 찾기/재설정 UI
- `routes.tsx` — `/forgot-password`, `/reset-password` (Login import 누락 버그 수정)
- `Login.tsx`, `pages/auth/Login.jsx` — 비밀번호 찾기 링크

### 수의사
- `VetProfile.tsx` — 상담료 설정 UI
- `VetDashboard.tsx` — 상담료 카드·프로필 링크
- `VetSearch.tsx` — GANADI 인증 병원 카드에 **원격 소견 금액** 작게 표시

### 관리자·신고
- `AdminDashboard.tsx` — 신고 스레드 대화 UI, 사용자 관리 탭에서 정지/삭제
- `ReportHistory.jsx`, `ReportDetail.jsx` — 보호자 신고 이력·상세
- `pages/vet/` — 수의사 신고 메시지 UI

### 기타
- `OpinionRequest.tsx` — 소견 요청 헤더 중복 제거, 상담료 표시
- `Home.tsx`, `Upload.tsx`, `DiagnoseNew.jsx`, `Dashboard.jsx` — UX·문구 정리
- `api/auth.js`, `api/admin.js`, `api/reports.js`, `api/vets.js` — API 클라이언트

---

## 문서

- **`docs/LAUNCH_READINESS.md`** — 배포 전 P0~P2 체크리스트·5일 계획·smoke test
- **`docs/CHANGELOG_SESSION_2026-05-19.md`** — 본 문서

---

## 배포 시 주의

1. 프로덕션 DB: `alembic upgrade head`
2. `EMAIL_DEV_EXPOSE_LINK=false`, SMTP 실제 설정
3. 카카오 Redirect URI·도메인을 `https://ganadi.site`로 등록
4. `docker-compose.yml` 프론트 context 경로 확인 (모노레포: `../frontend`)

---

*작성: 2026-05-19*
