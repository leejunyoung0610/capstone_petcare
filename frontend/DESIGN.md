# 🎨 GANADI Frontend 설계 문서 (실전용)

---

## 🎯 프로젝트 개요

### 핵심 목표
**3주 안에 작동하는 데모 완성!**

반려동물 보호자가 안구 사진 업로드 → AI 분석 → PDF 다운로드까지 원스톱 서비스

---

## 🛠️ 기술 스택 (최소화)

### Core
- **React** 18.3+ (UI)
- **JavaScript** (TypeScript 제거 - 빠른 개발)
- **Vite** 6.0+ (빌드)

### UI Framework
- **Tailwind CSS** 3.4+ (스타일링)
- **Headless UI** (모달, 드롭다운)
- **Heroicons** (아이콘)

### State Management
- **Zustand** 4.5+ (전역 상태 - React Query 제거)

### Routing
- **React Router** 6.22+ (페이지 라우팅)

### Form
- **React Hook Form** 7.51+ (폼 관리)

### HTTP Client
- **Axios** 1.6+ (API 통신)

### Image Processing
- **react-image-crop** 11.0+ ⭐ (이미지 크롭 - 중요!)
- **react-dropzone** 14.2+ (드래그 앤 드롭)

### Others
- **date-fns** (날짜 포맷)
- **clsx** (클래스 병합)
- **recharts** (차트 - AI 결과 표시)

---

## 📱 페이지 구조 (우선순위 기반)

### Phase 1-3만 구현 (데모용)

```
/ (Landing)
├── /login                   # 로그인 ✅ Phase 1
├── /register               # 회원가입 ✅ Phase 1
└── /dashboard              # 메인 대시보드 ✅ Phase 1
    ├── /pets               # 반려동물 목록 ✅ Phase 2
    │   ├── /new           # 반려동물 등록 ✅ Phase 2
    │   └── /:id/diagnose  # AI 진단 ⭐ Phase 3 (핵심!)
    └── /diagnosis/:id     # 진단 결과 ⭐ Phase 3
```

### 나중에 구현 (Phase 4+)
```
/vet                        # 수의사 전용
├── /login                 # 수의사 로그인
└── /dashboard             # 수의사 대시보드
    ├── /patients          # 담당 반려동물 목록
    ├── /diagnosis/:id     # AI 결과 확인
    └── /opinion/:id       # 수의사 소견 작성
```

---

## 🧩 핵심 컴포넌트 (Phase 1-3)

### Phase 1: 인증 (1일)
```javascript
// pages/Landing.jsx
- 서비스 소개
- 로그인/회원가입 버튼

// pages/auth/Login.jsx
- 이메일/비밀번호 입력
- 로그인 버튼
- JWT 토큰 저장

// pages/auth/Register.jsx
- 회원가입 폼 (이메일, 비밀번호, 이름, 전화번호)
- 유효성 검사

// pages/Dashboard.jsx
- 반려동물 목록 (빈 상태)
- "반려동물 등록하기" 버튼
```

### Phase 2: 반려동물 관리 (1일)
```javascript
// components/pet/PetCard.jsx
- 반려동물 카드 (이름, 종, 프로필 사진)
- "진단 시작" 버튼

// pages/pets/PetNew.jsx
- 반려동물 등록 폼
  * 이름, 종(dog/cat), 품종, 나이, 성별
  * 프로필 이미지 업로드 (선택)
```

### Phase 3: AI 진단 ⭐ (2-3일, 가장 중요!)
```javascript
// pages/diagnosis/DiagnoseNew.jsx ⭐⭐⭐
- react-dropzone: 드래그 앤 드롭
- react-image-crop: 이미지 크롭 ⭐
- 이미지 프리뷰
- "분석 시작" 버튼
- 로딩 상태 (10초)

// pages/diagnosis/DiagnosisResult.jsx ⭐⭐⭐
- AI 분석 결과 표시
  * 10개 질환 리스트
  * 각 질환: 판정(유/무) + 확신도(%)
- recharts: 막대 그래프
- Claude AI 소견서 표시
  * 종합 소견
  * 질환별 분석
  * 수의사 방문 긴급도
  * 보호자 주의사항
- PDF 다운로드 버튼 ⭐
  * Axios로 blob 받기
  * 파일 다운로드 (jsPDF 없이!)
```

---

## 🗄️ 상태 관리 (Zustand만 사용)

### Auth Store
```javascript
// stores/authStore.js
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (email, password) => {
    const response = await authAPI.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    set({ token: access_token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  }
}));
```

### Pet Store
```javascript
// stores/petStore.js
const usePetStore = create((set) => ({
  pets: [],
  currentPet: null,
  
  fetchPets: async () => {
    const response = await petsAPI.getAll();
    set({ pets: response.data });
  },
  
  createPet: async (data) => {
    await petsAPI.create(data);
    // fetchPets 다시 호출
  }
}));
```

### Diagnosis Store
```javascript
// stores/diagnosisStore.js
const useDiagnosisStore = create((set) => ({
  currentDiagnosis: null,
  isAnalyzing: false,
  
  analyzePet: async (petId, imageFile) => {
    set({ isAnalyzing: true });
    const response = await diagnosisAPI.analyze(petId, imageFile);
    set({ currentDiagnosis: response.data, isAnalyzing: false });
    return response.data;
  },
  
  downloadPDF: async (diagnosisId, petName) => {
    // AI 서버가 PDF 직접 반환 ⭐
    const response = await axios.post(
      'http://localhost:8000/api/ai/pdf',
      { /* 진단 데이터 */ },
      { responseType: 'blob' }  // blob으로 받기!
    );
    
    // 파일 다운로드
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${petName}_AI_screening.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}));
```

---

## 🎨 핵심 구현: 이미지 크롭 & 업로드

### DiagnoseNew.jsx (핵심!)
```javascript
import { useDropzone } from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function DiagnoseNew() {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [croppedImage, setCroppedImage] = useState(null);
  
  // 1. 드래그 앤 드롭
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  });
  
  // 2. 이미지 크롭 (react-image-crop)
  const onCropComplete = (crop) => {
    makeClientCrop(crop);
  };
  
  const makeClientCrop = async (crop) => {
    if (image && crop.width && crop.height) {
      const croppedImageUrl = await getCroppedImg(image, crop);
      setCroppedImage(croppedImageUrl);
    }
  };
  
  // 3. AI 분석 시작
  const handleAnalyze = async () => {
    const blob = await fetch(croppedImage).then(r => r.blob());
    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
    
    const result = await diagnosisStore.analyzePet(petId, file);
    navigate(`/diagnosis/${result.id}`);
  };
  
  return (
    <div>
      {/* 드래그 앤 드롭 영역 */}
      {!image && (
        <div {...getRootProps()} className="border-dashed border-2 p-10">
          <input {...getInputProps()} />
          <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
        </div>
      )}
      
      {/* 이미지 크롭 */}
      {image && !croppedImage && (
        <ReactCrop
          crop={crop}
          onChange={c => setCrop(c)}
          onComplete={onCropComplete}
        >
          <img src={image} alt="Upload" />
        </ReactCrop>
      )}
      
      {/* 크롭된 이미지 프리뷰 */}
      {croppedImage && (
        <div>
          <img src={croppedImage} alt="Cropped" />
          <button onClick={handleAnalyze}>
            분석 시작
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📥 PDF 다운로드 (jsPDF 없이!)

### AI 서버가 PDF 직접 생성 → blob으로 받아서 다운로드

```javascript
// stores/diagnosisStore.js
downloadPDF: async (petName, animalType, predictions, report) => {
  try {
    // AI 서버에 PDF 요청
    const response = await axios.post(
      'http://localhost:8000/api/ai/pdf',
      {
        pet_name: petName,
        animal_type: animalType,
        predictions: predictions,
        report: report
      },
      {
        responseType: 'blob',  // ⭐ blob으로 받기!
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 파일 다운로드
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${petName}_AI_screening_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF 다운로드 실패:', error);
    throw error;
  }
}
```

---

## 🏥 수의사 화면 (Phase 4+)

### 추가 필요한 페이지

```javascript
// pages/vet/VetDashboard.jsx
- 담당 반려동물 목록
- 최근 AI 분석 결과 요약

// pages/vet/PatientList.jsx
- 담당 반려동물 상세 목록
- 진단 이력 보기

// pages/vet/DiagnosisReview.jsx
- AI 분석 결과 확인
- 원본 이미지 + AI 히트맵
- 10개 질환 결과 확인

// pages/vet/OpinionWrite.jsx ⭐
- 수의사 소견 작성 폼
  * AI 결과 참고
  * 추가 소견 입력
  * 추천 치료법
  * 재진 일정
- 소견 저장 → 보호자에게 알림
```

---

## 📁 폴더 구조 (JavaScript 기반)

```
GANADI-frontend/
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── src/
│   ├── api/                    # API 통신
│   │   ├── client.js           # Axios 클라이언트
│   │   ├── auth.js
│   │   ├── pets.js
│   │   └── diagnosis.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Loading.jsx
│   │   ├── pet/
│   │   │   ├── PetCard.jsx
│   │   │   └── PetForm.jsx
│   │   └── diagnosis/
│   │       ├── ImageUploader.jsx  ⭐ (react-dropzone)
│   │       ├── ImageCropper.jsx   ⭐ (react-image-crop)
│   │       ├── ResultChart.jsx    (recharts)
│   │       └── ReportCard.jsx     (Claude 소견서)
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx          ✅ Phase 1
│   │   │   └── Register.jsx       ✅ Phase 1
│   │   ├── Dashboard.jsx          ✅ Phase 1
│   │   ├── pets/
│   │   │   ├── PetList.jsx        ✅ Phase 2
│   │   │   └── PetNew.jsx         ✅ Phase 2
│   │   ├── diagnosis/
│   │   │   ├── DiagnoseNew.jsx    ⭐ Phase 3
│   │   │   └── DiagnosisResult.jsx ⭐ Phase 3
│   │   └── vet/                   (Phase 4+)
│   │       ├── VetDashboard.jsx
│   │       ├── PatientList.jsx
│   │       ├── DiagnosisReview.jsx
│   │       └── OpinionWrite.jsx   ⭐
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── petStore.js
│   │   └── diagnosisStore.js
│   ├── utils/
│   │   ├── format.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 📦 의존성 설치

```bash
cd ~/GANADI-frontend

# 기본 의존성
npm install

# UI
npm install -D tailwindcss postcss autoprefixer
npm install @headlessui/react @heroicons/react
npm install clsx

# 라우터 & 상태관리
npm install react-router-dom
npm install zustand

# HTTP & 폼
npm install axios
npm install react-hook-form

# 이미지 처리 ⭐
npm install react-dropzone
npm install react-image-crop

# 차트
npm install recharts

# 유틸
npm install date-fns
```

---

## 🎯 개발 우선순위 (실전!)

### 🔥 Phase 1: 인증 (1일) - 필수!
- [x] 프로젝트 설정
- [ ] Tailwind 설정
- [ ] 라우터 설정
- [ ] 로그인 페이지 UI
- [ ] 회원가입 페이지 UI
- [ ] Auth API 연동
- [ ] Auth Store
- [ ] 토큰 관리

**데모 가능**: 로그인해서 대시보드 진입

### 🔥 Phase 2: 반려동물 (1일) - 필수!
- [ ] 반려동물 목록 UI
- [ ] 반려동물 등록 폼
- [ ] Pet API 연동
- [ ] Pet Store

**데모 가능**: 반려동물 등록 → 목록에 표시

### 🔥 Phase 3: AI 진단 (2-3일) - 핵심!
- [ ] 이미지 업로더 (react-dropzone)
- [ ] 이미지 크롭 (react-image-crop) ⭐
- [ ] AI 분석 로딩
- [ ] 결과 차트 (recharts)
- [ ] Claude 소견서 표시
- [ ] PDF 다운로드 (blob)
- [ ] Diagnosis API 연동
- [ ] Diagnosis Store

**데모 가능**: 전체 플로우 완성! 🎉

### 📅 Phase 4: 진단 이력 (1일) - 나중에
- [ ] 이력 목록
- [ ] 이력 상세
- [ ] 필터/검색

### 🏥 Phase 5: 수의사 (2일) - 나중에
- [ ] 수의사 로그인
- [ ] 담당 반려동물 목록
- [ ] AI 결과 확인
- [ ] 수의사 소견 작성 ⭐

### 🎨 Phase 6: 개선 (1-2일) - 나중에
- [ ] 반응형
- [ ] 애니메이션
- [ ] 에러 처리

**총 데모용 개발: 4-5일**

---

## ⚡ 빠른 시작

```bash
# 1. 의존성 설치
cd ~/GANADI-frontend
npm install
npx tailwindcss init -p

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 확인
http://localhost:5173
```

---

## 🎯 핵심 요약

### ✅ 변경 사항
- ✅ TypeScript → **JavaScript** (빠른 개발)
- ✅ React Query 제거 (Zustand만 사용)
- ✅ **react-image-crop** 명시 추가 ⭐
- ✅ jsPDF 제거 (AI 서버 PDF 사용)
- ✅ 수의사 소견 페이지 추가

### 🎯 우선순위
1. **Phase 1-3만 집중** (4-5일)
2. 작동하는 데모 완성
3. Phase 4-6은 시간 되면

### ⭐ 핵심 기능
1. **react-image-crop**: 이미지 크롭
2. **PDF 다운로드**: Axios blob
3. **수의사 소견**: OpinionWrite.jsx

---

**작성일**: 2026.03.16  
**버전**: 2.0.0 (실전용)  
**상태**: 설계 완료, 바로 구현 시작!
