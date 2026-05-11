import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import usePetStore from '../../stores/petStore';
import { ButtonCore } from '../../components/ui/button-core';
import { Modal } from '../../app/components/Modal';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8002';

export default function PetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { fetchPet, selectedPet, loading, error, removePet: deletePet } = usePetStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPet(parseInt(id)).catch(() => navigate('/pets'));
    }
  }, [id]);

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deletePet(parseInt(id));
      navigate('/pets');
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading || !selectedPet) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
        <p className="text-6xl mb-4">⚠️</p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">오류가 발생했습니다</h2>
        <ButtonCore variant="secondary" asChild>
          <Link to="/pets">목록으로 돌아가기</Link>
        </ButtonCore>
      </div>
    );
  }

  const pet = selectedPet;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
        Pet Profile
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">
        반려동물 상세
      </h1>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {/* 프로필 사진 */}
        <div className="flex justify-center mb-6">
          {pet.profile_image_url ? (
            <img
              src={pet.profile_image_url?.startsWith('http') ? pet.profile_image_url : `${BASE_URL}/${pet.profile_image_url}`}
              alt={pet.name}
              className="w-40 h-40 rounded-full object-cover border-4 border-slate-200"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl">
              {pet.species === 'dog' ? '🐶' : '🐱'}
            </div>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="space-y-3 text-sm mb-6">
          {[
            { label: '이름', value: pet.name },
            { label: '종류', value: pet.species === 'dog' ? '🐶 강아지' : '🐱 고양이' },
            pet.breed && { label: '품종', value: pet.breed },
            pet.age && { label: '나이', value: `${pet.age}세` },
            pet.gender && { label: '성별', value: pet.gender === 'male' ? '남아' : '여아' },
            pet.medical_history && { label: '병력', value: pet.medical_history },
          ].filter(Boolean).map((item) => (
            <div key={item.label} className="flex justify-between border-b border-slate-100 pb-3">
              <span className="font-medium text-slate-500">{item.label}</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <ButtonCore variant="default" className="flex-1" asChild>
            <Link to={`/diagnosis/new?petId=${pet.id}`}>AI 진단하기</Link>
          </ButtonCore>
          <ButtonCore variant="secondary" className="flex-1" asChild>
            <Link to={`/pets/${pet.id}/edit`}>수정</Link>
          </ButtonCore>
          <ButtonCore
            variant="destructive"
            className="flex-1"
            onClick={() => setShowDeleteModal(true)}
          >
            삭제
          </ButtonCore>
        </div>
      </div>

      <div className="mt-4 text-center">
        <ButtonCore variant="ghost" asChild>
          <Link to="/pets">← 목록으로</Link>
        </ButtonCore>
      </div>

      <Modal
        isOpen={showDeleteModal}
        title="반려동물 삭제"
        message="정말 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제하기"
        cancelText="취소"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDanger={true}
      />
    </div>
  );
}