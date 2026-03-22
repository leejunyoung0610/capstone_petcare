import { Link } from 'react-router';
import { Menu, User, Bell } from 'lucide-react';
import { useState } from 'react';

export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-brand-link sm:text-xl"
          >
            PET EYE AI
          </Link>
          <nav className="hidden items-center gap-8 font-mono text-[13px] font-medium text-slate-600 md:flex">
            <Link to="/register" className="transition hover:text-brand-link">
              스크리닝 시작
            </Link>
            <span className="cursor-not-allowed text-slate-400" title="준비 중">
              수의사 찾기
            </span>
            <span className="cursor-not-allowed text-slate-400" title="준비 중">
              질환백과
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="알림"
          >
            <Bell className="size-5" />
          </button>
          <Link
            to="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline"
          >
            로그인
          </Link>
          <Link
            to="/register"
            className="hidden rounded-xl bg-brand-link px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-600 sm:inline"
          >
            가입
          </Link>
          <Link to="/login" className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 sm:hidden">
            <User className="size-5" />
          </Link>
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="메뉴"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200/80 bg-white/95 px-4 py-4 font-mono text-sm backdrop-blur-md md:hidden">
          <Link to="/register" className="block py-2.5 font-medium" onClick={() => setOpen(false)}>
            스크리닝 시작
          </Link>
          <Link to="/login" className="block py-2.5" onClick={() => setOpen(false)}>
            로그인
          </Link>
        </div>
      )}
    </header>
  );
}
