import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minus } from 'lucide-react';

import { cn } from '../lib/utils';

interface FloatingButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onMinimize?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  isOpen,
  onToggle,
  onMinimize,
  position = 'bottom-right',
  primaryColor = '#007acc',
  size = 'md',
  showLabel = true,
  label = 'Chat with us',
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const labelPosition = {
    'bottom-right': 'right-16 bottom-0',
    'bottom-left': 'left-16 bottom-0',
    'top-right': 'right-16 top-0',
    'top-left': 'left-16 top-0',
  };

  if (isOpen) {
    return null; // Hide button when widget is open
  }

  return (
    <div
      className={cn(
        'fixed z-[9999] flex items-center',
        positionClasses[position],
        className
      )}
    >
      {/* Chat Label */}
      <AnimatePresence>
        {showLabel && !isOpen && (isHovered || !isOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute whitespace-nowrap px-3 py-2 bg-white text-gray-800 text-sm font-medium rounded-lg shadow-lg border border-gray-200',
              labelPosition[position]
            )}
          >
            {label}
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-2 h-2 bg-white border transform rotate-45',
                position.includes('right') 
                  ? 'left-[-4px] border-l-0 border-b-0 top-1/2 -translate-y-1/2' 
                  : 'right-[-4px] border-r-0 border-t-0 top-1/2 -translate-y-1/2'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50',
          sizeClasses[size]
        )}
        style={{
          backgroundColor: primaryColor,
        }}
        title={label}
      >
        {/* Pulse animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        
        {/* Icon */}
        <MessageCircle 
          className={cn(iconSizes[size], 'text-white relative z-10')} 
        />

        {/* Notification badge (optional) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          style={{ fontSize: '10px' }}
        >
          1
        </motion.div>
      </motion.button>
    </div>
  );
};