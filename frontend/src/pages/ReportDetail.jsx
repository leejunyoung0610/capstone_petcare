import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Send } from 'lucide-react';
import { getReportDetail, replyToReport } from '../api/reports';

const STATUS_LABEL = {
  pending: '대기',
  processing: '처리중',
  resolved: '완료',
  dismissed: '기각',
};

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function senderLabel(role) {
  if (role === 'admin') return '관리자';
  if (role === 'system') return '시스템';
  if (role === 'user') return '나';
  return role;
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReportDetail(id);
      setReport(data);
    } catch {
      alert('신고 정보를 불러오지 못했습니다.');
      navigate('/report/history');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToReport(id, reply.trim());
      setReply('');
      await load();
    } catch {
      alert('답글 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/report/history')} className="p-1 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-base font-bold text-slate-900">신고 #{report.id}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">상태</span>
            <span className="font-semibold">{STATUS_LABEL[report.status] || report.status}</span>
          </div>
          <div>
            <span className="text-slate-500">대상: </span>
            {report.target_label}
          </div>
          <div>
            <span className="text-slate-500">사유: </span>
            {report.reason}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">관리자와의 대화</h2>
          {(report.messages || []).map((m) => (
            <div
              key={m.id}
              className={`rounded-xl p-3 text-sm ${
                m.sender_role === 'user'
                  ? 'bg-blue-50 border border-blue-100 ml-6'
                  : 'bg-white border border-slate-200 mr-6'
              }`}
            >
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">{senderLabel(m.sender_role)}</span>
                <span>{formatTime(m.created_at)}</span>
              </div>
              <p className="text-slate-800 whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>

        {report.status !== 'dismissed' && (
          <form onSubmit={handleReply} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-bold text-slate-900 mb-2">답글 남기기</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="관리자에게 추가로 전달할 내용"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? '전송 중...' : '답글 보내기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
