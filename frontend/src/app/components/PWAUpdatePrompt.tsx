import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

/**
 * PWA Service Worker 등록 + 업데이트 토스트.
 *
 * 동작:
 *   - 앱이 처음 실행되면 SW 가 백그라운드에서 등록되고 자산을 캐시.
 *   - 새 버전이 빌드돼서 배포되면, `needRefresh` 가 true 가 되어 사용자에게
 *     "새 버전이 있습니다 → 새로고침" 토스트를 노출. 사용자가 누르면
 *     `updateServiceWorker(true)` 가 즉시 새 SW 활성화 + 페이지 reload.
 *   - 처음 오프라인 사용 가능 상태가 되면 `offlineReady` 가 true 가 되어
 *     "이제 오프라인에서도 사용 가능" 안내 (5초 후 자동 닫힘).
 *
 * 개발 모드에선 vite-plugin-pwa 의 devOptions.enabled=false 라 동작 안 함.
 * 프로덕션 빌드 (npm run build && npm run preview) 또는 배포에서 검증.
 */
export function PWAUpdatePrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("[PWA] SW 등록 실패:", error);
    },
  });

  useEffect(() => {
    if (needRefresh || offlineReady) setShow(true);
    else setShow(false);
  }, [needRefresh, offlineReady]);

  // offlineReady 는 5초 후 자동 닫기 (사용자 결정 필요 없음)
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => {
      setOfflineReady(false);
    }, 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5">
        {needRefresh ? (
          <>
            <RefreshCw className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="flex-1 text-sm text-slate-700">
              <p className="font-medium text-slate-900">새 버전이 있어요</p>
              <p className="text-xs text-slate-500">
                지금 새로고침하면 최신 GANADI를 사용할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={() => {
                setNeedRefresh(false);
              }}
              aria-label="닫기"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 text-sm text-slate-700">
              <p className="font-medium text-slate-900">오프라인 사용 가능</p>
              <p className="text-xs text-slate-500">이제 인터넷이 없어도 앱이 열려요.</p>
            </div>
            <button
              type="button"
              onClick={() => setOfflineReady(false)}
              aria-label="닫기"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
