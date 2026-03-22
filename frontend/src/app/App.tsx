import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import useAuthStore from '../stores/authStore';
import { router } from './routes';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <RouterProvider router={router} />;
}
