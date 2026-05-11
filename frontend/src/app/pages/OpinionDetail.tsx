import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getOpinion, downloadOpinionPDF } from "../../api/opinions";
import { Header } from "../components/Header";
import { FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { format, addHours } from "date-fns";

interface Opinion {
  id: number;
  content: string | null;
  visit_required: boolean;
  recommendation: string | null;
  created_at: string;
  answered_at: string | null;
  symptom_memo: string | null;
  vet_name: string | null;
  hospital_name: string | null;
  pet_name: string | null;
  owner_name: string | null;
  diagnosis: {
    id: number;
    main_disease: string | null;
    main_confidence: number | null;
    is_normal: boolean;
    image_url: string | null;
  } | null;
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
            onClick={() => navigate("/mypage?tab=opinions")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { content, visit_required, recommendation, created_at, answered_at, symptom_memo, vet_name, hospital_name, pet_name, diagnosis } = opinion;

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/mypage")}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          소견 목록으로 돌아가기
        </button>

        <h1 className="text-xl font-bold text-slate-900 mb-1">수의사 소견서</h1>
        <p className="text-sm text-slate-500 mb-8">
          {format(addHours(new Date(answered_at ?? created_at), 9), "yyyy년 MM월 dd일 HH:mm")} 발급
        </p>

        <div className="space-y-4">
          {/* 수의사 & 반려동물 정보 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">수의사 정보</p>
                <p className="font-bold text-slate-900">{vet_name}</p>
                <p className="text-sm text-slate-500">{hospital_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">반려동물 정보</p>
                <p className="font-bold text-slate-900">{pet_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">요청일</p>
                <p className="text-sm text-slate-700">
                  {format(addHours(new Date(created_at), 9), "yyyy년 MM월 dd일 HH:mm")}
                </p>
              </div>
              <div className="flex flex-col items-start">
                <p className="text-xs font-bold text-slate-400 mb-2">상태</p>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${content ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  }`}>
                  {content ? "완료" : "대기중"}
                </span>
              </div>
            </div>
          </div>

          {/* 병원 방문 권유 여부 */}
          <div className={`rounded-xl border p-5 ${visit_required ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
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
                {recommendation && (
                  <p className="text-sm text-slate-600 mt-1">{recommendation}</p>
                )}
              </div>
            </div>
          </div>

          {/* AI 분석 결과 요약 */}
          {diagnosis && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 mb-3">첨부된 AI 분석 결과</p>
              {diagnosis.is_normal ? (
                <p className="text-green-700 font-bold">✅ 이상 징후 없음</p>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-bold text-red-700">⚠️ {diagnosis.main_disease} 의심</p>
                  <p className="font-bold text-red-600">{diagnosis.main_confidence}%</p>
                </div>
              )}
            </div>
          )}

          {/* 보호자가 입력한 증상 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 mb-3">보호자가 입력한 증상</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {symptom_memo || "—"}
            </p>
          </div>

          {/* 수의사 소견 내용 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 mb-3">수의사 소견</p>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line">
              {content || "—"}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
            >
              <FileText className="inline w-4 h-4 mr-2" />
              {isPdfLoading ? "다운로드 중..." : "소견서 PDF 다운로드"}
            </button>
            <Link to={`/opinions/${requestId}/review`} className="flex-1">
              <button className="w-full py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                ⭐ 리뷰 작성
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}