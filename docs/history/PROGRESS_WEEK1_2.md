# GANADI 캡스톤 진행 현황 — 1~2주차 (2026-04-25 ~ 2026-05-02)

> 보호자/수의사/관리자 3-role 구조의 반려동물 안구 AI 스크리닝 서비스
> 모바일 앱화를 염두에 둔 단계적 기능 확장 계획 중 1~2주차 결과를 정리한다.

## 1. 전체 로드맵 (5주)

| 주차 | 주제 | 상태 |
|---|---|---|
| 1주차 | 수의사 자격증 인증 시스템 | ✅ 완료 |
| 2주차 | 카카오맵 + 위치 기반 병원 검색 | ⚠️ 코드 완료 / 카카오맵 서비스 활성화 대기 |
| 3주차 | 자체 별점·리뷰 시스템 강화 | ⏳ 예정 |
| 4주차 | 결제 + 푸시 알림 | ⏳ 예정 |
| 5주차 | Capacitor 로 모바일 앱화 | ⏳ 예정 |

---

## 2. 1주차 — 수의사 자격증 인증 시스템

### 목표
관리자가 수의사 회원가입을 무조건 승인해주는 게 아니라, **면허증 사본/재직증명서 같은 증빙 문서를 첨부받고 검토**한 뒤 승인/반려할 수 있도록 한다. 반려 시 사유를 회신해 재신청을 유도한다.

### 백엔드 (`GANADI-backend`)

- `app/models/__init__.py` — `Vet` 모델에 자격증 필드 추가
  - `license_number` (면허번호, 문자열)
  - `license_image_url` (면허증 이미지/PDF URL)
  - `employment_doc_url` (재직/개업 증명서 URL, 선택)
  - `rejection_reason` (반려 사유, Text)
  - `reviewed_at` (검토 시각)
- `alembic/versions/b3e7f9a4c5d2_add_vet_license_fields.py` — 위 필드를 추가하는 마이그레이션
- `app/core/storage.py` — `uploads/vet_documents/` 디렉토리 + `save_vet_document()` 함수 (이미지/PDF, 10MB 제한, 확장자 검증)
- `app/schemas/__init__.py`
  - `VetCreate` 에 `license_number` 옵션 추가
  - `VetResponse` 에 자격증 관련 필드 + `approval_status` 노출
  - `VetRejectRequest` (관리자 반려 사유 입력) 신규
- `app/routers/auth.py`
  - `POST /api/auth/vet/register-with-docs` — multipart/form-data 로 면허증 + 증빙서류 업로드 받는 회원가입 엔드포인트 신규
  - 카카오 OAuth 호출은 `httpx.AsyncClient(trust_env=False)` 로 변경 (Cursor 샌드박스 프록시 우회)
- `app/routers/admin.py`
  - `GET /api/admin/vets/{vet_id}` — 자격증 상세 + 첨부 URL + 반려 사유 조회 신규
  - `PATCH /api/admin/vets/{vet_id}/approve` — `approval_status=approved`, `reviewed_at` 갱신
  - `PATCH /api/admin/vets/{vet_id}/reject` — Body 에 `reason` 필수, `reviewed_at` 갱신
- `app/main.py` — `app.mount("/uploads", StaticFiles(directory="uploads"))` 로 정적 파일 노출 (이미 있던 설정 활용)

### 프론트엔드 (`GANADI-frontend`)

- `src/app/pages/VetRegister.tsx` — 회원가입 폼 전면 개편
  - 면허번호 input + 면허증 사본 file input(필수) + 재직증명서 file input(선택)
  - 파일 검증(타입/사이즈), 미리보기, `FileField` 재사용 컴포넌트
  - `vetRegisterWithDocs` 호출 (multipart/form-data)
- `src/api/auth.js` — `vetRegisterWithDocs(payload)` 신규 (FormData 빌드 + Content-Type 지정)
- `src/stores/authStore.js`
  - `vetRegisterWithDocs` 액션 추가
  - 백엔드 422 에러 객체를 사람이 읽을 수 있는 문자열로 변환하는 `formatError` 추가 — `Objects are not valid as a React child` 런타임 에러 해결
- `src/app/pages/AdminDashboard.tsx`
  - 수의사 행에 면허번호 + "상세/자격증" 버튼
  - `VetReviewModal` 컴포넌트 신규 — 면허증/증빙 문서 미리보기, 승인/반려 처리, 반려 시 사유 입력
  - `getAdminVetDetail` 호출, `buildFileUrl` / `isPdfPath` 유틸 추가
- `src/app/pages/KakaoCallback.tsx` — `useRef` 가드로 React StrictMode 중복 호출 방지 + 에러 메시지 개선

### 산출물
- 수의사가 회원가입 시 면허증을 즉시 첨부 → 관리자 승인 전까지 대기
- 관리자 대시보드에서 한 화면에 자격증 사진 미리보기 + 한 번에 승인/반려
- 반려 사유는 DB 에 저장되고 추후 재신청 시 활용 가능

---

## 3. 2주차 — 카카오맵 + 위치 기반 동물병원 검색

### 목표
보호자 화면의 "수의사 찾기" 페이지를 mock 데이터에서 **실제 카카오맵 + 카테고리 검색** 기반으로 전환한다. 카카오에 등록된 모든 동물병원을 보여주되, **GANADI 에 등록된 수의사가 운영하는 병원**은 별도 인증 배지/평점/소견 요청 버튼이 노출된다.

### 백엔드 (`GANADI-backend`)
- `app/routers/vets.py`
  - `POST /api/vets/match-hospitals` 신규
    - 입력: 카카오 카테고리 검색 결과 리스트
    - 처리: 병원명을 정규화(공백 제거 + 소문자) 한 뒤 GANADI 에 등록된 `approval_status=approved` 수의사들과 양방향 contains 매칭
    - 매칭된 수의사: 평균 별점 + 리뷰 수 + 진료과목 + 영업시간 부착
    - 출력: 카카오 정보 + GANADI 정보 합본 (`is_ganadi`, `vet_id` 포함)
  - `HospitalLookup` / `HospitalMatchResult` / `HospitalMatchRequest` 스키마 정의

### 프론트엔드 (`GANADI-frontend`)

- `src/types/kakao.d.ts` — 카카오맵 SDK TypeScript 타입 선언 (Map, LatLng, Marker, InfoWindow, Places, Status, SortBy 등 사용 부분)
- `src/lib/kakaoMap.ts` — **SDK 동적 로더**
  - `loadKakaoMapsSdk(appKey)` Promise 기반 1회 로드
  - script 태그 onerror, `kakao.maps.load` 콜백, 중복 호출 방지
  - 정적 `<script>` 방식의 타이밍 이슈/광고차단기 차단 시 명확한 에러 노출
- `src/app/pages/VetSearch.tsx` — 카카오맵 기반으로 전면 재작성
  - geolocation 으로 사용자 위치 자동 감지 (거부 시 강남역 폴백)
  - 카테고리 코드 `HP8`(병원) 으로 검색 → "동물/반려/애완/veterinary/pet" 필터로 동물병원만 추림
  - 백엔드 `match-hospitals` 호출하여 GANADI 매칭 결과로 보강
  - 마커 클릭 → 인포윈도우, 카드 클릭 → 지도 이동
  - 정렬 옵션: GANADI 우선 / 거리 / 평점
  - "GANADI 인증만 보기" 토글
  - GANADI 인증 병원: 파란 배지 + 별점 + 진료과목 + "소견 요청" 버튼
  - 일반 카카오 결과 병원: 회색 톤 + "GANADI 미가입 병원" 표기
  - 길찾기는 카카오맵 외부 링크 (`map.kakao.com/link/to/...`)
- `src/api/vets.js` — `matchHospitalsWithGanadi(hospitals)` 추가
- `frontend/.env.example` — `VITE_KAKAO_MAP_KEY` 발급 절차 주석 추가

### 현재 상태 — 카카오맵 활성화 대기

코드는 모두 완성됐으나 카카오 디벨로퍼스 콘솔에서 **OPEN_MAP_AND_LOCAL service** 활성화가 필요하다.

진행하면서 확인된 카카오 응답:
```
{"errorType":"NotAuthorizedError","message":"App(가나디) disabled OPEN_MAP_AND_LOCAL service."}
```

이 서비스를 활성화하려면 카카오 콘솔에서 **비즈앱 전환**(사업자번호가 없어도 본인인증 + 카카오비즈니스 통합 약관 동의로 개인 개발자 등록 가능) 절차를 거쳐야 한다.

#### 대안 후보 (활성화 지연 시 선택)
1. **카카오 비즈앱 신청** (정공법, 며칠~1주 소요)
2. **Leaflet + OpenStreetMap** 으로 즉시 전환 (가입 불필요, 한국 동물병원 데이터는 직접 GANADI DB 활용)
3. **네이버 지도 API** 로 전환 (네이버 클라우드 가입 + 카드 등록, 무료 쿼터 큼)

---

## 4. 부수적인 트러블슈팅 기록

| 이슈 | 원인 | 해결 |
|---|---|---|
| `Objects are not valid as a React child` | 백엔드 422 에러 객체를 그대로 `setError(err)` 했음 | `authStore.formatError` 도입 |
| Kakao 로그인 "사이트에 연결할 수 없음" | frontend 가 `localhost:8002` 로 요청 (포트 오타) | `.env` `VITE_API_URL` 및 하드코딩 두 곳 일괄 정리 |
| Kakao 로그인 `httpx.ProxyError 403` | Cursor 샌드박스의 내부 프록시(127.0.0.1:62402) 가 외부 차단 | `httpx.AsyncClient(trust_env=False)` 로 환경 프록시 무시 |
| Kakao 로그인 `ConnectError` | 샌드박스 외부 DNS 차단 | 외부 macOS 터미널에서 백엔드 기동 |
| VetSearch 카카오 SDK 401 | JavaScript SDK 도메인 미등록 | 카카오 콘솔 → 플랫폼 키 → JavaScript 키 → JavaScript SDK 도메인에 `http://localhost:5173`, `http://127.0.0.1:5173` 등록 |
| VetSearch 카카오 SDK 403 (현재) | 앱에서 카카오맵 서비스 비활성화 | 비즈앱 전환 후 활성화 (진행 예정) |

---

## 5. 다음 단계 (3주차 ~)

**3주차 — 자체 별점/리뷰 시스템 강화**
- 보호자가 소견 수신 후 별점 + 리뷰 작성
- 수의사 페이지에 평균 평점/리뷰 누적 노출
- 리뷰 신고/숨김(관리자) 기능
- 수의사 답글 기능
- 카카오맵 기반 검색에 자체 평점 정렬 정확도 향상

**4주차 — 결제 + 푸시 알림**
- 토스페이먼츠 또는 카카오페이 연동 (소견 요청료)
- 정산/환불 정책
- FCM 푸시 (소견 작성 알림, 소견 도착 알림 등)

**5주차 — Capacitor 로 모바일 앱화**
- Capacitor 셋업 + iOS/Android 빌드
- 카메라 / 푸시 / 위치 권한 네이티브 연동
- 앱 배포 준비 (스플래시, 아이콘, 스토어 메타데이터)

---

## 6. 환경 변수 정리

### `frontend/.env`
```
VITE_API_URL=http://localhost:8001/api
VITE_KAKAO_MAP_KEY=<JavaScript 키>
```

### `backend/.env` (변경 없음)
```
DATABASE_URL=mysql+pymysql://...
JWT_SECRET_KEY=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
```

## 7. 실행 방법 (현재 시점)

```bash
# 백엔드 (외부 macOS 터미널 권장)
cd backend
source venv/bin/activate
alembic upgrade head    # 1주차 마이그레이션 반영
uvicorn app.main:app --reload --port 8001 --host 0.0.0.0

# 프론트엔드
cd frontend
npm install
npm run dev   # http://localhost:5173
```
