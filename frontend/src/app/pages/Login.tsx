import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { WireframeBox } from "../components/WireframeBox";
import { WireframeButton } from "../components/WireframeButton";
import { Eye, Mail, Lock } from "lucide-react";
import useAuthStore from "../../stores/authStore";

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
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
      window.alert("수의사 로그인은 준비 중입니다.");
      return;
    }
    if (userType === "admin") {
      window.alert("관리자 로그인은 준비 중입니다.");
      return;
    }
    const ok = await login(formData.email, formData.password);
    if (ok) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Eye className="w-12 h-12 text-blue-600" />
              <h1 className="font-mono text-3xl font-bold text-blue-600">[PET EYE AI]</h1>
            </div>
          </Link>
          <p className="text-gray-600">반려동물 안구 건강 AI 스크리닝</p>
        </div>

        <WireframeBox label="LOGIN FORM" className="bg-white">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setUserType("user")}
              className={`flex-1 px-4 py-2 border-2 font-mono text-sm ${
                userType === "user"
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              보호자
            </button>
            <button
              type="button"
              onClick={() => setUserType("vet")}
              className={`flex-1 px-4 py-2 border-2 font-mono text-sm ${
                userType === "vet"
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              수의사
            </button>
            <button
              type="button"
              onClick={() => setUserType("admin")}
              className={`flex-1 px-4 py-2 border-2 font-mono text-sm ${
                userType === "admin"
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              관리자
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 font-mono text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded border-2 border-red-300 bg-red-50 p-3 font-mono text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" />
                <span>로그인 상태 유지</span>
              </label>
              <span className="text-blue-600 opacity-60 cursor-not-allowed">비밀번호 찾기</span>
            </div>

            <WireframeButton
              variant="primary"
              type="submit"
              className="w-full py-3 text-base"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </WireframeButton>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <span className="text-sm text-gray-500">또는</span>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
          </div>

          {userType === "user" && (
            <div className="space-y-3">
              <button
                type="button"
                className="w-full py-3 bg-yellow-400 border-2 border-yellow-500 font-mono text-sm font-bold flex items-center justify-center gap-2"
                onClick={() => window.alert("카카오 로그인은 준비 중입니다.")}
              >
                <div className="w-5 h-5 bg-gray-800 rounded"></div>
                카카오 로그인
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">계정이 없으신가요? </span>
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              {userType === "user" ? "회원가입" : userType === "vet" ? "수의사 등록" : ""}
            </Link>
          </div>
        </WireframeBox>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
