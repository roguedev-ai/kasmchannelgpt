import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { UnstructuredLoader } from '@langchain/community/document_loaders/fs/unstructured';
import { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';
import { backendConfig } from '../config/backend';
import { qdrantClient } from './qdrant-client';
import { ValidationError } from '../../types/backend';
import { createEmbeddingsClient, EmbeddingsClient } from './embeddings-factory';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class FileUploadHandler {
  private embeddings: EmbeddingsClient;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // Initialize embeddings using factory
    this.embeddings = createEmbeddingsClient();

    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: backendConfig.chunkSize,
      chunkOverlap: backendConfig.chunkOverlap,
    });

    console.log(
      `[Upload] Initialized file upload handler with ${this.embeddings.getProvider()} embeddings ` +
      `(${this.embeddings.getDimensions()} dimensions)`
    );
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > backendConfig.maxFileSize) {
      throw new ValidationError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${backendConfig.maxFileSize / 1024 / 1024}MB)`
      );
    }

    // Check file type
    if (!backendConfig.allowedFileTypes.includes(file.type)) {
      throw new ValidationError(
        `Invalid file type: ${file.type}. Allowed: ${backendConfig.allowedFileTypes.join(', ')}`
      );
    }
  }

  /**
   * Process uploaded file and store embeddings
   */
  async processFile(file: File, partnerId: string): Promise<void> {
    // Validate file
    this.validateFile(file);

    // Create temporary file
    const tempPath = path.join(os.tmpdir(), `upload-${uuidv4()}`);
    await fs.promises.writeFile(tempPath, Buffer.from(await file.arrayBuffer()));

    try {
      // Load document based on file type
      let docs: Document[];
      if (file.type === 'application/pdf') {
        const loader = new PDFLoader(tempPath);
        docs = await loader.load();
      } else {
        const loader = new UnstructuredLoader(tempPath);
        docs = await loader.load();
      }

      // Split text into chunks
      const texts = await this.textSplitter.splitDocuments(docs);

      // Generate embeddings
      console.log(`[Upload] Generating embeddings for ${texts.length} chunks`);
      const embeddings = await this.embeddings.embedDocuments(
        texts.map(doc => doc.pageContent)
      );

      // Store in Qdrant
      console.log(`[Upload] Storing ${embeddings.length} vectors in Qdrant`);
      await qdrantClient.upsertVectors(
        partnerId,
        embeddings,
        texts.map(doc => ({
          text: doc.pageContent,
          metadata: doc.metadata,
          source: file.name,
        }))
      );

      console.log(`[Upload] Successfully processed file: ${file.name}`);
    } finally {
      // Clean up temporary file
      await fs.promises.unlink(tempPath);
    }
  }
}
