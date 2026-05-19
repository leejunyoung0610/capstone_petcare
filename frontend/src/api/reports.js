import apiClient from './client';

export const submitReport = async (data) => {
  const response = await apiClient.post('/reports', data);
  return response.data;
};

export const getMyReports = () => apiClient.get('/reports/my').then((r) => r.data);

export const getReportDetail = (reportId) =>
  apiClient.get(`/reports/${reportId}`).then((r) => r.data);

export const getReportMessages = (reportId) =>
  apiClient.get(`/reports/${reportId}/messages`).then((r) => r.data);

export const replyToReport = (reportId, body) =>
  apiClient.post(`/reports/${reportId}/messages`, { body }).then((r) => r.data);
