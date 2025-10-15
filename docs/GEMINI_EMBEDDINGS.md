# Gemini Embeddings Integration

This document describes the implementation of Google's Gemini embeddings in the KasmChannelGPT project.

## Overview

The Gemini embeddings implementation provides an alternative to OpenAI's embeddings, using Google's Gemini API to generate vector embeddings for text content.

## Configuration

1. Set up your Gemini API key:
   ```env
   EMBEDDING_PROVIDER=gemini
   GEMINI_API_KEY=your-api-key-here
   ```

2. The embeddings client will automatically use Gemini when `EMBEDDING_PROVIDER` is set to 'gemini'.

## Implementation Details

- Model: `text-embedding-004`
- Embedding Dimensions: 768
- Batch Processing: Implemented with sequential processing to avoid rate limits

## Usage

```typescript
import { createEmbeddingsClient } from '../src/lib/rag/embeddings-factory';

// Create the client
const client = createEmbeddingsClient();

// Generate embeddings for a single query
const embedding = await client.embedQuery('Your text here');

// Generate embeddings for multiple documents
const embeddings = await client.embedDocuments(['Text 1', 'Text 2', 'Text 3']);
```

## Testing

Run the Gemini embeddings test:
```bash
# Set your API key first
export GEMINI_API_KEY=your-api-key-here

# Run the test
npm run test:gemini
```

## API Reference

### GeminiEmbeddingsClient

Implements the `EmbeddingsClient` interface:

```typescript
interface EmbeddingsClient {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
  getProvider(): string;
  getDimensions(): number;
}
```

### Methods

- `embedDocuments(texts: string[]): Promise<number[][]>`
  - Generates embeddings for multiple texts
  - Returns an array of embedding vectors

- `embedQuery(text: string): Promise<number[]>`
  - Generates an embedding for a single text
  - Returns a single embedding vector

- `getProvider(): string`
  - Returns 'gemini' as the provider name

- `getDimensions(): number`
  - Returns 768 (Gemini text-embedding-004 dimensions)

## Error Handling

The client includes error handling for:
- Missing API key
- API request failures
- Invalid responses

Errors are thrown with descriptive messages that include the HTTP status code and error details when available.
