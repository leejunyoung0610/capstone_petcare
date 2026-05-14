import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDiagnoses, deleteDiagnosis } from '../../api/diagnosis';
import { Trash2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getMyDiagnoses()
      .then(setHistories)
      .catch(() => setError('진단 이력을 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteDiagnosis(deleteTarget);
      setHistories((prev) => prev.filter((h) => h.id !== deleteTarget));
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getTrend = (current, previous) => {
    if (!previous || previous.is_normal) return null;
    if (current.is_normal) return '호전';
    const diff = (current.main_confidence ?? 0) - (previous.main_confidence ?? 0);
    if (diff > 0.05) return '악화';
    if (diff < -0.05) return '호전';
    return '유지';
  };

  const chartData = [...histories]
    .reverse()
    .filter((h) => !h.is_normal && h.main_confidence)
    .map((h) => ({
      date: new Date(h.created_at).toLocaleDateString(),
      신뢰도: Math.round(h.main_confidence),
      질환: h.main_disease,
    }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500 text-sm">{error}</div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold text-slate-900 mb-6">진단 이력</h1>

      {histories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
          <p className="text-slate-500">아직 진단 이력이 없어요.</p>
        </div>
      ) : (
        <>
          {/* 추이 차트 */}
          {chartData.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">질환 신뢰도 변화 추이</h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="신뢰도"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 이력 목록 */}
          <div className="flex flex-col gap-3">
            {histories.map((item, index) => {
              const previous = histories[index + 1];
              const trend = getTrend(item, previous);

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/diagnosis/${item.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-900">
                      {item.pet_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item.id);
                        }}
                        className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.is_normal ? (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                        정상
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                        {item.main_disease}
                      </span>
                    )}
                    {item.report_data && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        보고서
                      </span>
                    )}
                    {item.main_confidence && (
                      <span className="text-sm text-slate-500">
                        신뢰도 {Math.round(item.main_confidence)}%
                      </span>
                    )}
                    {trend && (
                      <span className={`text-sm font-bold ml-auto ${
                        trend === '악화' ? 'text-red-500' :
                        trend === '호전' ? 'text-green-500' :
                        'text-slate-400'
                      }`}>
                        {trend === '악화' ? '↑ 악화' :
                         trend === '호전' ? '↓ 호전' :
                         '— 유지'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">진단 이력 삭제</h3>
            <p className="text-sm text-slate-500 mb-5">
              삭제하면 보고서와 함께 복구할 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}