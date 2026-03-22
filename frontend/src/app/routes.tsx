import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import useAuthStore from '../stores/authStore';

import AppShell from '../components/layout/AppShell';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { VetSearch } from './pages/VetSearch';
import { OpinionRequest } from './pages/OpinionRequest';
import { MyPage } from './pages/MyPage';
import { DiseaseEncyclopedia } from './pages/DiseaseEncyclopedia';
import { VetDashboard } from './pages/VetDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

import Register from '../pages/auth/Register';
import Dashboard from '../pages/Dashboard';
import PetList from '../pages/pets/PetList';
import PetForm from '../pages/pets/PetForm';
import DiagnoseNew from '../pages/diagnosis/DiagnoseNew';
import DiagnoseResult from '../pages/diagnosis/DiagnoseResult';

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/', Component: Home },
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },

  /* Figma 네비와 동일: 업로드·결과 URL 유지 + 기존 진단 경로 병행 */
  { path: '/upload', Component: DiagnoseNew },
  { path: '/diagnosis/new', Component: DiagnoseNew },
  { path: '/result/:id', Component: DiagnoseResult },
  { path: '/diagnosis/:id', Component: DiagnoseResult },

  { path: '/vets', Component: VetSearch },
  { path: '/opinion-request/:vetId', Component: OpinionRequest },
  { path: '/mypage', Component: MyPage },
  { path: '/encyclopedia', Component: DiseaseEncyclopedia },
  { path: '/vet/dashboard', Component: VetDashboard },
  { path: '/admin/dashboard', Component: AdminDashboard },

  {
    Component: ProtectedLayout,
    children: [
      {
        Component: AppShell,
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'pets', Component: PetList },
          { path: 'pets/new', Component: PetForm },
          { path: 'pets/:id/edit', Component: PetForm },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
