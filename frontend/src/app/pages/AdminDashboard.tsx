import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Stethoscope,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  LogOut,
  Bell,
  Search,
  Shield,
  Activity,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import {
  getAdminStats,
  getAdminUsers,
  getAdminVets,
  getAdminReports,
  suspendAdminUser,
  deleteAdminUser,
  approveAdminVet,
  rejectAdminVet,
  patchAdminReport,
} from "../../api/admin";

type Tab = "overview" | "users" | "vets" | "reports";

interface AdminStats {
  total_users: number;
  total_vets: number;
  total_diagnoses: number;
  pending_vets: number;
  daily_diagnosis_counts: { date: string; count: number }[];
  disease_distribution: { disease: string; count: number; percentage: number }[];
  monthly_new_users: { month: string; count: number }[];
  monthly_diagnoses: { month: string; count: number }[];
  recent_activities: { at: string; type: string; label: string; ref: string }[];
  open_reports_count: number;
  disease_distribution_dog: { disease: string; count: number; percentage: number }[];
  disease_distribution_cat: { disease: string; count: number; percentage: number }[];
}

interface AdminUserRow {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  is_suspended: boolean;
  created_at: string;
  diagnosis_count?: number;
}

interface AdminVetRow {
  id: number;
  email: string;
  name: string;
  hospital_name?: string | null;
  approval_status: string;
  created_at: string;
}

interface AdminReportRow {
  id: number;
  reporter_email?: string | null;
  target_type: string;
  target_label: string;
  reason: string;
  status: string;
  created_at: string;
}

function vetStatusLabel(status: string) {
  const s = status?.toLowerCase();
  if (s === "pending") return { text: "승인 대기", className: "bg-orange-100 text-orange-800" };
  if (s === "approved") return { text: "승인됨", className: "bg-green-100 text-green-800" };
  if (s === "rejected") return { text: "거부됨", className: "bg-red-100 text-red-800" };
  return { text: status || "—", className: "bg-gray-100 text-gray-700" };
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return `${y}년 ${m}월`;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const authUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [vets, setVets] = useState<AdminVetRow[]>([]);
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [vetFilter, setVetFilter] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    const data = await getAdminStats(90);
    setStats(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await getAdminUsers({ limit: 200 });
    setUsers(data);
  }, []);

  const loadVets = useCallback(async () => {
    const params: Record<string, string> = { limit: "200" };
    if (vetFilter) params.approval_status = vetFilter;
    const data = await getAdminVets(params);
    setVets(data);
  }, [vetFilter]);

  const loadReports = useCallback(async () => {
    const params: Record<string, string> = {};
    if (reportStatus) params.status = reportStatus;
    const data = await getAdminReports(params);
    setReports(data);
  }, [reportStatus]);

  useEffect(() => {
    loadStats().catch(() => {});
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    (async () => {
      try {
        if (activeTab === "overview") await loadStats();
        else if (activeTab === "users") await loadUsers();
        else if (activeTab === "vets") await loadVets();
        else if (activeTab === "reports") await loadReports();
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e !== null && "response" in e
            ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        if (!cancelled) setError(typeof msg === "string" ? msg : "데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, loadStats, loadUsers, loadVets, loadReports]);

  const refreshAfterMutation = async () => {
    try {
      await loadStats();
      if (activeTab === "users") await loadUsers();
      if (activeTab === "vets") await loadVets();
      if (activeTab === "reports") await loadReports();
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSuspendUser = async (id: number) => {
    if (!window.confirm("이 보호자 계정을 정지할까요?")) return;
    setActionId(id);
    try {
      await suspendAdminUser(id);
      await refreshAfterMutation();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "정지 처리에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "정지 처리에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("계정을 삭제합니다. 연관 데이터도 삭제될 수 있습니다. 계속할까요?")) return;
    setActionId(id);
    try {
      await deleteAdminUser(id);
      await refreshAfterMutation();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "삭제에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "삭제에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const handleApproveVet = async (id: number) => {
    setActionId(id);
    try {
      await approveAdminVet(id);
      await refreshAfterMutation();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "승인에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "승인에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const handleRejectVet = async (id: number) => {
    if (!window.confirm("이 수의사 신청을 거부할까요?")) return;
    setActionId(id);
    try {
      await rejectAdminVet(id);
      await refreshAfterMutation();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "거부 처리에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "거부 처리에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const handleReportStatus = async (id: number, status: string) => {
    setActionId(id);
    try {
      await patchAdminReport(id, { status });
      await refreshAfterMutation();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "처리에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "처리에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const userGrowthChart = useMemo(
    () =>
      (stats?.monthly_new_users ?? []).map((x) => ({
        month: monthLabel(x.month),
        users: x.count,
      })),
    [stats]
  );

  const diagnosisMonthChart = useMemo(
    () =>
      (stats?.monthly_diagnoses ?? []).map((x) => ({
        month: monthLabel(x.month),
        count: x.count,
      })),
    [stats]
  );

  const filteredUsers = useMemo(() => {
    const q = searchUser.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [users, searchUser]);

  const navItems = [
    { key: "overview" as const, label: "전체 개요", icon: BarChart3 },
    { key: "users" as const, label: "사용자 관리", icon: Users },
    { key: "vets" as const, label: "수의사 관리", icon: Stethoscope },
    {
      key: "reports" as const,
      label: "신고 관리",
      icon: AlertTriangle,
      badge: stats?.open_reports_count,
    },
  ];

  const maxDog = Math.max(1, ...(stats?.disease_distribution_dog?.map((d) => d.count) ?? [1]));
  const maxCat = Math.max(1, ...(stats?.disease_distribution_cat?.map((d) => d.count) ?? [1]));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900">PetEye AI</span>
            <p className="text-xs text-slate-400">관리자 포털</p>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Shield className="h-5 w-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{authUser?.name ?? "Admin"}</p>
              <p className="text-xs text-slate-400">최고 관리자</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeTab === item.key
                  ? "bg-slate-900 font-medium text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="space-y-1 border-t border-slate-100 p-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            onClick={() => window.alert("시스템 설정 화면은 추후 연동됩니다.")}
          >
            <Settings className="h-4 w-4" />
            <span>시스템 설정</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-base font-bold text-slate-900">
            {activeTab === "overview"
              ? "전체 개요"
              : activeTab === "users"
                ? "사용자 관리"
                : activeTab === "vets"
                  ? "수의사 관리"
                  : "신고 관리"}
          </h1>
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="알림"
            onClick={() => window.alert("관리자 알림 센터는 추후 notifications API 와 연동할 수 있습니다.")}
          >
            <Bell className="h-4 w-4" />
            {(stats?.open_reports_count ?? 0) > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
        </header>

        <div className="space-y-5 p-6">
          {stats && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "전체 사용자",
                  value: String(stats.total_users),
                  sub: `${stats.pending_vets}명 수의사 승인 대기`,
                  icon: Users,
                  color: "blue" as const,
                },
                {
                  label: "등록 수의사",
                  value: String(stats.total_vets),
                  sub: `${stats.pending_vets}명 승인 대기`,
                  icon: Stethoscope,
                  color: "green" as const,
                },
                {
                  label: "총 AI 분석",
                  value: String(stats.total_diagnoses),
                  sub: "누적 스크리닝",
                  icon: Activity,
                  color: "purple" as const,
                },
                {
                  label: "미처리 신고",
                  value: String(stats.open_reports_count ?? 0),
                  sub: "확인 필요",
                  icon: AlertTriangle,
                  color: "red" as const,
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{stat.label}</span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        stat.color === "blue"
                          ? "bg-blue-50"
                          : stat.color === "green"
                            ? "bg-green-50"
                            : stat.color === "purple"
                              ? "bg-purple-50"
                              : "bg-red-50"
                      }`}
                    >
                      <stat.icon
                        className={`h-4 w-4 ${
                          stat.color === "blue"
                            ? "text-blue-600"
                            : stat.color === "green"
                              ? "text-green-600"
                              : stat.color === "purple"
                                ? "text-purple-600"
                                : "text-red-600"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className={`mt-0.5 text-xs ${stat.color === "red" ? "text-red-500" : "text-slate-400"}`}>
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-8 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              불러오는 중…
            </div>
          )}

          {!loading && activeTab === "overview" && stats && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">신규 사용자(월별)</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#1e293b" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">월별 AI 분석 건수</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={diagnosisMonthChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">검출 질환 분포 (강아지 / 고양이)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">강아지</p>
                      <div className="space-y-2">
                        {(stats.disease_distribution_dog ?? []).slice(0, 5).map((item) => (
                          <div key={item.disease}>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-slate-700">{item.disease}</span>
                              <span className="font-semibold">{item.count}건</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${(item.count / maxDog) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {(stats.disease_distribution_dog ?? []).length === 0 && (
                          <p className="text-xs text-slate-400">데이터 없음</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">고양이</p>
                      <div className="space-y-2">
                        {(stats.disease_distribution_cat ?? []).slice(0, 5).map((item) => (
                          <div key={item.disease}>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-slate-700">{item.disease}</span>
                              <span className="font-semibold">{item.count}건</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${(item.count / maxCat) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {(stats.disease_distribution_cat ?? []).length === 0 && (
                          <p className="text-xs text-slate-400">데이터 없음</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">최근 활동</h3>
                  <div className="space-y-2">
                    {(stats.recent_activities ?? []).map((a, i) => (
                      <div
                        key={`${a.at}-${i}`}
                        className="flex items-center gap-3 border-b border-slate-50 py-2 last:border-0"
                      >
                        <span className="w-24 shrink-0 text-xs text-slate-400">
                          {format(new Date(a.at), "MM/dd HH:mm")}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            a.type === "signup"
                              ? "bg-green-500"
                              : a.type === "diagnosis"
                                ? "bg-blue-500"
                                : a.type === "opinion"
                                  ? "bg-purple-500"
                                  : "bg-red-500"
                          }`}
                        />
                        <span className="flex-1 text-sm text-slate-700">{a.label}</span>
                        <span className="max-w-28 truncate text-xs text-slate-400">{a.ref}</span>
                      </div>
                    ))}
                    {(stats.recent_activities ?? []).length === 0 && (
                      <p className="text-sm text-slate-400">활동 기록이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">최근 일별 AI 분석 (선택 기간)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.daily_diagnosis_counts.map((d) => ({
                        date: d.date.slice(5),
                        count: d.count,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === "users" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">사용자 목록</h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="이메일, 이름 검색…"
                    className="rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      {["ID", "이메일", "이름", "가입일", "분석횟수", "상태", "관리"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500">#{u.id}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {u.created_at ? format(new Date(u.created_at), "yyyy-MM-dd") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">{u.diagnosis_count ?? 0}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              u.is_suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}
                          >
                            {u.is_suspended ? "정지" : "활성"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-xs font-medium text-amber-700 hover:text-amber-800 disabled:opacity-50"
                              disabled={u.is_suspended || actionId === u.id}
                              onClick={() => handleSuspendUser(u.id)}
                            >
                              정지
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                              disabled={actionId === u.id}
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="py-10 text-center text-slate-500">목록이 비어 있습니다.</p>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "vets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">수의사 목록</h2>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  value={vetFilter}
                  onChange={(e) => setVetFilter(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="pending">승인 대기</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">거부됨</option>
                </select>
              </div>
              {vets.map((vet) => {
                const st = vetStatusLabel(vet.approval_status);
                const pending = vet.approval_status?.toLowerCase() === "pending";
                return (
                  <div key={vet.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                          <Stethoscope className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{vet.name} 수의사</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.className}`}>
                              {st.text}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-xs text-slate-500">
                            <p>
                              {vet.hospital_name ?? "—"} · {vet.email}
                            </p>
                            <p>신청일: {vet.created_at ? format(new Date(vet.created_at), "yyyy-MM-dd") : "—"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {pending ? (
                          <>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                              disabled={actionId === vet.id}
                              onClick={() => handleApproveVet(vet.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> 승인
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                              disabled={actionId === vet.id}
                              onClick={() => handleRejectVet(vet.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" /> 거부
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">승인 처리 완료</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {vets.length === 0 && (
                <p className="py-10 text-center text-slate-500">조건에 맞는 수의사가 없습니다.</p>
              )}
            </div>
          )}

          {!loading && activeTab === "reports" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900">신고 내역</h2>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="pending">대기</option>
                  <option value="processing">처리중</option>
                  <option value="resolved">완료</option>
                  <option value="dismissed">기각</option>
                </select>
              </div>
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            report.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : report.status === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : report.status === "resolved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {report.status === "pending"
                            ? "대기"
                            : report.status === "processing"
                              ? "처리중"
                              : report.status === "resolved"
                                ? "완료"
                                : "기각"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {report.target_type}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-sm text-slate-700">
                        <p>
                          <span className="font-medium">신고자:</span> {report.reporter_email ?? "—"}
                        </p>
                        <p>
                          <span className="font-medium">대상:</span> {report.target_label}
                        </p>
                        <p>
                          <span className="font-medium">사유:</span> {report.reason}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {format(new Date(report.created_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.status === "pending" && (
                        <button
                          type="button"
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                          disabled={actionId === report.id}
                          onClick={() => handleReportStatus(report.id, "processing")}
                        >
                          처리 시작
                        </button>
                      )}
                      {report.status === "processing" && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            disabled={actionId === report.id}
                            onClick={() => handleReportStatus(report.id, "resolved")}
                          >
                            완료
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            disabled={actionId === report.id}
                            onClick={() => handleReportStatus(report.id, "dismissed")}
                          >
                            기각
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <p className="py-10 text-center text-slate-500">신고 내역이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
