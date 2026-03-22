import { cn } from '../../lib/utils';

/**
 * 섹션 상단 — 키커(영문 라벨) + 큰 제목 + 부제
 */
export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = 'center',
  className,
}) {
  return (
    <div
      className={cn(
        'mb-12 max-w-3xl md:mb-16',
        align === 'center' && 'mx-auto text-center',
        align === 'left' && 'text-left',
        className
      )}
    >
      {kicker && (
        <span
          className={cn(
            'mb-3 block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-brand-link',
            align === 'center' && 'mx-auto w-max'
          )}
        >
          {kicker}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed',
            align === 'center' && 'mx-auto max-w-2xl'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
