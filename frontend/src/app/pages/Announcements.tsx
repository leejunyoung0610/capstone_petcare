import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Search, Megaphone, ChevronRight } from "lucide-react";

type Category = "전체" | "공지" | "FAQ";

const mockAnnouncements = [
  {
    id: 1,
    type: "NOTICE",
    title: "서비스 오픈 안내",
    content: "반려동물 안구질환 AI 스크리닝 플랫폼 PetEye AI가 오픈했습니다. 많은 이용 부탁드립니다.",
    created_at: "2026-03-01",
  },
  {
    id: 2,
    type: "NOTICE",
    title: "수의사 소견 서비스 안내",
    content: "AI 분석 결과를 바탕으로 수의사에게 원격 소견을 요청할 수 있습니다.",
    created_at: "2026-03-05",
  },
  {
    id: 3,
    type: "FAQ",
    title: "AI 분석 결과는 의료 진단인가요?",
    content: "아닙니다. AI 분석 결과는 사전 스크리닝 목적의 참고자료이며 의료기기가 아닙니다.",
    created_at: "2026-03-08",
  },
  {
    id: 4,
    type: "FAQ",
    title: "소견 요청 후 얼마나 걸리나요?",
    content: "수의사 소견은 평균 12~24시간 내 제공됩니다.",
    created_at: "2026-03-08",
  },
  {
    id: 5,
    type: "NOTICE",
    title: "개인정보 처리방침 업데이트 안내",
    content: "개인정보 처리방침이 업데이트되었습니다. 자세한 내용을 확인해 주세요.",
    created_at: "2026-03-10",
  },
];

export function Announcements() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockAnnouncements.filter((a) => {
    const matchesCategory =
      activeCategory === "전체" ||
      (activeCategory === "공지" && a.type === "NOTICE") ||
      (activeCategory === "FAQ" && a.type === "FAQ");
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Megaphone className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">공지사항</h1>
          </div>
          <p className="text-slate-500 text-sm">서비스 관련 공지사항과 자주 묻는 질문을 확인하세요</p>
        </div>

        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="제목으로 검색..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6">
          {(["전체", "공지", "FAQ"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/announcements/${item.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    item.type === "NOTICE"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-green-50 text-green-700"
                  }`}>
                    {item.type === "NOTICE" ? "공지" : "FAQ"}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.created_at}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}