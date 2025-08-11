/**
 * API Key Validation and Management
 * 
 * Handles validation and status checking for API keys
 */

interface KeyValidationResult {
  isValid: boolean;
  error?: string;
  keyType: 'customgpt' | 'openai';
}

/**
 * Check if CustomGPT API key is configured on the server
 */
export async function validateCustomGPTKey(): Promise<KeyValidationResult> {
  try {
    // Try to fetch user limits to verify API key works
    const response = await fetch('/api/proxy/user/limits');
    
    if (response.ok) {
      return { isValid: true, keyType: 'customgpt' };
    }
    
    if (response.status === 401) {
      return { 
        isValid: false, 
        keyType: 'customgpt',
        error: 'CustomGPT API key is missing or invalid. Please add CUSTOMGPT_API_KEY to your .env.local file.' 
      };
    }
    
    if (response.status === 500) {
      const data = await response.json().catch(() => null);
      if (data?.error?.includes('API key is required')) {
        return { 
          isValid: false, 
          keyType: 'customgpt',
          error: 'CustomGPT API key is not configured. Please add CUSTOMGPT_API_KEY to your .env.local file.' 
        };
      }
    }
    
    return { 
      isValid: false, 
      keyType: 'customgpt',
      error: 'Failed to validate CustomGPT API key' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      keyType: 'customgpt',
      error: 'Unable to connect to server. Make sure the server is running.' 
    };
  }
}

/**
 * Check if OpenAI API key is configured (only needed for voice features)
 */
export async function validateOpenAIKey(): Promise<KeyValidationResult> {
  try {
    // Check if OPENAI_API_KEY is configured by trying a voice endpoint
    const response = await fetch('/api/proxy/voice/inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 401 || response.status === 500) {
      const data = await response.json().catch(() => null);
      if (data?.error?.includes('OPENAI_API_KEY')) {
        return { 
          isValid: false, 
          keyType: 'openai',
          error: 'OpenAI API key is not configured. Voice features require OPENAI_API_KEY in your .env.local file.' 
        };
      }
    }
    
    // If we get here, assume it's configured (actual test would happen when using voice)
    return { isValid: true, keyType: 'openai' };
  } catch (error) {
    // OpenAI key validation failure is not critical
    return { isValid: true, keyType: 'openai' };
  }
}

/**
 * Check all required API keys
 */
export async function validateAllKeys(): Promise<{
  customgpt: KeyValidationResult;
  openai: KeyValidationResult;
  allValid: boolean;
  criticalError?: string;
}> {
  const [customgptResult, openaiResult] = await Promise.all([
    validateCustomGPTKey(),
    validateOpenAIKey()
  ]);
  
  // CustomGPT key is critical, OpenAI key is optional
  const allValid = customgptResult.isValid;
  const criticalError = customgptResult.isValid ? undefined : customgptResult.error;
  
  return {
    customgpt: customgptResult,
    openai: openaiResult,
    allValid,
    criticalError
  };
}

/**
 * Get user-friendly setup instructions based on missing keys
 */
export function getSetupInstructions(validation: {
  customgpt: KeyValidationResult;
  openai: KeyValidationResult;
}): string[] {
  const instructions: string[] = [];
  
  if (!validation.customgpt.isValid) {
    instructions.push(
      '1. Copy .env.example to .env.local',
      '2. Add your CustomGPT API key: CUSTOMGPT_API_KEY=your_key_here',
      '3. Get your API key from https://app.customgpt.ai'
    );
  }
  
  if (!validation.openai.isValid) {
    instructions.push(
      'For voice features (optional):',
      '4. Add your OpenAI API key: OPENAI_API_KEY=your_key_here',
      '5. Get your API key from https://platform.openai.com'
    );
  }
  
  if (instructions.length > 0) {
    instructions.push('6. Restart the development server: npm run dev');
  }
  
  return instructions;
}