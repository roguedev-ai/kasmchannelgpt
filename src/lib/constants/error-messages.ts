/**
 * Error Messages for Demo Mode
 */

export const DEMO_ERROR_MESSAGES = {
  RATE_LIMIT: {
    title: 'Rate Limit Reached',
    message: 'The free trial is experiencing high demand. Please wait a moment and try again.',
    retryAfter: 60, // seconds
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your free trial session has expired. Please refresh the page to start a new session.',
  },
  LIMIT_REACHED: {
    title: 'Limit Reached',
    message: 'You have reached the maximum allowed for this free trial session.',
  },
  API_ERROR: {
    title: 'Service Error',
    message: 'Unable to process your request. Please try again later.',
  },
};

export function getErrorMessage(status: number, isFreeTrialMode: boolean): { title: string; message: string } {
  if (status === 429 && isFreeTrialMode) {
    return DEMO_ERROR_MESSAGES.RATE_LIMIT;
  }
  
  if (status === 403 && isFreeTrialMode) {
    return DEMO_ERROR_MESSAGES.LIMIT_REACHED;
  }
  
  if (status >= 500) {
    return DEMO_ERROR_MESSAGES.API_ERROR;
  }
  
  return {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
  };
}