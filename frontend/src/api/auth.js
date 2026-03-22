import apiClient from './client';

export const authAPI = {
  // 사용자 로그인
  login: (email, password) => {
    return apiClient.post('/auth/user/login', { email, password });
  },

  // 사용자 회원가입
  register: (data) => {
    return apiClient.post('/auth/user/register', data);
  },

  // 수의사 로그인
  vetLogin: (email, password) => {
    return apiClient.post('/auth/vet/login', { email, password });
  },

  // 수의사 회원가입
  vetRegister: (data) => {
    return apiClient.post('/auth/vet/register', data);
  },
};
