# GANADI 학습 데이터 수집 레이어 — DB/API 스펙 (Phase 1)

> **목적:** 기존 `업로드 → AI 분석 → diagnosis_results` 파이프라인은 유지하고,  
> **동의한 샘플만** `collected_samples`로 복제·검수·export하는 수집 레이어를 추가한다.  
> **배경:** device shortcut 분석으로 확인된 데이터 갭(특히 **스마트폰+수정체질환**)을 서비스 트래픽으로 메우기 위함.

**상태:** Phase 1 구현 전 확정 스펙 (2026-06)  
**관련 코드:** `DiagnoseNew.jsx`, `backend/app/routers/diagnosis.py`, `AdminDashboard.tsx`, `storage.py`, `inference_multitask.py`

---

## 1. 설계 원칙

| 원칙 | 내용 |
|------|------|
| 진단 경험 불변 | 보호자 UX·`diagnosis_results` 저장 흐름은 그대로 |
| opt-in 수집 | `training_consent=true`일 때만 `collected_samples` insert |
| device 필수 | 동의 시 **`capture_device` 반드시 수집** — 없으면 insert 거부 |
| AI 스냅샷 보존 | `top_3`, `all_diseases`(P비정상), `predictions` 전부 JSON 저장 |
| 운영/학습 분리 | DB에는 `diagnosis_id`로 추적 가능; **export 시 PII 제거** |
| 검수 후 학습 | `label_status=confirmed` + `confirmed_*` 확정 후에만 export 대상 |

---

## 2. DB — `collected_samples`

### 2.1 Enum 정의

```python
class CaptureDeviceEnum(str, enum.Enum):
    smartphone = "스마트폰"
    ophthalmoscope = "검안경"
    general_camera = "일반카메라"

class LabelStatusEnum(str, enum.Enum):
    pending = "pending"       # AI 예측만, 미검수
    confirmed = "confirmed"   # 관리자/수의사 확정
    rejected = "rejected"     # 학습 제외

class CollectionSourceEnum(str, enum.Enum):
    user_upload = "user_upload"   # Phase 1: 보호자 업로드
    # admin_import = "admin_import"  # Phase 2+
```

### 2.2 컬럼 정의

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | `INTEGER` PK | NO | auto | |
| `diagnosis_id` | `INTEGER` FK → `diagnosis_results.id` | YES | | 운영 추적용. 동의 업로드마다 1:1 (UNIQUE) |
| `source` | `VARCHAR(32)` | NO | `user_upload` | 수집 경로 |
| **— 이미지 —** |
| `image_url` | `VARCHAR(500)` | NO | | `save_image()` 결과 (S3 URL 또는 로컬 경로) |
| `image_storage_key` | `VARCHAR(500)` | YES | | S3 object key (export/이동용, 로컬이면 NULL) |
| **— 메타 (학습·갭 분석용) —** |
| `animal_type` | `SpeciesEnum` (`dog`/`cat`) | NO | | |
| `capture_device` | `CaptureDeviceEnum` | **NO** | | **Phase 1 필수.** 클라이언트 선택값 |
| `pet_breed` | `VARCHAR(100)` | YES | | 수집 시점 Pet.breed 스냅샷 (export 시 선택 포함) |
| `pet_age` | `INTEGER` | YES | | 수집 시점 Pet.age 스냅샷 |
| `pet_gender` | `VARCHAR(20)` | YES | | `male`/`female` → export 시 `수컷`/`암컷` |
| **— AI 스냅샷 (분석 재현용) —** |
| `ai_predictions` | `JSONB` | NO | | `predictions` — `{질환: {label, confidence}}` |
| `ai_top3` | `JSONB` | NO | | `top_3_diseases` — `[{disease, confidence}]` |
| `ai_all_diseases` | `JSONB` | NO | | `all_diseases` — `{질환: P(비정상) float}` |
| `ai_main_disease` | `VARCHAR(100)` | YES | | Top-1 질환 (정상이면 `""` 또는 NULL) |
| `ai_is_normal` | `BOOLEAN` | NO | `false` | |
| `ai_model_version` | `VARCHAR(64)` | YES | | e.g. `random_split` |
| `ai_checkpoint` | `VARCHAR(255)` | YES | | 추론에 사용된 checkpoint 경로/이름 |
| **— 동의 —** |
| `training_consent` | `BOOLEAN` | NO | `true` | insert 시점 항상 true (false면 행 생성 안 함) |
| `consent_at` | `TIMESTAMPTZ` | NO | `now()` | 동의 시각 |
| `consent_version` | `VARCHAR(32)` | NO | `v1` | 약관 버전 (재동의·감사용) |
| **— 검수 라벨 —** |
| `label_status` | `LabelStatusEnum` | NO | `pending` | |
| `confirmed_disease` | `VARCHAR(100)` | YES | | 확정 질환명 (예: `백내장`) |
| `confirmed_severity` | `VARCHAR(32)` | YES | | 확정 중증도 = `label_disease_lv_3` (예: `무`/`유`/`초기`/`성숙`) |
| `reviewer_id` | `INTEGER` FK → `users.id` | YES | | 관리자 user id |
| `reviewed_at` | `TIMESTAMPTZ` | YES | | |
| `reject_reason` | `TEXT` | YES | | `rejected` 시 |
| **— export —** |
| `exported_at` | `TIMESTAMPTZ` | YES | | 마지막 export 시각 |
| `export_batch_id` | `VARCHAR(64)` | YES | | export 묶음 ID |
| **— 감사 —** |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | |

### 2.3 인덱스

```sql
CREATE UNIQUE INDEX uq_collected_samples_diagnosis_id
  ON collected_samples (diagnosis_id) WHERE diagnosis_id IS NOT NULL;

CREATE INDEX ix_collected_samples_label_status
  ON collected_samples (label_status);

CREATE INDEX ix_collected_samples_animal_device
  ON collected_samples (animal_type, capture_device);

CREATE INDEX ix_collected_samples_confirmed_disease
  ON collected_samples (confirmed_disease)
  WHERE label_status = 'confirmed';

CREATE INDEX ix_collected_samples_created_at
  ON collected_samples (created_at DESC);

-- 갭 대시보드: (animal_type, capture_device, confirmed_disease, confirmed_severity)
CREATE INDEX ix_collected_samples_gap
  ON collected_samples (animal_type, capture_device, confirmed_disease, confirmed_severity)
  WHERE label_status = 'confirmed';
```

### 2.4 `diagnosis_results` 변경 (Phase 1, 선택·권장)

수집과 무관하게 진단 이력에도 AI 확장 필드를 남기면 디버깅에 유리하다.

| 추가 컬럼 | 타입 | NULL | 설명 |
|-----------|------|------|------|
| `capture_device` | `VARCHAR(32)` | YES | 업로드 시 선택 device (수집 여부와 무관 저장) |
| `ai_top3` | `JSONB` | YES | |
| `ai_all_diseases` | `JSONB` | YES | |

> **Phase 1 최소:** `collected_samples`에만 저장해도 동작 가능.  
> **권장:** `diagnosis_results`에도 `capture_device` + `ai_top3` + `ai_all_diseases` mirror.

---

## 3. API 변경

### 3.1 `POST /api/diagnosis/analyze` (변경)

**현재:** `pet_id` + `image` (multipart)  
**추가 Form 필드:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `training_consent` | `bool` | NO | default `false`. `true`일 때만 수집 |
| `capture_device` | `string` | **조건부 필수** | `training_consent=true`이면 **필수** |
| `consent_version` | `string` | NO | default `"v1"` |

**`capture_device` 허용값 (정확히 일치):**

```
스마트폰 | 검안경 | 일반카메라
```

**검증 규칙:**

```python
if training_consent and not capture_device:
    raise 400 "학습 활용 동의 시 촬영 장비 선택이 필요합니다."

if capture_device and capture_device not in ALLOWED_DEVICES:
    raise 400 "capture_device는 스마트폰, 검안경, 일반카메라 중 하나여야 합니다."
```

**처리 순서 (변경 없음 + 분기 추가):**

```
1. pet 소유권 확인
2. 이미지 검증 + save_image()
3. AI 서버 POST /api/ai/analyze
     files=image, data={ animal_type, device=capture_device }
4. diagnosis_results INSERT (기존 + 선택 mirror 필드)
5. IF training_consent:
     collected_samples INSERT (아래 AI 스냅샷 전부)
6. DiagnosisResponse 반환
```

**AI 서버 호출 수정 (`diagnosis.py`):**

```python
# 현재: data = {"animal_type": animal_type}
# 변경:
data = {"animal_type": animal_type}
if capture_device:
    data["device"] = capture_device
```

### 3.2 `DiagnosisResponse` (변경 없음 / Phase 1)

클라이언트 UX 변경 최소화. 수집 성공 여부는 Phase 2에서 optional 필드 추가 가능:

```json
{ "collected_sample_id": 123 }  // Phase 2 optional
```

### 3.3 Phase 2 Admin API (참고용, Phase 1 미구현)

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/admin/collected-samples` | 필터: status, device, disease, animal |
| `GET` | `/api/admin/collected-samples/stats/gap` | 질환×device×severity 카운트 매트릭스 |
| `PATCH` | `/api/admin/collected-samples/{id}` | confirm / reject / 라벨 수정 |
| `POST` | `/api/admin/collected-samples/export` | eye_data ZIP 생성 |

---

## 4. 프론트엔드 변경 (Phase 1)

**파일:** `frontend/src/pages/diagnosis/DiagnoseNew.jsx`

### 4.1 UI 추가

1. **촬영 장비 선택 (필수 UI, 분석 전)**  
   - 라디오: `스마트폰으로 촬영` / `검안경으로 촬영` / `일반카메라로 촬영`  
   - 기본값: `스마트폰` (서비스 주 사용 시나리오)

2. **학습 활용 동의 (opt-in 체크박스)**  
   - 문구 예:  
     > 「촬영하신 안구 사진을 AI 모델 학습·품질 개선에 활용하는 것에 동의합니다.  
     > 동의하지 않아도 AI 스크리닝 결과는 동일하게 제공됩니다.  
     > 학습 데이터에는 보호자 식별정보(이름·연락처)가 포함되지 않습니다.」  
   - `consent_version`: `"v1"` 고정 전송

3. **분석 버튼 검증**  
   - `capture_device` 미선택 → alert  
   - `training_consent=true`인데 device 없음 → 서버 400과 동일하게 차단

### 4.2 API 호출 (`diagnosisStore` / `diagnosis.js`)

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('training_consent', String(trainingConsent));
formData.append('capture_device', captureDevice);  // 항상 전송 권장
formData.append('consent_version', 'v1');
```

---

## 5. AI 스냅샷 JSON 스키마

`inference_multitask.run_multitask_inference()` 반환값 기준.

### 5.1 `ai_predictions`

```json
{
  "결막염": { "label": "유", "confidence": 87.9 },
  "백내장": { "label": "무", "confidence": 12.3 }
}
```

### 5.2 `ai_top3`

```json
[
  { "disease": "비궤양성각막질환", "confidence": 0.9771 },
  { "disease": "백내장", "confidence": 0.9698 },
  { "disease": "유루증", "confidence": 0.9249 }
]
```

### 5.3 `ai_all_diseases` (P(비정상) — **device shortcut/CP 분석 재현 필수**)

```json
{
  "결막염": 0.8787,
  "백내장": 0.9698,
  "핵경화": 0.9066
}
```

### 5.4 insert 시 매핑

| collected_samples | AI 응답 필드 |
|-------------------|--------------|
| `ai_predictions` | `predictions` |
| `ai_top3` | `top_3_diseases` |
| `ai_all_diseases` | `all_diseases` |
| `ai_main_disease` | `main_disease` |
| `ai_is_normal` | `is_normal` |
| `ai_model_version` | `model_version` |
| `ai_checkpoint` | `checkpoint` |

---

## 6. 동의 · PII 분리 정책

### 6.1 수집 범위 (동의 시)

| 포함 | 제외 |
|------|------|
| 안구 crop 이미지 | 보호자 `user_id`, email, phone |
| `capture_device`, species | 반려동물 `name` (export 기본 제외) |
| AI 예측 스냅샷 | GPS, EXIF 내 위치·기기 시리얼 |
| 품종·나이·성별 (선택) | `diagnosis_id` (export 파일에 미포함) |

### 6.2 DB 내 추적 (운영)

- `collected_samples.diagnosis_id` → 내부 감사·분쟁 대응용
- Admin API는 **관리자 role**만 접근
- export API는 **confirmed + reviewer_id 기록** 필수

### 6.3 Export 시 (학습용, 비식별)

- 파일명: `crop_collected_{uuid}.jpg` (user/pet/diagnosis id 미포함)
- JSON sidecar: 아래 §7 형식
- export ZIP에 **user/pet/email/diagnosis_id 컬럼 금지**
- `manifest.csv` (선택): `sample_uuid, animal_type, device, disease, severity` 만

### 6.4 약관

- 회원가입 약관과 **별도** `학습 데이터 활용 동의 v1` 문구 유지
- `consent_version` 컬럼으로 버전 관리

---

## 7. Export 포맷 — `eye_data` 호환

확정 라벨(`confirmed_*`)이 있는 `label_status=confirmed` 샘플만 export.

### 7.1 디렉터리 구조

```
eye_data/
  collected/                          # 기존 TL과 분리
    개/안구/일반/
      {confirmed_disease}/
        {confirmed_severity}/       # 무, 유, 초기, 비성숙, 성숙, 상, 하 ...
          crop_collected_{uuid}.jpg
          crop_collected_{uuid}.json
    TL2/고양이/안구/일반/
      ...
```

### 7.2 JSON sidecar (기존 TL과 동일 필드)

```json
{
  "images": {
    "meta": {
      "file_name": "crop_collected_a1b2c3d4.jpg",
      "device": "스마트폰",
      "breed": "말티즈",
      "age": 3,
      "gender": "수컷",
      "source": "ganadi_collected",
      "collected_at": "2026-06-01T12:00:00Z"
    }
  },
  "label": {
    "label_deleted": 0,
    "label_disease_nm": "백내장",
    "label_disease_lv_1": "유",
    "label_disease_lv_2": "유",
    "label_disease_lv_3": "성숙",
    "label_source": "admin_review",
    "label_bbox": null
  },
  "ai_snapshot": {
    "top3": [ ... ],
    "all_diseases": { ... },
    "model_version": "random_split"
  }
}
```

- `label_disease_lv_3` = `confirmed_severity` (학습 로더가 읽는 확정 라벨)
- `label_disease_nm` = `confirmed_disease`
- `ai_snapshot`은 학습 필수 아님 — 감사·재분석용 optional 블록
- `EyeDiseaseDataset`은 `label_disease_lv_3` + `device` + `label_deleted`만 필수

### 7.3 Export API 응답 (Phase 2)

```json
{
  "export_batch_id": "20260601_120000",
  "n_exported": 42,
  "download_url": "/api/admin/collected-samples/export/20260601_120000.zip",
  "gap_summary": {
    "dog": {
      "스마트폰": { "백내장": { "성숙": 3, "초기": 1 } }
    }
  }
}
```

---

## 8. 갭 대시보드 집계 (Phase 2 참고)

**목표:** `"스마트폰 + 백내장 + 성숙 = 0장"` 같은 빈칸을 실시간 표시.

```sql
SELECT animal_type, capture_device, confirmed_disease, confirmed_severity, COUNT(*)
FROM collected_samples
WHERE label_status = 'confirmed'
GROUP BY 1, 2, 3, 4;
```

AI-only pending 상태 참고용 (검수 전):

```sql
SELECT animal_type, capture_device, ai_main_disease, COUNT(*)
FROM collected_samples
WHERE label_status = 'pending'
GROUP BY 1, 2, 3;
```

---

## 9. Phase 1 구현 체크리스트 (Cursor용)

- [ ] Alembic: `collected_samples` 테이블 + enum + 인덱스
- [ ] SQLAlchemy model + Pydantic schemas
- [ ] `diagnosis.py`: `training_consent`, `capture_device`, `consent_version` Form 수신
- [ ] `diagnosis.py`: AI 호출 시 `device=capture_device` 전달
- [ ] `diagnosis.py`: consent=true → `collected_samples` insert (AI JSON 전부)
- [ ] consent=true + device 누락 → 400
- [ ] `DiagnoseNew.jsx`: device 라디오 + consent 체크박스 + FormData
- [ ] `diagnosis.js` / store: 새 필드 전달
- [ ] (권장) `diagnosis_results` mirror 컬럼 migration
- [ ] `.env.example` / 약관 문구 stub (`docs/LEGAL_TRAINING_CONSENT_v1.md` — Phase 1 후)

**Phase 1 제외 (Phase 2):** Admin 라벨링 UI, gap dashboard, export ZIP

---

## 10. 리스크 · 결정 사항

| 항목 | 결정 |
|------|------|
| device를 Phase 1에 포함? | **예 — 필수.** 동의 시 미입력 거부 |
| device 기본값 | 클라이언트 UI default `스마트폰`, 서버는 default 없음 |
| crop 좌표 | Phase 1: 클라이언트 crop 결과 이미지만 저장 (`label_bbox=null`) |
| 중복 수집 | `diagnosis_id` UNIQUE로 1진단 1수집 |
| EXIF device 추정 | Phase 1 미사용 — 사용자 선택만 신뢰 |

---

## 부록: 현재 코드 갭 (분석 근거)

1. **`top_3` / `all_diseases` 미저장** — `diagnosis.py` L105–113, AI는 반환하나 DB 미반영  
2. **device 미전달** — AI `Form(device)` 존재 (`api/main.py`), diagnosis 라우터 미연결  
3. **Admin** — 질환 분포(`main_disease`)만 있음, 라벨링 큐·device 갭 없음  

이 스펙은 위 3개 갭을 Phase 1에서 **수집 테이블 중심으로** 해소하고, 검수·export는 Phase 2로 분리한다.
