import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { getMyReports } from '../api/reports';

const STATUS_LABEL = {
  pending: '대기',
  processing: '처리중',
  resolved: '완료',
  dismissed: '기각',
};

export default function ReportHistory() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyReports()
      .then(setReports)
      .catch(() => alert('신고 내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-base font-bold text-slate-900">내 신고 내역</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {loading && <p className="text-center text-sm text-slate-500 py-10">불러오는 중...</p>}
        {!loading && reports.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-10">접수한 신고가 없습니다.</p>
        )}
        {reports.map((r) => (
          <Link
            key={r.id}
            to={`/report/history/${r.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500">#{r.id}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {STATUS_LABEL[r.status] || r.status}
              </span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">{r.target_label}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.reason}</p>
            {r.message_count > 0 && (
              <p className="text-xs text-blue-600 mt-2">관리자 메시지 {r.message_count}건</p>
            )}
          </Link>
        ))}
        <Link
          to="/report"
          className="block w-full py-3 text-center border border-slate-300 bg-white rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          새 신고하기
        </Link>
      </div>
    </div>
  );
}
