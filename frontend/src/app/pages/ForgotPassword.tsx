import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Eye, Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../api/auth';

export function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('account') === 'vet' ? 'vet' : 'user';
  const [accountType, setAccountType] = useState<'user' | 'vet'>(initialType);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [mailpitUrl, setMailpitUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDevResetUrl('');
    setMailpitUrl('');
    try {
      const res = await authAPI.forgotPassword(email.trim(), accountType);
      setMessage(res.data.message);
      if (res.data.dev_reset_url) {
        setDevResetUrl(res.data.dev_reset_url);
      }
      if (res.data.delivery_mode === 'mailpit' && res.data.mailpit_url) {
        setMailpitUrl(res.data.mailpit_url);
      }
    } catch {
      setError('요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Eye className="w-10 h-10 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">PET EYE AI</h1>
            </div>
          </Link>
          <p className="text-slate-500 text-sm">비밀번호 재설정</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> 로그인으로
          </Link>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            {[
              { key: 'user' as const, label: '보호자' },
              { key: 'vet' as const, label: '수의사' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setAccountType(t.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  accountType === t.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            가입한 이메일로 재설정 링크를 보내 드립니다. 링크는 60분 동안 유효합니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입 이메일"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 space-y-2">
                <p>{message}</p>
                {mailpitUrl && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-2 text-blue-900">
                    <p className="text-xs mb-1">
                      로컬 메일함(Mailpit)에서 확인하세요. 네이버 앱/웹메일에는 도착하지 않습니다.
                    </p>
                    <a
                      href={mailpitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-700 underline"
                    >
                      {mailpitUrl} 열기
                    </a>
                  </div>
                )}
                {devResetUrl && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-900">
                    <p className="text-xs font-semibold mb-1">개발용 재설정 링크 (SMTP 미설정)</p>
                    <a href={devResetUrl} className="text-xs text-blue-700 break-all underline">
                      {devResetUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '발송 중...' : '재설정 링크 받기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
