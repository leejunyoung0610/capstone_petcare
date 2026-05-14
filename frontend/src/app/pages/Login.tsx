import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, Mail, Lock } from "lucide-react";
import useAuthStore from "../../stores/authStore";
import { apiBaseURL } from "../../api/client";

export function Login() {
  const navigate = useNavigate();
  const { login, vetLogin, isLoading, error, clearError, logout } = useAuthStore();
  const [userType, setUserType] = useState<"user" | "vet" | "admin">("user");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "vet") {
      const ok = await vetLogin(formData.email, formData.password);
      if (ok) navigate("/vet/dashboard");
      return;
    }
    if (userType === "admin") {
      const ok = await login(formData.email, formData.password);
      if (ok) {
        const role = useAuthStore.getState().user?.role;
        if (role !== "admin") {
          logout();
          window.alert("관리자 권한이 없는 계정입니다.");
        } else {
          navigate("/admin/dashboard");
        }
      }
      return;
    }
    const ok = await login(formData.email, formData.password);
    if (ok) {
      const role = useAuthStore.getState().user?.role;
      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/dashboard");
    }
  };

  const userTypes = [
    { key: "user", label: "보호자" },
    { key: "vet", label: "수의사" },
    { key: "admin", label: "관리자" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Eye className="w-10 h-10 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">PET EYE AI</h1>
            </div>
          </Link>
          <p className="text-slate-500 text-sm">반려동물 안구 건강 AI 스크리닝</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {/* 사용자 유형 탭 */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            {userTypes.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  clearError();
                  setUserType(type.key as "user" | "vet" | "admin");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${userType === type.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 로그인 상태 유지 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" />
                <span>로그인 상태 유지</span>
              </label>
              <span className="text-slate-400 cursor-not-allowed">비밀번호 찾기</span>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 구분선 */}
          {userType === "user" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">또는</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                type="button"
                className="w-full py-3 bg-yellow-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-yellow-500"
                onClick={() => {
                  window.location.href = `${apiBaseURL}/auth/kakao`;
                }}
              >
                <div className="w-5 h-5 bg-slate-800 rounded" />
                카카오 로그인
              </button>
            </>
          )}

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center text-sm">
            {userType === "user" && (
              <>
                <span className="text-slate-500">계정이 없으신가요? </span>
                <Link to="/register" className="font-bold text-blue-600 hover:underline">
                  회원가입
                </Link>
              </>
            )}
            {userType === "vet" && (
              <>
                <span className="text-slate-500">계정이 없으신가요? </span>
                <Link to="/vet/register" className="font-bold text-blue-600 hover:underline">
                  수의사 신청
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-6 space-y-2">
          <Link to="/" className="block text-sm text-slate-500 hover:text-slate-900">
            ← 메인으로 돌아가기
          </Link>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <Link to="/legal/privacy" className="hover:text-slate-800 underline-offset-2 hover:underline">
              개인정보 처리방침
            </Link>
            <Link to="/legal/terms" className="hover:text-slate-800 underline-offset-2 hover:underline">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}