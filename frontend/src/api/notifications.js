import apiClient from './client';

// 알림 목록 조회
export const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

// 알림 읽음 처리
export const markAsRead = async (id) => {
  const response = await apiClient.patch(`/notifications/${id}`);
  return response.data;
};

// 전체 읽음 처리
export const markAllAsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};