import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { format, addHours } from 'date-fns';
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
  PieChart,
  Pie,
  Cell,
  Legend,
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
  FileText,
  Eye as EyeIcon,
  X as CloseIcon,
  Send,
  MessageSquare,
  Database,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import {
  getAdminStats,
  getAdminUsers,
  getAdminVets,
  getAdminVetDetail,
  getAdminReports,
  suspendAdminUser,
  unsuspendAdminUser,
  deleteAdminUser,
  approveAdminVet,
  rejectAdminVet,
  patchAdminReport,
  getAdminReportMessages,
  sendAdminReportMessage,
} from "../../api/admin";

import { serverOrigin } from "../../api/client";
import { CollectedSamplesPanel } from "./admin/CollectedSamplesPanel";

function buildFileUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${serverOrigin}/${path.replace(/^\/+/, "")}`;
}

function isPdfPath(path?: string | null) {
  return !!path && /\.pdf(\?|$)/i.test(path);
}

type Tab = "overview" | "users" | "vets" | "reports" | "samples";

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
  license_number?: string | null;
  created_at: string;
}

interface AdminVetDetail extends AdminVetRow {
  address?: string | null;
  phone?: string | null;
  specialty?: string | null;
  business_hours?: string | null;
  license_image_url?: string | null;
  employment_doc_url?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
}

interface AdminReportRow {
  id: number;
  reporter_email?: string | null;
  target_type: string;
  target_user_id?: number | null;
  target_vet_id?: number | null;
  target_label: string;
  reason: string;
  status: string;
  admin_note?: string | null;
  created_at: string;
}

interface ReportMessageRow {
  id: number;
  sender_role: string;
  audience: string;
  body: string;
  email_sent: boolean;
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
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  // 수의사 검토 모달 상태
  const [reviewVet, setReviewVet] = useState<AdminVetDetail | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [reportMessages, setReportMessages] = useState<Record<number, ReportMessageRow[]>>({});
  const [msgDraft, setMsgDraft] = useState({
    audience: "reporter" as "reporter" | "subject" | "internal",
    body: "",
    send_email: true,
  });

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
    loadStats().catch(() => { });
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

  const handleSuspendUser = async (userId: number, uiLockId?: number) => {
    const reason = window.prompt(
      "정지 사유를 입력하세요.\n※ 로그인 화면 안내에 포함되며, 문의 채널도 함께 표시됩니다.",
    );
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      window.alert("정지 사유는 필수입니다.");
      return;
    }
    if (!window.confirm("이 보호자 계정을 정지할까요?")) return;
    setActionId(uiLockId ?? userId);
    try {
      await suspendAdminUser(userId, trimmed);
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

  const handleUnsuspendUser = async (userId: number, uiLockId?: number) => {
    if (!window.confirm("이 보호자 계정의 정지를 해제할까요?")) return;
    setActionId(uiLockId ?? userId);
    try {
      await unsuspendAdminUser(userId);
      await refreshAfterMutation();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "정지 해제에 실패했습니다.";
      window.alert(typeof msg === "string" ? msg : "정지 해제에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteUser = async (userId: number, uiLockId?: number) => {
    if (!window.confirm("계정을 삭제합니다. 연관 데이터도 삭제될 수 있습니다. 계속할까요?")) return;
    setActionId(uiLockId ?? userId);
    try {
      await deleteAdminUser(userId);
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

  const handleRejectVet = async (id: number, reason: string) => {
    if (!reason.trim()) {
      window.alert("반려 사유를 입력해주세요.");
      return;
    }
    setActionId(id);
    try {
      await rejectAdminVet(id, reason.trim());
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

  // 수의사 상세 모달 열기
  const openVetReview = async (vetId: number) => {
    setReviewLoading(true);
    setShowRejectInput(false);
    setRejectReason("");
    try {
      const data = await getAdminVetDetail(vetId);
      setReviewVet(data);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "상세 정보를 불러오지 못했습니다.";
      window.alert(typeof msg === "string" ? msg : "상세 정보를 불러오지 못했습니다.");
    } finally {
      setReviewLoading(false);
    }
  };

  const closeVetReview = () => {
    setReviewVet(null);
    setShowRejectInput(false);
    setRejectReason("");
  };

  const submitApproveFromModal = async () => {
    if (!reviewVet) return;
    await handleApproveVet(reviewVet.id);
    closeVetReview();
  };

  const submitRejectFromModal = async () => {
    if (!reviewVet) return;
    await handleRejectVet(reviewVet.id, rejectReason);
    closeVetReview();
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

  const loadReportThread = async (reportId: number) => {
    const msgs = await getAdminReportMessages(reportId);
    setReportMessages((prev) => ({ ...prev, [reportId]: msgs }));
  };

  const toggleReportThread = async (reportId: number) => {
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
      return;
    }
    setExpandedReportId(reportId);
    try {
      await loadReportThread(reportId);
    } catch {
      window.alert("대화 내역을 불러오지 못했습니다.");
    }
  };

  const handleSendReportMessage = async (reportId: number) => {
    if (!msgDraft.body.trim()) {
      window.alert("메시지 내용을 입력해 주세요.");
      return;
    }
    setActionId(reportId);
    try {
      await sendAdminReportMessage(reportId, {
        audience: msgDraft.audience,
        body: msgDraft.body.trim(),
        send_email: msgDraft.send_email,
      });
      setMsgDraft((p) => ({ ...p, body: "" }));
      await loadReportThread(reportId);
      await loadReports();
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "메시지 전송에 실패했습니다.";
      window.alert(typeof detail === "string" ? detail : "메시지 전송에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const audienceLabel = (a: string) => {
    if (a === "reporter") return "신고자";
    if (a === "subject") return "피신고 대상";
    if (a === "internal") return "내부 메모";
    return a;
  };

  const senderRoleLabel = (role: string) => {
    if (role === "admin") return "관리자";
    if (role === "user") return "신고자";
    if (role === "vet") return "수의사";
    if (role === "system") return "시스템";
    return role;
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

  const diseaseDistributionChart = useMemo(
    () => (stats?.disease_distribution ?? []).map((d) => ({
      name: d.disease,
      value: d.count,
    })),
    [stats]
  );

  const PIE_COLORS = [
    "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
  ];

  const filteredUsers = useMemo(() => {
    const q = searchUser.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
      const matchesRole = !roleFilter ||
        (roleFilter === "suspended" && u.is_suspended) ||
        (roleFilter === "active" && !u.is_suspended);
      const matchesDate = !dateFilter || u.created_at?.startsWith(dateFilter);
      return matchesSearch && matchesRole && matchesDate;
    });
  }, [users, searchUser, roleFilter, dateFilter]);

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
    { key: "samples" as const, label: "학습 데이터", icon: Database },
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
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${activeTab === item.key
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
            disabled
            title="준비 중입니다. 추후 연동 예정입니다."
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 opacity-60"
          >
            <Settings className="h-4 w-4" />
            <span>시스템 설정 (준비 중)</span>
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
                  : activeTab === "samples"
                    ? "학습 데이터 수집"
                    : "신고 관리"}
          </h1>
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
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color === "blue"
                        ? "bg-blue-50"
                        : stat.color === "green"
                          ? "bg-green-50"
                          : stat.color === "purple"
                            ? "bg-purple-50"
                            : "bg-red-50"
                        }`}
                    >
                      <stat.icon
                        className={`h-4 w-4 ${stat.color === "blue"
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
                          {format(addHours(new Date(a.at), 9), "MM/dd HH:mm")}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.type === "signup"
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
              {/* 질환별 분포 파이 차트 */}
              {diseaseDistributionChart.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">질환별 분포 (전체)</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={diseaseDistributionChart}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {diseaseDistributionChart.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}건`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "users" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">사용자 목록</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {/* 상태 필터 */}
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">전체 상태</option>
                    <option value="active">활성</option>
                    <option value="suspended">정지</option>
                  </select>

                  {/* 가입일 필터 */}
                  <input
                    type="month"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />

                  {/* 검색 */}
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
                          {u.created_at ? format(addHours(new Date(u.created_at), 9), "yyyy-MM-dd") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">{u.diagnosis_count ?? 0}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.is_suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                              }`}
                          >
                            {u.is_suspended ? "정지" : "활성"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.is_suspended ? (
                              <button
                                type="button"
                                className="text-xs font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
                                disabled={actionId === u.id}
                                onClick={() => handleUnsuspendUser(u.id)}
                              >
                                정지해제
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="text-xs font-medium text-amber-700 hover:text-amber-800 disabled:opacity-50"
                                disabled={actionId === u.id}
                                onClick={() => handleSuspendUser(u.id)}
                              >
                                정지
                              </button>
                            )}
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
                            <p>
                              면허번호: {vet.license_number || "—"} · 신청일:{" "}
                              {vet.created_at ? format(addHours(new Date(vet.created_at), 9), "yyyy-MM-dd") : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          onClick={() => openVetReview(vet.id)}
                        >
                          <EyeIcon className="h-3.5 w-3.5" /> 상세 / 자격증
                        </button>
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
                              onClick={() => openVetReview(vet.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" /> 거부
                            </button>
                          </>
                        ) : (
                          <span className="self-center text-xs text-slate-400">
                            처리 완료
                          </span>
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
                <div>
                  <h2 className="text-sm font-bold text-slate-900">신고 · 관리자 소통</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    신고자·피신고자와 대화한 뒤 필요 시 「사용자 관리」 탭에서 계정 정지를 검토하세요.
                  </p>
                </div>
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
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{report.id}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${report.status === "pending"
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
                          {report.target_vet_id ? ` (수의사 ID ${report.target_vet_id})` : ""}
                          {report.target_user_id ? ` (사용자 ID ${report.target_user_id})` : ""}
                        </p>
                        <p>
                          <span className="font-medium">사유:</span> {report.reason}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {format(addHours(new Date(report.created_at), 9), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        onClick={() => toggleReportThread(report.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {expandedReportId === report.id ? "대화 닫기" : "대화 열기"}
                      </button>
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

                  {expandedReportId === report.id && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {(reportMessages[report.id] ?? []).map((m) => (
                          <div
                            key={m.id}
                            className={`rounded-lg p-3 text-xs ${m.audience === "internal"
                              ? "bg-amber-50 border border-amber-100"
                              : "bg-slate-50 border border-slate-100"
                              }`}
                          >
                            <div className="flex flex-wrap justify-between gap-1 text-slate-500 mb-1">
                              <span>
                                {senderRoleLabel(m.sender_role)} · {audienceLabel(m.audience)}
                                {m.email_sent ? " · 이메일 발송됨" : ""}
                              </span>
                              <span>
                                {format(addHours(new Date(m.created_at), 9), "MM-dd HH:mm")}
                              </span>
                            </div>
                            <p className="text-slate-800 whitespace-pre-wrap">{m.body}</p>
                          </div>
                        ))}
                        {(reportMessages[report.id] ?? []).length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">아직 메시지가 없습니다.</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="text-xs font-semibold text-slate-600">수신:</label>
                          <select
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            value={msgDraft.audience}
                            onChange={(e) =>
                              setMsgDraft((p) => ({
                                ...p,
                                audience: e.target.value as "reporter" | "subject" | "internal",
                              }))
                            }
                          >
                            <option value="reporter">신고자 (앱 + 이메일)</option>
                            <option value="subject">피신고 대상 (앱/이메일)</option>
                            <option value="internal">내부 메모 (관리자만)</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={msgDraft.send_email}
                              onChange={(e) =>
                                setMsgDraft((p) => ({ ...p, send_email: e.target.checked }))
                              }
                              disabled={msgDraft.audience === "internal"}
                            />
                            이메일 발송
                          </label>
                        </div>
                        <textarea
                          rows={3}
                          value={msgDraft.body}
                          onChange={(e) => setMsgDraft((p) => ({ ...p, body: e.target.value }))}
                          placeholder="신고자에게 확인 요청, 수의사에게 주의 안내 등"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
                        />
                        <button
                          type="button"
                          disabled={actionId === report.id}
                          onClick={() => handleSendReportMessage(report.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" /> 메시지 보내기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <p className="py-10 text-center text-slate-500">신고 내역이 없습니다.</p>
              )}
            </div>
          )}

          {activeTab === "samples" && <CollectedSamplesPanel />}
        </div>
      </main>

      {/* 수의사 상세 / 자격증 검토 모달 */}
      {(reviewVet || reviewLoading) && (
        <VetReviewModal
          vet={reviewVet}
          loading={reviewLoading}
          actionId={actionId}
          showRejectInput={showRejectInput}
          rejectReason={rejectReason}
          onClose={closeVetReview}
          onApprove={submitApproveFromModal}
          onStartReject={() => setShowRejectInput(true)}
          onCancelReject={() => {
            setShowRejectInput(false);
            setRejectReason("");
          }}
          onChangeRejectReason={setRejectReason}
          onSubmitReject={submitRejectFromModal}
        />
      )}
    </div>
  );
}

// ==================== 수의사 검토 모달 ====================
function VetReviewModal(props: {
  vet: AdminVetDetail | null;
  loading: boolean;
  actionId: number | null;
  showRejectInput: boolean;
  rejectReason: string;
  onClose: () => void;
  onApprove: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onChangeRejectReason: (v: string) => void;
  onSubmitReject: () => void;
}) {
  const {
    vet,
    loading,
    actionId,
    showRejectInput,
    rejectReason,
    onClose,
    onApprove,
    onStartReject,
    onCancelReject,
    onChangeRejectReason,
    onSubmitReject,
  } = props;

  const isProcessing = vet ? actionId === vet.id : false;
  const pending = vet?.approval_status?.toLowerCase() === "pending";

  const licenseUrl = buildFileUrl(vet?.license_image_url);
  const employmentUrl = buildFileUrl(vet?.employment_doc_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-bold text-slate-900">수의사 가입 신청 검토</h2>
        <p className="mb-5 text-sm text-slate-500">
          첨부된 면허증/증빙 서류를 확인한 뒤 승인 또는 반려해주세요.
        </p>

        {loading || !vet ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* 기본 정보 */}
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">기본 정보</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Field label="이름" value={`${vet.name} 수의사`} />
                <Field label="이메일" value={vet.email} />
                <Field label="병원명" value={vet.hospital_name || "—"} />
                <Field label="면허번호" value={vet.license_number || "—"} />
                <Field
                  label="신청일"
                  value={
                    vet.created_at ? format(addHours(new Date(vet.created_at), 9), "yyyy-MM-dd HH:mm") : "—"
                  }
                />
                <Field
                  label="상태"
                  value={vetStatusLabel(vet.approval_status).text}
                />
              </dl>
              {vet.rejection_reason && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  반려 사유: {vet.rejection_reason}
                </p>
              )}
            </section>

            {/* 면허증 */}
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">수의사 면허증 (필수)</h3>
                {licenseUrl && (
                  <a
                    href={licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-3.5 w-3.5" /> 새 창에서 열기
                  </a>
                )}
              </div>
              <DocPreview url={licenseUrl} label="면허증" />
            </section>

            {/* 재직증명서 */}
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  재직 / 개업 증명서 (선택)
                </h3>
                {employmentUrl && (
                  <a
                    href={employmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-3.5 w-3.5" /> 새 창에서 열기
                  </a>
                )}
              </div>
              <DocPreview url={employmentUrl} label="재직증명서" />
            </section>

            {/* 액션 영역 */}
            {pending && (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                {showRejectInput ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      반려 사유
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => onChangeRejectReason(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="예) 면허증 사본이 흐릿하여 면허번호 식별이 어렵습니다. 선명한 사본을 다시 첨부하여 재신청해 주세요."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={onCancelReject}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing || !rejectReason.trim()}
                        onClick={onSubmitReject}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        반려 확정
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      검토 후 아래 버튼으로 처리해주세요.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onStartReject}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> 반려 (사유 입력)
                      </button>
                      <button
                        type="button"
                        onClick={onApprove}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" /> 승인
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function DocPreview({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400">
        첨부된 {label}이 없습니다
      </div>
    );
  }
  if (isPdfPath(url)) {
    return (
      <div className="space-y-2">
        <object data={url} type="application/pdf" className="h-96 w-full rounded-lg border border-slate-200">
          <p className="p-4 text-sm text-slate-500">
            PDF 미리보기를 지원하지 않는 브라우저입니다. 위의 "새 창에서 열기"로 확인해주세요.
          </p>
        </object>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img
        src={url}
        alt={label}
        className="max-h-[480px] w-full rounded-lg border border-slate-200 object-contain"
      />
    </a>
  );
}
