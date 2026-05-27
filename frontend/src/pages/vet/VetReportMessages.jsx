import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChevronLeft, Send, Shield } from 'lucide-react';
import {
  getVetReportMessages,
  getVetReportThread,
  replyVetReportMessage,
} from '../../api/vets';

const STATUS_LABEL = {
  pending: '대기',
  processing: '처리중',
  resolved: '완료',
  dismissed: '기각',
};

function formatTime(iso) {
  try {
    const d = new Date(iso);
    d.setHours(d.getHours() + 9);
    return d.toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function senderLabel(role) {
  if (role === 'admin') return '관리자';
  if (role === 'vet') return '나';
  return role;
}

export default function VetReportMessages() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [thread, setThread] = useState([]);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadList = useCallback(async () => {
    const data = await getVetReportMessages();
    setList(data);
  }, []);

  const loadThread = useCallback(async (id) => {
    const [d, msgs] = await Promise.all([
      getVetReportMessages().then((rows) => rows.find((r) => String(r.id) === String(id))),
      getVetReportThread(id),
    ]);
    setDetail(d || null);
    setThread(msgs);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (reportId) {
          await loadThread(reportId);
        } else {
          await loadList();
        }
      } catch {
        alert('관리자 안내를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId, loadList, loadThread]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !reportId) return;
    setSending(true);
    try {
      await replyVetReportMessage(reportId, reply.trim());
      setReply('');
      await loadThread(reportId);
    } catch {
      alert('답글 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        불러오는 중...
      </div>
    );
  }

  if (!reportId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <Link
            to="/vet/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            대시보드
          </Link>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            관리자 안내
          </h1>
          <p className="text-xs text-slate-500 mt-1">신고·검토 관련 관리자 메시지입니다.</p>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
          {list.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-12">받은 관리자 안내가 없습니다.</p>
          )}
          {list.map((r) => (
            <Link
              key={r.id}
              to={`/vet/report-messages/${r.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>#{r.id}</span>
                <span>{STATUS_LABEL[r.status] || r.status}</span>
              </div>
              <p className="font-semibold text-slate-900">{r.target_label}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.reason}</p>
              {r.message_count > 0 && (
                <p className="text-xs text-blue-600 mt-2">메시지 {r.message_count}건</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/vet/report-messages')} className="p-1 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900">관리자 안내 #{reportId}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {detail && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-1">
            <p><span className="text-slate-500">상태:</span> {STATUS_LABEL[detail.status] || detail.status}</p>
            <p><span className="text-slate-500">관련:</span> {detail.target_label}</p>
            <p className="text-xs text-slate-500">{detail.reason}</p>
          </div>
        )}

        <div className="space-y-3">
          {thread.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl p-3 text-sm ${m.sender_role === 'vet'
                ? 'bg-blue-50 border border-blue-100 ml-8'
                : 'bg-white border border-slate-200 mr-8'
                }`}
            >
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{senderLabel(m.sender_role)}</span>
                <span>{formatTime(m.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-slate-800">{m.body}</p>
            </div>
          ))}
        </div>

        {detail?.status !== 'dismissed' && (
          <form onSubmit={handleReply} className="bg-white border border-slate-200 rounded-xl p-4">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="관리자에게 답변"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
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
