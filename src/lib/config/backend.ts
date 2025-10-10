interface BackendConfig {
  // JWT
  jwtSecret: string;
  jwtExpirationHours: number;
  
  // Qdrant
  qdrantUrl: string;
  qdrantTimeout: number;
  
  // CustomGPT
  customGptApiKey: string;
  customGptBaseUrl: string;
  
  // OpenAI (for embeddings)
  openaiApiKey: string;
  embeddingModel: string;
  embeddingDimension: number;
  
  // File processing
  maxFileSize: number;
  allowedFileTypes: string[];
  chunkSize: number;
  chunkOverlap: number;
  
  // Rate limiting
  maxQueriesPerMinute: number;
  maxUploadsPerHour: number;
}

function validateConfig(): BackendConfig {
  const required = [
    'JWT_SECRET',
    'CUSTOMGPT_API_KEY',
    'QDRANT_URL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return {
    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpirationHours: 24,
    
    // Qdrant
    qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
    qdrantTimeout: 30000,
    
    // CustomGPT
    customGptApiKey: process.env.CUSTOMGPT_API_KEY!,
    customGptBaseUrl: process.env.CUSTOMGPT_BASE_URL || 'https://app.customgpt.ai/api/v1',
    
    // OpenAI
    openaiApiKey: process.env.OPENAI_API_KEY || process.env.CUSTOMGPT_API_KEY!,
    embeddingModel: 'text-embedding-3-small',
    embeddingDimension: 1536,
    
    // File processing
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
    chunkSize: 1000,
    chunkOverlap: 200,
    
    // Rate limiting
    maxQueriesPerMinute: 10,
    maxUploadsPerHour: 5,
  };
}

export const backendConfig = validateConfig();
