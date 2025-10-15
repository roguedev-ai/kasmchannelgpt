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
    const url = `${this.baseUrl}/projects/${this.projectId}/conversations`;
    
    const prompt = `Context from our knowledge base:\n\n${context}\n\nUser question: ${userQuery}\n\nPlease answer based on the context provided above.`;

    const response = await fetch(url, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CustomGPT] ${response.status} error:`, errorText);
      throw new Error(`CustomGPT API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.openai_response || 'I could not generate an answer.';
  }
}

export const customGPTClient = new CustomGPTClient();
