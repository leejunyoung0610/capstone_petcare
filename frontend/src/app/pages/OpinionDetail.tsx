import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getOpinion, downloadOpinionPDF } from "../../api/opinions";
import { Header } from "../components/Header";
import { FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Opinion {
  id: number;
  opinion_text: string;
  visit_required: boolean;
  recommended_action: string | null;
  created_at: string;
  pdf_url: string | null;
  opinion_request: {
    symptom_description: string;
    pet: { name: string; species: string };
    vet: { name: string; hospital_name: string; speciality: string };
    diagnosis_result?: {
      id: number;
      main_disease: string | null;
      main_confidence: number | null;
      is_normal: boolean;
    };
  };
}

export function OpinionDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [opinion, setOpinion] = useState<Opinion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requestId) return;
    getOpinion(requestId)
      .then(setOpinion)
      .catch(() => setError("소견 정보를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [requestId]);

  const handleDownloadPDF = async () => {
    if (!opinion) return;
    try {
      setIsPdfLoading(true);
      await downloadOpinionPDF(opinion.id);
    } catch {
      alert("PDF 다운로드에 실패했습니다.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-500">소견 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opinion) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">오류가 발생했습니다</h2>
          <p className="text-slate-500 mb-6">{error || "소견을 찾을 수 없습니다."}</p>
          <button
            onClick={() => navigate("/mypage")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { opinion_text, visit_required, recommended_action, created_at, opinion_request } = opinion;
  const { pet, vet, symptom_description, diagnosis_result } = opinion_request;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate("/opinions")}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          소견 목록으로 돌아가기
        </button>

        <h1 className="text-xl font-bold text-slate-900 mb-1">수의사 소견서</h1>
        <p className="text-sm text-slate-500 mb-8">
          {format(new Date(created_at), "yyyy년 MM월 dd일 HH:mm")} 발급
        </p>

        <div className="space-y-4">
          {/* 수의사 & 반려동물 정보 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">수의사 정보</p>
                <p className="font-bold text-slate-900">{vet.name}</p>
                <p className="text-sm text-slate-500">{vet.hospital_name}</p>
                <p className="text-sm text-slate-500">{vet.speciality}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">반려동물 정보</p>
                <p className="font-bold text-slate-900">{pet.name}</p>
                <p className="text-sm text-slate-500">
                  {pet.species === "DOG" ? "🐕 강아지" : "🐱 고양이"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">요청일</p>
                <p className="text-sm text-slate-700">
                  {format(new Date(created_at), "yyyy년 MM월 dd일 HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">상태</p>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${opinion_text ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  }`}>
                  {opinion_text ? "완료" : "대기중"}
                </span>
              </div>
            </div>
          </div>

          {/* 병원 방문 권유 여부 */}
          <div className={`rounded-xl border p-5 ${visit_required
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
            }`}>
            <div className="flex items-center gap-4">
              {visit_required ? (
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              )}
              <div>
                <p className={`font-bold ${visit_required ? "text-red-700" : "text-green-700"}`}>
                  {visit_required ? "동물병원 방문이 필요합니다" : "당장 방문하지 않아도 됩니다"}
                </p>
                {recommended_action && (
                  <p className="text-sm text-slate-600 mt-1">{recommended_action}</p>
                )}
              </div>
            </div>
          </div>

          {/* AI 분석 결과 요약 */}
          {diagnosis_result && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 mb-3">첨부된 AI 분석 결과</p>
              {diagnosis_result.is_normal ? (
                <p className="text-green-700 font-bold">✅ 이상 징후 없음</p>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-bold text-red-700">
                    ⚠️ {diagnosis_result.main_disease} 의심
                  </p>
                  <p className="font-bold text-red-600">
                    {diagnosis_result.main_confidence}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 보호자가 입력한 증상 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 mb-3">보호자가 입력한 증상</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {symptom_description}
            </p>
          </div>

          {/* 수의사 소견 내용 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 mb-3">수의사 소견</p>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line">
              {opinion_text}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => navigate("/opinions")}
            >
              목록으로
            </button>
            <button
              className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
            >
              <FileText className="inline w-4 h-4 mr-2" />
              {isPdfLoading ? "다운로드 중..." : "소견서 PDF 다운로드"}
            </button>
          </div>

          {/* 리뷰 작성 버튼 */}
          <Link to={`/opinions/${requestId}/review`}>
            <button className="w-full py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
              ⭐ 리뷰 작성
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}