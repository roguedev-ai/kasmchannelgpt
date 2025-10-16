export interface CustomGPTResponse {
  data: {
    openai_response: string;
    conversation_id: string;
    session_id?: string;
  };
  citations?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export type ResponseSource = 'default' | 'own_content' | 'openai_content';

export class CustomGPTClient {
  private apiKey: string;
  private projectId: string;
  private baseUrl = 'https://app.customgpt.ai/api/v1';

  constructor(apiKey: string, projectId: string) {
    if (!apiKey) {
      throw new Error('CustomGPT API key is required');
    }
    if (!projectId) {
      throw new Error('CustomGPT project ID is required');
    }
    
    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  /**
   * Two-step process to get a response from CustomGPT:
   * 1. Create a conversation
   * 2. Send a message to that conversation
   */
  async query(
    question: string, 
    context?: string, 
    conversationName?: string,
    responseSource: ResponseSource = 'default'
  ): Promise<CustomGPTResponse> {
    // Step 1: Create conversation
    const name = conversationName || 
      `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    console.log('[CustomGPT] Step 1: Creating conversation:', name);
    
    const createResponse = await fetch(
      `${this.baseUrl}/projects/${this.projectId}/conversations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[CustomGPT] Conversation creation error:', createResponse.status, errorText);
      throw new Error(`Failed to create conversation: ${createResponse.status} ${errorText}`);
    }

    const conversationData = await createResponse.json();
    const conversationId = conversationData.data?.id;

    if (!conversationId) {
      console.error('[CustomGPT] No conversation ID in response:', conversationData);
      throw new Error('Failed to get conversation ID from CustomGPT');
    }

    console.log('[CustomGPT] Conversation created:', conversationId);

    // Step 2: Send message to conversation
    const prompt = context 
      ? `Context from uploaded document:\n\n${context}\n\n---\n\nQuestion: ${question}`
      : question;

    console.log('[CustomGPT] Step 2: Sending message to conversation');
    console.log('[CustomGPT] Response source:', responseSource);

    const messageResponse = await fetch(
      `${this.baseUrl}/projects/${this.projectId}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          response_source: responseSource,
          stream: false
        })
      }
    );

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('[CustomGPT] Message send error:', messageResponse.status, errorText);
      throw new Error(`Failed to send message: ${messageResponse.status} ${errorText}`);
    }

    const result = await messageResponse.json();
    
    console.log('[CustomGPT] Response received');
    console.log('[CustomGPT] Conversation ID:', conversationId);
    console.log('[CustomGPT] Response length:', result.data?.openai_response?.length || 0);

    // Add conversation_id to response if not present
    if (result.data && !result.data.conversation_id) {
      result.data.conversation_id = conversationId;
    }

    return result;
  }
}

// Singleton with lazy initialization
let customGPTInstance: CustomGPTClient | null = null;

export function getCustomGPTClient(): CustomGPTClient {
  if (!customGPTInstance) {
    const apiKey = process.env.CUSTOMGPT_API_KEY;
    const projectId = process.env.CUSTOMGPT_PROJECT_ID;
    
    if (!apiKey || !projectId) {
      throw new Error(
        'CustomGPT credentials not configured. Please set CUSTOMGPT_API_KEY and CUSTOMGPT_PROJECT_ID in .env.local'
      );
    }
    
    customGPTInstance = new CustomGPTClient(apiKey, projectId);
  }
  
  return customGPTInstance;
}
