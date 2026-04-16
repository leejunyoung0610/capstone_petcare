import apiClient from './client';

/** 보호자: 신고 접수 → 관리자 /admin/reports 에서 처리 */
export const submitUserReport = (data) =>
  apiClient.post('/reports', data).then((r) => r.data);
