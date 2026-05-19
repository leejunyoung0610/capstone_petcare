import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDropzone } from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload as UploadIcon, Camera, AlertTriangle } from 'lucide-react';
import usePetStore from '../../stores/petStore';
import useDiagnosisStore from '../../stores/diagnosisStore';
import Button from '../../components/ui/Button';

export default function DiagnoseNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPetId = searchParams.get('petId');

  const { pets, fetchPets } = usePetStore();
  const { analyzePet, loading, error, clearError } = useDiagnosisStore();

  const [selectedPetId, setSelectedPetId] = useState(preselectedPetId || '');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    fetchPets();
    return () => clearError();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 카메라 직접 촬영 — onDrop 과 동일한 후처리 흐름 재사용
  const cameraInputRef = useRef(null);
  const handleCameraSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      e.target.value = '';
      return;
    }
    onDrop([file]);
    // 같은 파일을 다시 선택해도 onChange 가 발화되도록 초기화
    e.target.value = '';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejectedFiles) => {
      const err = rejectedFiles[0]?.errors[0];
      if (err?.code === 'file-too-large') {
        alert('이미지 크기는 5MB 이하여야 합니다.');
      } else if (err?.code === 'file-invalid-type') {
        alert('JPG, PNG 형식의 이미지만 업로드 가능합니다.');
      }
    },
  });

  const handleAnalyze = async () => {
    if (!selectedPetId) { alert('반려동물을 선택해주세요.'); return; }
    if (!image) { alert('이미지를 업로드해주세요.'); return; }
    try {
      const result = await analyzePet(parseInt(selectedPetId), image);
      navigate(`/diagnosis/${result.id}`);
    } catch (err) { }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setShowCrop(false);
    setCrop({ unit: '%', width: 90, aspect: 1 });
  };

  // 단계 진행 상태 — 1: 항상, 2: 사진 선택됨, 3: 분석 가능
  const step = !selectedPetId ? 1 : !image ? 2 : 3;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-10 md:py-14">
      {/* 헤더 — 모바일 압축 */}
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-600">
        Screening
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-3xl md:text-4xl">
        안구 사진 AI 스크리닝
      </h1>
      <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:mt-3 sm:text-sm">
        반려동물을 선택하고 선명한 눈 사진을 올려주세요. 결과는 참고용입니다.
      </p>

      <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 sm:mt-6 sm:p-4 sm:text-sm">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-amber-900">의료기기·진단이 아닙니다</p>
          <p>
            AI 결과는 사전 스크리닝용 참고 정보일 뿐이며 오류가 있을 수 있습니다. 이상 징후가 있거나 불안하면 지체 없이
            동물병원에서 면허 수의사의 진단을 받으세요.
          </p>
        </div>
      </div>

      {/* 진행 상태 — 모바일은 작은 한 줄, sm+ 는 풍성하게 */}
      <div className="mb-5 mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-10 sm:mt-8 sm:p-5">
        <div className="flex items-center justify-center gap-2 py-1">
          <StepPill index={1} label="반려동물" active={step >= 1} />
          <Connector active={step >= 2} />
          <StepPill index={2} label="사진 업로드" active={step >= 2} />
          <Connector active={step >= 3} />
          <StepPill index={3} label="AI 분석" active={step >= 3} />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 sm:mb-6 sm:p-4">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="space-y-3 sm:space-y-4">
          {/* 반려동물 선택 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="mb-2.5 text-sm font-bold text-slate-900 sm:text-base">
              1. 반려동물 선택
            </h3>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                style={{ direction: 'ltr', textAlign: 'left' }}
              >
                <option value="">반려동물을 선택하세요</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species === 'dog' ? '강아지' : '고양이'}
                    {pet.breed && `, ${pet.breed}`}
                    {pet.age && `, ${pet.age}세`})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <Link
              to="/pets/new"
              className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline sm:text-sm"
            >
              + 새 반려동물 등록하기
            </Link>
          </section>

          {/* 이미지 업로드 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="mb-2.5 text-sm font-bold text-slate-900 sm:text-base">
              2. 눈 사진 업로드
            </h3>
            {!imagePreview ? (
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition sm:p-10 ${isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
                  }`}
              >
                <input {...getInputProps()} />
                <UploadIcon className="mx-auto mb-2 h-8 w-8 text-slate-300 sm:mb-3 sm:h-10 sm:w-10" />
                <p className="mb-1 text-xs text-slate-500 sm:text-sm">
                  {isDragActive ? '여기에 이미지를 놓으세요' : '클릭 또는 드래그하여 업로드'}
                </p>
                <p className="text-[11px] text-slate-400 sm:text-xs">
                  JPG · PNG · 최대 5MB
                </p>
              </div>
            ) : (
              <div>
                {showCrop ? (
                  <div className="mb-3 sm:mb-4">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                    >
                      <img
                        ref={imgRef}
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full rounded-lg"
                      />
                    </ReactCrop>
                  </div>
                ) : (
                  <div className="mb-3 sm:mb-4">
                    <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleReset} className="flex-1">
                    다시 선택
                  </Button>
                  {showCrop && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (completedCrop && imgRef.current) {
                          const canvas = document.createElement('canvas');
                          const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
                          const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
                          canvas.width = completedCrop.width * scaleX;
                          canvas.height = completedCrop.height * scaleY;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(
                            imgRef.current,
                            completedCrop.x * scaleX,
                            completedCrop.y * scaleY,
                            completedCrop.width * scaleX,
                            completedCrop.height * scaleY,
                            0,
                            0,
                            canvas.width,
                            canvas.height,
                          );
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
                              setImage(croppedFile);
                              setImagePreview(URL.createObjectURL(blob));
                            }
                          }, 'image/jpeg');
                        }
                        setShowCrop(false);
                      }}
                      className="flex-1"
                    >
                      크롭 완료
                    </Button>
                  )}
                </div>
              </div>
            )}
            {/* 카메라 직접 촬영 — 모바일에서는 후면 카메라가 바로 열림 (capture=environment) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] sm:mt-3 sm:text-sm"
            >
              <Camera className="h-4 w-4" />
              카메라로 촬영
            </button>
          </section>

          <Button
            variant="primary"
            onClick={handleAnalyze}
            loading={loading}
            disabled={!selectedPetId || !image}
            className="h-12 w-full text-sm font-semibold sm:text-base"
          >
            AI 분석 시작하기
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* 촬영 가이드 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 sm:text-base">
              <span className="text-base sm:text-xl">💡</span>
              좋은 사진 촬영 가이드
            </h3>
            <ul className="space-y-2.5">
              {[
                ['밝은 조명에서 촬영', '자연광이나 밝은 실내 조명'],
                ['눈 부분에 초점', '눈이 화면 중앙에 크게'],
                ['흔들림 없이 선명하게', '흐릿하면 정확도 떨어짐'],
                ['정면 촬영 권장', '측면보다 정면이 좋음'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-2.5">
                  <span className="text-sm sm:text-base">✅</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{t}</p>
                    <p className="text-xs text-slate-500">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 검출 가능 질환 */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm sm:p-5">
            <h3 className="mb-2.5 text-sm font-bold text-slate-900 sm:text-base">
              검출 가능 질환
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="mb-0.5 text-xs font-bold text-blue-600 sm:text-sm">
                  🐶 강아지 10종
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  결막염, 각막궤양, 백내장, 녹내장, 유루증, 각막부골편, 각막염, 안검내반증 외
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-bold text-emerald-600 sm:text-sm">
                  🐱 고양이 AI 5개 라벨 · 백과 6건
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  결막염, 각막궤양, 각막부골편, 유루증 외
                </p>
              </div>
            </div>
          </section>

          {/* 주의사항 */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
            <span className="text-base sm:text-lg">⚠️</span>
            <p className="text-[11px] leading-relaxed text-slate-600 sm:text-xs">
              본 서비스는 사전 스크리닝 목적이며 의료기기가 아닙니다. 최종 진단은 동물병원에서 받으세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 진행 단계 1·2·3 칩 */
function StepPill({ index, label, active }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 ring-1 sm:gap-2.5 sm:px-3 sm:py-2 ${active ? 'bg-blue-50 ring-blue-100' : 'bg-slate-50 ring-slate-200'
        }`}
    >
      <span
        className={`text-[11px] font-bold sm:text-sm ${active ? 'text-blue-600' : 'text-slate-300'
          }`}
      >
        {index}
      </span>
      <span
        className={`text-[11px] sm:text-sm ${active ? 'font-semibold text-slate-800' : 'text-slate-400'
          }`}
      >
        {label}
      </span>
    </div>
  );
}

function Connector({ active }) {
  return (
    <div
      className={`h-px w-6 flex-shrink-0 sm:w-10 md:w-14 ${active ? 'bg-blue-200' : 'bg-slate-200'
        }`}
    />
  );
}