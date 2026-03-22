import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, User, Bell } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { cn } from '../../lib/utils';

const navClass = ({ isActive }) =>
  cn(
    'rounded-lg px-2 py-1 font-mono text-[13px] font-medium transition-colors',
    isActive
      ? 'bg-blue-50 font-semibold text-brand-link'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  );

export default function AppHeader() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 lg:gap-10">
          <Link
            to="/dashboard"
            className="font-display text-lg font-bold tracking-tight text-brand-link sm:text-xl"
            onClick={() => setMobileOpen(false)}
          >
            PET EYE AI
          </Link>
          <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
            <NavLink to="/diagnosis/new" className={navClass}>
              AI 분석
            </NavLink>
            <NavLink to="/pets" className={navClass}>
              반려동물
            </NavLink>
            <NavLink to="/dashboard" className={navClass}>
              홈
            </NavLink>
            <span className="cursor-not-allowed px-2 py-1 font-mono text-[13px] text-slate-400" title="준비 중">
              수의사
            </span>
            <span className="cursor-not-allowed px-2 py-1 font-mono text-[13px] text-slate-400" title="준비 중">
              백과
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="알림"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            className="hidden rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 sm:block"
            aria-label="계정"
            onClick={() => navigate('/dashboard')}
          >
            <User className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline"
          >
            로그아웃
          </button>
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="메뉴"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-1 font-mono text-sm">
            <NavLink to="/diagnosis/new" className={navClass} onClick={() => setMobileOpen(false)}>
              AI 분석
            </NavLink>
            <NavLink to="/pets" className={navClass} onClick={() => setMobileOpen(false)}>
              반려동물
            </NavLink>
            <NavLink to="/dashboard" className={navClass} onClick={() => setMobileOpen(false)}>
              홈
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-left font-semibold text-slate-800"
            >
              로그아웃
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
