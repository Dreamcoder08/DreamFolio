import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

/**
 * Atomic Button component with variants and loading state.
 * Uses composition pattern for maximum flexibility.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 min-h-[44px] font-semibold tracking-[0.01em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/[0.55] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      default: "rounded-full border border-primary/40 bg-primary text-background shadow-soft hover:bg-accent hover:border-accent hover:shadow-elevated hover:-translate-y-0.5",
      outline: "rounded-full border border-primary/20 bg-primary/5 text-foreground hover:border-primary/40 hover:bg-primary/10",
      ghost: "rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary",
      link: "text-muted-foreground underline-offset-4 hover:text-primary hover:underline",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
