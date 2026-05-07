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

  // 수의사 회원가입 (자격증 미첨부 — 호환용)
  vetRegister: (data) => {
    return apiClient.post('/auth/vet/register', data);
  },

  // 수의사 회원가입 + 자격증/증빙 첨부 (multipart/form-data)
  // payload: { email, password, name, hospital_name, license_number, license_image: File, employment_doc?: File }
  vetRegisterWithDocs: (payload) => {
    const fd = new FormData();
    fd.append('email', payload.email);
    fd.append('password', payload.password);
    fd.append('name', payload.name);
    fd.append('hospital_name', payload.hospital_name);
    fd.append('license_number', payload.license_number);
    fd.append('license_image', payload.license_image);
    if (payload.employment_doc) {
      fd.append('employment_doc', payload.employment_doc);
    }
    return apiClient.post('/auth/vet/register-with-docs', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 내 프로필 조회
  getMe: () => {
    return apiClient.get('/users/me');
  },

  // 프로필 수정
  updateMe: (data) => {
    return apiClient.put('/users/me', data);
  },

  // 회원 탈퇴
  deleteMe: () => {
    return apiClient.delete('/users/me');
  },

   // 비밀번호 변경
  changePassword: (data) => {
    return apiClient.put('/users/me/password', data);
  },

  // 프로필 사진 업로드
  uploadProfileImage: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post('/users/me/profile-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 토큰 재발급
  refresh: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  },
};
