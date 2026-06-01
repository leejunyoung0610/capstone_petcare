import apiClient from './client';
import {
  needsDirectPdfNavigation,
  openPdfViaDirectUrl,
  savePdfBlob,
} from '../lib/pdfDownload';

/**
 * 진단 API
 */

// AI 진단 요청 (이미지 업로드)
export const analyzePetEye = async (petId, imageFile, options = {}) => {
  const {
    trainingConsent = false,
    captureDevice = '스마트폰',
    consentVersion = 'v1',
  } = options;

  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('training_consent', trainingConsent ? 'true' : 'false');
  formData.append('capture_device', captureDevice);
  formData.append('consent_version', consentVersion);
  
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

// 진단 결과 삭제
export const deleteDiagnosis = async (diagnosisId) => {
  await apiClient.delete(`/diagnosis/${diagnosisId}`);
};

// 인앱 보고서 조회 (없으면 AI 서버에서 생성 후 DB에 저장)
export const getDiagnosisReport = async (diagnosisId) => {
  const response = await apiClient.get(`/diagnosis/${diagnosisId}/report`, {
    timeout: 120000,
  });
  return response.data;
};

// PDF 다운로드 (Claude 리포트 + ReportLab PDF — 서버 처리 시간이 길 수 있음)
export const downloadDiagnosisPDF = async (diagnosisId) => {
  // iOS Safari: axios 완료 후 blob 열기는 사용자 제스처가 만료되어 무응답처럼 보임
  if (needsDirectPdfNavigation()) {
    openPdfViaDirectUrl(`/diagnosis/${diagnosisId}/pdf`);
    return;
  }

  try {
    const response = await apiClient.get(`/diagnosis/${diagnosisId}/pdf`, {
      responseType: 'blob',
      timeout: 120000,
    });

    savePdfBlob(response.data, `진단보고서_${diagnosisId}.pdf`);
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
