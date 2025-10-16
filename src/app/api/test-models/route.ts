import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TEST_PROMPT = 'Hello, this is a test message. Please respond with a short greeting.';

const MODEL_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
};

export async function GET(request: NextRequest) {
  try {
    console.log('[Test] Testing Gemini 2.0 Flash model...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: MODEL_CONFIG,
      });
      
      const result = await model.generateContent(TEST_PROMPT);
      const response = result.response;
      const text = response.text();
      
      console.log('[Test] Success with Gemini 2.0 Flash');
      
      return NextResponse.json({
        status: 'success',
        model: 'gemini-2.0-flash',
        response: text,
        config: MODEL_CONFIG,
        apiKeyValid: true,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('[Test] Failed with Gemini 2.0 Flash:', error);
      
      let errorType = 'unknown';
      if (error.message?.includes('API key')) {
        errorType = 'invalid_key';
      } else if (error.message?.includes('quota')) {
        errorType = 'quota_exceeded';
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorType = 'model_not_found';
      }

      return NextResponse.json({
        status: 'error',
        model: 'gemini-2.0-flash',
        error: error.message,
        errorType,
        apiKeyValid: !error.message?.includes('API key'),
        timestamp: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    console.error('[Test] Error testing model:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to test model',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
