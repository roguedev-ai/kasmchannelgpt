"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  [
    "inline-block text-sm font-medium leading-relaxed",
    "text-foreground/90",
    "transition-colors duration-200",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
    "cursor-default select-none",
    // Enhanced typography
    "tracking-tight",
    "antialiased",
    // Hover effect when used with form elements
    "hover:text-foreground",
    // Focus-within support
    "group-focus-within:text-primary",
    "peer-focus:text-primary",
    // Error state support
    "peer-aria-invalid:text-destructive",
    "peer-invalid:text-destructive",
  ].join(" "),
  {
    variants: {
      size: {
        default: "text-sm",
        xs: "text-xs",
        lg: "text-base",
      },
      weight: {
        default: "font-medium",
        normal: "font-normal",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-destructive after:font-normal",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      weight: "default",
      required: false,
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, size, weight, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ size, weight, required }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }