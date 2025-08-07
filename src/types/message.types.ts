// Message types based on CustomGPT API documentation

export interface MessageMetadata {
  user_ip: string;
  user_agent: string;
  external_id?: string;
  request_source: string;
}

export interface MessageFeedback {
  created_at: string;
  updated_at: string;
  user_id: number;
  reaction: 'liked' | 'disliked';
}

export interface APIMessage {
  id: number;
  user_id: number;
  user_query: string;
  openai_response: string;
  created_at: string;
  updated_at: string;
  conversation_id: number;
  citations: number[];
  metadata: MessageMetadata;
  response_feedback?: MessageFeedback;
}

export interface APIMessageResponse {
  status: string;
  data: APIMessage;
}

export interface UpdateMessageFeedbackRequest {
  feedback: 'thumbs_up' | 'thumbs_down';
}