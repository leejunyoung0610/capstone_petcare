import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getMyOpinions, cancelOpinion } from "../../api/opinions";
import { Header } from "../components/Header";
import { MessageCircle, Calendar, Eye, ArrowLeft } from "lucide-react";

interface Opinion {
  id: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  created_at: string;
  vet_name: string;
  hospital_name: string;
  pet_name: string;
  content?: string | null;
  main_disease?: string | null;
  is_normal?: boolean | null;
}

function mapOpinionRow(o: any): Opinion {
  const done = o.content != null && String(o.content).length > 0;
  return {
    id: o.id,
    status: done ? "COMPLETED" : "PENDING",
    created_at: o.created_at,
    vet_name: o.vet_name ?? "—",
    hospital_name: o.hospital_name ?? "—",
    pet_name: o.pet_name ?? "—",
    content: o.content,
    main_disease: o.diagnosis?.main_disease ?? null,
    is_normal: o.diagnosis?.is_normal ?? null,
  };
}

type FilterTab = "전체" | "대기중" | "진행중" | "완료";

const statusMap: Record<string, string> = {
  PENDING: "대기중",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export function OpinionList() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("전체");

  const handleCancel = async (opinionId: number) => {
    if (!window.confirm("소견 요청을 취소하시겠어요?")) return;
    try {
      await cancelOpinion(opinionId);
      setOpinions((prev) =>
        prev.map((o) => o.id === opinionId ? { ...o, status: "CANCELLED" } : o)
      );
    } catch {
      alert("취소에 실패했습니다.");
    }
  };

  useEffect(() => {
    getMyOpinions()
      .then((rows) => setOpinions(Array.isArray(rows) ? rows.map(mapOpinionRow) : []))
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = opinions.filter((o) => {
    if (activeTab === "전체") return true;
    if (activeTab === "대기중") return o.status === "PENDING";
    if (activeTab === "진행중") return o.status === "IN_PROGRESS";
    if (activeTab === "완료") return o.status === "COMPLETED";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/mypage?tab=opinions")}
          className="flex items-center gap-2 text-sm text-slate-500 mb-4 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          수의사 소견으로 돌아가기
        </button>
        <h1 className="text-xl font-bold text-slate-900 mb-6">소견 요청 내역</h1>

        {/* 필터 탭 */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
          {(["전체", "대기중", "진행중", "완료"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <MessageCircle className="w-10 h-10 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 mb-4">소견 요청 내역이 없습니다</p>
            <Link
              to="/vets"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              수의사 찾기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((opinion) => (
              <div key={opinion.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{opinion.vet_name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusStyle[opinion.status]}`}>
                        {statusMap[opinion.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{opinion.hospital_name}</p>
                    <p className="text-sm text-slate-500">반려동물: {opinion.pet_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {opinion.created_at.slice(0, 10)}
                    </p>
                    {/* 대표 질환명 추가 */}
                    {opinion.main_disease != null && (
                      <p className="text-xs mt-1">
                        <span className="text-slate-400">대표 질환: </span>
                        <span className={`font-medium ${opinion.is_normal ? "text-green-600" : "text-red-500"}`}>
                          {opinion.is_normal ? "이상 없음" : opinion.main_disease}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {opinion.status === "COMPLETED" && (
                  <Link to={`/opinions/${opinion.id}`}>
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                      <Eye className="w-4 h-4" />
                      소견 상세보기
                    </button>
                  </Link>
                )}

                {opinion.status === "IN_PROGRESS" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                    수의사가 검토 중입니다. 평균 12~24시간 내 소견이 제공됩니다.
                  </div>
                )}

                {opinion.status === "PENDING" && (
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                      수의사의 검토를 기다리고 있습니다.
                    </div>
                    <button
                      onClick={() => handleCancel(opinion.id)}
                      className="text-xs font-medium text-red-400 hover:text-red-600"
                    >
                      요청 취소
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}