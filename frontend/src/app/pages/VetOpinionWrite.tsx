import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { writeVetOpinion } from "../../api/opinions";

export function VetOpinionWrite() {
  const { opinionId } = useParams<{ opinionId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [visitRequired, setVisitRequired] = useState(false);
  const [serviceFee, setServiceFee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      window.alert("소견 본문을 입력해주세요.");
      return;
    }
    const id = Number(opinionId);
    if (!Number.isFinite(id)) {
      window.alert("잘못된 요청입니다.");
      return;
    }
    setSubmitting(true);
    try {
      await writeVetOpinion(id, {
        content: content.trim(),
        recommendation: recommendation.trim() || undefined,
        visit_required: visitRequired,
        service_fee: serviceFee.trim() ? Number(serviceFee) : undefined,
      });
      navigate("/vet/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "저장에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <Link
          to="/vet/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4" />
          대시보드로
        </Link>
        <h1 className="mt-2 text-lg font-bold text-slate-900">소견 작성</h1>
        <p className="text-xs text-slate-500">요청 #{opinionId}</p>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-xs font-semibold text-slate-700">소견 본문 *</label>
          <textarea
            required
            rows={8}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="임상 소견을 입력하세요."
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-xs font-semibold text-slate-700">권고사항</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder="예: 24시간 이내 병원 방문"
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={visitRequired}
              onChange={(e) => setVisitRequired(e.target.checked)}
              className="rounded border-slate-300"
            />
            병원 방문 권고
          </label>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-xs font-semibold text-slate-700">서비스 금액 (원, 선택)</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={serviceFee}
            onChange={(e) => setServiceFee(e.target.value)}
            placeholder="30000"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "저장 중…" : "소견 제출"}
        </button>
      </form>
    </div>
  );
}
