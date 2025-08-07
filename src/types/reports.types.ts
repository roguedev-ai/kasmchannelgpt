// Reports and Analytics types based on CustomGPT API documentation

// Traffic Report
export interface TrafficSource {
  request_source: string;
  request_source_number: number;
}

export interface TrafficReportResponse {
  status: string;
  data: {
    sources: TrafficSource[];
  };
}

// Queries Report
export interface QueryStatus {
  status: string;
  count: number;
}

export interface QueriesReportResponse {
  status: string;
  data: {
    total: number;
    query_status: QueryStatus[];
  };
}

// Conversations Report
export interface ConversationsReportResponse {
  status: string;
  data: {
    total: number;
    average_queries_per_conversation: number | string;
  };
}

// Analysis Report
export interface AnalysisDataPoint {
  queries_number: number | string;
  created_at_interval: string;
}

export interface ConversationDataPoint {
  queries_number: number | string;
  created_at_interval: string;
}

export interface QueriesPerConversationDataPoint {
  queries_number: number | string;
  created_at_interval: string;
}

export interface AnalysisReportResponse {
  status: string;
  data: {
    queries: AnalysisDataPoint[];
    conversations: ConversationDataPoint[];
    queries_per_conversation: QueriesPerConversationDataPoint[];
  };
}

export type AnalysisInterval = 'daily' | 'weekly' | 'monthly';