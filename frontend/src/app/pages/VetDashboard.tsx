import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Clock,
  CheckCircle,
  FileText,
  Star,
  TrendingUp,
  Calendar,
  Eye,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  BadgeCheck,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useAuthStore from "../../stores/authStore";
import { getVetMe, getVetDashboardSummary } from "../../api/vets";
import { getVetOpinionRequests } from "../../api/opinions";
import { SHOW_OPINION_PAYMENT_UI } from "../../config/features";

type Tab = "pending" | "completed" | "stats";

interface OpinionRow {
  id: number;
  diagnosis_id: number;
  pet_name?: string | null;
  owner_name?: string | null;
  symptom_memo?: string | null;
  created_at: string;
  answered_at?: string | null;
  content?: string | null;
  recommendation?: string | null;
  visit_required?: boolean;
  service_fee?: number | null;
  owner_rating?: number | null;
  owner_review?: string | null;
  diagnosis?: {
    animal_type?: string;
    main_disease?: string | null;
    main_confidence?: number | null;
    image_url?: string;
  } | null;
}

interface VetProfile {
  name: string;
  hospital_name?: string | null;
  approval_status?: string;
  opinion_fee_won?: number | null;
}

const DEFAULT_OPINION_FEE_WON = 30000;

interface DashSummary {
  pending_count: number;
  completed_total: number;
  completed_last_7_days: number;
  avg_rating?: number | null;
  review_count: number;
  revenue_this_month: number;
  monthly_requests: { month: string; count: number }[];
  disease_breakdown: { disease: string; count: number }[];
}

const PIE_COLORS = ["#3b82f6", "#0ea5e9", "#6366f1", "#94a3b8", "#22c55e", "#eab308", "#a855f7", "#64748b"];

function speciesKo(animal?: string | null) {
  const t = animal?.toLowerCase();
  if (t === "dog") return "강아지";
  if (t === "cat") return "고양이";
  return "반려동물";
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return `${m}월`;
}

export function VetDashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [summary, setSummary] = useState<DashSummary | null>(null);
  const [pending, setPending] = useState<OpinionRow[]>([]);
  const [completed, setCompleted] = useState<OpinionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [me, sum, pend, done] = await Promise.all([
        getVetMe(),
        getVetDashboardSummary(),
        getVetOpinionRequests("pending"),
        getVetOpinionRequests("answered"),
      ]);
      setProfile(me);
      setSummary(sum);
      setPending(pend);
      setCompleted(done);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "데이터를 불러오지 못했습니다.";
      setError(typeof msg === "string" ? msg : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const ratingBars = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    completed.forEach((c) => {
      const r = c.owner_rating;
      if (r && r >= 1 && r <= 5) buckets[r - 1] += 1;
    });
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating: `${rating}점`,
      count: buckets[rating - 1],
    }));
  }, [completed]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { key: "pending" as const, label: "대기 중 소견", icon: Clock, badge: summary?.pending_count },
    { key: "completed" as const, label: "완료된 소견", icon: CheckCircle, badge: null },
    { key: "stats" as const, label: "통계", icon: TrendingUp, badge: null },
  ];

  const approved =
    (profile?.approval_status ?? "approved").toLowerCase() === "approved";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside
        className={`${sidebarCollapsed ? "w-16" : "w-60"
          } sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-200`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label="사이드바 접기"
          >
            <Eye className="h-4 w-4 text-white" />
          </button>
          {!sidebarCollapsed && (
            <div>
              <span className="text-sm font-bold text-slate-900">PetEye AI</span>
              <p className="text-xs text-slate-400">수의사 포털</p>
            </div>
          )}
        </div>

        {!sidebarCollapsed && profile && (
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                <StethoscopeMini />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{profile.name} 수의사</p>
                <div className="flex items-center gap-1">
                  <BadgeCheck className={`h-3 w-3 ${approved ? "text-green-500" : "text-amber-500"}`} />
                  <span className={`text-xs ${approved ? "text-green-600" : "text-amber-600"}`}>
                    {approved ? "승인됨" : "승인 대기"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${activeTab === item.key
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge != null && item.badge > 0 ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="space-y-1 border-t border-slate-100 p-2">
          <Link
            to="/vet/report-messages"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>관리자 안내</span>}
          </Link>
          <Link
            to="/vet/profile"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>{SHOW_OPINION_PAYMENT_UI ? "프로필 · 상담료" : "프로필"}</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {!approved && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
            <strong>승인 대기 중입니다.</strong> 관리자가 수의사 신청을 승인하면 모든 기능을 이용할 수 있습니다. 승인 전에도
            로그인·프로필 수정은 가능합니다.
          </div>
        )}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-base font-bold text-slate-900">
            {activeTab === "pending"
              ? "대기 중 소견 요청"
              : activeTab === "completed"
                ? "완료된 소견"
                : "활동 통계"}
          </h1>
        </header>

        <div className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-12 text-slate-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              불러오는 중…
            </div>
          )}

          {!loading && summary && (
            <>
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${SHOW_OPINION_PAYMENT_UI ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
              {[
                {
                  label: "대기 중",
                  value: String(summary.pending_count),
                  sub: "소견 요청",
                  icon: Clock,
                  color: "blue" as const,
                },
                {
                  label: "최근 7일 완료",
                  value: String(summary.completed_last_7_days),
                  sub: `전체 완료 ${summary.completed_total}건`,
                  icon: CheckCircle,
                  color: "green" as const,
                },
                {
                  label: "평균 평점",
                  value: summary.avg_rating != null ? String(summary.avg_rating) : "—",
                  sub: `리뷰 ${summary.review_count}개`,
                  icon: Star,
                  color: "amber" as const,
                },
                ...(SHOW_OPINION_PAYMENT_UI
                  ? [{
                      label: "이번 달 수익",
                      value: `${(summary.revenue_this_month / 1000).toFixed(0)}K`,
                      sub: `${summary.revenue_this_month.toLocaleString()}원`,
                      icon: TrendingUp,
                      color: "purple" as const,
                    }]
                  : []),
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{stat.label}</span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color === "blue"
                        ? "bg-blue-50"
                        : stat.color === "green"
                          ? "bg-green-50"
                          : stat.color === "amber"
                            ? "bg-amber-50"
                            : "bg-purple-50"
                        }`}
                    >
                      <stat.icon
                        className={`h-4 w-4 ${stat.color === "blue"
                          ? "text-blue-600"
                          : stat.color === "green"
                            ? "text-green-600"
                            : stat.color === "amber"
                              ? "text-amber-500"
                              : "text-purple-600"
                          }`}
                      />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
                </div>
              ))}
            </div>

            {SHOW_OPINION_PAYMENT_UI && (
            <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">원격 소견 상담료</p>
                  <p className="mt-0.5 text-lg font-semibold text-blue-700">
                    {(profile?.opinion_fee_won != null
                      ? profile.opinion_fee_won
                      : DEFAULT_OPINION_FEE_WON
                    ).toLocaleString("ko-KR")}
                    원
                    {profile?.opinion_fee_won == null && (
                      <span className="ml-2 text-xs font-normal text-slate-500">(플랫폼 기본값)</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    보호자 소견 요청·결제 금액에 반영됩니다. 원하시는 금액으로 변경할 수 있습니다.
                  </p>
                </div>
              </div>
              <Link
                to="/vet/profile#opinion-fee"
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                상담료 설정
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            )}
            </>
          )}

          {!loading && activeTab === "pending" && (
            <div className="space-y-4">
              {pending.map((req) => {
                const d = req.diagnosis;
                const hasAi = !!(d?.main_disease && d.main_confidence != null);
                return (
                  <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-slate-900">
                            {req.pet_name ?? "반려동물"} ({speciesKo(d?.animal_type)})
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                            <Clock className="h-3 w-3" /> 대기 중
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">보호자: {req.owner_name ?? "—"}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(req.created_at)}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">#{String(req.id).padStart(5, "0")}</span>
                    </div>

                    {hasAi && (
                      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div>
                            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                              <FileText className="h-3.5 w-3.5" /> AI 분석 결과 첨부됨
                            </p>
                            <p className="text-xs text-slate-600">
                              대표 질환: <strong className="text-blue-700">{d?.main_disease}</strong>
                              <span className="ml-2 text-slate-500">신뢰도 {d?.main_confidence}%</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            onClick={() => navigate(`/vet/diagnosis/${req.diagnosis_id}?requestId=${req.id}`)}
                          >
                            AI 결과 보기
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="mb-1.5 text-xs font-semibold text-slate-700">증상 설명</p>
                      <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                        {req.symptom_memo || "—"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        to={`/vet/opinions/${req.id}/write`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        소견 작성하기
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {pending.length === 0 && (
                <p className="py-12 text-center text-slate-500">대기 중인 소견 요청이 없습니다.</p>
              )}
            </div>
          )}

          {!loading && activeTab === "completed" && (
            <div className="space-y-4">
              {completed.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {c.pet_name ?? "반려동물"} ({speciesKo(c.diagnosis?.animal_type)})
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          <CheckCircle className="h-3 w-3" /> 완료
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">보호자: {c.owner_name ?? "—"}</p>
                      <p className="mt-0.5 text-xs text-slate-400">완료: {formatDateTime(c.answered_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end gap-0.5">
                        {c.owner_rating
                          ? Array.from({ length: c.owner_rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ))
                          : null}
                      </div>
                      {SHOW_OPINION_PAYMENT_UI && (
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {c.service_fee != null ? `${c.service_fee.toLocaleString()}원` : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="mb-1.5 text-xs font-semibold text-green-800">작성한 소견</p>
                    <p className="text-sm leading-relaxed text-slate-700">{c.content}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${c.visit_required ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}
                    >
                      {c.visit_required ? "병원 방문 필요" : "경과 관찰"}
                    </span>
                  </div>
                  {c.owner_review && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-yellow-900">보호자 리뷰</p>
                      <p className="text-sm text-slate-700">{c.owner_review}</p>
                    </div>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Link
                      to={`/vet/opinions/${c.id}/write?edit=true&content=${encodeURIComponent(c.content ?? "")}&recommendation=${encodeURIComponent(c.recommendation ?? "")}&visit_required=${c.visit_required}&service_fee=${c.service_fee ?? ""}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      소견 수정
                    </Link>
                  </div>
                </div>
              ))}
              {completed.length === 0 && (
                <p className="py-12 text-center text-slate-500">완료된 소견이 없습니다.</p>
              )}
            </div>
          )}

          {!loading && activeTab === "stats" && summary && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">월별 소견 요청 추이</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={summary.monthly_requests.map((x) => ({
                          month: monthLabel(x.month),
                          count: x.count,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">평점 분포 (보호자 리뷰)</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingBars}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className={`grid gap-5 ${SHOW_OPINION_PAYMENT_UI ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
                {SHOW_OPINION_PAYMENT_UI && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">수익</h3>
                  <p className="text-sm text-slate-600">
                    이번 달 누적 <strong className="text-slate-900">{summary.revenue_this_month.toLocaleString()}원</strong>{" "}
                    (소견 작성 시 입력한 service_fee 합계)
                  </p>
                </div>
                )}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">질환별 소견 분포</h3>
                  <div className="h-[180px] w-full">
                    {summary.disease_breakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.disease_breakdown.map((d) => ({ name: d.disease, value: d.count }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {summary.disease_breakdown.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">데이터 없음</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    d.setHours(d.getHours() + 9);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

function StethoscopeMini() {
  return (
    <svg className="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4h3v6a3 3 0 106 0V4h3" />
      <path d="M6 8H4a2 2 0 00-2 2v2a6 6 0 0012 0v-2" />
    </svg>
  );
}
