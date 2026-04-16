import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getOpinion } from "../../api/opinions";
import { downloadOpinionPDF } from "../../api/opinions";
import { Header } from "../components/Header";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-gray-500">소견 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opinion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error || "소견을 찾을 수 없습니다."}</p>
          <WireframeButton variant="secondary" onClick={() => navigate("/mypage")}>
            마이페이지로 돌아가기
          </WireframeButton>
        </div>
      </div>
    );
  }

  const { opinion_text, visit_required, recommended_action, created_at, opinion_request } = opinion;
  const { pet, vet, symptom_description, diagnosis_result } = opinion_request;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate("/mypage")}
          className="flex items-center gap-2 text-sm text-gray-600 mb-6 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          마이페이지로 돌아가기
        </button>

        <h1 className="text-3xl font-bold mb-2">수의사 소견서</h1>
        <p className="text-gray-600 mb-8">
          {format(new Date(created_at), "yyyy년 MM월 dd일 HH:mm")} 발급
        </p>

        <div className="space-y-6">
          {/* 수의사 & 반려동물 정보 */}
          <WireframeBox label="INFO" className="bg-blue-50">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">수의사 정보</p>
                <p className="font-bold text-lg">{vet.name}</p>
                <p className="text-sm text-gray-600">{vet.hospital_name}</p>
                <p className="text-sm text-gray-600">{vet.speciality}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">반려동물 정보</p>
                <p className="font-bold text-lg">{pet.name}</p>
                <p className="text-sm text-gray-600">
                  {pet.species === "DOG" ? "🐕 강아지" : "🐱 고양이"}
                </p>
              </div>
            </div>
          </WireframeBox>

          {/* 병원 방문 권유 여부 — 가장 눈에 띄게 */}
          <WireframeBox
            label="VISIT REQUIRED"
            className={visit_required ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"}
          >
            <div className="flex items-center gap-4">
              {visit_required ? (
                <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
              )}
              <div>
                <p className={`text-xl font-bold ${visit_required ? "text-red-700" : "text-green-700"}`}>
                  {visit_required ? "동물병원 방문이 필요합니다" : "당장 방문하지 않아도 됩니다"}
                </p>
                {recommended_action && (
                  <p className="text-sm text-gray-700 mt-1">{recommended_action}</p>
                )}
              </div>
            </div>
          </WireframeBox>

          {/* AI 분석 결과 요약 (첨부된 경우) */}
          {diagnosis_result && (
            <WireframeBox label="AI ANALYSIS SUMMARY" className="bg-gray-50">
              <p className="text-xs font-bold text-gray-500 mb-3">첨부된 AI 분석 결과</p>
              {diagnosis_result.is_normal ? (
                <p className="text-green-700 font-bold">✅ 이상 징후 없음</p>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-bold text-red-700">
                    ⚠️ {diagnosis_result.main_disease} 의심
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {diagnosis_result.main_confidence}%
                  </p>
                </div>
              )}
            </WireframeBox>
          )}

          {/* 보호자가 입력한 증상 */}
          <WireframeBox label="SYMPTOM DESCRIPTION">
            <p className="text-xs font-bold text-gray-500 mb-3">보호자가 입력한 증상</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {symptom_description}
            </p>
          </WireframeBox>

          {/* 수의사 소견 내용 */}
          <WireframeBox label="VET OPINION" className="bg-white">
            <p className="text-xs font-bold text-gray-500 mb-3">수의사 소견</p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {opinion_text}
            </p>
          </WireframeBox>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4">
            <WireframeButton
              variant="outline"
              className="flex-1 py-3"
              onClick={() => navigate("/mypage")}
            >
              마이페이지로
            </WireframeButton>
            <WireframeButton
              variant="primary"
              className="flex-1 py-3"
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
            >
              <FileText className="inline w-4 h-4 mr-2" />
              {isPdfLoading ? "다운로드 중..." : "소견서 PDF 다운로드"}
            </WireframeButton>
          </div>
        </div>
      </div>
    </div>
  );
}