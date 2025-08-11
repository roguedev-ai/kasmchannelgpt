/**
 * API Headers utility for CustomGPT proxy
 * Supports both server-side API key and demo mode
 */

export function getApiHeaders(demoApiKey?: string): Record<string, string> {
  // In demo mode, use the provided API key
  const apiKey = demoApiKey || process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    throw new Error('CUSTOMGPT_API_KEY is not configured. Please add it to your .env.local file and restart the server.');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function getStreamHeaders(demoApiKey?: string): Record<string, string> {
  // In demo mode, use the provided API key
  const apiKey = demoApiKey || process.env.CUSTOMGPT_API_KEY;
  
  if (!apiKey) {
    throw new Error('CUSTOMGPT_API_KEY is not configured. Please add it to your .env.local file and restart the server.');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
}