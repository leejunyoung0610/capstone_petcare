import apiClient from './client';

export const getAdminStats = (days = 7) =>
  apiClient.get('/admin/stats', { params: { days } }).then((r) => r.data);

export const getAdminUsers = (params = {}) =>
  apiClient.get('/admin/users', { params }).then((r) => r.data);

export const suspendAdminUser = (userId) =>
  apiClient.patch(`/admin/users/${userId}/suspend`).then((r) => r.data);

export const deleteAdminUser = (userId) =>
  apiClient.delete(`/admin/users/${userId}`);

export const getAdminVets = (params = {}) =>
  apiClient.get('/admin/vets', { params }).then((r) => r.data);

// 수의사 상세 조회 (자격증/증빙서류 URL 포함)
export const getAdminVetDetail = (vetId) =>
  apiClient.get(`/admin/vets/${vetId}`).then((r) => r.data);

export const approveAdminVet = (vetId) =>
  apiClient.patch(`/admin/vets/${vetId}/approve`).then((r) => r.data);

// reason: 반려 사유 (필수)
export const rejectAdminVet = (vetId, reason) =>
  apiClient.patch(`/admin/vets/${vetId}/reject`, { reason }).then((r) => r.data);

export const getAdminReports = (params = {}) =>
  apiClient.get('/admin/reports', { params }).then((r) => r.data);

export const patchAdminReport = (reportId, data) =>
  apiClient.patch(`/admin/reports/${reportId}`, data).then((r) => r.data);
