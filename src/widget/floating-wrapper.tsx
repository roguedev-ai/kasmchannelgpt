/**
 * Floating Button Wrapper Component
 * 
 * Lightweight wrapper that creates a floating button interface using the enhanced widget.
 * This replaces the heavy React component with a simpler implementation that leverages
 * the conversation management features built into the core widget.
 * 
 * Usage:
 * CustomGPTWidget.init({
 *   agentId: '123',
 *   mode: 'floating',
 *   enableConversationManagement: true,
 *   maxConversations: 10
 * });
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingWrapperProps {
  widget: any; // The CustomGPTWidget instance
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

/**
 * Floating Wrapper Component
 * 
 * Provides the floating button UI that opens/closes the widget.
 * All conversation management is handled by the widget itself.
 */
export const FloatingWrapper: React.FC<FloatingWrapperProps> = ({
  widget,
  position = 'bottom-right',
  primaryColor = '#007acc',
  size = 'md',
  showLabel = true,
  label = 'Chat with us',
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleToggle = () => {
    if (isOpen) {
      widget.close();
      setIsOpen(false);
    } else {
      widget.open();
      setIsOpen(true);
    }
  };

  // Sync with widget state
  useEffect(() => {
    const checkWidgetState = () => {
      setIsOpen(widget.isOpened);
    };

    // Check periodically
    const interval = setInterval(checkWidgetState, 100);
    return () => clearInterval(interval);
  }, [widget]);

  if (isOpen) {
    return null; // Hide button when widget is open
  }

  return (
    <div
      className={cn(
        'fixed z-[9998] flex items-center',
        positionClasses[position]
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
        onClick={handleToggle}
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
      </motion.button>
    </div>
  );
};

/**
 * Helper function to create a floating button with the widget
 * 
 * @example
 * createFloatingButton({
 *   agentId: '123',
 *   enableConversationManagement: true,
 *   maxConversations: 10
 * });
 */
export function createFloatingButton(config: any) {
  // Import the widget dynamically
  const { CustomGPTWidget } = window as any;
  
  if (!CustomGPTWidget) {
    throw new Error('CustomGPTWidget not found. Make sure to include the widget script.');
  }

  // Create widget with floating mode
  const widget = CustomGPTWidget.init({
    ...config,
    mode: 'floating',
  });

  // Create a container for the floating button
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'customgpt-floating-button';
  document.body.appendChild(buttonContainer);

  // Render the floating button wrapper
  const ReactDOM = (window as any).ReactDOM;
  if (!ReactDOM || !ReactDOM.createRoot) {
    throw new Error('ReactDOM not found. Make sure React is loaded.');
  }
  
  const root = ReactDOM.createRoot(buttonContainer);
  
  root.render(
    React.createElement(FloatingWrapper, {
      widget,
      position: config.position,
      primaryColor: config.primaryColor,
      size: config.buttonSize,
      showLabel: config.showLabel,
      label: config.label,
    })
  );

  return widget;
}