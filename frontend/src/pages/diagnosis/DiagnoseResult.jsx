import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { format } from 'date-fns';
import clsx from 'clsx';
import useDiagnosisStore from '../../stores/diagnosisStore';
import Button from '../../components/ui/Button';
import { ButtonCore } from '../../components/ui/button-core';
import { WireframeBox } from '../../components/WireframeBox';

export default function DiagnoseResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentDiagnosis, loading, error, fetchDiagnosis, downloadPDF, clearError } = useDiagnosisStore();

  useEffect(() => {
    if (id) {
      fetchDiagnosis(parseInt(id));
    }
    return () => clearError();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(parseInt(id));
    } catch (err) {
      // Error handled by store
    }
  };

  if (loading && !currentDiagnosis) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-brand-link border-t-transparent" />
          <p className="text-sm text-muted-foreground">진단 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !currentDiagnosis) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">오류가 발생했습니다</h2>
        <p className="mb-6 max-w-md text-muted-foreground">
          {error || '진단 결과를 찾을 수 없습니다.'}
        </p>
        <ButtonCore variant="default" asChild>
          <Link to="/pets">반려동물 목록으로 돌아가기</Link>
        </ButtonCore>
      </div>
    );
  }

  const { predictions, main_disease, main_confidence, is_normal, image_url, created_at } = currentDiagnosis;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-link">Result</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        스크리닝 결과
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
        아래 수치는 AI 참고용입니다. 눈에 이상이 보이면 지체 없이 동물병원에 방문하세요.
      </p>

      <div className="mt-8">
        <WireframeBox
          label="RESULT SUMMARY"
          className={clsx(
            'mb-8 p-8',
            is_normal ? 'border-emerald-300 bg-emerald-50/80' : 'border-destructive/40 bg-destructive/5'
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{is_normal ? '✅' : '⚠️'}</span>
                <h2 className="text-3xl font-bold">
                  {is_normal ? '이상 징후 없음' : main_disease}
                </h2>
              </div>
              {!is_normal && (
                <p className="text-lg">
                  신뢰도: <span className="font-bold">{main_confidence}%</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">진단 일시</p>
              <p className="font-semibold">
                {format(new Date(created_at), 'yyyy-MM-dd HH:mm')}
              </p>
            </div>
          </div>

          {!is_normal && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-sm text-foreground">
                ⚠️ AI가 검출한 이상 징후입니다. 정확한 진단을 위해 동물병원 방문을 권장합니다.
              </p>
              <p className="text-xs text-muted-foreground">
                * 본 서비스는 사전 스크리닝 목적이며 의료기기가 아닙니다.
              </p>
            </div>
          )}
        </WireframeBox>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <WireframeBox label="IMAGE" className="bg-card p-6">
              <h3 className="mb-4 font-mono font-semibold text-foreground">원본 이미지</h3>
              <img
                src={image_url}
                alt="진단 이미지"
                className="w-full rounded-lg"
              />
            </WireframeBox>

            <WireframeBox label="ACTIONS" className="space-y-3 bg-card p-6">
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                loading={loading}
                className="w-full"
              >
                📄 진단 보고서 PDF 다운로드
              </Button>
              <ButtonCore variant="secondary" asChild className="w-full">
                <Link to="/pets" className="inline-flex w-full justify-center">
                  반려동물 목록으로
                </Link>
              </ButtonCore>
              <ButtonCore variant="secondary" asChild className="w-full">
                <Link to="/diagnosis/new" className="inline-flex w-full justify-center">
                  새로운 진단하기
                </Link>
              </ButtonCore>
            </WireframeBox>
          </div>

          <div className="space-y-6">
            <WireframeBox label="DETAIL" className="bg-card p-6">
              <h3 className="mb-4 font-mono font-semibold text-foreground">상세 분석 결과</h3>
              
              <div className="space-y-3">
                {Object.entries(predictions).map(([disease, pred]) => (
                  <div
                    key={disease}
                    className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{disease}</p>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            pred.label === '유' || pred.label === 'abnormal'
                              ? 'bg-destructive/80'
                              : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(100, pred.confidence)}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p
                        className={clsx(
                          'text-lg font-bold',
                          pred.label === '유' || pred.label === 'abnormal'
                            ? 'text-destructive'
                            : 'text-emerald-600'
                        )}
                      >
                        {pred.confidence}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pred.label === '유' || pred.label === 'abnormal' ? '이상 징후' : '정상'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </WireframeBox>

            <WireframeBox label="NEXT STEPS" className="bg-muted/40 p-6">
              <h3 className="mb-4 font-mono font-semibold text-foreground">💡 다음 단계</h3>
              <ul className="space-y-2 text-sm text-foreground">
                {is_normal ? (
                  <>
                    <li className="flex gap-2">
                      <span>✅</span>
                      <span>현재 이상 징후가 발견되지 않았습니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✅</span>
                      <span>정기적인 검사를 권장합니다 (3~6개월마다).</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✅</span>
                      <span>증상이 나타나면 즉시 재검사를 받으세요.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2">
                      <span>⚠️</span>
                      <span>가까운 동물병원을 방문하여 정밀 검사를 받으세요.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>⚠️</span>
                      <span>PDF 보고서를 출력하여 수의사에게 보여주세요.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>⚠️</span>
                      <span>증상이 악화되면 즉시 내원하세요.</span>
                    </li>
                  </>
                )}
              </ul>
            </WireframeBox>
          </div>
        </div>
      </div>
    </div>
  );
}
