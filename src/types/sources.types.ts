// Sources types based on CustomGPT API documentation

import type { Page } from './pages.types';

// Source settings
export interface SourceSettings {
  executive_js: boolean;
  data_refresh_frequency: string;
  create_new_pages: boolean;
  remove_unexist_pages: boolean;
  refresh_existing_pages: string;
  sitemap_path?: string;
  allow_extra_timeout?: boolean;
}

// Individual source
export interface Source {
  id: number;
  created_at: string;
  updated_at: string;
  type: string;
  settings: SourceSettings;
  pages?: Page[];
  pageCount?: number | string; // Added for displaying count without loading all pages
}

// Sources list response
export interface SourcesListResponse {
  status: string;
  data: {
    sitemaps: Source[];
    uploads: Source | Source[];  // Can be single object or array based on API response
  };
}

// Create/Update source response
export interface SourceResponse {
  status: string;
  data: Source;
}

// Delete source response
export interface DeleteSourceResponse {
  status: string;
  data: {
    deleted: boolean;
  };
}

// Update source settings request
export interface UpdateSourceSettingsRequest {
  executive_js?: boolean;
  data_refresh_frequency?: string;
  create_new_pages?: boolean;
  remove_unexist_pages?: boolean;
  refresh_existing_pages?: string;
  allow_extra_timeout?: boolean;
}

// Create source request (for sitemap)
export interface CreateSitemapSourceRequest {
  sitemap_path: string;
  executive_js?: boolean;
  data_refresh_frequency?: string;
  create_new_pages?: boolean;
  remove_unexist_pages?: boolean;
  refresh_existing_pages?: string;
  allow_extra_timeout?: boolean;
}