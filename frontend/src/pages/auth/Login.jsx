import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Mail, Lock } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { WireframeBox } from '../../components/WireframeBox';
import { WireframeButton } from '../../components/WireframeButton';
import { InputCore } from '../../components/ui/input-core';
import { cn } from '../../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
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
      window.alert('수의사 로그인은 준비 중입니다.');
      return;
    }
    if (userType === 'admin') {
      window.alert('관리자 로그인은 준비 중입니다.');
      return;
    }
    const ok = await login(formData.email, formData.password);
    if (ok) navigate('/dashboard');
  };

  const tab = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setUserType(id)}
      className={cn(
        'flex-1 border-2 px-4 py-2 font-mono text-sm font-semibold transition-colors',
        userType === id
          ? 'border-brand-link bg-blue-50 text-blue-800'
          : 'border-border bg-card text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/80 to-indigo-100/90 p-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-blue-500/10 ring-1 ring-slate-200/80">
                <Eye className="size-8 text-brand-link" strokeWidth={1.75} />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">PET EYE AI</h1>
            </div>
          </Link>
          <p className="text-[15px] leading-relaxed text-slate-600">반려동물 안구 건강 · AI 사전 스크리닝</p>
        </div>

        <WireframeBox label="로그인" className="shadow-float">
          <div className="mb-6 flex gap-2">
            {tab('user', '보호자')}
            {tab('vet', '수의사')}
            {tab('admin', '관리자')}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-sm font-bold text-foreground">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <InputCore
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력하세요"
                  className="border-2 py-3 pl-10 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-sm font-bold text-foreground">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <InputCore
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력하세요"
                  className="border-2 py-3 pl-10 font-mono text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded border-2 border-destructive/40 bg-destructive/10 p-3 font-mono text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="rounded border-2" />
                <span>로그인 상태 유지</span>
              </label>
              <span className="cursor-not-allowed text-brand-link opacity-60">비밀번호 찾기</span>
            </div>

            <WireframeButton
              variant="primary"
              type="submit"
              className="flex w-full items-center justify-center py-3 text-base disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </WireframeButton>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-0.5 flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">또는</span>
            <div className="h-0.5 flex-1 bg-border" />
          </div>

          {userType === 'user' && (
            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 border-2 border-amber-400 bg-amber-300 py-3 font-mono text-sm font-bold text-amber-950 hover:bg-amber-200"
                onClick={() => window.alert('카카오 로그인은 준비 중입니다.')}
              >
                <span className="size-5 rounded bg-zinc-800" aria-hidden />
                카카오 로그인
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">계정이 없으신가요? </span>
            <Link to="/register" className="font-bold text-brand-link hover:underline">
              {userType === 'user' ? '회원가입' : userType === 'vet' ? '수의사 등록' : ''}
            </Link>
          </div>
        </WireframeBox>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
