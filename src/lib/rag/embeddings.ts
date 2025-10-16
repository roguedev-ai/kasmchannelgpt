import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAIEmbeddings } from '@langchain/openai';

export interface EmbeddingsInterface {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

export class GeminiEmbeddingsWrapper implements EmbeddingsInterface {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      console.log('[Embeddings] Generating Gemini embedding for query');
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('[Embeddings] Gemini embedQuery error:', error);
      throw new Error(`Failed to generate Gemini embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      console.log(`[Embeddings] Generating Gemini embeddings for ${texts.length} documents`);
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      
      // Process in parallel with rate limiting
      const batchSize = 20;
      const embeddings: number[][] = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(text => 
            model.embedContent(text)
              .then(result => result.embedding.values)
          )
        );
        embeddings.push(...batchResults);
        
        // Add small delay between batches to avoid rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return embeddings;
    } catch (error) {
      console.error('[Embeddings] Gemini embedDocuments error:', error);
      throw new Error(`Failed to generate Gemini embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class OpenAIEmbeddingsWrapper implements EmbeddingsInterface {
  private embeddings: OpenAIEmbeddings;

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-3-small',
      dimensions: 768, // Match Gemini's dimension for compatibility
    });
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      console.log('[Embeddings] Generating OpenAI embedding for query');
      return await this.embeddings.embedQuery(text);
    } catch (error) {
      console.error('[Embeddings] OpenAI embedQuery error:', error);
      throw new Error(`Failed to generate OpenAI embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      console.log(`[Embeddings] Generating OpenAI embeddings for ${texts.length} documents`);
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      console.error('[Embeddings] OpenAI embedDocuments error:', error);
      throw new Error(`Failed to generate OpenAI embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export function createEmbeddings(): EmbeddingsInterface {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    console.log('[Embeddings] Using Gemini embeddings');
    return new GeminiEmbeddingsWrapper(geminiKey);
  } else if (openaiKey) {
    console.log('[Embeddings] Using OpenAI embeddings');
    return new OpenAIEmbeddingsWrapper(openaiKey);
  } else {
    throw new Error('No embeddings API key found. Set GEMINI_API_KEY or OPENAI_API_KEY');
  }
}
