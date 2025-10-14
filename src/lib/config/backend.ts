interface BackendConfig {
  openaiApiKey: string;
  qdrantUrl: string;
  qdrantTimeout?: number;
  jwtSecret: string;
  jwtExpirationHours: number;
  baseUrl: string;
  
  // Embedding configuration
  embeddingProvider: 'openai' | 'gemini';
  customGptApiKey?: string;
  geminiApiKey?: string;
}

// Default values for development
const defaultConfig: BackendConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantTimeout: parseInt(process.env.QDRANT_TIMEOUT || '30000'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpirationHours: parseInt(process.env.JWT_EXPIRATION_HOURS || '24'),
  baseUrl: process.env.CUSTOMGPT_BASE_URL || 'http://localhost:3000',
  
  // Embedding configuration
  embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'openai') as 'openai' | 'gemini',
  customGptApiKey: process.env.CUSTOMGPT_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
};

// Validate required fields
function validateConfig(config: BackendConfig): BackendConfig {
  // In development, use default values
  if (process.env.NODE_ENV === 'development') {
    return config;
  }
  
  // In production, require certain fields
  const required = ['qdrantUrl', 'jwtSecret', 'baseUrl'];
  const missing = required.filter(key => !config[key as keyof BackendConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate embedding provider
  if (config.embeddingProvider === 'gemini') {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required when EMBEDDING_PROVIDER=gemini');
    }
  } else {
    // For OpenAI, require either OPENAI_API_KEY or CUSTOMGPT_API_KEY
    if (!config.openaiApiKey && !config.customGptApiKey) {
      throw new Error('OPENAI_API_KEY or CUSTOMGPT_API_KEY is required when EMBEDDING_PROVIDER=openai');
    }
  }
  
  return config;
}

export const backendConfig = validateConfig(defaultConfig);
