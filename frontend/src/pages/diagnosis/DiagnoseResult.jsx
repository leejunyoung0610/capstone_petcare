import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { format, addHours } from 'date-fns';
import clsx from 'clsx';
import {
  Star,
  MapPin,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Stethoscope,
  AlertCircle,
  ClipboardList,
  Download,
} from 'lucide-react';
import useDiagnosisStore from '../../stores/diagnosisStore';
import Button from '../../components/ui/Button';
import { ButtonCore } from '../../components/ui/button-core';
import { getRecommendedVets } from '../../api/vets';
import { getDiagnosisReport } from '../../api/diagnosis';
import {
  getScreeningSummary,
  getTopSuspicions,
  formatAbnormalPct,
} from '../../lib/diagnosisDisplay';

export default function DiagnoseResult() {
  const { id } = useParams();
  const { currentDiagnosis, loading, error, fetchDiagnosis, downloadPDF, clearError } = useDiagnosisStore();

  useEffect(() => {
    if (id) fetchDiagnosis(parseInt(id));
    return () => clearError();
  }, [id]);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const handleDownloadPDF = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      await downloadPDF(parseInt(id));
    } catch (err) {
      setPdfError(err?.message || 'PDF 다운로드에 실패했습니다.');
    } finally {
      setPdfBusy(false);
    }
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const handleViewReport = async () => {
    if (reportOpen && reportData) {
      setReportOpen(false);
      return;
    }
    if (reportData) {
      setReportOpen(true);
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await getDiagnosisReport(parseInt(id));
      setReportData(data);
      setReportOpen(true);
    } catch (err) {
      setReportError(err?.response?.data?.detail || err?.message || '보고서를 불러올 수 없습니다.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading && !currentDiagnosis) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">진단 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !currentDiagnosis) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">오류가 발생했습니다</h2>
        <p className="mb-6 max-w-md text-slate-500">{error || '진단 결과를 찾을 수 없습니다.'}</p>
        <ButtonCore variant="default" asChild>
          <Link to="/pets">반려동물 목록으로 돌아가기</Link>
        </ButtonCore>
      </div>
    );
  }

  const {
    predictions,
    main_disease,
    main_confidence,
    is_normal,
    image_url,
    heatmap_url,
    created_at,
    pet_name,
  } = currentDiagnosis;

  const screening = useMemo(
    () => getScreeningSummary({ is_normal, main_disease, main_confidence, predictions }),
    [is_normal, main_disease, main_confidence, predictions]
  );
  const top3 = useMemo(() => getTopSuspicions(predictions, 3), [predictions]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Result</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        스크리닝 결과
      </h1>
      {pet_name && (
        <p className="mt-1 text-sm text-slate-500">반려동물: {pet_name}</p>
      )}
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
        아래 수치는 AI 참고용입니다. 눈에 이상이 보이면 지체 없이 동물병원에 방문하세요.
      </p>

      <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-2 leading-relaxed">
          <p className="font-semibold text-amber-900">면책 및 안내</p>
          <p>
            본 화면은 질병 진단·치료 결정을 대체하지 않습니다. AI는 학습 데이터와 알고리즘 한계로 오판·누락이 발생할 수
            있으며, 동물병원 방문과 수의사 진단이 최종 기준입니다.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {/* 1) 질환 유무 요약 */}
        <div
          className={clsx(
            'mb-6 rounded-xl border p-6 shadow-sm',
            screening.status === 'normal'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                AI 스크리닝 요약
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className="text-4xl">{screening.status === 'normal' ? '✅' : '⚠️'}</span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{screening.headline}</h2>
                  <p className="mt-1 text-sm text-slate-600">{screening.detail}</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
                {formatAbnormalPct(screening.percentage)}
                <span className="ml-2 text-base font-medium text-slate-500">
                  {screening.status === 'normal' ? '정상 소견 신뢰도' : '이상 가능성(최고)'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">진단 일시</p>
              <p className="text-sm font-semibold text-slate-700">
                {format(addHours(new Date(created_at), 9), 'yyyy-MM-dd HH:mm')}
              </p>
            </div>
          </div>

          {screening.status === 'abnormal' && (
            <div className="rounded-lg border border-red-100 bg-white p-3">
              <p className="text-sm text-slate-700">
                정확한 판단은 수의사 진료가 필요합니다. PDF 보고서에 전체 질환별 수치가 포함됩니다.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-900">원본 이미지</h3>
              <img
                src={image_url?.startsWith('http') ? image_url : `http://localhost/${image_url}`}
                alt="진단 이미지"
                className="w-full rounded-lg"
              />
            </div>

            {heatmap_url && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 font-bold text-slate-900">GradCAM 히트맵</h3>
                <p className="mb-3 text-xs text-slate-400">빨간색 영역일수록 AI가 주목한 부위입니다</p>
                <img src={heatmap_url} alt="히트맵" className="w-full rounded-lg" />
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Button
                variant="primary"
                onClick={handleViewReport}
                loading={reportLoading}
                className="w-full"
              >
                <FileText className="mr-1.5 inline h-4 w-4" />
                {reportOpen ? '보고서 닫기' : 'AI 보고서 보기'}
              </Button>
              {reportError && <p className="text-center text-xs text-red-500">{reportError}</p>}
              <Button
                variant="secondary"
                onClick={handleDownloadPDF}
                loading={pdfBusy}
                className="w-full"
              >
                <Download className="mr-1.5 inline h-4 w-4" />
                PDF 저장 (전체 질환·품종 참고)
              </Button>
              {pdfError && <p className="text-center text-xs text-red-500">{pdfError}</p>}
              <ButtonCore variant="secondary" asChild className="w-full">
                <Link to="/diagnosis/history" className="inline-flex w-full justify-center">
                  히스토리 보기
                </Link>
              </ButtonCore>
              <ButtonCore variant="secondary" asChild className="w-full">
                <Link to="/diagnosis/new" className="inline-flex w-full justify-center">
                  다시 검사하기
                </Link>
              </ButtonCore>
            </div>

            {reportOpen && reportData?.report && (
              <InAppReport
                data={reportData}
                onClose={() => setReportOpen(false)}
                onDownloadPDF={handleDownloadPDF}
                pdfBusy={pdfBusy}
                pdfError={pdfError}
              />
            )}
          </div>

          <div className="space-y-4">
            {/* 2) Top 3 의심 질환만 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-bold text-slate-900">의심 질환 Top 3</h3>
              <p className="mb-4 text-xs text-slate-400">
                이상 가능성(%)이 높은 순입니다. 전체 {Object.keys(predictions || {}).length}개
                질환 수치는 PDF에서 확인하세요.
              </p>
              <div className="space-y-4">
                {top3.map((item, idx) => (
                  <div key={item.disease} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <p className="font-semibold text-slate-900">{item.disease}</p>
                      </div>
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          item.isAbnormal ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {item.isAbnormal ? '이상 가능' : '정상 쪽'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          item.isAbnormal ? 'bg-red-500' : 'bg-emerald-400'
                        )}
                        style={{ width: `${Math.min(100, item.confidence)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-sm font-bold tabular-nums text-slate-700">
                      이상 가능성 {formatAbnormalPct(item.confidence)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={clsx(
                'rounded-xl border p-5 shadow-sm',
                is_normal ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
              )}
            >
              <h3 className="mb-3 font-bold text-slate-900">
                {is_normal ? '✅ 추천 행동' : '⚠️ 추천 행동'}
              </h3>
              {is_normal ? (
                <p className="text-sm text-slate-700">
                  현재 이상 징후가 두드러지지 않습니다. 3~6개월마다 정기 스크리닝을 권장합니다.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">
                    <strong>{main_disease || top3[0]?.disease}</strong> 등 이상 가능성이 있습니다.
                    수의사 상담·소견 요청을 권장합니다.
                  </p>
                  <ButtonCore variant="default" asChild className="w-full">
                    <Link to="/vets" className="inline-flex w-full justify-center text-sm">
                      🏥 병원 찾기 / 소견 요청
                    </Link>
                  </ButtonCore>
                </div>
              )}
            </div>

            {!is_normal && <RecommendedVetsCard />}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-slate-900">📄 PDF 보고서 안내</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                PDF에는 <strong>전체 질환별 확률 표</strong>, 품종·나이별 흔한 안구 질환 참고,
                AI 종합 소견이 포함됩니다. 병원 방문 시 출력해 수의사에게 보여주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Claude AI가 생성한 보고서를 앱 안에서 보여주는 카드 */
function InAppReport({ data, onClose, onDownloadPDF, pdfBusy, pdfError }) {
  const { report, pet_name, animal_type, created_at } = data;
  const urgencyColor = {
    '즉시 방문': 'bg-red-100 text-red-700 border-red-200',
    '빠른 시일 내 방문': 'bg-amber-100 text-amber-700 border-amber-200',
    '정기검진': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    즉시: 'bg-red-100 text-red-700 border-red-200',
    '1주 이내': 'bg-amber-100 text-amber-700 border-amber-200',
    '1개월 이내': 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white shadow-sm">
      {pdfBusy && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">PDF 생성 중...</p>
        </div>
      )}
      <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-slate-900">AI 진단 보고서</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-blue-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{pet_name}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5">
            {animal_type === 'dog' ? '강아지' : '고양이'}
          </span>
          {created_at && (
            <span>{format(addHours(new Date(created_at), 9), 'yyyy.MM.dd HH:mm')}</span>
          )}
        </div>

        <div
          className={clsx(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold',
            urgencyColor[report.visit_urgency] || 'border-slate-200 bg-slate-100 text-slate-700'
          )}
        >
          {report.vet_required ? (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          )}
          병원 방문: {report.visit_urgency}
        </div>

        {report.summary && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              종합 소견
            </h4>
            <p className="rounded-lg border border-slate-100 bg-white p-3 text-sm leading-relaxed text-slate-700">
              {report.summary}
            </p>
          </div>
        )}

        {report.breed_age_notes && (
          <div>
            <h4 className="mb-1.5 text-sm font-bold text-slate-800">품종·연령 참고</h4>
            <p className="whitespace-pre-line rounded-lg border border-slate-100 bg-white p-3 text-sm leading-relaxed text-slate-600">
              {report.breed_age_notes}
            </p>
          </div>
        )}

        {report.disease_analysis && Object.keys(report.disease_analysis).length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              Top 3 의심 질환 상세
            </h4>
            <div className="space-y-2">
              {Object.entries(report.disease_analysis).map(([disease, analysis]) => (
                <DiseaseAnalysisCard key={disease} disease={disease} analysis={analysis} />
              ))}
            </div>
          </div>
        )}

        {report.precautions?.length > 0 && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              주의사항
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {report.precautions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onDownloadPDF}
          disabled={pdfBusy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {pdfBusy ? 'PDF 생성 중...' : 'PDF로 저장 (전체 질환 표 포함)'}
        </button>
        {pdfError && <p className="text-center text-xs text-red-500">{pdfError}</p>}
      </div>
    </div>
  );
}

function DiseaseAnalysisCard({ disease, analysis }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-slate-800"
      >
        {disease}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <p className="border-t border-slate-100 px-3 py-2 text-sm text-slate-600">{analysis}</p>}
    </div>
  );
}

function RecommendedVetsCard() {
  const [vets, setVets] = useState([]);
  const [loadingVets, setLoadingVets] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getRecommendedVets()
      .then(setVets)
      .catch(() => setVets([]))
      .finally(() => setLoadingVets(false));
  }, []);

  if (loadingVets || vets.length === 0) return null;

  const shown = expanded ? vets : vets.slice(0, 2);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        GANADI 인증 수의사 추천
      </h3>
      <div className="space-y-3">
        {shown.map((vet) => (
          <div key={vet.id} className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{vet.hospital_name || vet.name}</p>
                <p className="text-xs text-slate-500">{vet.specialty || '안과·일반'}</p>
              </div>
              {vet.rating != null && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {vet.rating.toFixed(1)}
                </span>
              )}
            </div>
            {vet.address && (
              <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                {vet.address}
              </p>
            )}
            <Link
              to={`/opinion-request/${vet.id}`}
              className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
            >
              소견 요청 →
            </Link>
          </div>
        ))}
      </div>
      {vets.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? '접기' : `더 보기 (${vets.length - 2}곳)`}
        </button>
      )}
    </div>
  );
}
