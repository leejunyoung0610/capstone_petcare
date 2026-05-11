import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import {
  getSubscriptionStatus,
  isPushSupported,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
  type PushStatus,
} from '../../lib/push';

/** 마이페이지 설정 탭 안의 "푸시 알림" 카드. */
export function PushSettingsCard() {
  const [status, setStatus] = useState<PushStatus>('default');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSubscriptionStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  const isOn = status === 'subscribed';
  const isUnsupported = status === 'unsupported';
  const isBlocked = status === 'denied';

  const handleToggle = async () => {
    if (busy || isUnsupported) return;
    setBusy(true);
    setMessage(null);
    try {
      if (isOn) {
        await unsubscribeFromPush();
        setStatus('default');
        setMessage('푸시 알림을 해제했습니다.');
      } else {
        const next = await subscribeToPush();
        setStatus(next);
        if (next === 'subscribed') {
          setMessage('푸시 알림을 활성화했습니다.');
        } else if (next === 'denied') {
          setMessage(
            '브라우저에서 알림 권한이 차단되어 있습니다. 사이트 설정에서 허용해주세요.',
          );
        }
      }
    } catch (e) {
      console.error(e);
      setMessage('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await sendTestPush();
      if (r.sent > 0) setMessage(`테스트 알림 ${r.sent}건 전송했습니다.`);
      else setMessage('전송할 구독이 없습니다. 먼저 활성화해주세요.');
    } catch (e) {
      console.error(e);
      setMessage('테스트 전송 실패. 콘솔을 확인해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            isOn ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {isOn ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            푸시 알림
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            소견이 도착하거나 진단 결과가 준비되면 브라우저로 즉시 알려드립니다.
          </p>

          {!isUnsupported && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggle}
                disabled={busy || isBlocked}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
                  isOn
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isOn ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <BellRing className="h-4 w-4" />
                )}
                {isOn ? '알림 끄기' : '알림 켜기'}
              </button>
              {isOn && (
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm"
                >
                  테스트 발송
                </button>
              )}
            </div>
          )}

          {isUnsupported && (
            <p className="mt-3 inline-block rounded-md bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
              이 브라우저는 Web Push 를 지원하지 않습니다. iOS Safari 는 16.4+ 에서
              홈화면에 추가한 PWA 에서만 지원됩니다.
            </p>
          )}

          {isBlocked && (
            <p className="mt-3 inline-block rounded-md bg-red-50 px-2.5 py-1 text-[11px] text-red-700">
              브라우저에서 알림이 차단되어 있습니다. 주소창 자물쇠 메뉴 → 알림 →
              "허용" 으로 변경 후 다시 시도해주세요.
            </p>
          )}

          {message && (
            <p className="mt-2 text-[11px] text-slate-500 sm:text-xs">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
