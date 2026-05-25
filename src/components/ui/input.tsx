import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Atomic Input component with label and error states.
 * Follows accessibility best practices with proper label association.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] sm:text-[11px] font-code uppercase tracking-[0.18em] text-muted-text"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "w-full rounded-xl sm:rounded-2xl border border-white/8 bg-white/[0.02] px-3.5 py-3 sm:px-4 sm:py-3.5 text-base text-foreground",
            "focus:border-primary/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
            "transition-colors duration-300 placeholder:text-muted-text/35",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="block pt-1 text-xs text-red-400" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
