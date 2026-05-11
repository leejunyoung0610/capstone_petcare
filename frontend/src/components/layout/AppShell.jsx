import { Outlet, NavLink, useLocation } from 'react-router';
import AppHeader from './AppHeader';
import { Home, PawPrint, MapPin, User, Sparkles } from 'lucide-react';

// 좌·우 2탭씩 + 가운데 floating CTA (AI 분석)
// 모바일 사용감을 토스/카카오뱅크 스타일에 맞춰 강조한다.
const sideItems = [
  { to: '/dashboard', icon: Home, label: '홈' },
  { to: '/pets', icon: PawPrint, label: '반려동물' },
];
const sideItemsRight = [
  { to: '/vets', icon: MapPin, label: '병원' },
  { to: '/mypage', icon: User, label: '마이' },
];

// AI 분석 페이지에 있을 때는 가운데 버튼을 활성색으로 표시
function useIsDiagnoseActive() {
  const { pathname } = useLocation();
  return pathname.startsWith('/diagnosis') || pathname.startsWith('/upload') || pathname.startsWith('/result');
}

export default function AppShell() {
  return (
    // pb-24 = 64px 탭바 + floating 여유 + safe-area 보정
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      <AppHeader />
      <Outlet />

      {/* 모바일 하단 탭바 (lg 이상에서는 숨김) */}
      <MobileTabBar />
    </div>
  );
}

function MobileTabBar() {
  const aiActive = useIsDiagnoseActive();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      // iOS notch / 홈인디케이터 영역 보정
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative">
        {/* 가운데 floating CTA — 탭바 위로 살짝 떠 있음 */}
        <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center">
          <NavLink
            to="/diagnosis/new"
            aria-label="AI 분석"
            className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-blue-500/30 ring-4 ring-white transition active:scale-95 ${
              aiActive
                ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                : 'bg-gradient-to-br from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600'
            }`}
          >
            <Sparkles className="h-6 w-6" />
          </NavLink>
        </div>

        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-2 pb-1.5">
            {sideItems.map(({ to, icon: Icon, label }) => (
              <TabItem key={to} to={to} Icon={Icon} label={label} />
            ))}

            {/* 가운데 칸 — floating 버튼이 차지 */}
            <div className="flex items-end justify-center pb-0.5">
              <span className={`text-[10px] font-medium ${aiActive ? 'text-blue-600' : 'text-slate-400'}`}>
                AI 분석
              </span>
            </div>

            {sideItemsRight.map(({ to, icon: Icon, label }) => (
              <TabItem key={to} to={to} Icon={Icon} label={label} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function TabItem({ to, Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-400 active:text-blue-600'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
