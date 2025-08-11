'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const { isMobile } = useBreakpoint();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    onChange(startStr, endStr);
    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(localStartDate, localEndDate);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          isMobile ? "w-full" : "w-64"
        )}
      >
        <Calendar className={cn(
          "mr-2",
          isMobile ? "w-4 h-4" : "w-4 h-4"
        )} />
        <span className={cn(
          isMobile && "text-sm"
        )}>
          {formatDateRange()}
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setIsOpen(false)}
              />
            )}
            
            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 0 }}
              className={cn(
                "bg-card border border-border rounded-lg shadow-lg z-50",
                isMobile 
                  ? "fixed bottom-0 left-0 right-0 rounded-t-xl rounded-b-none" 
                  : "absolute top-full mt-2 right-0 w-80",
                isMobile ? "p-4 pb-6 safe-area-pb" : "p-4"
              )}
            >
              <div className="space-y-4">
                {/* Preset Ranges */}
                <div className="space-y-2">
                  <h4 className={cn(
                    "font-medium text-foreground",
                    isMobile ? "text-base" : "text-sm"
                  )}>Quick Select</h4>
                  <div className={cn(
                    "flex gap-2",
                    isMobile && "flex-col"
                  )}>
                    {presetRanges.map((range) => (
                      <Button
                        key={range.label}
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        onClick={() => handlePresetClick(range.days)}
                        className={cn(
                          isMobile && "h-11 touch-target"
                        )}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Range */}
                <div className="space-y-2">
                  <h4 className={cn(
                    "font-medium text-foreground",
                    isMobile ? "text-base" : "text-sm"
                  )}>Custom Range</h4>
                  <div className={cn(
                    "grid gap-2",
                    isMobile ? "grid-cols-1" : "grid-cols-2"
                  )}>
                    <div>
                      <Label className={cn(
                        "text-muted-foreground",
                        isMobile ? "text-sm" : "text-xs"
                      )}>Start Date</Label>
                      <Input
                        type="date"
                        value={localStartDate}
                        onChange={(e) => setLocalStartDate(e.target.value)}
                        className={cn(
                          "w-full",
                          isMobile ? "h-12 text-base touch-target" : "h-9 text-sm"
                        )}
                      />
                    </div>
                    <div>
                      <Label className={cn(
                        "text-muted-foreground",
                        isMobile ? "text-sm" : "text-xs"
                      )}>End Date</Label>
                      <Input
                        type="date"
                        value={localEndDate}
                        onChange={(e) => setLocalEndDate(e.target.value)}
                        className={cn(
                          "w-full",
                          isMobile ? "h-12 text-base touch-target" : "h-9 text-sm"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={cn(
                  "flex gap-2 pt-2 border-t",
                  isMobile ? "flex-col-reverse" : "justify-end"
                )}>
                  <Button
                    variant="ghost"
                    size={isMobile ? "default" : "sm"}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      isMobile && "w-full h-11 touch-target"
                    )}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size={isMobile ? "default" : "sm"}
                    onClick={handleApply}
                    className={cn(
                      isMobile && "w-full h-11 touch-target"
                    )}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};