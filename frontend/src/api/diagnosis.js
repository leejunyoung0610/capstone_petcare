import apiClient from './client';

/**
 * 진단 API
 */

// AI 진단 요청 (이미지 업로드)
export const analyzePetEye = async (petId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await apiClient.post(`/diagnosis/analyze?pet_id=${petId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// 진단 결과 상세 조회
export const getDiagnosis = async (diagnosisId) => {
  const response = await apiClient.get(`/diagnosis/${diagnosisId}`);
  return response.data;
};

// 내 진단 이력 조회
export const getMyDiagnoses = async () => {
  const response = await apiClient.get('/diagnosis/history');
  return response.data;
};

// 반려동물별 진단 이력 조회
export const getPetDiagnoses = async (petId) => {
  const response = await apiClient.get(`/diagnosis/pet/${petId}`);
  return response.data;
};

// PDF 다운로드 (Claude 리포트 + ReportLab PDF — 서버 처리 시간이 길 수 있음)
export const downloadDiagnosisPDF = async (diagnosisId) => {
  try {
    const response = await apiClient.get(`/diagnosis/${diagnosisId}/pdf`, {
      responseType: 'blob',
      timeout: 120000,
    });

    const blob = response.data;
    if (!(blob instanceof Blob) || blob.size < 100) {
      throw new Error('PDF 응답이 올바르지 않습니다.');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `진단보고서_${diagnosisId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    const data = error.response?.data;
    if (data instanceof Blob) {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        const detail = parsed?.detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
              : text || 'PDF 다운로드에 실패했습니다.';
        throw new Error(msg);
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          throw new Error(text.slice(0, 200) || 'PDF 다운로드에 실패했습니다.');
        }
        throw parseErr;
      }
    }
    throw error;
  }
};
