import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Mail, Lock } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { apiBaseURL } from '../../api/client';

export default function Login() {
  const navigate = useNavigate();
  const { login, vetLogin, isLoading, error, clearError, logout } = useAuthStore();
  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userType === 'vet') {
      const ok = await vetLogin(formData.email, formData.password);
      if (ok) navigate('/vet/dashboard');
      return;
    }
    if (userType === 'admin') {
      const ok = await login(formData.email, formData.password);
      if (ok) {
        const role = useAuthStore.getState().user?.role;
        if (role !== 'admin') {
          logout();
          window.alert('관리자 권한이 없는 계정입니다.');
        } else navigate('/admin/dashboard');
      }
      return;
    }
    const ok = await login(formData.email, formData.password);
    if (ok) {
      const role = useAuthStore.getState().user?.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    }
  };

  const userTypes = [
    { id: 'user', label: '보호자' },
    { id: 'vet', label: '수의사' },
    { id: 'admin', label: '관리자' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/80 to-indigo-100/90 p-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* 로고 */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80">
                <Eye className="size-8 text-blue-600" strokeWidth={1.75} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">PET EYE AI</h1>
            </div>
          </Link>
          <p className="text-sm text-slate-500">반려동물 안구 건강 · AI 사전 스크리닝</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {/* 탭 */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            {userTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setUserType(type.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  userType === type.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력하세요"
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 로그인 상태 유지 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" className="rounded" />
                <span>로그인 상태 유지</span>
              </label>
              <span className="cursor-not-allowed text-slate-400">비밀번호 찾기</span>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 구분선 */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">또는</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* 카카오 로그인 */}
          {userType === 'user' && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-400 rounded-xl text-sm font-semibold text-yellow-900 hover:bg-yellow-500"
              onClick={() => {
                window.location.href = `${apiBaseURL}/auth/kakao`;
              }}
            >
              <span className="w-5 h-5 rounded bg-zinc-800" />
              카카오 로그인
            </button>
          )}

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">계정이 없으신가요? </span>
            {userType === 'user' && (
              <Link to="/register" className="font-bold text-blue-600 hover:underline">회원가입</Link>
            )}
            {userType === 'vet' && (
              <Link to="/vet/register" className="font-bold text-blue-600 hover:underline">수의사 등록</Link>
            )}
            {userType === 'admin' && (
              <span className="text-slate-400">관리자 계정은 별도로 발급됩니다.</span>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-900">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}