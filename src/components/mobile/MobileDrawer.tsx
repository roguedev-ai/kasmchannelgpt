'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTouchGestures } from '@/hooks/useTouchGestures';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  lockBodyScroll?: boolean;
}

const widthClasses = {
  sm: 'w-64',
  md: 'w-80', 
  lg: 'w-96',
  xl: 'w-[75vw]', // 75% of viewport width
  full: 'w-full'
};

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  side = 'left',
  width = 'md',
  className,
  showCloseButton = true,
  lockBodyScroll = true
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle swipe to close
  const gestureRef = useTouchGestures({
    onSwipeLeft: side === 'left' ? onClose : undefined,
    onSwipeRight: side === 'right' ? onClose : undefined,
    threshold: 50
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (lockBodyScroll && isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, lockBodyScroll]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const slideVariants = {
    hidden: {
      x: side === 'left' ? '-100%' : '100%',
      transition: {
        type: 'tween',
        duration: 0.3
      }
    },
    visible: {
      x: 0,
      transition: {
        type: 'tween',
        duration: 0.3
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={slideVariants}
            className={cn(
              'fixed top-0 bottom-0 z-50',
              'bg-background border-border',
              'shadow-xl',
              side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
              widthClasses[width],
              'safe-area-pt safe-area-pb', // Safe area handling
              className
            )}
          >
            {/* Gesture area for swipe to close */}
            <div
              ref={gestureRef}
              className="h-full flex flex-col"
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b border-border">
                  {title && (
                    <h2 className="text-lg font-semibold text-foreground">
                      {title}
                    </h2>
                  )}
                  
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 -mr-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Bottom sheet component for mobile actions and selections
 */
interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: 'sm' | 'md' | 'lg' | 'full';
  showHandle?: boolean;
  className?: string;
}

const heightClasses = {
  sm: 'h-1/3',
  md: 'h-1/2',
  lg: 'h-2/3',
  full: 'h-full'
};

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'md',
  showHandle = true,
  className
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle swipe down to close
  const gestureRef = useTouchGestures({
    onSwipeDown: onClose,
    threshold: 50
  });

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const slideVariants = {
    hidden: {
      y: '100%',
      transition: {
        type: 'tween',
        duration: 0.3
      }
    },
    visible: {
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={slideVariants}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background border-t border-border',
              'rounded-t-xl shadow-xl',
              heightClasses[height],
              'safe-area-pb',
              className
            )}
          >
            <div
              ref={gestureRef}
              className="h-full flex flex-col"
            >
              {/* Handle */}
              {showHandle && (
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 bg-muted rounded-full" />
                </div>
              )}
              
              {/* Header */}
              {title && (
                <div className="px-4 pb-3">
                  <h2 className="text-lg font-semibold text-foreground text-center">
                    {title}
                  </h2>
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};