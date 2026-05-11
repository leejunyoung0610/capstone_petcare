import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { uploadPetProfileImage } from '../../api/pets';
import usePetStore from '../../stores/petStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function PetForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const fromMyPage = searchParams.get('from') === 'mypage';
  const fileInputRef = useRef(null);

  const { addPet, editPet, fetchPet, loading, error, clearError } = usePetStore();

  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    gender: '',
    is_neutered: false,
    medical_history: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
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
          is_neutered: pet.is_neutered || false,
          medical_history: pet.medical_history || '',
        });
        if (pet.profile_image_url) {
          const imageUrl = pet.profile_image_url.startsWith('http')
            ? pet.profile_image_url
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8002'}/${pet.profile_image_url}`;
          setProfileImagePreview(imageUrl);
        }
      }).catch(() => {
        navigate('/pets');
      });
    }
    return () => clearError();
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = '이름을 입력해주세요.';
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
        is_neutered: formData.is_neutered,
        medical_history: formData.medical_history.trim() || null,
      };

      let petId;
      if (isEdit) {
        await editPet(parseInt(id), petData);
        petId = parseInt(id);
      } else {
        const newPet = await addPet(petData);
        petId = newPet.id;
      }

      // 프로필 사진 업로드
      if (profileImage && petId) {
        await uploadPetProfileImage(petId, profileImage);
      }

      navigate(fromMyPage ? '/mypage' : '/pets');
    } catch (err) { }
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
        {isEdit ? 'Edit' : 'New pet'}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {isEdit ? '반려동물 정보 수정' : '반려동물 등록'}
      </h1>
      <p className="mt-2 max-w-lg text-sm text-slate-500">
        진단 시 선택할 수 있도록 기본 정보를 정확히 입력해 주세요.
      </p>

      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 프로필 사진 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              프로필 사진 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">
                    {formData.species === 'dog' ? '🐶' : '🐱'}
                  </span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  사진 선택
                </button>
                {profileImagePreview && (
                  <button
                    type="button"
                    onClick={() => { setProfileImage(null); setProfileImagePreview(null); }}
                    className="ml-2 text-sm text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
                <p className="text-xs text-slate-400 mt-1">JPG, PNG · 최대 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* 이름 */}
          <Input
            label="이름"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="예: 뽀삐, 나비"
            error={formErrors.name}
            required
          />

          {/* 종류 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              종류 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  value="dog"
                  checked={formData.species === 'dog'}
                  onChange={handleChange}
                />
                <span className="text-sm">🐶 강아지</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  value="cat"
                  checked={formData.species === 'cat'}
                  onChange={handleChange}
                />
                <span className="text-sm">🐱 고양이</span>
              </label>
            </div>
          </div>

          {/* 품종 */}
          <Input
            label="품종"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            placeholder="예: 포메라니안, 코리안숏헤어"
          />

          {/* 나이 */}
          <Input
            label="나이"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            placeholder="숫자만 입력 (세)"
            error={formErrors.age}
          />

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">성별</label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full appearance-none px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                style={{ direction: 'ltr', textAlign: 'left' }}
              >
                <option value="">선택 안 함</option>
                <option value="male">남아</option>
                <option value="female">여아</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 중성화 여부 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">중성화 여부</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_neutered"
                checked={formData.is_neutered}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm text-slate-600">중성화 완료</span>
            </label>
          </div>

          {/* 병력/특이사항 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              병력/특이사항 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={handleChange}
              placeholder="예: 알레르기 있음, 심장병 병력, 특이사항 없음"
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
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
              disabled={!isValid}
              className="flex-1"
            >
              {isEdit ? '수정하기' : '등록하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}