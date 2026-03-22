import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDropzone } from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload as UploadIcon, Camera } from 'lucide-react';
import usePetStore from '../../stores/petStore';
import useDiagnosisStore from '../../stores/diagnosisStore';
import Button from '../../components/ui/Button';
import { WireframeBox } from '../../components/WireframeBox';
import { WireframeButton } from '../../components/WireframeButton';

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!selectedPetId) {
      alert('반려동물을 선택해주세요.');
      return;
    }
    if (!image) {
      alert('이미지를 업로드해주세요.');
      return;
    }

    try {
      const result = await analyzePet(parseInt(selectedPetId), image);
      navigate(`/diagnosis/${result.id}`);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setShowCrop(false);
    setCrop({ unit: '%', width: 90, aspect: 1 });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-link">Screening</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        안구 사진 AI 스크리닝
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
        반려동물을 선택한 뒤 선명한 눈 사진을 올려 주세요. 결과는 참고용이며, 이상이 의심되면 반드시
        병원 진료를 받으세요.
      </p>

      <div className="mb-12 mt-10 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-6 shadow-sm backdrop-blur-sm sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 rounded-full bg-blue-50 px-3 py-2 ring-1 ring-blue-100">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-link text-sm font-bold text-white shadow-sm">
              1
            </div>
            <span className="font-mono text-[13px] font-semibold text-slate-800">반려동물</span>
          </div>
          <div className="hidden h-px w-10 bg-gradient-to-r from-transparent via-slate-300 to-transparent sm:block md:w-14" />
          <div
            className={`flex items-center gap-2.5 rounded-full px-3 py-2 ring-1 ${
              image ? 'bg-blue-50 ring-blue-100' : 'bg-slate-50 ring-slate-200/80'
            }`}
          >
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
                image ? 'bg-brand-link' : 'bg-slate-400'
              }`}
            >
              2
            </div>
            <span
              className={`font-mono text-[13px] ${image ? 'font-semibold text-slate-800' : 'text-slate-500'}`}
            >
              사진 업로드
            </span>
          </div>
          <div className="hidden h-px w-10 bg-gradient-to-r from-transparent via-slate-300 to-transparent sm:block md:w-14" />
          <div className="flex items-center gap-2.5 rounded-full bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
            <div className="flex size-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-white">
              3
            </div>
            <span className="font-mono text-[13px] text-slate-500">AI 분석</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <WireframeBox label="PET SELECTOR" className="bg-card">
              <h3 className="mb-4 font-mono font-bold text-foreground">1. 반려동물 선택</h3>
              <select
                className="w-full rounded-md border-2 border-border bg-input-background px-3 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-link/30"
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
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
              <Link to="/pets/new" className="mt-3 block font-mono text-sm text-brand-link hover:underline">
                + 새 반려동물 등록하기
              </Link>
            </WireframeBox>

            <WireframeBox label="IMAGE UPLOAD" className="bg-card">
              <h3 className="mb-4 font-mono font-bold text-foreground">2. 눈 사진 업로드</h3>

              {!imagePreview ? (
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-lg border-4 border-dashed p-12 text-center transition ${
                    isDragActive
                      ? 'border-brand-link bg-blue-50'
                      : 'border-muted-foreground/40 hover:border-brand-link/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadIcon className="mx-auto mb-4 size-16 text-muted-foreground" />
                  <p className="mb-2 font-mono text-sm text-muted-foreground">
                    {isDragActive
                      ? '여기에 이미지를 놓으세요'
                      : '클릭하거나 드래그하여 사진 업로드'}
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG 파일 지원</p>
                </div>
              ) : (
                <div>
                  {showCrop && (
                    <div className="mb-4">
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                      >
                        <img src={imagePreview} alt="Preview" className="max-w-full" />
                      </ReactCrop>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleReset}
                      className="flex-1"
                    >
                      다시 선택
                    </Button>
                    {showCrop && (
                      <Button
                        variant="primary"
                        onClick={() => setShowCrop(false)}
                        className="flex-1"
                      >
                        크롭 완료
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <WireframeButton variant="outline" type="button" className="flex w-full items-center justify-center gap-2" disabled>
                  <Camera className="size-4" />
                  카메라로 촬영 (준비 중)
                </WireframeButton>
              </div>
            </WireframeBox>

            <Button
              variant="primary"
              onClick={handleAnalyze}
              loading={loading}
              disabled={!selectedPetId || !image}
              className="h-12 w-full text-base"
            >
              AI 분석 시작하기
            </Button>
          </div>

          <div className="space-y-6">
            <WireframeBox label="GUIDE" className="bg-card">
              <h3 className="mb-4 flex items-center gap-2 font-mono font-bold text-foreground">
                <span className="text-2xl">💡</span>
                좋은 사진 촬영 가이드
              </h3>

              <div className="space-y-4">
                {[
                  ['밝은 조명에서 촬영', '자연광이나 밝은 실내 조명 권장'],
                  ['눈 부분에 초점', '눈이 화면의 중앙에 크게 보이도록'],
                  ['흔들림 없이 선명하게', '흐릿한 사진은 정확도가 낮아집니다'],
                  ['정면 촬영 권장', '측면보다는 정면에서 촬영'],
                ].map(([t, d]) => (
                  <div key={t} className="flex gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </WireframeBox>

            <WireframeBox label="DISEASES" className="bg-blue-50/80">
              <h3 className="mb-4 font-mono font-bold text-foreground">검출 가능 질환</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 font-bold text-brand-link">🐶 강아지 (10종)</p>
                  <p className="text-xs text-muted-foreground">
                    결막염, 각막궤양, 백내장, 녹내장, 유루증, 각막부골편, 각막염, 안검내반증 등
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-bold text-emerald-600">🐱 고양이 (5종)</p>
                  <p className="text-xs text-muted-foreground">결막염, 각막궤양, 각막부골편, 유루증 등</p>
                </div>
              </div>
            </WireframeBox>

            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
              <p className="text-xs text-foreground">
                <strong>⚠️ 알림:</strong> 본 서비스는 사전 스크리닝 목적이며 의료기기가 아닙니다. 최종 진단은
                반드시 동물병원에서 받으시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}
