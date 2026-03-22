import { create } from 'zustand';
import { analyzePetEye, getDiagnosis, getMyDiagnoses, getPetDiagnoses, downloadDiagnosisPDF } from '../api/diagnosis';

const useDiagnosisStore = create((set, get) => ({
  // State
  diagnoses: [],
  currentDiagnosis: null,
  loading: false,
  error: null,

  // Actions
  analyzePet: async (petId, imageFile) => {
    set({ loading: true, error: null });
    try {
      const result = await analyzePetEye(petId, imageFile);
      set({ 
        currentDiagnosis: result,
        diagnoses: [result, ...get().diagnoses],
        loading: false 
      });
      return result;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'AI 분석 중 오류가 발생했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  fetchDiagnosis: async (diagnosisId) => {
    set({ loading: true, error: null });
    try {
      const diagnosis = await getDiagnosis(diagnosisId);
      set({ currentDiagnosis: diagnosis, loading: false });
      return diagnosis;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '진단 결과를 불러오는데 실패했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  fetchMyDiagnoses: async () => {
    set({ loading: true, error: null });
    try {
      const diagnoses = await getMyDiagnoses();
      set({ diagnoses, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '진단 이력을 불러오는데 실패했습니다.',
        loading: false 
      });
    }
  },

  fetchPetDiagnoses: async (petId) => {
    set({ loading: true, error: null });
    try {
      const diagnoses = await getPetDiagnoses(petId);
      set({ diagnoses, loading: false });
      return diagnoses;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '진단 이력을 불러오는데 실패했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  downloadPDF: async (diagnosisId) => {
    set({ loading: true, error: null });
    try {
      await downloadDiagnosisPDF(diagnosisId);
      set({ loading: false });
    } catch (error) {
      const msg =
        error?.message ||
        error.response?.data?.detail ||
        'PDF 다운로드에 실패했습니다.';
      set({
        error: msg,
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  setCurrentDiagnosis: (diagnosis) => set({ currentDiagnosis: diagnosis }),
}));

export default useDiagnosisStore;
