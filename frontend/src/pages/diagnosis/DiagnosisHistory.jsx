import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDiagnoses } from '../../api/diagnosis';

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistories = async () => {
      try {
        const data = await getMyDiagnoses();
        setHistories(data);
      } catch (err) {
        setError('진단 이력을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistories();
  }, []);

  if (isLoading) return <div className="text-center py-20">불러오는 중...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">진단 이력</h1>

      {histories.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          아직 진단 이력이 없어요.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {histories.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/diagnosis/${item.id}`)}
              className="border rounded-xl p-5 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">
                  {item.pet_name} ({item.animal_type === 'DOG' ? '강아지' : '고양이'})
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {item.is_normal ? (
                  <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                    정상
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
                    {item.main_disease}
                  </span>
                )}
                {item.main_confidence && (
                  <span className="text-sm text-gray-500">
                    신뢰도 {Math.round(item.main_confidence * 100)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}