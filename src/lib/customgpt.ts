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

  async query(question: string, context?: string): Promise<CustomGPTResponse> {
    const prompt = context 
      ? `Context from uploaded document:\n${context}\n\nQuestion: ${question}`
      : question;

    console.log('[CustomGPT] Sending query to project:', this.projectId);
    
    const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        response_source: 'all',
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CustomGPT] API Error:', response.status, errorText);
      throw new Error(`CustomGPT API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[CustomGPT] Response received');
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
