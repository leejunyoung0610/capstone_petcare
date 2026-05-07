import { useNavigate, useParams } from "react-router";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";

const mockAnnouncements = [
  {
    id: 1,
    type: "NOTICE",
    title: "서비스 오픈 안내",
    content: "반려동물 안구질환 AI 스크리닝 플랫폼 PetEye AI가 오픈했습니다. 많은 이용 부탁드립니다.\n\n저희 플랫폼은 스마트폰으로 촬영한 반려동물 눈 사진 한 장으로 AI가 안구 질환 가능성을 사전 스크리닝하고, 수의사의 원격 소견을 연계하는 통합 플랫폼입니다.",
    created_at: "2026-03-01",
  },
  {
    id: 2,
    type: "NOTICE",
    title: "수의사 소견 서비스 안내",
    content: "AI 분석 결과를 바탕으로 수의사에게 원격 소견을 요청할 수 있습니다.\n\n소견 요청 후 평균 12~24시간 내에 수의사의 소견을 받아보실 수 있습니다.",
    created_at: "2026-03-05",
  },
  {
    id: 3,
    type: "FAQ",
    title: "AI 분석 결과는 의료 진단인가요?",
    content: "아닙니다. AI 분석 결과는 사전 스크리닝 목적의 참고자료이며 의료기기가 아닙니다.\n\n수의사법 제10조에 따라 본 서비스는 진단이 아닌 소견 제공 형태로 운영됩니다. 최종 진단 및 처방은 반드시 동물병원을 직접 방문하여 수의사에게 받으시기 바랍니다.",
    created_at: "2026-03-08",
  },
  {
    id: 4,
    type: "FAQ",
    title: "소견 요청 후 얼마나 걸리나요?",
    content: "수의사 소견은 평균 12~24시간 내 제공됩니다.\n\n수의사의 상황에 따라 다소 늦어질 수 있으며, 소견이 완료되면 알림으로 안내해 드립니다.",
    created_at: "2026-03-08",
  },
  {
    id: 5,
    type: "NOTICE",
    title: "개인정보 처리방침 업데이트 안내",
    content: "개인정보 처리방침이 업데이트되었습니다. 자세한 내용을 확인해 주세요.\n\n주요 변경사항: 반려동물 이미지 데이터 처리 방침 명시, AI 분석 데이터 보관 기간 명시.",
    created_at: "2026-03-10",
  },
];

export function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const item = mockAnnouncements.find((a) => a.id === Number(id));

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <p className="text-6xl mb-4">⚠️</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">게시글을 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate("/announcements")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/announcements")}
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로 돌아가기
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="mb-6">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              item.type === "NOTICE"
                ? "bg-blue-50 text-blue-700"
                : "bg-green-50 text-green-700"
            }`}>
              {item.type === "NOTICE" ? "공지" : "FAQ"}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-3 mb-2">{item.title}</h1>
            <p className="text-sm text-slate-400">{item.created_at}</p>
          </div>

          <hr className="border-slate-100 mb-6" />

          <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
            {item.content}
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/announcements")}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}