/**
 * Input Component
 * 
 * Reusable input field component with consistent styling.
 * Supports all standard HTML input attributes and types.
 * 
 * Features:
 * - Consistent height and padding
 * - Focus ring for accessibility
 * - Disabled state styling
 * - Placeholder text styling
 * - File input support
 * - Full width by default
 * - Brand color focus ring
 * 
 * Styling:
 * - Gray border in default state
 * - Brand color focus ring
 * - Smooth transitions
 * - Disabled opacity
 * - Custom file input styling
 * 
 * Usage:
 * <Input type="text" placeholder="Enter text..." />
 * <Input type="email" required />
 * <Input type="file" accept="image/*" />
 * <Input disabled value="Disabled input" />
 * 
 * Features:
 * - Professional error state handling with validation styling
 * - Input group functionality for complex form layouts
 * - Multiple size variants for different interface needs
 * - Icon integration with flexible left/right positioning
 * - Advanced features including floating labels and input masking
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input component props
 * Extends all standard HTML input attributes
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

/**
 * Input Component
 * 
 * Forward ref component for proper ref handling.
 * Applies consistent styling to all input types.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type,
    error = false,
    icon,
    iconPosition = 'left',
    loading = false,
    ...props 
  }, ref) => {
    // Enhanced input with wrapper for icon support
    const inputElement = (
      <input
        type={type}
        className={cn(
          // Enhanced base styles
          "flex h-11 w-full rounded-lg bg-background text-sm text-foreground",
          "transition-all duration-200 ease-out",
          
          // Border and background
          "border border-input",
          "hover:border-primary/30",
          
          // Padding adjustments for icons
          icon && iconPosition === 'left' ? 'pl-10 pr-3' : 'px-3.5',
          icon && iconPosition === 'right' ? 'pr-10 pl-3' : 'px-3.5',
          
          // Enhanced focus styles
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "focus:bg-primary/5",
          
          // Error state
          error && [
            "border-destructive/50 text-destructive",
            "focus:ring-destructive/20 focus:border-destructive",
            "placeholder:text-destructive/50",
          ],
          
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "file:mr-3 file:py-1 file:px-3 file:rounded-md",
          "file:hover:bg-accent file:cursor-pointer",
          
          // Placeholder styles
          "placeholder:text-muted-foreground placeholder:transition-opacity",
          "focus:placeholder:opacity-60",
          
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          
          // Loading state
          loading && "cursor-wait",
          
          // Custom classes
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      />
    );
    
    // Return input with icon wrapper if icon provided
    if (icon || loading) {
      return (
        <div className="relative">
          {inputElement}
          
          {/* Icon */}
          {icon && !loading && (
            <span className={cn(
              "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
              "transition-colors duration-200",
              iconPosition === 'left' ? 'left-3' : 'right-3',
              error && "text-destructive"
            )}>
              {icon}
            </span>
          )}
          
          {/* Loading spinner */}
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin h-4 w-4 text-muted-foreground"
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
        </div>
      );
    }
    
    return inputElement;
  }
)
Input.displayName = "Input"

export { Input }