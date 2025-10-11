import { backendConfig } from '../config/backend';
import { qdrantClient, DocumentMetadata } from './qdrant-client';
import { QueryRequest, QueryResponse } from '../../types/backend';
import { createEmbeddingsClient, EmbeddingsClient } from './embeddings-factory';
import { detectFunctionFromQuery, getAgentForFunction, AgentFunction } from './agent-router';
import { v4 as uuidv4 } from 'uuid';

export class QueryPipeline {
  private embeddings: EmbeddingsClient;

  constructor() {
    // Initialize embeddings using factory
    this.embeddings = createEmbeddingsClient();

    console.log(
      `[Query] Initialized with ${this.embeddings.getProvider()} embeddings ` +
      `(${this.embeddings.getDimensions()} dimensions)`
    );
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
  ): Promise<DocumentMetadata[]> {
    console.log(`[Query] Retrieving top ${topK} documents for partner: ${partnerId}`);

    // Search partner's isolated collection
    const results = await qdrantClient.searchVectors(
      partnerId,
      queryEmbedding,
      topK
    );

    console.log(`[Query] Retrieved ${results.length} documents`);
    return results;
  }

  /**
   * Query CustomGPT with context and agent routing
   */
  private async queryCustomGPT(
    query: string,
    context: string,
    agentFunction?: AgentFunction,
    conversationId?: string
  ): Promise<{ answer: string; conversationId: string }> {
    // Auto-detect function if not specified
    const func = agentFunction || detectFunctionFromQuery(query);
    
    // Get agent ID for this function
    const agentId = getAgentForFunction(func);
    
    console.log(`[Query] Using CustomGPT function: ${func}`);
    if (agentId) {
      console.log(`[Query] Agent ID: ${agentId}`);
    }
    
    const systemPrompt = `You are a helpful AI assistant specialized in ${func}. Use the following context from the user's documents to answer their question. If the context doesn't contain relevant information, say so clearly.

Context:
${context}

Important: Base your answer primarily on the provided context. If the context doesn't contain enough information, acknowledge this limitation.`;

    const userPrompt = query;
    
    try {
      // Build request body
      const requestBody: any = {
        message: userPrompt,
        system_message: systemPrompt,
        conversation_id: conversationId,
        stream: false,
      };
      
      // Add agent ID if configured
      if (agentId) {
        requestBody.agent_id = agentId;
      }
      
      // Call CustomGPT API
      const response = await fetch(`${backendConfig.customGptBaseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${backendConfig.customGptApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`CustomGPT API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        answer: data.response,
        conversationId: data.conversation_id,
      };
    } catch (error) {
      console.error('[Query] CustomGPT API error:', error);
      throw new Error('Failed to get response from CustomGPT');
    }
  }

  /**
   * Process a query and return relevant documents
   */
  async processQuery(request: QueryRequest & { agentFunction?: AgentFunction }): Promise<QueryResponse> {
    const { query, partnerId, conversationId, agentFunction } = request;
    
    console.log(`[Query] Processing query for partner: ${partnerId}`);

    // Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(query);

    // Retrieve relevant documents
    const documents = await this.retrieveRelevantDocs(partnerId, queryEmbedding, 5);

    // Format context from documents
    const context = documents
      .map(doc => `Source: ${doc.source}\n${doc.text}`)
      .join('\n\n');

    // Query CustomGPT with context and optional agent function
    const { answer, conversationId: newConversationId } = await this.queryCustomGPT(
      query,
      context,
      agentFunction,
      conversationId
    );

    // Return response
    return {
      query,
      documents,
      answer,
      conversationId: newConversationId,
      metadata: {
        provider: this.embeddings.getProvider(),
        dimensions: this.embeddings.getDimensions(),
        timestamp: new Date().toISOString(),
        agentFunction: agentFunction || detectFunctionFromQuery(query),
      },
    };
  }
}
