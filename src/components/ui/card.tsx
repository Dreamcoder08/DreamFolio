import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

/**
 * Card container component with glassmorphism variant.
 * Uses composition pattern - compose with CardHeader, CardBody, etc.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: "rounded-[28px] border border-border/40 bg-background-soft/80 shadow-soft backdrop-blur-md",
      glass: "glass rounded-[32px]",
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], "relative overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card header section
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pt-6 sm:px-8 sm:pt-8", className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * Card body/content section
 */
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 sm:p-8", className)} {...props} />
  )
);
CardBody.displayName = 'CardBody';

/**
 * Card footer section
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pb-6 sm:px-8 sm:pb-8", className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
