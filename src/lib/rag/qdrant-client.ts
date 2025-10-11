import { QdrantClient } from '@qdrant/js-client-rest';
import { backendConfig } from '../config/backend';

export interface DocumentMetadata {
  source: string;
  text: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class QdrantWrapper {
  private client: QdrantClient;
  private isAvailable: boolean = false;

  constructor() {
    this.client = new QdrantClient({
      url: backendConfig.qdrantUrl,
      timeout: backendConfig.qdrantTimeout,
    });
    console.log('[Qdrant] Initialized client');
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      await fetch(`${backendConfig.qdrantUrl}/healthz`);
      this.isAvailable = true;
      console.log('[Qdrant] Service is available');
    } catch (error) {
      this.isAvailable = false;
      console.warn('[Qdrant] Service is not available - using mock data');
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.isAvailable;
  }

  async searchVectors(
    collectionName: string,
    vector: number[],
    limit: number = 5
  ): Promise<DocumentMetadata[]> {
    if (!this.isAvailable) {
      // Return mock data when Qdrant is not available
      return [{
        source: 'mock-data',
        text: 'This is mock data because Qdrant is not available. Please ensure Qdrant is running and properly configured.',
        timestamp: new Date().toISOString(),
        metadata: { isMock: true }
      }];
    }

    try {
      const response = await this.client.search(collectionName, {
        vector,
        limit,
        with_payload: true,
      });

      return response.map(hit => ({
        source: hit.payload?.source as string,
        text: hit.payload?.text as string,
        timestamp: hit.payload?.timestamp as string,
        metadata: hit.payload?.metadata as Record<string, any>,
      }));
    } catch (error) {
      console.error('[Qdrant] Search failed:', error);
      throw error;
    }
  }

  async createCollection(
    collectionName: string,
    dimension: number
  ): Promise<void> {
    if (!this.isAvailable) {
      console.warn('[Qdrant] Cannot create collection - service not available');
      return;
    }

    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);

      if (!exists) {
        await this.client.createCollection(collectionName, {
          vectors: {
            size: dimension,
            distance: 'Cosine',
          },
        });
        console.log(`[Qdrant] Created collection: ${collectionName}`);
      } else {
        console.log(`[Qdrant] Collection exists: ${collectionName}`);
      }
    } catch (error) {
      console.error('[Qdrant] Create collection failed:', error);
      throw error;
    }
  }

  async upsertVectors(
    collectionName: string,
    vectors: number[][],
    metadata: DocumentMetadata[]
  ): Promise<void> {
    if (!this.isAvailable) {
      console.warn('[Qdrant] Cannot upsert vectors - service not available');
      return;
    }

    try {
      const points = vectors.map((vector, i) => ({
        id: Date.now() + i,
        vector,
        payload: {
          source: metadata[i].source,
          text: metadata[i].text,
          timestamp: metadata[i].timestamp,
          metadata: metadata[i].metadata || {},
        },
      }));

      await this.client.upsert(collectionName, {
        points,
      });

      console.log(`[Qdrant] Upserted ${vectors.length} vectors`);
    } catch (error) {
      console.error('[Qdrant] Upsert failed:', error);
      throw error;
    }
  }
}

export const qdrantClient = new QdrantWrapper();
