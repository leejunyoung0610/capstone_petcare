import { cn } from '../lib/utils';

/**
 * variant="panel" — 제품형 카드 (기본)
 * variant="wire" — 와이어/기획용 점선 박스
 */
export function WireframeBox({ children, className = '', label, variant = 'panel' }) {
  const isWire = variant === 'wire';

  return (
    <div
      className={cn(
        'relative',
        isWire
          ? 'rounded-xl border-2 border-dashed border-slate-300/80 bg-slate-50/60 p-5 shadow-none'
          : 'overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-lg shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.04] backdrop-blur-sm md:p-8',
        className
      )}
    >
      {label && (
        <div
          className={cn(
            isWire
              ? 'absolute -top-2.5 left-3 rounded bg-white px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-200'
              : 'mb-5 inline-flex w-max items-center rounded-full bg-gradient-to-r from-blue-600/[0.08] to-indigo-600/[0.12] px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-blue-600/15'
          )}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
