import apiClient from './client';

// 수의사 대시보드 KPI·차트용 (피그마 통계 탭)
export const getVetDashboardSummary = async () => {
  const response = await apiClient.get('/vets/dashboard-summary');
  return response.data;
};

// 수의사 내 프로필 조회
export const getVetMe = async () => {
  const response = await apiClient.get('/vets/profile');
  return response.data;
};

// 수의사 프로필 수정
export const updateVetMe = async (data) => {
  const response = await apiClient.put('/vets/profile', data);
  return response.data;
};

// 수의사 소견 요청 목록 조회
export const getVetOpinionRequests = async (status) => {
  const params = status ? { status } : {};
  const response = await apiClient.get('/opinion-requests/vet', { params });
  return response.data;
};

// 소견 요청 상태 변경 (IN_PROGRESS)
export const updateRequestStatus = async (requestId) => {
  const response = await apiClient.patch(`/opinion-requests/${requestId}/status`);
  return response.data;
};

// 수의사 처리 케이스 히스토리
export const getVetOpinionHistory = async () => {
  const response = await apiClient.get('/vet-opinions/vet/history');
  return response.data;
};

// 수의사 통계 조회
export const getVetStats = async () => {
  const response = await apiClient.get('/vets/me/stats');
  return response.data;
};

// 카카오맵 병원 리스트와 GANADI 수의사 매칭
// hospitals: [{ place_id, place_name, address, road_address, phone, x, y, distance_m }]
export const matchHospitalsWithGanadi = async (hospitals) => {
  const response = await apiClient.post('/vets/match-hospitals', { hospitals });
  return response.data;
};

// GANADI 에 승인 등록된 수의사 공용 목록
// params: { sort: 'rating' | 'reviews' | 'recent', limit, offset, specialty }
export const listRegisteredVets = async (params = {}) => {
  const response = await apiClient.get('/vets/registered', { params });
  return response.data;
};

// AI 결과 페이지 등에서 보여줄 짧은 추천 수의사 목록 (기본 3명)
export const getRecommendedVets = async (params = {}) => {
  const response = await apiClient.get('/vets/recommended', { params });
  return response.data;
};