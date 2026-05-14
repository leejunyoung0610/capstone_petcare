import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { confirmTossPayment } from "../../api/payments";

export function PaymentTossSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    if (!paymentKey || !orderId || amount == null || amount === "") {
      setError("결제 정보가 없습니다. 소견 요청 화면에서 다시 시도해 주세요.");
      return;
    }
    done.current = true;

    (async () => {
      try {
        const res = await confirmTossPayment({
          paymentKey,
          orderId,
          amount,
        });
        const id = res.opinionId;
        if (id != null) {
          navigate(`/opinions/${id}`, { replace: true });
          return;
        }
        setError("소견 요청 처리에 실패했습니다.");
      } catch (e: unknown) {
        let msg = "";
        if (typeof e === "object" && e !== null && "response" in e) {
          const raw = (e as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
          if (Array.isArray(raw)) {
            msg = raw.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ");
          } else if (raw != null) {
            msg = String(raw);
          }
        }
        setError(msg || "결제 확인 중 오류가 발생했습니다.");
      }
    })();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16">
      {!error ? (
        <>
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-600">테스트 결제를 확인하는 중입니다…</p>
        </>
      ) : (
        <>
          <p className="mb-4 text-center text-sm text-red-600">{error}</p>
          <Link to="/mypage" className="text-sm font-medium text-blue-600 hover:underline">
            마이페이지로
          </Link>
        </>
      )}
    </div>
  );
}
