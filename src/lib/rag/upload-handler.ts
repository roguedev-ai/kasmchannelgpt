import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { UnstructuredLoader } from '@langchain/community/document_loaders/fs/unstructured';
import { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';
import { backendConfig } from '../config/backend';
import { qdrantClient } from './qdrant-client';
import { ValidationError } from '../../types/backend';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class FileUploadHandler {
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // Initialize OpenAI embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: backendConfig.openaiApiKey,
      modelName: backendConfig.embeddingModel,
    });

    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: backendConfig.chunkSize,
      chunkOverlap: backendConfig.chunkOverlap,
    });

    console.log('[Upload] Initialized file upload handler');
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

    console.log(`[Upload] File validated: ${file.name} (${file.type})`);
  }

  /**
   * Save file temporarily for processing
   */
  private async saveTempFile(file: File): Promise<string> {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `upload_${uuidv4()}_${file.name}`);

    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.promises.writeFile(tempPath, buffer);

    console.log(`[Upload] Saved temp file: ${tempPath}`);

    return tempPath;
  }

  /**
   * Delete temporary file
   */
  private async deleteTempFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
      console.log(`[Upload] Deleted temp file: ${filePath}`);
    } catch (error) {
      console.error(`[Upload] Error deleting temp file: ${error}`);
    }
  }

  /**
   * Load and parse document based on file type
   */
  private async loadDocument(filePath: string, mimeType: string): Promise<string> {
    let loader;

    switch (mimeType) {
      case 'application/pdf':
        loader = new PDFLoader(filePath, {
          splitPages: false,
        });
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'text/plain':
      case 'text/markdown':
        loader = new UnstructuredLoader(filePath, {
          strategy: 'fast',
        });
        break;

      default:
        throw new ValidationError(`Unsupported file type: ${mimeType}`);
    }

    const docs = await loader.load();
    const text = docs.map((doc: Document) => doc.pageContent).join('\n\n');

    console.log(`[Upload] Loaded document: ${text.length} characters`);

    return text;
  }

  /**
   * Process uploaded file and store in Qdrant
   */
  async processUpload(
    file: File,
    partnerId: string
  ): Promise<{
    success: boolean;
    fileId: string;
    filename: string;
    chunkCount: number;
    namespace: string;
  }> {
    const fileId = uuidv4();
    const filename = file.name;
    let tempFilePath: string | null = null;

    try {
      console.log(`[Upload] Processing file for partner: ${partnerId}`);

      // Step 1: Validate file
      this.validateFile(file);

      // Step 2: Save temporarily
      tempFilePath = await this.saveTempFile(file);

      // Step 3: Load and parse document
      const text = await this.loadDocument(tempFilePath, file.type);

      if (!text || text.trim().length === 0) {
        throw new ValidationError('Document is empty or could not be parsed');
      }

      // Step 4: Split into chunks
      const chunks = await this.textSplitter.createDocuments([text]);
      console.log(`[Upload] Created ${chunks.length} chunks`);

      // Step 5: Generate embeddings for all chunks
      console.log('[Upload] Generating embeddings...');
      const embeddings = await this.embeddings.embedDocuments(
        chunks.map((chunk: Document) => chunk.pageContent)
      );

      console.log(`[Upload] Generated ${embeddings.length} embeddings`);

      // Step 6: Prepare points for Qdrant
      const points = embeddings.map((embedding, index) => ({
        id: `${fileId}_chunk_${index}`,
        vector: embedding,
        payload: {
          text: chunks[index].pageContent,
          filename,
          partnerId,
          uploadedAt: new Date().toISOString(),
          chunkIndex: index,
          fileId,
        },
      }));

      // Step 7: Store in Qdrant (partner's isolated collection)
      await qdrantClient.upsertVectors(partnerId, points);

      // Step 8: Clean up temp file
      if (tempFilePath) {
        await this.deleteTempFile(tempFilePath);
      }

      const namespace = `partner_${partnerId}`;

      console.log(
        `[Upload] Successfully processed ${filename}: ${chunks.length} chunks stored in ${namespace}`
      );

      return {
        success: true,
        fileId,
        filename,
        chunkCount: chunks.length,
        namespace,
      };

    } catch (error) {
      // Clean up temp file on error
      if (tempFilePath) {
        await this.deleteTempFile(tempFilePath);
      }

      console.error(`[Upload] Error processing file: ${error}`);
      throw error;
    }
  }
}

// Singleton instance
export const fileUploadHandler = new FileUploadHandler();
