import { sessionManager } from '../session/partner-session';

interface APIClient {
  login(partnerId: string, email: string): Promise<LoginResponse>;
  uploadFile(file: File): Promise<UploadResponse>;
  query(query: string, conversationId?: string): Promise<QueryResponse>;
}

interface LoginResponse {
  token: string;
  partnerId: string;
  namespace: string;
  expiresAt: string;
}

interface UploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  chunkCount: number;
  namespace: string;
}

interface QueryResponse {
  answer: string;
  sources: Array<{
    text: string;
    filename: string;
    score: number;
  }>;
  conversationId: string;
}

class RealAPIClient implements APIClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  async login(partnerId: string, email: string): Promise<LoginResponse> {
    console.log('[API Client] Logging in:', partnerId);
    
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ partnerId, email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store token in session manager
    sessionManager.setSession(data.token, data.partnerId);
    
    return data;
  }
  
  async uploadFile(file: File): Promise<UploadResponse> {
    const token = sessionManager.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    console.log('[API Client] Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/api/rag/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    return await response.json();
  }
  
  async query(query: string, conversationId?: string): Promise<QueryResponse> {
    const token = sessionManager.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    console.log('[API Client] Querying:', query);
    
    const response = await fetch(`${this.baseUrl}/api/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, conversationId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Query failed');
    }
    
    return await response.json();
  }
}

// Export the real API client
export const apiClient = new RealAPIClient();
