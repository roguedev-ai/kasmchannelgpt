"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SimpleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

/**
 * Simple Select Component
 * 
 * A wrapper around the Radix UI Select component that provides a simpler API
 * similar to native HTML select elements, making migration easier.
 * 
 * @example
 * ```tsx
 * <SimpleSelect
 *   value={dateRange}
 *   onValueChange={setDateRange}
 *   options={[
 *     { value: '7d', label: 'Last 7 days' },
 *     { value: '30d', label: 'Last 30 days' },
 *     { value: '90d', label: 'Last 90 days' },
 *     { value: '1y', label: 'Last year' }
 *   ]}
 *   placeholder="Select date range"
 * />
 * ```
 */
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  className,
  disabled = false,
  name,
  id,
}: SimpleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger className={cn("w-full", className)} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Grouped Select Component
 * 
 * For selects with grouped options (like languages grouped by region)
 */
export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface GroupedSelectProps extends Omit<SimpleSelectProps, 'options'> {
  groups: SelectGroup[];
}

export function GroupedSelect({
  value,
  onValueChange,
  groups,
  placeholder = "Select an option",
  className,
  disabled = false,
  name,
  id,
}: GroupedSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger className={cn("w-full", className)} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.map((group, index) => (
          <React.Fragment key={index}>
            {index > 0 && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel>{group.label}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </React.Fragment>
        ))}
      </SelectContent>
    </Select>
  );
}

