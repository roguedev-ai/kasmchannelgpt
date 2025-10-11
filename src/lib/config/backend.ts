// Environment variables with defaults
const env = {
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // CustomGPT
  CUSTOMGPT_API_KEY: process.env.CUSTOMGPT_API_KEY || '',
  CUSTOMGPT_BASE_URL: process.env.CUSTOMGPT_BASE_URL || 'http://localhost:3000/api',
  CUSTOMGPT_DEFAULT_AGENT_ID: process.env.CUSTOMGPT_DEFAULT_AGENT_ID,
  CUSTOMGPT_AGENT_SALES: process.env.CUSTOMGPT_AGENT_SALES,
  CUSTOMGPT_AGENT_SUPPORT: process.env.CUSTOMGPT_AGENT_SUPPORT,
  CUSTOMGPT_AGENT_TECHNICAL: process.env.CUSTOMGPT_AGENT_TECHNICAL,
  CUSTOMGPT_AGENT_GENERAL: process.env.CUSTOMGPT_AGENT_GENERAL,

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

  // Embedding Provider
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'openai',
};

// Validate required environment variables
if (!env.OPENAI_API_KEY && !env.CUSTOMGPT_API_KEY && env.EMBEDDING_PROVIDER === 'openai') {
  throw new Error('Either OPENAI_API_KEY or CUSTOMGPT_API_KEY is required when using OpenAI embeddings');
}

if (!env.GEMINI_API_KEY && env.EMBEDDING_PROVIDER === 'gemini') {
  throw new Error('GEMINI_API_KEY is required when using Gemini embeddings');
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
  openaiApiKey: env.OPENAI_API_KEY || env.CUSTOMGPT_API_KEY, // Fallback to CustomGPT key
  embeddingModel: env.EMBEDDING_MODEL,

  // Gemini
  geminiApiKey: env.GEMINI_API_KEY,

  // CustomGPT
  customGptApiKey: env.CUSTOMGPT_API_KEY,
  customGptBaseUrl: env.CUSTOMGPT_BASE_URL,
  customGptDefaultAgentId: env.CUSTOMGPT_DEFAULT_AGENT_ID,
  customGptAgents: {
    sales: env.CUSTOMGPT_AGENT_SALES,
    support: env.CUSTOMGPT_AGENT_SUPPORT,
    technical: env.CUSTOMGPT_AGENT_TECHNICAL,
    general: env.CUSTOMGPT_AGENT_GENERAL,
  },

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

  // Embedding Provider
  embeddingProvider: env.EMBEDDING_PROVIDER as 'openai' | 'gemini',
} as const;
