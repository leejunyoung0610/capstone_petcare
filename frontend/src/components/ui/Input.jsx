import { cn } from '../../lib/utils';
import { Label } from './label-radix';
import { InputCore } from './input-core';

export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}
      <InputCore
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
