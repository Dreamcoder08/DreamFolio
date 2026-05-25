import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'online' | 'offline' | 'busy' | 'idle';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Atomic StatusIndicator component for showing system or user status.
 * Includes optional pulse animation for "live" indicators.
 */
const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  ({ className, status = 'online', pulse = true, size = 'md', ...props }, ref) => {
    const statusColors = {
      online: "bg-primary",
      offline: "bg-zinc-600",
      busy: "bg-accent",
      idle: "bg-muted-text",
    };

    const sizes = {
      sm: "h-1.5 w-1.5",
      md: "h-2 w-2",
      lg: "h-3 w-3",
    };

    return (
      <span
        ref={ref}
        className={cn("relative flex", sizes[size], className)}
        aria-label={`Status: ${status}`}
        role="status"
        {...props}
      >
        {pulse && status === 'online' && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              statusColors[status]
            )}
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            sizes[size],
            statusColors[status]
          )}
        />
      </span>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator };
