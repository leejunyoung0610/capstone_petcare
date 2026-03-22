import { create } from 'zustand';
import { getMyPets, getPet, createPet, updatePet, deletePet } from '../api/pets';

const usePetStore = create((set, get) => ({
  // State
  pets: [],
  selectedPet: null,
  loading: false,
  error: null,

  // Actions
  fetchPets: async () => {
    set({ loading: true, error: null });
    try {
      const pets = await getMyPets();
      set({ pets, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '반려동물 목록을 불러오는데 실패했습니다.',
        loading: false 
      });
    }
  },

  fetchPet: async (petId) => {
    set({ loading: true, error: null });
    try {
      const pet = await getPet(petId);
      set({ selectedPet: pet, loading: false });
      return pet;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '반려동물 정보를 불러오는데 실패했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  addPet: async (petData) => {
    set({ loading: true, error: null });
    try {
      const newPet = await createPet(petData);
      set((state) => ({ 
        pets: [...state.pets, newPet],
        loading: false 
      }));
      return newPet;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '반려동물 등록에 실패했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  editPet: async (petId, petData) => {
    set({ loading: true, error: null });
    try {
      const updatedPet = await updatePet(petId, petData);
      set((state) => ({
        pets: state.pets.map(p => p.id === petId ? updatedPet : p),
        selectedPet: updatedPet,
        loading: false
      }));
      return updatedPet;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '반려동물 정보 수정에 실패했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  removePet: async (petId) => {
    set({ loading: true, error: null });
    try {
      await deletePet(petId);
      set((state) => ({
        pets: state.pets.filter(p => p.id !== petId),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || '반려동물 삭제에 실패했습니다.',
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  setSelectedPet: (pet) => set({ selectedPet: pet }),
}));

export default usePetStore;
