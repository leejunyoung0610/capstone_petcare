import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ButtonCore } from './button-core';

const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
  outline: 'outline',
};

const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

/**
 * 앱 공통 버튼 — shadcn 스타일 + loading 지원 (기존 API 유지)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <ButtonCore
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variantMap[variant] || variant}
      size={sizeMap[size] || size}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          처리중...
        </>
      ) : (
        children
      )}
    </ButtonCore>
  );
}
