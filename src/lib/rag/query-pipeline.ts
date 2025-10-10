import { OpenAIEmbeddings } from '@langchain/openai';
import { backendConfig } from '../config/backend';
import { qdrantClient } from './qdrant-client';
import { QueryRequest, QueryResponse, DocumentSource } from '../../types/backend';
import { v4 as uuidv4 } from 'uuid';

export class QueryPipeline {
  private embeddings: OpenAIEmbeddings;
  
  constructor() {
    // Initialize embeddings (same model as upload)
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: backendConfig.openaiApiKey,
      modelName: backendConfig.embeddingModel,
    });
    
    console.log('[Query] Initialized query pipeline');
  }
  
  /**
   * Generate embedding for a query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    console.log(`[Query] Generating embedding for query: "${query.substring(0, 50)}..."`);
    
    const embedding = await this.embeddings.embedQuery(query);
    
    console.log(`[Query] Generated embedding: ${embedding.length} dimensions`);
    
    return embedding;
  }
  
  /**
   * Retrieve relevant documents from Qdrant
   */
  private async retrieveRelevantDocs(
    partnerId: string,
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<DocumentSource[]> {
    console.log(`[Query] Retrieving top ${topK} documents for partner: ${partnerId}`);
    
    // Search partner's isolated collection
    const results = await qdrantClient.searchVectors(
      partnerId,
      queryEmbedding,
      topK
    );
    
    // Transform to DocumentSource format
    const sources: DocumentSource[] = results.map(result => ({
      text: result.payload.text,
      filename: result.payload.filename,
      score: result.score,
      chunkIndex: result.payload.chunkIndex,
    }));
    
    console.log(`[Query] Retrieved ${sources.length} relevant documents`);
    
    return sources;
  }
  
  /**
   * Build context string from retrieved documents
   */
  private buildContext(sources: DocumentSource[]): string {
    if (sources.length === 0) {
      return 'No relevant documents found in your knowledge base.';
    }
    
    const contextParts = sources.map((source, index) => 
      `[Document ${index + 1}: ${source.filename}]\n${source.text}`
    );
    
    return contextParts.join('\n\n---\n\n');
  }
  
  /**
   * Query CustomGPT with context
   */
  private async queryCustomGPT(
    query: string,
    context: string,
    conversationId?: string
  ): Promise<{ answer: string; conversationId: string }> {
    console.log('[Query] Sending query to CustomGPT...');
    
    // Build the prompt with context
    const systemPrompt = `You are a helpful AI assistant. Use the following context from the user's documents to answer their question. If the context doesn't contain relevant information, say so clearly.

Context:
${context}

Important: Base your answer primarily on the provided context. If the context doesn't contain enough information, acknowledge this limitation.`;

    const userPrompt = query;
    
    try {
      // Call CustomGPT API
      const response = await fetch(`${backendConfig.customGptBaseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${backendConfig.customGptApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userPrompt,
          system_message: systemPrompt,
          conversation_id: conversationId,
          stream: false,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CustomGPT API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('[Query] Received response from CustomGPT');
      
      return {
        answer: data.message || data.response || 'No response from CustomGPT',
        conversationId: data.conversation_id || conversationId || uuidv4(),
      };
      
    } catch (error: any) {
      console.error('[Query] Error querying CustomGPT:', error);
      throw new Error(`Failed to query CustomGPT: ${error?.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Main query function - orchestrates the full RAG pipeline
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const { query, partnerId, conversationId } = request;
    
    console.log(`[Query] Processing query for partner: ${partnerId}`);
    console.log(`[Query] Query: "${query}"`);
    
    try {
      // Step 1: Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Step 2: Retrieve relevant documents from partner's collection
      const sources = await this.retrieveRelevantDocs(
        partnerId,
        queryEmbedding,
        5 // Top 5 most relevant chunks
      );
      
      // Step 3: Build context from retrieved documents
      const context = this.buildContext(sources);
      
      // Step 4: Query CustomGPT with context
      const { answer, conversationId: newConversationId } = await this.queryCustomGPT(
        query,
        context,
        conversationId
      );
      
      console.log('[Query] Query completed successfully');
      
      return {
        answer,
        sources,
        conversationId: newConversationId,
      };
      
    } catch (error: any) {
      console.error('[Query] Error in query pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Query without RAG (direct to CustomGPT)
   * Useful if partner has no documents uploaded yet
   */
  async queryDirect(
    query: string,
    conversationId?: string
  ): Promise<{ answer: string; conversationId: string }> {
    console.log('[Query] Direct query (no RAG)');
    
    return await this.queryCustomGPT(
      query,
      'No documents available. Answer based on general knowledge.',
      conversationId
    );
  }
}

// Singleton instance
export const queryPipeline = new QueryPipeline();
