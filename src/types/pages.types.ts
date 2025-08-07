// Pages types based on CustomGPT API documentation

export interface Page {
  id: number;
  page_url: string;
  page_url_hash: string;
  project_id: number;
  s3_path: string | null;
  crawl_status: 'queued' | 'crawling' | 'crawled' | 'failed';
  index_status: 'queued' | 'indexing' | 'indexed' | 'failed';
  is_file: boolean;
  is_refreshable: boolean;
  is_file_kept: boolean;
  filename: string | null;
  filesize: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectInfo {
  id: number;
  project_name: string;
  sitemap_path: string | null;
  is_chat_active: boolean;
  user_id: number;
  team_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  type: 'SITEMAP' | 'WEBSITE' | 'FILE' | string;
  is_shared: boolean;
  shareable_slug: string;
  shareable_link: string;
  embed_code: string;
  live_chat_code: string;
  are_licenses_allowed: boolean;
}

export interface PagesListResponse {
  status: string;
  data: {
    project: ProjectInfo;
    pages: {
      current_page: number;
      data: Page[];
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

export interface DeletePageResponse {
  status: string;
  data: {
    deleted: boolean;
  };
}

export interface ReindexPageResponse {
  status: string;
  data: {
    updated: boolean;
  };
}

export interface PagesQueryParams {
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  crawl_status?: 'all' | 'queued' | 'crawling' | 'crawled' | 'failed';
  index_status?: 'all' | 'queued' | 'indexing' | 'indexed' | 'failed';
}

// Page Metadata types
export interface PageMetadata {
  id: number;
  url: string;
  title: string;
  description: string;
  image: string;
}

export interface PageMetadataResponse {
  status: string;
  data: PageMetadata;
}