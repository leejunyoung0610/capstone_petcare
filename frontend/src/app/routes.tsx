import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import useAuthStore from '../stores/authStore';

import AppShell from '../components/layout/AppShell';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VetSearch } from './pages/VetSearch';
import { OpinionRequest } from './pages/OpinionRequest';
import { MyPage } from './pages/MyPage';
import { DiseaseEncyclopedia } from './pages/DiseaseEncyclopedia';
import { VetDashboard } from './pages/VetDashboard';
import { VetOpinionWrite } from './pages/VetOpinionWrite';
import { VetRegister } from './pages/VetRegister';
import { VetProfile } from './pages/VetProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { OpinionDetail } from './pages/OpinionDetail';
import { Notifications } from './pages/Notifications';
import { VetOpinionComplete } from './pages/VetOpinionComplete';
import { VetDiagnosisDetail } from './pages/VetDiagnosisDetail';
import { OpinionList } from './pages/OpinionList';
import { ReviewWrite } from './pages/ReviewWrite';
import { Announcements } from './pages/Announcements';
import { AnnouncementDetail } from './pages/AnnouncementDetail';
import { DiseaseDetail } from './pages/DiseaseDetail';
import { KakaoCallback } from './pages/KakaoCallback';
import { LegalPrivacy } from './pages/LegalPrivacy';
import { LegalTerms } from './pages/LegalTerms';
import { PaymentTossSuccess } from './pages/PaymentTossSuccess';
import { PaymentTossFail } from './pages/PaymentTossFail';

import Register from '../pages/auth/Register';
import Dashboard from '../pages/Dashboard';
import PetList from '../pages/pets/PetList';
import PetForm from '../pages/pets/PetForm';
import DiagnoseNew from '../pages/diagnosis/DiagnoseNew';
import DiagnoseResult from '../pages/diagnosis/DiagnoseResult';
import DiagnosisHistory from '../pages/diagnosis/DiagnosisHistory';
import PetDetail from '../pages/pets/PetDetail';
import Report from '../pages/Report';
import ReportHistory from '../pages/ReportHistory';
import ReportDetail from '../pages/ReportDetail';
import VetReportMessages from '../pages/vet/VetReportMessages';

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

// 수의사 아니면 보호자 대시보드로 (JWT role: vet)
function VetLayout() {
  const { isAuthenticated, user } = useAuthStore((s) => s);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'vet') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
// 관리자 아니면 홈으로 (백엔드 User.role === "admin") — AppHeader 와 분리된 전용 상단바
function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore((s) => s);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-slate-100">
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/', Component: Home },
  { path: '/login', Component: Login },
  { path: '/forgot-password', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
  { path: '/auth/kakao/callback', Component: KakaoCallback },
  { path: '/register', Component: Register },
  { path: '/vet/register', Component: VetRegister },
  { path: '/legal/privacy', Component: LegalPrivacy },
  { path: '/legal/terms', Component: LegalTerms },


  {
    path: '/vet', Component: VetLayout, children: [
      { path: 'dashboard', Component: VetDashboard },
      { path: 'profile', Component: VetProfile },
      { path: 'opinions/:opinionId/write', Component: VetOpinionWrite },
      { path: 'opinions/:opinionId/complete', Component: VetOpinionComplete },
      { path: 'diagnosis/:diagnosisId', Component: VetDiagnosisDetail },
      { path: 'report-messages', Component: VetReportMessages },
      { path: 'report-messages/:reportId', Component: VetReportMessages },
    ]
  },

  {
    path: '/admin', Component: AdminLayout, children: [
      { path: 'dashboard', Component: AdminDashboard },
    ]
  },

  {
    Component: ProtectedLayout,
    children: [
      {
        Component: AppShell,
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'pets', Component: PetList },
          { path: 'pets/new', Component: PetForm },
          { path: 'pets/:id', Component: PetDetail },
          { path: 'pets/:id/edit', Component: PetForm },
          { path: 'diagnosis/history', Component: DiagnosisHistory },
          /* AI 분석·결과 — AppShell로 상단바(AppHeader) 유지 (diagnosis/:id 보다 구체적인 경로를 먼저) */
          { path: 'upload', Component: DiagnoseNew },
          { path: 'diagnosis/new', Component: DiagnoseNew },
          { path: 'result/:id', Component: DiagnoseResult },
          { path: 'diagnosis/:id', Component: DiagnoseResult },
          { path: '/vets', Component: VetSearch },
          { path: '/opinion-request/:vetId', Component: OpinionRequest },
          { path: '/opinions', Component: OpinionList },
          { path: '/opinions/:requestId', Component: OpinionDetail },
          { path: '/opinions/:opinionId/review', Component: ReviewWrite },
          { path: '/notifications', Component: Notifications },
          { path: '/mypage', Component: MyPage },
          { path: '/encyclopedia', Component: DiseaseEncyclopedia },
          { path: '/encyclopedia/:id', Component: DiseaseDetail },
          { path: '/announcements', Component: Announcements },
          { path: '/announcements/:id', Component: AnnouncementDetail },
          { path: '/report', Component: Report },
          { path: '/report/history', Component: ReportHistory },
          { path: '/report/history/:id', Component: ReportDetail },
          { path: '/payment/toss/success', Component: PaymentTossSuccess },
          { path: '/payment/toss/fail', Component: PaymentTossFail },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
