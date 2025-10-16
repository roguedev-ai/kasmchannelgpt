interface CustomGPTResponse {
  data: {
    openai_response: string;
    conversation_id: string;
    sources?: Array<{
      content: string;
      source: string;
      relevance: number;
    }>;
  };
}

interface CustomGPTError {
  error: string;
  message: string;
  status: number;
}

export class CustomGPTClient {
  private apiKey: string;
  private projectId: string;
  private baseUrl = 'https://app.customgpt.ai/api/v1';

  constructor(apiKey: string, projectId: string) {
    if (!apiKey) throw new Error('CustomGPT API key is required');
    if (!projectId) throw new Error('CustomGPT project ID is required');

    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  async query(question: string, context?: string): Promise<CustomGPTResponse> {
    try {
      console.log('[CustomGPT] Sending query...');
      console.log(`[CustomGPT] Question: "${question.substring(0, 100)}..."`);
      if (context) {
        console.log(`[CustomGPT] Context length: ${context.length} characters`);
      }

      const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: context ? `Context: ${context}\n\nQuestion: ${question}` : question,
          response_source: 'all', // Use both training data and any uploaded sources
          include_sources: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as CustomGPTError;
        console.error('[CustomGPT] API error:', error);

        // Enhance error messages
        let message = 'Failed to get response from CustomGPT';
        if (response.status === 401) {
          message = 'Invalid CustomGPT API key';
        } else if (response.status === 404) {
          message = 'CustomGPT project not found';
        } else if (response.status === 429) {
          message = 'CustomGPT API rate limit exceeded';
        }

        throw new Error(`${message} (${response.status}): ${error.message || error.error}`);
      }

      const result = await response.json() as CustomGPTResponse;
      
      console.log('[CustomGPT] Response received successfully');
      console.log(`[CustomGPT] Response length: ${result.data.openai_response.length} characters`);
      if (result.data.sources) {
        console.log(`[CustomGPT] Sources included: ${result.data.sources.length}`);
      }

      return result;

    } catch (error) {
      console.error('[CustomGPT] Error:', error);
      
      // Enhance error handling
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Failed to connect to CustomGPT API: Network error');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred while querying CustomGPT');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('[CustomGPT] Testing connection...');
      
      const response = await fetch(`${this.baseUrl}/projects/${this.projectId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error('[CustomGPT] Connection test failed:', response.statusText);
        return false;
      }

      console.log('[CustomGPT] Connection test successful');
      return true;

    } catch (error) {
      console.error('[CustomGPT] Connection test error:', error);
      return false;
    }
  }
}
