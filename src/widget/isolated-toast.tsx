import React from 'react';
import { toast as globalToast, Toaster } from 'sonner';

/**
 * Isolated toast implementation for widgets
 * 
 * Creates widget-specific toast notifications that don't interfere
 * with other widget instances or the main application.
 */

// Store widget-specific toast queues
const widgetToastQueues = new Map<string, Array<any>>();

/**
 * Widget-specific Toaster component
 * This component only shows toasts for its specific widget session
 */
export const WidgetToaster: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  // Create a filter function that only shows toasts for this widget
  return (
    <Toaster 
      position="top-center"
      closeButton
      gap={8}
      toastOptions={{
        style: { 
          zIndex: 10000,
          marginTop: '8px'
        },
        // Custom class to identify widget-specific toasts
        className: `widget-toast-${sessionId}`,
      }}
      // Filter toasts to only show those for this widget
      richColors
      theme="light"
    />
  );
};

/**
 * Get or create a widget-specific toast instance
 */
export function getWidgetToast(sessionId: string) {
  // Initialize queue if not exists
  if (!widgetToastQueues.has(sessionId)) {
    widgetToastQueues.set(sessionId, []);
  }
  
  return {
    success: (message: string, options?: any) => {
      // Use data attribute to mark widget-specific toasts
      globalToast.success(message, {
        ...options,
        id: `${sessionId}-${Date.now()}-${Math.random()}`,
        duration: 3000,
        className: `widget-toast-${sessionId}`,
        data: {
          widgetSessionId: sessionId
        }
      });
    },
    error: (message: string, options?: any) => {
      globalToast.error(message, {
        ...options,
        id: `${sessionId}-${Date.now()}-${Math.random()}`,
        duration: 4000,
        className: `widget-toast-${sessionId}`,
        data: {
          widgetSessionId: sessionId
        }
      });
    },
    info: (message: string, options?: any) => {
      globalToast.info(message, {
        ...options,
        id: `${sessionId}-${Date.now()}-${Math.random()}`,
        duration: 3000,
        className: `widget-toast-${sessionId}`,
        data: {
          widgetSessionId: sessionId
        }
      });
    },
    warning: (message: string, options?: any) => {
      globalToast.warning(message, {
        ...options,
        id: `${sessionId}-${Date.now()}-${Math.random()}`,
        duration: 3500,
        className: `widget-toast-${sessionId}`,
        data: {
          widgetSessionId: sessionId
        }
      });
    },
    loading: (message: string, options?: any) => {
      return globalToast.loading(message, {
        ...options,
        id: `${sessionId}-${Date.now()}-${Math.random()}`,
        className: `widget-toast-${sessionId}`,
        data: {
          widgetSessionId: sessionId
        }
      });
    },
    dismiss: (id?: string) => {
      if (id) {
        globalToast.dismiss(id);
      }
    }
  };
}

/**
 * Hook to use widget-specific toast in components
 */
export function useWidgetToast(sessionId: string) {
  return getWidgetToast(sessionId);
}