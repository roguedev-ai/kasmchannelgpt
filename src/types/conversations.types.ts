// Conversation types based on CustomGPT API

// Use the existing Conversation type from main types file
import type { Conversation } from '@/types';

export interface Message {
  id: number;
  user_id: number;
  user_query: string;
  openai_response: string;
  created_at: string;
  updated_at: string;
  conversation_id: number;
  citations: number[];
  metadata?: {
    user_ip?: string;
    user_agent?: string;
    external_id?: string;
    request_source?: string;
  };
  response_feedback?: {
    created_at: string;
    updated_at: string;
    user_id: number;
    reaction: 'liked' | 'disliked';
  };
}

export interface ConversationsListResponse {
  status: 'success' | 'error';
  data: {
    current_page: number;
    data: Conversation[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface ConversationMessagesResponse {
  status: 'success' | 'error';
  data: {
    conversation: Conversation;
    messages: {
      current_page: number;
      data: Message[];
      first_page_url: string;
      from: number;
      last_page: number;
      last_page_url: string;
      next_page_url: string | null;
      path: string;
      per_page: number;
      prev_page_url: string | null;
      to: number;
      total: number;
    };
  };
}

export interface CreateConversationResponse {
  status: 'success' | 'error';
  data: Conversation;
}

export interface UpdateConversationResponse {
  status: 'success' | 'error';
  data: Conversation;
}

export interface DeleteConversationResponse {
  status: 'success' | 'error';
  data: {
    deleted: boolean;
  };
}

export interface SendMessageResponse {
  status: 'success' | 'error';
  data: Message;
}

// Query parameters
export interface ConversationsListParams {
  page?: number;
  order?: 'asc' | 'desc';
  orderBy?: string;
  userFilter?: 'all' | string;
}

export interface MessagesListParams {
  page?: number;
  order?: 'asc' | 'desc';
}

export interface SendMessageParams {
  prompt: string;
  response_source?: 'default' | string;
  stream?: boolean;
  lang?: string;
}