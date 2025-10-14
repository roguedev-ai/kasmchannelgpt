import { OpenAIEmbeddings } from '@langchain/openai';
import { backendConfig } from '../config/backend';

export class EmbeddingsFactory {
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: backendConfig.openaiApiKey,
      modelName: 'text-embedding-ada-002',
      batchSize: 512,
      stripNewLines: true,
    });
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
  
  async embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }
}
