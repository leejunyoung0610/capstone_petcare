import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { format, addHours } from 'date-fns';
import clsx from 'clsx';
import { Star, MapPin } from 'lucide-react';
import useDiagnosisStore from '../../stores/diagnosisStore';
import Button from '../../components/ui/Button';
import { ButtonCore } from '../../components/ui/button-core';
import { getRecommendedVets } from '../../api/vets';

export default function DiagnoseResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentDiagnosis, loading, error, fetchDiagnosis, downloadPDF, clearError } = useDiagnosisStore();

  useEffect(() => {
    if (id) fetchDiagnosis(parseInt(id));
    return () => clearError();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(parseInt(id));
    } catch (err) { }
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

  const { predictions, main_disease, main_confidence, is_normal, image_url, heatmap_url, created_at } = currentDiagnosis;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Result</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        스크리닝 결과
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
        아래 수치는 AI 참고용입니다. 눈에 이상이 보이면 지체 없이 동물병원에 방문하세요.
      </p>

      <div className="mt-8">
        {/* 결과 요약 */}
        <div className={clsx(
          'mb-6 rounded-xl border p-6 shadow-sm',
          is_normal ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
        )}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{is_normal ? '✅' : '⚠️'}</span>
                <h2 className="text-2xl font-bold text-slate-900">
                  {is_normal ? '이상 징후 없음' : main_disease}
                </h2>
              </div>
              {!is_normal && (
                <p className="text-sm text-slate-600">
                  신뢰도: <span className="font-bold">{main_confidence}%</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">진단 일시</p>
              <p className="text-sm font-semibold text-slate-700">
                {format(addHours(new Date(created_at), 9), 'yyyy-MM-dd HH:mm')}
              </p>
            </div>
          </div>

          {!is_normal && (
            <div className="rounded-lg border border-red-100 bg-white p-3">
              <p className="mb-1 text-sm text-slate-700">
                ⚠️ AI가 검출한 이상 징후입니다. 정확한 진단을 위해 동물병원 방문을 권장합니다.
              </p>
              <p className="text-xs text-slate-400">* 본 서비스는 사전 스크리닝 목적이며 의료기기가 아닙니다.</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {/* 원본 이미지 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-900">원본 이미지</h3>
              <img
                src={image_url?.startsWith('http') ? image_url : `http://localhost/${image_url}`}
                alt="진단 이미지"
                className="w-full rounded-lg"
              />
            </div>

            {/* 히트맵 이미지 */}
            {heatmap_url && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="mb-1 font-bold text-slate-900">GradCAM 히트맵</h3>
                <p className="text-xs text-slate-400 mb-3">빨간색 영역일수록 AI가 주목한 부위입니다</p>
                <img src={heatmap_url} alt="히트맵" className="w-full rounded-lg" />
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 낮음</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 중간</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> 높음</span>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <Button variant="primary" onClick={handleDownloadPDF} loading={loading} className="w-full">
                📄 진단 보고서 PDF 다운로드
              </Button>
              <ButtonCore variant="secondary" asChild className="w-full">
                <Link to="/diagnosis/history" className="inline-flex w-full justify-center">
                  📋 히스토리 보기
                </Link>
              </ButtonCore>
              <ButtonCore variant="secondary" asChild className="w-full">
                <Link to="/diagnosis/new" className="inline-flex w-full justify-center">
                  🔄 다시 검사하기
                </Link>
              </ButtonCore>
            </div>
          </div>

          <div className="space-y-4">
            {/* 상세 분석 결과 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900">상세 분석 결과</h3>
              <div className="space-y-3">
                {Object.entries(predictions).map(([disease, pred]) => (
                  <div key={disease} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{disease}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            pred.label === '유' || pred.label === 'abnormal' ? 'bg-red-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(100, pred.confidence)}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className={clsx(
                        'text-lg font-bold',
                        pred.label === '유' || pred.label === 'abnormal' ? 'text-red-600' : 'text-emerald-600'
                      )}>
                        {pred.confidence}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {pred.label === '유' || pred.label === 'abnormal' ? '이상 징후' : '정상'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 행동 */}
            <div className={clsx(
              'rounded-xl border p-5 shadow-sm',
              is_normal ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            )}>
              <h3 className="mb-3 font-bold text-slate-900">
                {is_normal ? '✅ 추천 행동' : '⚠️ 추천 행동'}
              </h3>
              {is_normal ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">현재 이상 징후가 발견되지 않았습니다. 정기적인 검사를 권장합니다.</p>
                  <ButtonCore variant="secondary" asChild className="w-full">
                    <Link to="/diagnosis/history" className="inline-flex w-full justify-center text-sm">
                      📋 정기 검사 히스토리 보기
                    </Link>
                  </ButtonCore>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">
                    <strong>{main_disease}</strong> 이상 징후가 감지되었습니다. 수의사 소견 요청을 권장합니다.
                  </p>
                  <ButtonCore variant="default" asChild className="w-full">
                    <Link to="/vets" className="inline-flex w-full justify-center text-sm">
                      🏥 병원 찾기 / 소견 요청
                    </Link>
                  </ButtonCore>
                </div>
              )}
            </div>

            {/* GANADI 등록 수의사 직접 추천 — 비정상일 때만 노출 */}
            {!is_normal && <RecommendedVetsCard />}

            {/* 다음 단계 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900">💡 다음 단계</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {is_normal ? (
                  <>
                    <li className="flex gap-2"><span>✅</span><span>현재 이상 징후가 발견되지 않았습니다.</span></li>
                    <li className="flex gap-2"><span>✅</span><span>정기적인 검사를 권장합니다 (3~6개월마다).</span></li>
                    <li className="flex gap-2"><span>✅</span><span>증상이 나타나면 즉시 재검사를 받으세요.</span></li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2"><span>⚠️</span><span>가까운 동물병원을 방문하여 정밀 검사를 받으세요.</span></li>
                    <li className="flex gap-2"><span>⚠️</span><span>PDF 보고서를 출력하여 수의사에게 보여주세요.</span></li>
                    <li className="flex gap-2"><span>⚠️</span><span>증상이 악화되면 즉시 내원하세요.</span></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** AI 결과 페이지 안에서 GANADI 등록 수의사 상위 3명을 보여주는 카드 */
function RecommendedVetsCard() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getRecommendedVets({ limit: 3 })
      .then((data) => alive && setVets(Array.isArray(data) ? data : []))
      .catch(() => alive && setVets([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  if (vets.length === 0) {
    // 등록 수의사가 아직 없는 환경(시연 전) — 카드를 숨겨 빈 공간 방지
    return null;
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">
            🌟 GANADI 등록 수의사에게 바로 요청
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            검증된 수의사가 평균 12\~24시간 내 답변
          </p>
        </div>
        <Link
          to="/vets?ganadi=1"
          className="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
        >
          전체 보기
        </Link>
      </div>

      <ul className="space-y-2">
        {vets.map((v) => (
          <li key={v.id}>
            <Link
              to={`/opinion-request/${v.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
                {v.name?.slice(0, 1) || '🩺'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {v.name}
                  </p>
                  {typeof v.rating === 'number' && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      {v.rating.toFixed(1)}
                      <span className="text-slate-400">({v.review_count})</span>
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">
                  {v.hospital_name}
                  {v.specialty ? ` · ${v.specialty}` : ''}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                요청
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}