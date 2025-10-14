interface BackendConfig {
  openaiApiKey: string;
  qdrantUrl: string;
  qdrantTimeout?: number;
  jwtSecret: string;
  jwtExpirationHours: number;
  baseUrl: string;
}

// Default values for development
const defaultConfig: BackendConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantTimeout: parseInt(process.env.QDRANT_TIMEOUT || '30000'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpirationHours: parseInt(process.env.JWT_EXPIRATION_HOURS || '24'),
  baseUrl: process.env.CUSTOMGPT_BASE_URL || 'http://localhost:3000',
};

// Validate required fields
function validateConfig(config: BackendConfig): BackendConfig {
  // In development, use default values
  if (process.env.NODE_ENV === 'development') {
    return config;
  }
  
  // In production, require certain fields
  const required = ['openaiApiKey', 'qdrantUrl', 'jwtSecret', 'baseUrl'];
  const missing = required.filter(key => !config[key as keyof BackendConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return config;
}

export const backendConfig = validateConfig(defaultConfig);
