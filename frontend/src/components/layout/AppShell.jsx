import { Outlet, NavLink } from 'react-router';
import AppHeader from './AppHeader';
import { Home, PawPrint, Scan, MessageCircle, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: '홈' },
  { to: '/pets', icon: PawPrint, label: '반려동물' },
  { to: '/diagnosis/new', icon: Scan, label: '검사' },
  { to: '/opinions', icon: MessageCircle, label: '요청내역' },
  { to: '/mypage', icon: User, label: '마이페이지' },
];

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16 lg:pb-0">
      <AppHeader />
      <Outlet />

      {/* 하단 네비게이션 (모바일만) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}