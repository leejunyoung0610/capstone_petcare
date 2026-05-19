import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router';
import { Menu, X, User, Bell } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { getNotifications } from '../../api/notifications';

const navClass = ({ isActive }) =>
  cn(
    'rounded-lg px-2 py-1 text-[13px] font-medium transition-colors',
    isActive
      ? 'bg-blue-50 font-semibold text-brand-link'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  );

export default function AppHeader() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [mobileOpen]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      getNotifications()
        .then((data) => setUnreadCount(data.filter((n) => !n.is_read).length))
        .catch(() => { });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header ref={menuRef} className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-10">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-brand-link sm:text-xl"
            onClick={() => setMobileOpen(false)}
            title="메인"
          >
            PET EYE AI
          </Link>
          <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
            <NavLink to="/diagnosis/new" className={navClass}>
              AI 분석
            </NavLink>
            <NavLink to="/vets" className={navClass}>
              수의사 찾기
            </NavLink>
            <NavLink to="/encyclopedia" className={navClass}>
              질환 백과
            </NavLink>
            <NavLink to="/announcements" className={navClass}>
              공지사항
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/pets" className={navClass}>
                  반려동물
                </NavLink>
                <NavLink to="/dashboard" className={navClass}>
                  대시보드
                </NavLink>
                <NavLink to="/report" className={navClass}>
                  신고하기
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/notifications"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="알림"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className="hidden rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 sm:block"
                aria-label="계정"
                onClick={() => navigate('/mypage')}
              >
                <User className="size-5" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline"
              >
                로그아웃
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-link shadow-sm hover:bg-slate-50"
              >
                회원가입
              </Link>
            </div>
          )}
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="메뉴"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-slide-down border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            <NavLink to="/diagnosis/history" className={navClass} onClick={() => setMobileOpen(false)}>
              내 진단 이력
            </NavLink>
            <NavLink to="/opinions" className={navClass} onClick={() => setMobileOpen(false)}>
              내 소견 요청
            </NavLink>
            <NavLink to="/encyclopedia" className={navClass} onClick={() => setMobileOpen(false)}>
              질환 백과
            </NavLink>
            <NavLink to="/announcements" className={navClass} onClick={() => setMobileOpen(false)}>
              공지사항
            </NavLink>
            <NavLink to="/report" className={navClass} onClick={() => setMobileOpen(false)}>
              신고하기
            </NavLink>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-lg border border-slate-200 py-2 text-center text-sm font-semibold text-slate-700"
              >
                로그아웃
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
                <Link
                  to="/login"
                  className="rounded-xl py-2 text-center font-semibold text-brand-link"
                  onClick={() => setMobileOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl border border-slate-200 py-2 text-center font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
