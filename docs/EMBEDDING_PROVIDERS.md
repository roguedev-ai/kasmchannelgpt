# Embedding Provider Configuration

This platform supports multiple embedding providers for document vectorization.

## Supported Providers

### OpenAI (Default)
- **Model**: text-embedding-3-small
- **Dimensions**: 1536
- **Cost**: $0.00002 per 1K tokens
- **API Key**: Can use `OPENAI_API_KEY` or `CUSTOMGPT_API_KEY`
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
# OR
CUSTOMGPT_API_KEY=sk-your-key
```

### Google Gemini
- **Model**: text-embedding-004
- **Dimensions**: 768
- **Cost**: Free tier available (15,000 requests/day)
- **API Key**: Requires `GEMINI_API_KEY`
```env
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
```

## How to Get API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and paste into `.env.local`

### Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy and paste into `.env.local`

## ⚠️ Switching Providers

**WARNING**: If you change `EMBEDDING_PROVIDER`, you MUST:
1. Delete all Qdrant collections (different dimensions)
2. Re-upload all documents
3. Restart the application

### Migration Steps
```bash
# 1. Stop the application
pm2 stop rag-platform

# 2. Update .env.local
nano .env.local
# Change EMBEDDING_PROVIDER=gemini
# Add GEMINI_API_KEY=your-key

# 3. Delete Qdrant collections (if Docker)
docker exec qdrant-container sh -c "rm -rf /qdrant/storage/collections/*"

# OR restart Qdrant container
docker restart qdrant-container

# 4. Restart application
pm2 restart rag-platform

# 5. Re-upload documents for each partner
```

## Recommendation
- Choose your embedding provider BEFORE production deployment
- Once documents are uploaded, switching providers requires re-uploading everything

## Cost Comparison
For 1 million tokens (~750k words):
| Provider | Cost |
|----------|------|
| OpenAI | $0.02 |
| Gemini | Free (within limits) |

## Quality Comparison
Both providers offer excellent semantic search quality:
- OpenAI: Slightly better for English text
- Gemini: Multilingual support, free tier

## Technical Details

### Vector Dimensions
- OpenAI: 1536 dimensions
- Gemini: 768 dimensions

The system automatically:
- Creates Qdrant collections with correct dimensions
- Validates API keys before use
- Handles fallback to CustomGPT key for OpenAI
- Logs provider and dimension info

### Code Structure
- `src/lib/rag/embeddings-factory.ts`: Provider implementations
- `src/lib/config/backend.ts`: Configuration validation
- `src/lib/rag/upload-handler.ts`: Document processing
- `src/lib/rag/query-pipeline.ts`: Query processing

### Error Handling
The system validates:
- Required API keys are present
- Provider selection is valid
- Vector dimensions match collection
- API responses are valid

## Monitoring & Debugging

Enable debug logging in `.env.local`:
```env
DEBUG=true
```

This will show:
- Provider initialization
- Dimension validation
- API key validation
- Collection creation
- Vector operations

## Future Enhancements
1. Support for more providers:
   - Cohere
   - Azure OpenAI
   - Local embeddings
2. Automatic migration between providers
3. Provider-specific optimizations
4. Cost tracking and quotas
