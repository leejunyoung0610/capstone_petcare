import apiClient from './client';

export const submitReport = async (data) => {
  const response = await apiClient.post('/reports', data);
  return response.data;
};