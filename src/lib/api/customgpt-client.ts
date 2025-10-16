import { backendConfig } from '../config/backend';

export interface CustomGPTQueryRequest {
  prompt: string;
  context?: string;
}

export class CustomGPTClient {
  private apiKey: string;
  private baseUrl: string;
  private projectId: string = '8669'; // Your KasmGPT project ID

  constructor() {
    this.apiKey = backendConfig.customGptApiKey || '';
    this.baseUrl = process.env.CUSTOMGPT_BASE_URL || 'https://app.customgpt.ai/api/v1';
  }

  async query(userQuery: string, context: string): Promise<string> {
    try {
      // Step 1: Create a conversation
      const conversationUrl = `${this.baseUrl}/projects/${this.projectId}/conversations`;
      const conversationResponse = await fetch(conversationUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Query_${Date.now()}`
        })
      });

      if (!conversationResponse.ok) {
        const errorText = await conversationResponse.text();
        console.error(`[CustomGPT] Conversation creation error ${conversationResponse.status}:`, errorText);
        throw new Error(`CustomGPT API error: ${conversationResponse.status}`);
      }

      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.data?.id;

      if (!conversationId) {
        throw new Error('Failed to get conversation ID from CustomGPT');
      }

      // Step 2: Send message with context to get AI response
      const prompt = `CONTEXT FROM DOCUMENTS:
${context}

INSTRUCTIONS:
- Answer using ONLY the context above
- Do not use general knowledge
- If the answer isn't in the context, say so
- Be specific and cite sources

USER QUESTION: ${userQuery}`;

      const messageUrl = `${this.baseUrl}/projects/${this.projectId}/conversations/${conversationId}/messages`;
      
      const messageResponse = await fetch(messageUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          response_source: 'own_content'
        })
      });

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        console.error(`[CustomGPT] Message error ${messageResponse.status}:`, errorText);
        throw new Error(`CustomGPT API error: ${messageResponse.status}`);
      }

      const messageData = await messageResponse.json();
      return messageData.data?.openai_response || 'I could not generate an answer.';

    } catch (error) {
      console.error('[CustomGPT] Query error:', error);
      throw error;
    }
  }
}

export const customGPTClient = new CustomGPTClient();
