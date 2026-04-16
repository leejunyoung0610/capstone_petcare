import { useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

/**
 * 보호자/메인 앱의 AppHeader 와 분리된 관리자 전용 상단바.
 * 사용자 웹 네비(AI 분석, 마이페이지 등)는 노출하지 않습니다.
 */
export default function AdminHeader() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900 text-slate-100 shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Shield className="size-6 shrink-0 text-amber-400" aria-hidden />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-bold tracking-tight text-white sm:text-base">
              PET EYE AI
            </p>
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
              관리자 콘솔
            </p>
          </div>
          <span className="hidden rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300 sm:inline">
            Admin only
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="hidden max-w-[140px] truncate text-right text-xs text-slate-400 sm:block sm:max-w-[200px] sm:text-sm">
            {user?.name ?? '—'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
