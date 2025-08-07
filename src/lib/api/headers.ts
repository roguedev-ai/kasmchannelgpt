/**
 * API Headers utility for CustomGPT proxy
 */

export function getApiHeaders(): Record<string, string> {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    throw new Error('CUSTOMGPT_API_KEY environment variable is not set');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function getStreamHeaders(): Record<string, string> {
  const apiKey = process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    throw new Error('CUSTOMGPT_API_KEY environment variable is not set');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
}