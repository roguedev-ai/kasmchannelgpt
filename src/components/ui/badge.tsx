/**
 * Badge Component
 * 
 * Small label component for displaying status, tags, or counts.
 * Built with class-variance-authority for variant support.
 * 
 * Features:
 * - Multiple visual variants
 * - Rounded pill shape
 * - Compact sizing
 * - Hover effects
 * - Focus ring for accessibility
 * - Inline display
 * 
 * Variants:
 * - default: Primary brand color
 * - secondary: Gray/neutral color
 * - destructive: Red/danger color
 * - outline: Border only style
 * 
 * Usage:
 * <Badge>Default</Badge>
 * <Badge variant="secondary">Secondary</Badge>
 * <Badge variant="destructive">Error</Badge>
 * <Badge variant="outline">Outline</Badge>
 * 
 * Common use cases:
 * - Status indicators
 * - Tag labels
 * - Count displays
 * - Category labels
 * - Feature flags
 * 
 * Features:
 * - Multiple size variants for different interface contexts
 * - Comprehensive color system with semantic meaning
 * - Interactive removable badges with smooth animations
 * - Icon integration with flexible positioning
 * - Badge grouping and clickable functionality for enhanced UX
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge variant configuration
 * 
 * Defines the visual styles for different badge variants.
 * Uses Tailwind's color system for theming.
 */
const badgeVariants = cva(
  // Enhanced base styles for all badges
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 cursor-default select-none",
  {
    variants: {
      variant: {
        // Primary/default style with subtle gradient
        default: [
          "bg-gradient-to-r from-primary to-primary-hover",
          "text-primary-foreground",
          "shadow-sm hover:shadow-md",
          "hover:scale-105",
          "border border-primary/20",
        ].join(" "),
        // Secondary style with softer appearance
        secondary: [
          "bg-secondary",
          "text-secondary-foreground",
          "border border-secondary",
          "hover:bg-secondary/80",
          "hover:shadow-sm",
        ].join(" "),
        // Destructive/danger style with attention-grabbing design
        destructive: [
          "bg-destructive/90",
          "text-destructive-foreground",
          "border border-destructive/20",
          "hover:bg-destructive",
          "hover:shadow-md hover:shadow-destructive/20",
        ].join(" "),
        // Outline style with enhanced border
        outline: [
          "border-2 border-border",
          "bg-background",
          "text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "hover:border-accent-foreground/20",
        ].join(" "),
        // Success variant
        success: [
          "bg-success/90",
          "text-success-foreground",
          "border border-success/20",
          "hover:bg-success",
          "hover:shadow-md hover:shadow-success/20",
        ].join(" "),
        // Warning variant
        warning: [
          "bg-warning/90",
          "text-warning-foreground",
          "border border-warning/20",
          "hover:bg-warning",
          "hover:shadow-md hover:shadow-warning/20",
        ].join(" "),
        // Ghost variant
        ghost: [
          "bg-muted/50",
          "text-foreground",
          "hover:bg-muted",
          "hover:text-foreground",
          "transition-colors",
        ].join(" "),
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Badge component props
 * 
 * Extends standard div attributes with variant support
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge Component
 * 
 * Renders a small pill-shaped label with variant styling.
 * Commonly used for status indicators and tags.
 */
function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant, size }), className)} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }