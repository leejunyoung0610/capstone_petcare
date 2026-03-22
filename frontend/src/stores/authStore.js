import { create } from 'zustand';
import { authAPI } from '../api/auth';

const initialToken =
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

const useAuthStore = create((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,

  // 로그인
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      set({
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.detail || '로그인에 실패했습니다.',
        isLoading: false,
      });
      return false;
    }
  },

  // 회원가입
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register(data);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.detail || '회원가입에 실패했습니다.',
        isLoading: false,
      });
      return false;
    }
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // 인증 체크 (페이지 로드 시)
  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({
        token,
        isAuthenticated: true,
      });
    }
  },

  // 에러 클리어
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
