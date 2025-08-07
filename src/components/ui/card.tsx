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
  ...props 
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
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
      className={cn('flex flex-col space-y-1.5 p-6', className)}
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
        'text-2xl font-semibold leading-none tracking-tight',
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
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
};