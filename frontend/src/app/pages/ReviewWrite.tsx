import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { rateOpinion } from "../../api/opinions";
import { Header } from "../components/Header";
import { Star } from "lucide-react";

export function ReviewWrite() {
  const { opinionId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("별점을 선택해주세요.");
    try {
      setIsSubmitting(true);
      await rateOpinion(opinionId, {
        rating,
        review: content.trim() || undefined,
      });
      alert("리뷰가 등록되었습니다.");
      navigate("/opinions");
    } catch {
      alert("리뷰 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabel = ["", "매우 불만족", "불만족", "보통", "만족", "매우 만족"];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-xl font-bold text-slate-900 mb-1">리뷰 작성</h1>
        <p className="text-sm text-slate-500 mb-8">수의사 소견에 대한 후기를 남겨주세요</p>

        <div className="space-y-4">
          {/* 별점 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-700 mb-4">
              별점 <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-slate-500">{ratingLabel[rating]}</p>
            )}
          </div>

          {/* 리뷰 내용 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-700 mb-3">
              리뷰 내용 <span className="text-slate-400 font-normal">(선택)</span>
            </p>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm h-36 resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="수의사 소견이 도움이 되셨나요? 솔직한 후기를 남겨주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => navigate("/opinions")}
            >
              취소
            </button>
            <button
              className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "리뷰 등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}