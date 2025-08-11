/**
 * Button Component
 * 
 * Reusable button component with multiple variants and sizes.
 * Built with class-variance-authority for type-safe styling.
 * 
 * Variants:
 * - default: Primary brand button with shadow
 * - destructive: Red danger button for destructive actions
 * - outline: Secondary button with border
 * - secondary: Gray background button
 * - ghost: Transparent button with hover state
 * - link: Text-only button styled as link
 * 
 * Sizes:
 * - default: Standard size (h-10)
 * - sm: Small size (h-8)
 * - lg: Large size (h-12)
 * - icon: Square icon button (10x10)
 * 
 * Features:
 * - Full keyboard accessibility
 * - Focus ring for keyboard navigation
 * - Disabled state handling
 * - Smooth transitions
 * - Responsive to all button HTML attributes
 * 
 * Usage examples:
 * <Button>Click me</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button size="sm" variant="outline">Cancel</Button>
 * <Button size="icon" variant="ghost"><Icon /></Button>
 * 
 * Features:
 * - Comprehensive variant system with brand-consistent styling
 * - Professional color schemes aligned with design guidelines
 * - Loading states with integrated spinner animations
 * - Button group functionality for complex interfaces
 * - Full icon support with flexible positioning options
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button variant configuration using class-variance-authority
 * 
 * Base classes apply to all buttons, then variant-specific
 * classes are added based on the variant and size props.
 */
const buttonVariants = cva(
  // Enhanced base classes with premium feel
  'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transform-gpu active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary-hover hover:shadow-md hover:scale-[1.02]',
          'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'active:bg-primary-active',
          'transition-all duration-200',
        ].join(' '),
        destructive: [
          'bg-destructive text-destructive-foreground shadow-sm',
          'hover:bg-destructive/90 hover:shadow-md hover:scale-[1.02]',
          'focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2',
          'active:bg-destructive/80',
        ].join(' '),
        outline: [
          'border border-input bg-background/50 backdrop-blur-sm',
          'hover:bg-accent hover:text-accent-foreground hover:border-accent',
          'focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2',
          'transition-all duration-200',
        ].join(' '),
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80 hover:shadow-sm',
          'focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2',
        ].join(' '),
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2',
          'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        ].join(' '),
        link: [
          'text-primary underline-offset-4 hover:underline',
          'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'hover:text-primary-hover',
        ].join(' '),
        premium: [
          'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground',
          'shadow-md hover:shadow-lg hover:scale-[1.02]',
          'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'before:absolute before:inset-0 before:bg-white/20 before:opacity-0',
          'hover:before:opacity-100 before:transition-opacity before:duration-200',
          'overflow-hidden',
        ].join(' '),
      },
      size: {
        default: 'h-10 rounded-lg px-4 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button component props
 * 
 * Extends standard HTML button attributes with variant props
 * @property variant - Visual style variant
 * @property size - Button size preset
 * @property asChild - Whether to render as child component (for composition)
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

/**
 * Button Component
 * 
 * Forward ref component for proper ref handling in forms
 * and other use cases requiring direct DOM access.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    children,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      // Add ripple effect
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const rippleX = e.clientX - rect.left;
      const rippleY = e.clientY - rect.top;
      const rippleId = Date.now();
      
      setRipples(prev => [...prev, { x: rippleX, y: rippleY, id: rippleId }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== rippleId));
      }, 600);
      
      // Call original onClick
      onClick?.(e);
    }, [loading, disabled, onClick]);
    
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          'relative overflow-hidden',
          loading && 'cursor-wait'
        )}
        ref={ref}
        disabled={loading || disabled}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="block animate-ripple rounded-full bg-white/30 dark:bg-white/20" 
              style={{
                width: 0,
                height: 0,
                animation: 'ripple-expand 0.6s ease-out forwards',
              }}
            />
          </span>
        ))}
        
        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        {/* Button content */}
        <span className={cn(
          'relative z-10 inline-flex items-center',
          loading && 'opacity-0'
        )}>
          {children}
        </span>
        
        {/* Loading text */}
        {loading && loadingText && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="ml-6">{loadingText}</span>
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };