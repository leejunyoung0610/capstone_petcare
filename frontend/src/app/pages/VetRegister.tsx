import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, Mail, Lock, User, Building2, Stethoscope, ArrowLeft } from "lucide-react";
import useAuthStore from "../../stores/authStore";

/**
 * 수의사 회원가입 — 백엔드에서 approval_status=pending 으로 생성되며,
 * 관리자 승인 후 포털 기능을 쓰는 흐름과 맞춥니다. (증빙 업로드는 추후)
 */
export function VetRegister() {
  const navigate = useNavigate();
  const { vetRegister, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    hospital_name: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setLocalError(null);
    clearError();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setLocalError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setLocalError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!form.name.trim()) {
      setLocalError("이름을 입력해주세요.");
      return;
    }
    const ok = await vetRegister({
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      hospital_name: form.hospital_name.trim() || undefined,
    });
    if (ok) {
      window.alert(
        "신청이 접수되었습니다.\n관리자 승인 후 수의사 포털을 이용할 수 있습니다.\n승인 전에는 일부 기능이 제한될 수 있습니다."
      );
      navigate("/login", { replace: true });
    }
  };

  const err = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          로그인으로
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/50">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-600/30">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">수의사 포털 · 회원 신청</h1>
            <p className="mt-2 text-sm text-slate-500">
              가입 후 <strong className="text-slate-700">관리자 승인</strong>이 완료되어야 본 서비스를 이용할 수 있습니다.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="name@hospital.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">비밀번호 (8자 이상)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="passwordConfirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.passwordConfirm}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">이름 (표시명)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="홍길동"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">병원명</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="hospital_name"
                  type="text"
                  value={form.hospital_name}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="○○동물병원"
                />
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "처리 중…" : "신청하기"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              수의사 로그인
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <Eye className="h-4 w-4" />
            서비스 홈
          </Link>
        </div>
      </div>
    </div>
  );
}
