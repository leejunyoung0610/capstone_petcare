/**
 * AI 스크리닝 결과 UI용 — predictions JSON 기준 Top-K·요약 계산.
 * confidence 는 P(비정상)×100 (AI 서버 legacy predictions 와 동일).
 */

function isAbnormalLabel(label) {
  if (!label) return false;
  const n = String(label).trim();
  return n !== '무' && n.toLowerCase() !== 'normal';
}

/** @param {Record<string, { label?: string, confidence?: number }>} predictions */
export function getTopSuspicions(predictions, limit = 3) {
  if (!predictions || typeof predictions !== 'object') return [];

  return Object.entries(predictions)
    .filter(([key]) => !key.startsWith('_'))
    .map(([disease, pred]) => ({
      disease,
      label: pred?.label ?? '무',
      confidence: Number(pred?.confidence ?? 0),
      isAbnormal: isAbnormalLabel(pred?.label),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

/**
 * 화면 상단 「질환 유무」 요약.
 * @returns {{ status: 'normal'|'abnormal', headline: string, percentage: number, detail: string }}
 */
export function getScreeningSummary({ is_normal, main_disease, main_confidence, predictions }) {
  const pct = Math.round(Number(main_confidence ?? 0));
  const top = getTopSuspicions(predictions, 1)[0];

  if (is_normal) {
    return {
      status: 'normal',
      headline: '특이 소견 없음',
      percentage: pct,
      detail: 'AI 스크리닝상 뚜렷한 이상 징후가 보이지 않습니다.',
    };
  }

  const diseaseName = main_disease || top?.disease || '이상 징후';
  return {
    status: 'abnormal',
    headline: '이상 징후 의심',
    percentage: pct,
    detail: `${diseaseName} 등 이상 가능성이 AI에 의해 검출되었습니다.`,
  };
}

export function formatAbnormalPct(confidence) {
  const n = Number(confidence);
  if (Number.isNaN(n)) return '—';
  return `${Math.min(100, Math.max(0, n)).toFixed(1)}%`;
}
