import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ChevronLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { getDiagnosis } from "../../api/diagnosis";
import { getOpinion } from "../../api/opinions";

interface Prediction {
  label: string;
  confidence: number;
}

interface Diagnosis {
  id: number;
  main_disease: string | null;
  main_confidence: number | null;
  is_normal: boolean;
  predictions: Record<string, Prediction>;
  input_image_url: string;
  heatmap_url: string | null;
  created_at: string;
}

interface OpinionRequest {
  symptom_description: string;
  image_urls?: string[] | null;
  pet: { name: string; species: string; age: number };
  user: { nickname: string };
}

export function VetDiagnosisDetail() {
  const { diagnosisId } = useParams();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [opinionRequest, setOpinionRequest] = useState<OpinionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!diagnosisId) return;
    const promises: Promise<any>[] = [
      getDiagnosis(parseInt(diagnosisId)),
    ];
    if (requestId) {
      promises.push(getOpinion(requestId));
    }
    Promise.all(promises)
      .then(([diag, req]) => {
        setDiagnosis(diag);
        if (req) setOpinionRequest(req.opinion_request ?? req);
      })
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [diagnosisId, requestId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          불러오는 중…
        </div>
      </div>
    );
  }

  if (error || !diagnosis) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">오류가 발생했습니다</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link to="/vet/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <Link
          to="/vet/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4" />
          대시보드로
        </Link>
        <h1 className="mt-2 text-lg font-bold text-slate-900">AI 분석 결과 & 소견 요청 상세</h1>
        <p className="text-xs text-slate-500">진단 #{diagnosisId}</p>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* 보호자/반려동물 정보 */}
        {opinionRequest && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">소견 요청 정보</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">반려동물</p>
                <p className="font-semibold">
                  {opinionRequest.pet?.name} ({opinionRequest.pet?.species === "DOG" ? "강아지" : "고양이"}, {opinionRequest.pet?.age}세)
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">보호자</p>
                <p className="font-semibold">{opinionRequest.user?.nickname}</p>
              </div>
            </div>
          </div>
        )}

        {/* 결과 요약 */}
        <div className={`rounded-xl border p-5 shadow-sm ${
          diagnosis.is_normal ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-4">
            {diagnosis.is_normal ? (
              <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className={`text-xl font-bold ${diagnosis.is_normal ? "text-green-700" : "text-red-700"}`}>
                {diagnosis.is_normal ? "이상 징후 없음" : diagnosis.main_disease}
              </p>
              {!diagnosis.is_normal && (
                <p className="text-sm text-slate-600 mt-1">
                  신뢰도: <strong>{diagnosis.main_confidence}%</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 이미지 & 히트맵 */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">원본 이미지</h3>
              <img src={diagnosis.input_image_url} alt="원본 이미지" className="w-full rounded-lg object-cover" />
            </div>

            {diagnosis.heatmap_url && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  GradCAM 히트맵
                  <span className="ml-2 text-xs font-normal text-slate-400">(빨간색 = 고신뢰 영역)</span>
                </h3>
                <img src={diagnosis.heatmap_url} alt="GradCAM 히트맵" className="w-full rounded-lg object-cover" />
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 낮음</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 중간</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> 높음</span>
                </div>
              </div>
            )}

            {/* 추가 사진 */}
            {opinionRequest?.image_urls && opinionRequest.image_urls.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">보호자 추가 사진</h3>
                <div className="grid grid-cols-3 gap-2">
                  {opinionRequest.image_urls.map((url, i) => (
                    <img key={i} src={url} alt={`추가 사진 ${i + 1}`} className="w-full rounded-lg object-cover aspect-square" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 질환별 확률 + 증상 */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">질환별 확률</h3>
              <div className="space-y-3">
                {Object.entries(diagnosis.predictions)
                  .sort((a, b) => b[1].confidence - a[1].confidence)
                  .map(([disease, pred]) => (
                    <div key={disease}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={pred.label === "유" ? "font-bold text-red-600" : "text-slate-600"}>
                          {disease}
                        </span>
                        <span className="font-mono font-bold">{pred.confidence}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pred.label === "유" ? "bg-red-500" : "bg-slate-300"}`}
                          style={{ width: `${Math.min(100, pred.confidence)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 증상 설명 */}
            {opinionRequest?.symptom_description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">보호자 증상 설명</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {opinionRequest.symptom_description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}