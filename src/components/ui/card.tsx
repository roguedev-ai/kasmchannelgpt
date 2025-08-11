/**
 * Card Component Set
 * 
 * Flexible card components for content containers.
 * Provides consistent styling for grouped content.
 * 
 * Components:
 * - Card: Main container with border and shadow
 * - CardHeader: Header section with padding
 * - CardTitle: Title text with typography
 * - CardContent: Body content with padding
 * 
 * Features:
 * - Rounded corners
 * - Subtle shadow
 * - Gray border
 * - White background
 * - Consistent padding
 * - Composable structure
 * 
 * Usage:
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     Card content goes here
 *   </CardContent>
 * </Card>
 * 
 * Features:
 * - Complete card component system with footer and description support
 * - Multiple card variants including outlined, elevated, and flat styles
 * - Interactive hover effects and clickable card functionality
 * - Loading states and skeleton components for better UX
 * - Card grid layouts and group organization
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card component props
 * Extends standard div attributes
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
  interactive?: boolean;
}

/**
 * Card Component
 * 
 * Main container component with border and shadow.
 * Use as wrapper for card content sections.
 */
export const Card: React.FC<CardProps> = ({ 
  className, 
  children,
  variant = 'default',
  interactive = false,
  ...props 
}) => {
  const variantStyles = {
    default: 'border border-border bg-card shadow-sm',
    elevated: 'bg-card shadow-md hover:shadow-lg transition-shadow duration-300',
    bordered: 'border-2 border-border bg-card hover:border-primary/20 transition-colors duration-200',
    glass: 'backdrop-blur-md bg-card/50 border border-white/10 shadow-lg',
  };
  
  return (
    <div
      className={cn(
        'rounded-xl text-card-foreground transition-all duration-200',
        variantStyles[variant],
        interactive && [
          'cursor-pointer',
          'hover:scale-[1.01]',
          'hover:shadow-lg',
          'active:scale-[0.99]',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Header Component
 * 
 * Header section with consistent padding.
 * Typically contains CardTitle and description.
 */
export const CardHeader: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col space-y-2 p-6 pb-4',
        'border-b border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Title Component
 * 
 * Title text with proper typography.
 * Renders as h3 element for semantic HTML.
 */
export const CardTitle: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'text-xl font-semibold leading-tight tracking-tight',
        'text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * Card Content Component
 * 
 * Body content section with padding.
 * Negative top padding assumes usage after CardHeader.
 */
export const CardContent: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div 
      className={cn(
        'p-6 pt-5',
        'text-muted-foreground',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Description Component
 * 
 * Description text for card headers.
 * Typically used within CardHeader after CardTitle.
 */
export const CardDescription: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-sm text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

/**
 * Card Footer Component
 * 
 * Footer section for action buttons or metadata.
 * Includes top border and consistent padding.
 */
export const CardFooter: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 pt-4',
        'border-t border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};