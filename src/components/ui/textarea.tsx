import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Atomic Textarea component with label and error states.
 * Follows accessibility best practices with proper label association.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || `textarea-${React.useId()}`;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-code uppercase tracking-[0.18em] text-muted-text"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            "w-full rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 text-base text-foreground resize-none",
            "focus:border-primary/45 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
            "transition-colors duration-300 placeholder:text-muted-text/35",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <span id={`${textareaId}-error`} className="block pt-1 text-xs text-red-400" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
