import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TEST_PROMPT = 'Hello, this is a test message. Please respond with a short greeting.';

const MODELS = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'models/gemini-1.5-pro'
];

const MODEL_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
};

export async function GET(request: NextRequest) {
  try {
    console.log('[Test] Testing Gemini models...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const results = [];
    
    for (const modelName of MODELS) {
      console.log(`[Test] Trying model: ${modelName}`);
      
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: MODEL_CONFIG,
        });
        
        const result = await model.generateContent(TEST_PROMPT);
        const response = result.response;
        const text = response.text();
        
        console.log(`[Test] Success with model: ${modelName}`);
        results.push({
          model: modelName,
          status: 'works',
          response: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          config: MODEL_CONFIG,
        });
      } catch (error: any) {
        console.error(`[Test] Failed with model: ${modelName}`, error);
        results.push({
          model: modelName,
          status: 'failed',
          error: error.message,
          details: error.toString(),
        });
      }
      
      // Add delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Find working models
    const workingModels = results.filter(r => r.status === 'works');
    console.log(`[Test] Found ${workingModels.length} working models`);
    
    return NextResponse.json({
      results,
      workingModels: workingModels.map(m => m.model),
      recommendedModel: workingModels[0]?.model || null,
      apiKeyValid: results.some(r => !r.error?.includes('API key')),
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[Test] Error testing models:', error);
    return NextResponse.json(
      {
        error: 'Failed to test models',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
