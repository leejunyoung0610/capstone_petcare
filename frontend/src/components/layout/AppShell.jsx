import { Outlet } from 'react-router';
import AppHeader from './AppHeader';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 bg-dot-slate bg-[length:28px_28px]">
      <AppHeader />
      <Outlet />
    </div>
  );
}
