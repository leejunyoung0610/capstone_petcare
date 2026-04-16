import { create } from 'zustand';
import { authAPI } from '../api/auth';

const USER_KEY = 'ganadi_auth_user';

function readStoredUser() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const initialToken =
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
const initialUser = readStoredUser();

function formatError(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || JSON.stringify(e)).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return error.message || '요청에 실패했습니다.';
}

const useAuthStore = create((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,

  // 로그인
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { access_token, name, role } = response.data;
      
      localStorage.setItem('token', access_token);
      const user = { name, role };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      set({
        error: formatError(error),
        isLoading: false,
      });
      return false;
    }
  },

  // 수의사 로그인
  vetLogin: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.vetLogin(email, password);
      const { access_token, name, role } = response.data;
      localStorage.setItem('token', access_token);
      const user = { name, role: role || 'vet' };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    catch (error) {
      set({
        error: formatError(error),
        isLoading: false,
      });
      return false;
    }
  },

  // 수의사 회원가입 (가입 후 approval_status=pending, 관리자 승인 필요)
  vetRegister: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.vetRegister(data);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: formatError(error),
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
        error: formatError(error),
        isLoading: false,
      });
      return false;
    }
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // 인증 체크 (페이지 로드 시)
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = readStoredUser();
    if (token) {
      set({
        token,
        user,
        isAuthenticated: true,
      });
    } else {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  // 에러 클리어
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
