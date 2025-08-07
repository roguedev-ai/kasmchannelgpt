/**
 * Message Error Display Component
 * 
 * Displays error messages with appropriate styling and context based on HTTP status codes.
 * Provides user-friendly error messages and actionable guidance.
 */

import React from 'react';
import { AlertCircle, XCircle, CreditCard, UserX, Search, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageErrorDisplayProps {
  error: string | Error;
  statusCode?: number;
  onRetry?: () => void;
  className?: string;
}

/**
 * Parse error to extract status code and message
 */
const parseError = (error: string | Error): { statusCode?: number; message: string } => {
  if (typeof error === 'string') {
    // Try to extract status code from error message
    const statusMatch = error.match(/(\d{3})/);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;
    return { statusCode, message: error };
  }
  
  return { 
    statusCode: (error as any).status || (error as any).statusCode,
    message: error.message 
  };
};

/**
 * Get error details based on status code
 */
const getErrorDetails = (statusCode?: number, message?: string) => {
  switch (statusCode) {
    case 400:
      return {
        icon: AlertCircle,
        title: 'Invalid Request',
        description: 'The request format is invalid. Please check your input and try again.',
        className: 'border-orange-200 bg-orange-50',
        iconClassName: 'text-orange-600',
        textClassName: 'text-orange-800',
      };
      
    case 401:
      return {
        icon: UserX,
        title: 'Authentication Failed',
        description: 'Your API key is either missing or invalid. Please check your API key configuration.',
        className: 'border-red-200 bg-red-50',
        iconClassName: 'text-red-600',
        textClassName: 'text-red-800',
        showSupport: true,
      };
      
    case 403:
      // Check if this is an inactive agent error
      const isInactiveAgent = message && (
        message.toLowerCase().includes('inactive') ||
        message.toLowerCase().includes('no documents') ||
        message.toLowerCase().includes('agent is not active') ||
        message.toLowerCase().includes('project is not active') ||
        message.toLowerCase().includes('no documents uploaded')
      );
      
      if (isInactiveAgent) {
        return {
          icon: AlertCircle,
          title: 'Agent Inactive',
          description: 'This agent is inactive. Please add documents to activate it before starting a conversation.',
          className: 'border-orange-200 bg-orange-50',
          iconClassName: 'text-orange-600',
          textClassName: 'text-orange-800',
        };
      }
      
      return {
        icon: UserX,
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource. Please check your API key permissions.',
        className: 'border-red-200 bg-red-50',
        iconClassName: 'text-red-600',
        textClassName: 'text-red-800',
        showSupport: true,
      };
      
    case 404:
      return {
        icon: Search,
        title: 'Not Found',
        description: 'The requested agent or conversation was not found. It may have been deleted or you may not have access.',
        className: 'border-gray-200 bg-gray-50',
        iconClassName: 'text-gray-600',
        textClassName: 'text-gray-800',
      };
      
    case 429:
      return {
        icon: CreditCard,
        title: 'Query Credits Exhausted',
        description: 'You have exhausted your current query credits. Please contact customer service for assistance.',
        className: 'border-yellow-200 bg-yellow-50',
        iconClassName: 'text-yellow-600',
        textClassName: 'text-yellow-800',
        showSupport: true,
        supportUrl: 'https://customgpt.freshdesk.com/support/home',
      };
      
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        icon: ServerCrash,
        title: 'Server Error',
        description: 'An internal server error occurred. Please try again later or contact support if the issue persists.',
        className: 'border-red-200 bg-red-50',
        iconClassName: 'text-red-600',
        textClassName: 'text-red-800',
        showRetry: true,
      };
      
    default:
      return {
        icon: XCircle,
        title: 'Error',
        description: message || 'An unexpected error occurred. Please try again.',
        className: 'border-red-200 bg-red-50',
        iconClassName: 'text-red-600',
        textClassName: 'text-red-800',
        showRetry: true,
      };
  }
};

export const MessageErrorDisplay: React.FC<MessageErrorDisplayProps> = ({
  error,
  statusCode: propStatusCode,
  onRetry,
  className,
}) => {
  const { statusCode: parsedStatusCode, message } = parseError(error);
  const finalStatusCode = propStatusCode || parsedStatusCode;
  
  const errorDetails = getErrorDetails(finalStatusCode, message);
  const Icon = errorDetails.icon;
  
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        errorDetails.className,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', errorDetails.iconClassName)} />
        
        <div className="flex-1 space-y-2">
          <div>
            <h3 className={cn('font-medium', errorDetails.textClassName)}>
              {errorDetails.title}
              {finalStatusCode && ` (${finalStatusCode})`}
            </h3>
            <p className={cn('text-sm mt-1', errorDetails.textClassName, 'opacity-90')}>
              {errorDetails.description}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {errorDetails.showRetry && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-xs"
              >
                Try Again
              </Button>
            )}
            
            {errorDetails.showSupport && (
              <a
                href={errorDetails.supportUrl || 'https://customgpt.freshdesk.com/support/home'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                Contact Support
              </a>
            )}
          </div>
          
          {/* Technical Details (collapsed by default) */}
          {message && message !== errorDetails.description && (
            <details className="mt-3">
              <summary className={cn('text-xs cursor-pointer', errorDetails.textClassName, 'opacity-70')}>
                Technical Details
              </summary>
              <pre className={cn(
                'mt-2 p-2 text-xs rounded bg-white bg-opacity-50 overflow-x-auto',
                errorDetails.textClassName,
                'opacity-80'
              )}>
                {message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};