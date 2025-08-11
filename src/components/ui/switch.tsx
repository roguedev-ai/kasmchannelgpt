"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center",
      "rounded-full border-2 border-transparent",
      "transition-all duration-300 ease-in-out",
      "bg-input hover:bg-input/80",
      "data-[state=checked]:bg-primary data-[state=checked]:hover:bg-primary-hover",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "group",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full",
        "bg-background shadow-sm",
        "ring-0 transition-all duration-300 ease-spring",
        "border border-border/50",
        "data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-1",
        "data-[state=checked]:border-primary-foreground/20",
        "group-hover:scale-110",
        "data-[state=checked]:shadow-md"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }