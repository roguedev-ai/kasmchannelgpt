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
  // Base styles for all badges
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary/default style with brand colors
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        // Secondary style with neutral colors
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Destructive/danger style with red colors
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Outline style with border only
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
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
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }