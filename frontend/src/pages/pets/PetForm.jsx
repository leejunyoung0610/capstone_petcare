import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import usePetStore from '../../stores/petStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { WireframeBox } from '../../components/WireframeBox';

export default function PetForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { addPet, editPet, fetchPet, selectedPet, loading, error, clearError } = usePetStore();

  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    gender: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEdit && id) {
      fetchPet(parseInt(id)).then((pet) => {
        setFormData({
          name: pet.name || '',
          species: pet.species || 'dog',
          breed: pet.breed || '',
          age: pet.age ? pet.age.toString() : '',
          gender: pet.gender || '',
        });
      }).catch(() => {
        navigate('/pets');
      });
    }
    return () => clearError();
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.';
    }
    if (formData.age && (parseInt(formData.age) < 0 || parseInt(formData.age) > 30)) {
      errors.age = '나이는 0~30 사이로 입력해주세요.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const petData = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed.trim() || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
      };

      if (isEdit) {
        await editPet(parseInt(id), petData);
      } else {
        await addPet(petData);
      }

      navigate('/pets');
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-link">
        {isEdit ? 'Edit' : 'New pet'}
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {isEdit ? '반려동물 정보 수정' : '반려동물 등록'}
      </h1>
      <p className="mt-2 max-w-lg text-[15px] text-slate-600">
        진단 시 선택할 수 있도록 기본 정보를 정확히 입력해 주세요.
      </p>

      <WireframeBox label={isEdit ? '프로필 수정' : '새 프로필'} className="mt-10 shadow-float">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <Input
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 뽀삐, 나비"
              error={formErrors.name}
              required
            />

            {/* Species */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종류 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="species"
                    value="dog"
                    checked={formData.species === 'dog'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>🐶 강아지</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="species"
                    value="cat"
                    checked={formData.species === 'cat'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>🐱 고양이</span>
                </label>
              </div>
            </div>

            {/* Breed */}
            <Input
              label="품종"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="예: 포메라니안, 코리안숏헤어"
            />

            {/* Age */}
            <Input
              label="나이"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              placeholder="숫자만 입력 (세)"
              error={formErrors.age}
            />

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성별
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택 안 함</option>
                <option value="male">남아</option>
                <option value="female">여아</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/pets')}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="flex-1"
              >
                {isEdit ? '수정하기' : '등록하기'}
              </Button>
            </div>
          </form>
      </WireframeBox>
    </div>
  );
}
