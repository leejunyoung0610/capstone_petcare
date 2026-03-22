# 반려동물 안구질환 AI 모델

세종대학교 컴퓨터공학과 캡스톤디자인 2026-1

---

## 프로젝트 개요

반려동물(강아지/고양이) 눈 사진을 입력받아 안구 질환을 AI로 스크리닝하는 모델.  
보호자가 스마트폰으로 찍은 사진 → 자동 눈 감지 → 질환별 확률 출력.

웹은 `frontend/`, 앱·DB 연동 API는 `backend/`, 눈 이미지 추론은 `api/`에서 각각 띄워서 맞춥니다.

---

## 환경 설정

### 1. 가상환경 생성

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화 (macOS/Linux)
source venv/bin/activate

# 가상환경 활성화 (Windows)
# venv\Scripts\activate
```

### 2. 패키지 설치

```bash
# 의존성 패키지 설치
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. MPS (Apple Silicon) 가속 확인

```bash
python -c "import torch; print(f'MPS 사용 가능: {torch.backends.mps.is_available()}')"
```

---

## 프로젝트 구조

```
capstone_petcare/
├── venv/                   # 가상환경 (git 제외)
├── eye_data/              # 데이터셋
├── models/
│   ├── yolo/              # YOLOv8 눈 감지 모델
│   │   ├── prepare_yolo_dataset.py
│   │   ├── train_yolo.py
│   │   └── eye_detection.yaml
│   └── classifier/        # EfficientNet-B3 질환 분류 모델
│       ├── dataset.py
│       ├── model.py
│       ├── train.py
│       └── predict.py
├── api/                   # AI 추론 FastAPI (예: 포트 8000)
│   └── main.py
├── backend/               # 앱 백엔드 API (DB·인증·진단 연계)
├── frontend/            # 웹 UI (Vite + React)
├── requirements.txt       # 루트(AI) 패키지 의존성
├── .gitignore
└── README.md
```

---

## 모델 구성

### 모델 1. YOLOv8 눈 감지 (Eye Detection)
- 원본 사진에서 눈 영역 Bounding Box 감지 후 크롭
- 학습 데이터: TS 원천 이미지 + TL JSON의 label_bbox 좌표
- 출력: 크롭된 눈 이미지 (400×400)

### 모델 2. EfficientNet-B3 멀티태스크 질환 분류
- 공유 백본(EfficientNet-B3) + 질환별 독립 분류 헤드
- 강아지/고양이 각각 별도 모델로 학습
- 각 질환 헤드가 독립적으로 유무/중증도 분류
- 복합 질환 동시 감지 가능

---

## 강아지 모델 질환 헤드

| 질환 | 클래스 | 폴더 |
|------|--------|------|
| 결막염 | 무/유 | eye_data/TL1/개/안구/일반/결막염/ |
| 궤양성각막질환 | 무/상/하 | eye_data/TL1/개/안구/일반/궤양성각막질환/ |
| 백내장 | 무/초기/비성숙/성숙 | eye_data/TL1/개/안구/일반/백내장/ |
| 비궤양성각막질환 | 무/상/하 | eye_data/TL1/개/안구/일반/비궤양성각막질환/ |
| 색소침착성각막염 | 무/유 | eye_data/TL1/개/안구/일반/색소침착성각막염/ |
| 안검내반증 | 무/유 | eye_data/TL2/개/안구/일반/안검내반증/ |
| 안검염 | 무/유 | eye_data/TL2/개/안구/일반/안검염/ |
| 안검종양 | 무/유 | eye_data/TL2/개/안구/일반/안검종양/ |
| 유루증 | 무/유 | eye_data/TL2/개/안구/일반/유루증/ |
| 핵경화 | 무/유 | eye_data/TL2/개/안구/일반/핵경화/ |

## 고양이 모델 질환 헤드

| 질환 | 클래스 | 폴더 |
|------|--------|------|
| 각막궤양 | 무/유 | eye_data/TL2/고양이/안구/일반/각막궤양/ |
| 각막부골편 | 무/유 | eye_data/TL2/고양이/안구/일반/각막부골편/ |
| 결막염 | 무/유 | eye_data/TL2/고양이/안구/일반/결막염/ |
| 비궤양성각막염 | 무/유 | eye_data/TL2/고양이/안구/일반/비궤양성각막염/ |
| 안검염 | 무/유 | eye_data/TL2/고양이/안구/일반/안검염/ |

---

## 데이터셋 구조

```
eye_data/
├── TL1/          # 라벨링 데이터 (크롭 완료 400×400)
│   └── 개/안구/일반/{질환}/{중증도}/
│       ├── crop_D0_xxxxx.jpg   # 크롭 이미지
│       └── crop_D0_xxxxx.json  # 라벨 JSON
├── TL2/          # 라벨링 데이터 추가 질환
│   ├── 개/안구/일반/{질환}/{중증도}/
│   └── 고양이/안구/일반/{질환}/{중증도}/
├── VL/           # Validation 라벨링 데이터
└── TS1/          # 원천 데이터 (원본 고해상도 3264×2448)
    └── 개/안구/일반/{질환}/{중증도}/
        ├── D0_xxxxx.jpg    # 원본 이미지 (crop_ 없음)
        └── D0_xxxxx.json   # JSON (label_bbox 포함)
```

### 핵심 JSON 필드

```json
{
  "images": {
    "meta": {
      "file_name": "D0_02f99e22-xxxx.jpg",
      "device": "일반카메라",
      "breed": "말티즈",
      "age": 3,
      "gender": "수컷"
    }
  },
  "label": {
    "label_deleted": 0,
    "label_disease_nm": "결막염",
    "label_disease_lv_1": "유",
    "label_disease_lv_2": "유",
    "label_disease_lv_3": "유",
    "label_bbox": [x, y, w, h]
  }
}
```

### 데이터 필터 조건

```python
if label["label_deleted"] == 1: skip          # 삭제된 데이터
if device in ["안구초음파", "안저카메라"]: skip  # 전문 장비 이미지 제외
label = label["label_disease_lv_3"]            # 확정 라벨만 사용
```

---

## 기술 스택

- Python 3.10+
- PyTorch 2.x + MPS (MacBook M4)
- timm (EfficientNet-B3)
- Ultralytics YOLOv8
- Albumentations (augmentation)
- pytorch-grad-cam (GradCAM 히트맵)
- FastAPI + Uvicorn (AI 서버)
- ONNX Runtime (추론 최적화)

---

## UUID 매칭 방법 (TS ↔ TL)

```
TL 파일: crop_D0_02f99e22-60a5-11ec-8402-0a7404972c70.jpg
TS 파일:       D0_02f99e22-60a5-11ec-8402-0a7404972c70.jpg

"crop_" 제거하면 동일한 UUID → 1:1 매칭 가능
TL JSON의 label_bbox를 TS 원본 이미지에 적용하여 YOLO 라벨 생성
```

---

## 개발 단계

1. ✅ 환경 설정 및 프로젝트 구조 생성
3. ⬜ YOLOv8 눈 감지 모델 학습
4. ⬜ EfficientNet-B3 질환 분류 모델 학습
5. ⬜ FastAPI 서버 구축
6. ⬜ 모델 최적화 및 배포

---

## 라이선스

세종대학교 컴퓨터공학과 캡스톤디자인 프로젝트
