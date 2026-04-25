import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'outline';
}

/**
 * Atomic Badge component for status indicators, tags, and labels.
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: "bg-white/[0.05] text-zinc-400 border-border/40",
      primary: "bg-primary/10 text-primary border-primary/25",
      success: "bg-sage/10 text-sage border-sage/25",
      warning: "bg-accent/10 text-accent border-accent/25",
      outline: "bg-transparent border-border/60 text-muted-foreground",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-code font-bold uppercase tracking-[0.2em]",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
