/**
 * API Key Validation Endpoint
 * 
 * Simple endpoint to check if required API keys are configured
 * without making external API calls.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[VALIDATE-KEYS] Checking environment variables...');
    
    // Check if CustomGPT API key is present
    const customGptKey = process.env.CUSTOMGPT_API_KEY;
    const hasCustomGptKey = !!(customGptKey && customGptKey.trim().length > 0);
    
    console.log('[VALIDATE-KEYS] CustomGPT API key present:', hasCustomGptKey);
    console.log('[VALIDATE-KEYS] CustomGPT API key length:', customGptKey?.length || 0);
    
    // OpenAI key is optional
    const openaiKey = process.env.OPENAI_API_KEY;
    const hasOpenaiKey = !!(openaiKey && openaiKey.trim().length > 0);
    
    console.log('[VALIDATE-KEYS] OpenAI API key present:', hasOpenaiKey);
    
    const result = {
      valid: hasCustomGptKey,
      customgpt_key_present: hasCustomGptKey,
      openai_key_present: hasOpenaiKey,
      timestamp: new Date().toISOString()
    };
    
    console.log('[VALIDATE-KEYS] Validation result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[VALIDATE-KEYS] Error validating keys:', error);
    
    return NextResponse.json({
      valid: false,
      error: 'Validation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}