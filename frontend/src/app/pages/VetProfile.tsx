import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getVetMe, updateVetMe } from "../../api/vets";
import { SHOW_OPINION_PAYMENT_UI } from "../../config/features";

/** 병원 프로필 — PUT /api/vets/profile 과 연동 (피그마 설정 탭 대체) */
export function VetProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    hospital_name: "",
    address: "",
    phone: "",
    specialty: "",
    business_hours: "",
    opinion_fee_won: "" as string | number,
  });

  useEffect(() => {
    let c = false;
    getVetMe()
      .then((me: Record<string, unknown>) => {
        if (c) return;
        setForm({
          hospital_name: String(me.hospital_name ?? ""),
          address: String(me.address ?? ""),
          phone: String(me.phone ?? ""),
          specialty: String(me.specialty ?? ""),
          business_hours: String(me.business_hours ?? ""),
          opinion_fee_won:
            me.opinion_fee_won !== undefined && me.opinion_fee_won !== null
              ? Number(me.opinion_fee_won)
              : "",
        });
      })
      .catch(() => setMsg("프로필을 불러오지 못했습니다."))
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setMsg(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = {
        hospital_name: form.hospital_name.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
        business_hours: form.business_hours.trim() || undefined,
      };
      if (SHOW_OPINION_PAYMENT_UI) {
        const feeRaw = form.opinion_fee_won;
        if (feeRaw === "" || feeRaw === null || feeRaw === undefined) {
          payload.opinion_fee_won = null;
        } else {
          const n = typeof feeRaw === "number" ? feeRaw : parseInt(String(feeRaw).replace(/\D/g, ""), 10);
          if (!Number.isFinite(n) || n < 0) {
            setMsg("상담료는 0 이상의 숫자로 입력해 주세요.");
            setSaving(false);
            return;
          }
          payload.opinion_fee_won = n;
        }
      }
      await updateVetMe(payload);
      setMsg("저장되었습니다.");
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setMsg(typeof detail === "string" ? detail : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <Link
          to="/vet/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4" />
          대시보드
        </Link>
        <h1 className="mt-2 text-lg font-bold text-slate-900">
          {SHOW_OPINION_PAYMENT_UI ? "병원 프로필 · 상담료" : "병원 프로필"}
        </h1>
        <p className="text-xs text-slate-500">
          {SHOW_OPINION_PAYMENT_UI
            ? "보호자에게 노출되는 정보와 소견 결제 금액을 설정합니다."
            : "보호자에게 노출되는 병원 정보를 설정합니다."}
        </p>
      </header>

      <div className="mx-auto max-w-lg p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            불러오는 중…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {[
              ["hospital_name", "병원명"],
              ["address", "주소"],
              ["phone", "대표 전화"],
              ["specialty", "진료 과목 (예: 안과)"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
                <input
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">진료 시간</label>
              <textarea
                name="business_hours"
                rows={2}
                value={form.business_hours}
                onChange={onChange}
                placeholder="평일 09:00–19:00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {SHOW_OPINION_PAYMENT_UI && (
              <div id="opinion-fee">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  원격 소견 상담료 (원)
                </label>
                <input
                  name="opinion_fee_won"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.opinion_fee_won === "" ? "" : form.opinion_fee_won}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((p) => ({
                      ...p,
                      opinion_fee_won: v === "" ? "" : parseInt(v, 10) || 0,
                    }));
                    setMsg(null);
                  }}
                  placeholder="비워두면 플랫폼 기본 금액"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  미입력 시 서비스 기본 상담료가 적용됩니다. 보호자 소견 요청·결제 금액에 반영됩니다.
                </p>
              </div>
            )}
            {msg && (
              <p className={`text-sm ${msg.includes("실패") ? "text-red-600" : "text-green-700"}`}>{msg}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
