import { Link, useSearchParams } from "react-router";

export function PaymentTossFail() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-lg font-bold text-slate-900">결제가 완료되지 않았습니다</p>
      <p className="mt-2 text-sm text-slate-600">
        토스 테스트 결제창에서 취소했거나 오류가 발생했습니다. 실제 과금은 없습니다.
      </p>
      {(code || message) && (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
          {code && <span className="mr-2 font-mono">{code}</span>}
          {message && (
            <span>
              {(() => {
                try {
                  return decodeURIComponent(message);
                } catch {
                  return message;
                }
              })()}
            </span>
          )}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          to="/mypage"
          className="rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          마이페이지로
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
          홈으로
        </Link>
      </div>
    </div>
  );
}
