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
    
    // Check if CustomGPT API key is present (production key)
    const customGptKey = process.env.CUSTOMGPT_API_KEY;
    const hasCustomGptKey = !!(customGptKey && customGptKey.trim().length > 0);
    
    // Check if demo API key is present (for free trial)
    const demoKey = process.env.CUSTOMGPT_API_KEY_DEMO_USE_ONLY;
    const hasDemoKey = !!(demoKey && demoKey.trim().length > 0);
    
    console.log('[VALIDATE-KEYS] CustomGPT API key present:', hasCustomGptKey);
    console.log('[VALIDATE-KEYS] CustomGPT API key length:', customGptKey?.length || 0);
    console.log('[VALIDATE-KEYS] Demo API key present:', hasDemoKey);
    
    // OpenAI key is optional
    const openaiKey = process.env.OPENAI_API_KEY;
    const hasOpenaiKey = !!(openaiKey && openaiKey.trim().length > 0);
    
    console.log('[VALIDATE-KEYS] OpenAI API key present:', hasOpenaiKey);
    
    // Only return valid: true if there's a production CustomGPT API key
    // Demo key alone doesn't count as "valid" for production mode detection
    const result = {
      valid: hasCustomGptKey,
      customgpt_key_present: hasCustomGptKey,
      demo_key_present: hasDemoKey,
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