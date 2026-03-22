import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import usePetStore from '../../stores/petStore';
import useAuthStore from '../../stores/authStore';
import { ButtonCore } from '../../components/ui/button-core';
import { WireframeBox } from '../../components/WireframeBox';

export default function PetList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pets, loading, error, fetchPets, clearError } = usePetStore();

  useEffect(() => {
    fetchPets();
    return () => clearError();
  }, []);

  if (loading && pets.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-brand-link border-t-transparent" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
      <WireframeBox label="내 반려동물" className="mb-10 shadow-float">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              {user?.name ? `${user.name}님, 환영합니다!` : '내 반려동물'}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              내 반려동물
            </h1>
          </div>
          <ButtonCore variant="default" asChild>
            <Link to="/pets/new">+ 반려동물 등록</Link>
          </ButtonCore>
        </div>
      </WireframeBox>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {pets.length === 0 ? (
          <WireframeBox label="EMPTY" className="bg-card p-12 text-center">
            <div className="mb-4 text-6xl">🐶🐱</div>
            <h3 className="mb-2 text-xl font-bold text-foreground">등록된 반려동물이 없습니다</h3>
            <p className="mb-6 text-muted-foreground">
              반려동물을 등록하고 AI 안구 스크리닝을 시작해 보세요!
            </p>
            <ButtonCore variant="default" size="lg" asChild>
              <Link to="/pets/new">첫 번째 반려동물 등록하기</Link>
            </ButtonCore>
          </WireframeBox>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <div
                key={pet.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/pets/${pet.id}/edit`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/pets/${pet.id}/edit`);
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.05] ring-1 ring-slate-900/[0.03] transition hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-lg"
              >
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-muted to-accent">
                    {pet.profile_image_url ? (
                      <img
                        src={pet.profile_image_url}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl">
                        {pet.species === 'dog' ? '🐶' : '🐱'}
                      </div>
                    )}
                </div>

                <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-foreground">{pet.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-semibold">종:</span>{' '}
                        {pet.species === 'dog' ? '강아지' : '고양이'}
                        {pet.breed && ` (${pet.breed})`}
                      </p>
                      {pet.age && (
                        <p>
                          <span className="font-semibold">나이:</span> {pet.age}세
                        </p>
                      )}
                      {pet.gender && (
                        <p>
                          <span className="font-semibold">성별:</span>{' '}
                          {pet.gender === 'male' ? '남아' : '여아'}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <ButtonCore variant="secondary" className="flex-1" asChild>
                        <Link
                          to={`/pets/${pet.id}/edit`}
                          className="inline-flex w-full justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          수정
                        </Link>
                      </ButtonCore>
                      <ButtonCore variant="default" className="flex-1" asChild>
                        <Link
                          to={`/diagnosis/new?petId=${pet.id}`}
                          className="inline-flex w-full justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          진단하기
                        </Link>
                      </ButtonCore>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
