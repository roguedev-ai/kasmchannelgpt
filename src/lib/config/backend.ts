// Environment variables with defaults
const env = {
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
  
  // CustomGPT
  CUSTOMGPT_API_KEY: process.env.CUSTOMGPT_API_KEY || '',
  CUSTOMGPT_BASE_URL: process.env.CUSTOMGPT_BASE_URL || 'http://localhost:3000/api',
  
  // Qdrant
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
  QDRANT_TIMEOUT: parseInt(process.env.QDRANT_TIMEOUT || '5000', 10),
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRATION_HOURS: parseInt(process.env.JWT_EXPIRATION_HOURS || '24', 10),
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(','),
  
  // Text Processing
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '1000', 10),
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || '1536', 10),

  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || './data/rag-platform.db',
};

// Validate required environment variables
if (!env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

if (!env.CUSTOMGPT_API_KEY) {
  throw new Error('CUSTOMGPT_API_KEY is required');
}

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

// Export validated configuration
export const backendConfig = {
  // OpenAI
  openaiApiKey: env.OPENAI_API_KEY,
  embeddingModel: env.EMBEDDING_MODEL,
  
  // CustomGPT
  customGptApiKey: env.CUSTOMGPT_API_KEY,
  customGptBaseUrl: env.CUSTOMGPT_BASE_URL,
  
  // Qdrant
  qdrantUrl: env.QDRANT_URL,
  qdrantTimeout: env.QDRANT_TIMEOUT,
  
  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtExpirationHours: env.JWT_EXPIRATION_HOURS,
  
  // File Upload
  maxFileSize: env.MAX_FILE_SIZE,
  allowedFileTypes: env.ALLOWED_FILE_TYPES,
  
  // Text Processing
  chunkSize: env.CHUNK_SIZE,
  chunkOverlap: env.CHUNK_OVERLAP,
  embeddingDimension: env.EMBEDDING_DIMENSION,

  // Database
  databasePath: env.DATABASE_PATH,
} as const;
