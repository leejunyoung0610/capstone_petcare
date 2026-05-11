import apiClient from './client';

// 소견 요청 전송
export const createOpinion = async (data) => {
  const response = await apiClient.post('/opinions/request', data);
  return response.data;
};

// 보호자: 내가 요청한 소견 목록 (수의사용 GET /opinions/requests 와 구분)
export const getMyOpinions = async () => {
  const response = await apiClient.get('/opinions/mine');
  return response.data;
};

// 소견 요청 취소
export const cancelOpinion = async (opinionId) => {
  const response = await apiClient.patch(`/opinions/${opinionId}/cancel`);
  return response.data;
};

// 소견 단건 조회 — opinion.id 기준
// (백엔드 GET /opinions/{diagnosis_id} 는 진단별 "최신 소견" 만 반환하므로,
//  목록에서 특정 카드를 눌렀을 때는 by-id 를 사용한다.)
export const getOpinion = async (opinionId) => {
  const response = await apiClient.get(`/opinions/by-id/${opinionId}`);
  return response.data;
};

// 수의사: 소견 요청 목록 (status: pending | answered)
export const getVetOpinionRequests = async (status) => {
  const params = status ? { status } : {};
  const response = await apiClient.get('/opinions/requests', { params });
  return response.data;
};

// 수의사: 소견 작성·수정
export const writeVetOpinion = async (opinionId, data) => {
  const response = await apiClient.post(`/opinions/${opinionId}`, data);
  return response.data;
};

export const updateVetOpinion = async (opinionId, data) => {
  const response = await apiClient.put(`/opinions/${opinionId}`, data);
  return response.data;
};

// 소견서 PDF 다운로드
export const downloadOpinionPDF = async (opinionId) => {
  const response = await apiClient.get(`/vet-opinions/${opinionId}/pdf`, {
    responseType: 'blob',
    timeout: 60000,
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `소견서_${opinionId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 리뷰 작성 (평점·리뷰)
export const rateOpinion = async (opinionId, data) => {
  const response = await apiClient.post(`/opinions/${opinionId}/rate`, data);
  return response.data;
};