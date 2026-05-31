import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Database, Eye, Loader2, RefreshCw, X } from "lucide-react";
import {
  getAdminCollectedSamples,
  getAdminCollectedSampleDetail,
  getAdminCollectedSamplesGapStats,
  patchAdminCollectedSample,
} from "../../../api/admin";
import { serverOrigin } from "../../../api/client";

function buildFileUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${serverOrigin}/${path.replace(/^\/+/, "")}`;
}

interface SampleRow {
  id: number;
  diagnosis_id?: number | null;
  image_url: string;
  animal_type: string;
  capture_device: string;
  pet_breed?: string | null;
  ai_main_disease?: string | null;
  ai_is_normal: boolean;
  ai_top3: { disease: string; confidence: number }[];
  label_status: string;
  confirmed_disease?: string | null;
  confirmed_severity?: string | null;
  created_at: string;
}

interface SampleDetail extends SampleRow {
  ai_predictions: Record<string, { label: string; confidence: number }>;
  ai_all_diseases: Record<string, number>;
  ai_model_version?: string | null;
  reject_reason?: string | null;
  consent_version: string;
}

interface GapStats {
  status_counts: Record<string, number>;
  confirmed: { animal_type: string; capture_device: string; disease: string; severity?: string | null; count: number }[];
  pending_ai: { animal_type: string; capture_device: string; disease: string; count: number }[];
}

function statusBadge(status: string) {
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "confirmed") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "pending") return "검수 대기";
  if (status === "confirmed") return "확정";
  if (status === "rejected") return "거절";
  return status;
}

function animalLabel(t: string) {
  return t === "dog" ? "강아지" : t === "cat" ? "고양이" : t;
}

export function CollectedSamplesPanel() {
  const [items, setItems] = useState<SampleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [gap, setGap] = useState<GapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");

  const [detail, setDetail] = useState<SampleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDisease, setConfirmDisease] = useState("");
  const [confirmSeverity, setConfirmSeverity] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (statusFilter) params.label_status = statusFilter;
      if (deviceFilter) params.capture_device = deviceFilter;
      if (animalFilter) params.animal_type = animalFilter;
      if (diseaseFilter.trim()) params.disease = diseaseFilter.trim();

      const [listData, gapData] = await Promise.all([
        getAdminCollectedSamples(params),
        getAdminCollectedSamplesGapStats(),
      ]);
      setItems(listData.items ?? []);
      setTotal(listData.total ?? 0);
      setGap(gapData);
    } catch {
      setError("수집 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deviceFilter, animalFilter, diseaseFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await getAdminCollectedSampleDetail(id);
      setDetail(data);
      setConfirmDisease(data.confirmed_disease || data.ai_main_disease || "");
      setConfirmSeverity(data.confirmed_severity || "");
      setRejectReason(data.reject_reason || "");
    } catch {
      setError("상세 정보를 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePatch = async (labelStatus: "confirmed" | "rejected" | "pending") => {
    if (!detail) return;
    setActionLoading(true);
    setError(null);
    try {
      const payload: Record<string, string> = { label_status: labelStatus };
      if (labelStatus === "confirmed") {
        payload.confirmed_disease = confirmDisease.trim();
        if (confirmSeverity.trim()) payload.confirmed_severity = confirmSeverity.trim();
      }
      if (labelStatus === "rejected" && rejectReason.trim()) {
        payload.reject_reason = rejectReason.trim();
      }
      const updated = await patchAdminCollectedSample(detail.id, payload);
      setDetail(updated);
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof msg === "string" ? msg : "검수 처리에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = gap?.status_counts?.pending ?? 0;

  return (
    <div className="space-y-5">
      {/* 요약 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "전체 수집", value: total },
          { label: "검수 대기", value: pendingCount },
          { label: "확정", value: gap?.status_counts?.confirmed ?? 0 },
          { label: "거절", value: gap?.status_counts?.rejected ?? 0 },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* 갭 참고 (pending AI) */}
      {gap && gap.pending_ai.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Database className="h-4 w-4" />
            AI 예측 기준 분포 (검수 전 참고)
          </h3>
          <div className="flex flex-wrap gap-2">
            {gap.pending_ai.slice(0, 12).map((row, i) => (
              <span
                key={`${row.animal_type}-${row.capture_device}-${row.disease}-${i}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                {animalLabel(row.animal_type)} · {row.capture_device} · {row.disease} ({row.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs text-slate-600">
          상태
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">전체</option>
            <option value="pending">검수 대기</option>
            <option value="confirmed">확정</option>
            <option value="rejected">거절</option>
          </select>
        </label>
        <label className="text-xs text-slate-600">
          장비
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">전체</option>
            <option value="스마트폰">스마트폰</option>
            <option value="검안경">검안경</option>
            <option value="일반카메라">일반카메라</option>
          </select>
        </label>
        <label className="text-xs text-slate-600">
          종
          <select
            value={animalFilter}
            onChange={(e) => setAnimalFilter(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">전체</option>
            <option value="dog">강아지</option>
            <option value="cat">고양이</option>
          </select>
        </label>
        <label className="flex-1 min-w-[140px] text-xs text-slate-600">
          질환 검색
          <input
            type="text"
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
            placeholder="예: 백내장"
            className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">이미지</th>
                <th className="px-4 py-3">수집일</th>
                <th className="px-4 py-3">종 · 장비</th>
                <th className="px-4 py-3">AI Top-1</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const imgUrl = buildFileUrl(row.image_url);
                return (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.created_at ? format(new Date(row.created_at), "yyyy-MM-dd HH:mm") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{animalLabel(row.animal_type)}</div>
                      <div className="text-xs text-slate-500">{row.capture_device}</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.ai_is_normal ? (
                        <span className="text-slate-500">정상</span>
                      ) : (
                        <span className="font-medium text-slate-800">{row.ai_main_disease || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(row.label_status)}`}>
                        {statusLabel(row.label_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        상세
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              수집된 샘플이 없습니다. COLLECTION_ENABLED=true 이고 사용자 동의 시 데이터가 쌓입니다.
            </p>
          )}
        </div>
      )}

      {/* 상세 모달 */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">수집 샘플 #{detail?.id ?? "…"}</h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {detailLoading && !detail ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : detail ? (
              <div className="space-y-5 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {buildFileUrl(detail.image_url) && (
                    <img
                      src={buildFileUrl(detail.image_url)!}
                      alt="수집 이미지"
                      className="max-h-64 w-full rounded-xl object-contain ring-1 ring-slate-200"
                    />
                  )}
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">종 · 장비:</span>{" "}
                      {animalLabel(detail.animal_type)} / {detail.capture_device}
                    </p>
                    <p>
                      <span className="text-slate-500">품종:</span> {detail.pet_breed || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">AI Top-1:</span>{" "}
                      {detail.ai_is_normal ? "정상" : detail.ai_main_disease || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">상태:</span>{" "}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(detail.label_status)}`}>
                        {statusLabel(detail.label_status)}
                      </span>
                    </p>
                  </div>
                </div>

                {detail.ai_top3?.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">AI Top-3</h4>
                    <ul className="space-y-1 text-sm">
                      {detail.ai_top3.map((t) => (
                        <li key={t.disease} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                          <span>{t.disease}</span>
                          <span className="text-slate-500">{(t.confidence * 100).toFixed(1)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-800">검수</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-600">
                      확정 질환
                      <input
                        value={confirmDisease}
                        onChange={(e) => setConfirmDisease(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="예: 백내장"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      중증도
                      <input
                        value={confirmSeverity}
                        onChange={(e) => setConfirmSeverity(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="무 / 유 / 초기 / 성숙"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs text-slate-600">
                    거절 사유
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handlePatch("confirmed")}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      확정
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handlePatch("rejected")}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      거절
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handlePatch("pending")}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                      대기로 되돌리기
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
