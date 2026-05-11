# GANADI 개발 현황 요약 (2026년 5월)

모노레포(`capstone_petcare`) 및 팀 원격 저장소 **GANADI-backend**, **GANADI-frontend** 기준으로 정리했습니다.

---

## 1. 이번 라운드에서 마무리한 항목

### 프론트엔드

- **모바일 하단 탭**: 홈 · 반려동물 · AI(플로팅) · 병원 · 마이. 햄버거 메뉴는 보조 메뉴만 노출해 중복 완화 (`AppShell.jsx`, `AppHeader.jsx`).
- **AI 분석 페이지**: 카메라 직접 촬영(`capture="environment"`), 레이아웃 정돈 (`DiagnoseNew.jsx`).
- **소견 진입 동선**: AI 결과 화면에서 GANADI 등록 수의사 추천 카드 · 병원 찾기 연동 (`DiagnoseResult.jsx`). 병원 찾기에서 `?ganadi=1` 시 필터 자동 ON 및 칩 UI (`VetSearch.tsx`).
- **PWA / Web Push**: `vite-plugin-pwa`를 **injectManifest**로 전환, 커스텀 `src/sw.ts`(precache·런타임 캐시·push·notificationclick). 마이페이지 설정 탭에 푸시 ON/OFF·테스트 (`PushSettingsCard.tsx`, `src/lib/push.ts`).
- **의존성**: Web Push용 `workbox-*` 패키지 추가.

### 백엔드

- **수의사 공개 API**: `GET /api/vets/registered`, `GET /api/vets/recommended` (승인된 수의사 목록·추천, 인증 불필요).
- **Web Push**: VAPID 설정(`app/core/config.py`), 키 로드/생성(`app/core/push.py`), `PushSubscription` 테이블 및 Alembic 마이그레이션 `c1d2e3f4a5b6`, 라우터 `/api/push/*`(공개키·구독·해제·테스트).
- **알림 연동**: `create_notification()`에서 DB 알림 저장 후 등록된 구독으로 푸시 전송; 소견 작성 완료 시 보호자에게 연동 (`notifications.py`, `opinions.py`).
- **시연용 시드**: `scripts/seed_demo_vets.py` — 서울 지역 예시 병원 5곳·승인 수의사·더미 리뷰(실행: `python -m scripts.seed_demo_vets`).
- **운영 Nginx**: `nginx/nginx.prod.conf`에 CSP 및 보안 헤더 추가(Kakao Maps/OAuth 허용, `unsafe-eval` 미포함).
- **의존성**: `pywebpush` 추가.

### 보안·운영 참고

- **`vapid_keys.json`**: 로컬에서 자동 생성되는 **비공개 키**이므로 Git에 포함하지 않음(`backend/.gitignore`). 배포 시에는 `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 환경변수 주입 권장.

---

## 2. AI 모델 (고양이)

- **검증**: `models/classifier/comprehensive_eval.py --species cat` 로 VL 고양이 검증셋 평가.
- **요약**: 질환별 평균 Accuracy 약 **81.75%** (강아지 검증 ~90%대 대비 데이터 규모 차이 큼).
- **문서·산출물**: `models/classifier/PERFORMANCE_VALIDATION_REPORT_CAT.md`, `eval_results/cat_eval_*.json|.csv`.
- **데이터 구조 참고**: 학습은 주로 `eye_data/TL2/고양이/안구/일반` 한 경로; 강아지는 `개/안구/일반` + `TL2/개/…` 두 묶음 사용. 고양이 두 번째 학습 묶음은 **실제 폴더·데이터 확보 후** `CAT_DATA_PATHS`에 추가하는 방식이 안전함(VL은 검증 전용 유지).

---

## 3. 제외·유의 기능 (팀 합의 범위 밖 또는 외부 의존)

- 결제 연동.
- Kakao Map **비즈앱** 전제 기능(개인 개발자 한계 시 일부 제한 가능).

---

## 4. 다음 작업 아이디어 (우선순위 참고)

1. 고양이 성능 목표(예: 평균 90%): 결막염 등 약한 헤드 중심 **데이터 보강**, 클래스 가중/Focal, 증강 튜닝.
2. 푸시: **프로덕션 빌드·HTTPS** 환경에서 구독·수신 E2E 검증.
3. 시드 수의사 계정으로 소견·알림·푸시 플로우 시연.

---

*본 문서는 커밋 시점의 기능 요약이며, 세부 API 스펙은 OpenAPI 및 각 저장소 코드를 기준으로 한다.*
