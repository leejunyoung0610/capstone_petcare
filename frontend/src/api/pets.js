import apiClient from './client';

/**
 * 반려동물 API
 */

// 내 반려동물 목록 조회
export const getMyPets = async () => {
  const response = await apiClient.get('/pets');
  return response.data;
};

// 반려동물 상세 조회
export const getPet = async (petId) => {
  const response = await apiClient.get(`/pets/${petId}`);
  return response.data;
};

// 반려동물 등록
export const createPet = async (petData) => {
  const response = await apiClient.post('/pets', petData);
  return response.data;
};

// 반려동물 수정
export const updatePet = async (petId, petData) => {
  const response = await apiClient.put(`/pets/${petId}`, petData);
  return response.data;
};

// 반려동물 삭제
export const deletePet = async (petId) => {
  await apiClient.delete(`/pets/${petId}`);
};
