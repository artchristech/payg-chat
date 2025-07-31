import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/supabase';
import { supabase } from './supabaseClient';
import { createDocumentChunks, updateDocumentChunkCount } from './documents';
import { DocumentChunk } from '../types/documents';

// Document loaders
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { JSONLoader } from 'langchain/document_loaders/fs/json';

export interface ProcessingProgress {
  stage: 'loading' | 'splitting' | 'embedding' | 'storing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export class DocumentProcessor {
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: 'text-embedding-3-small', // More cost-effective than text-embedding-ada-002
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  async processDocument(
    documentId: string,
    userId: string,
    fileUrl: string,
    fileName: string,
    fileType: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    try {
      onProgress?.({
        stage: 'loading',
        progress: 10,
        message: 'Loading document...'
      });

      // Load document based on file type
      const documents = await this.loadDocument(fileUrl, fileName, fileType);

      onProgress?.({
        stage: 'splitting',
        progress: 30,
        message: 'Splitting document into chunks...'
      });

      // Split documents into chunks
      const chunks = await this.textSplitter.splitDocuments(documents);

      onProgress?.({
        stage: 'embedding',
        progress: 50,
        message: 'Generating embeddings...'
      });

      // Generate embeddings for each chunk
      const documentChunks: Omit<DocumentChunk, 'id' | 'createdAt'>[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding for this chunk
        const embedding = await this.embeddings.embedQuery(chunk.pageContent);
        
        // Create document chunk
        documentChunks.push({
          documentId,
          userId,
          content: chunk.pageContent,
          chunkIndex: i,
          embedding,
          metadata: {
            ...chunk.metadata,
            fileName,
            fileType,
            chunkLength: chunk.pageContent.length,
          },
        });

        // Update progress
        const embeddingProgress = 50 + (i / chunks.length) * 30;
        onProgress?.({
          stage: 'embedding',
          progress: embeddingProgress,
          message: `Generating embeddings... (${i + 1}/${chunks.length})`
        });
      }

      onProgress?.({
        stage: 'storing',
        progress: 85,
        message: 'Storing chunks in database...'
      });

      // Store chunks in database
      await createDocumentChunks(documentChunks);

      // Update document chunk count
      await updateDocumentChunkCount(documentId, chunks.length);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Document processing complete!'
      });

    } catch (error) {
      console.error('Error processing document:', error);
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Processing failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }

  private async loadDocument(fileUrl: string, fileName: string, fileType: string): Promise<Document[]> {
    try {
      // For web-based processing, we'll fetch the file content and process it
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const content = await response.text();

      // Create a Document object based on file type
      let documents: Document[] = [];

      switch (fileType) {
        case 'text/plain':
        case 'text/markdown':
          documents = [new Document({
            pageContent: content,
            metadata: { source: fileName, type: fileType }
          })];
          break;

        case 'application/json':
          try {
            const jsonData = JSON.parse(content);
            const jsonContent = typeof jsonData === 'object' 
              ? JSON.stringify(jsonData, null, 2) 
              : content;
            documents = [new Document({
              pageContent: jsonContent,
              metadata: { source: fileName, type: fileType }
            })];
          } catch {
            // If JSON parsing fails, treat as plain text
            documents = [new Document({
              pageContent: content,
              metadata: { source: fileName, type: fileType }
            })];
          }
          break;

        case 'text/csv':
          // For CSV, we'll treat each row as context
          const lines = content.split('\n').filter(line => line.trim());
          const csvContent = lines.join('\n');
          documents = [new Document({
            pageContent: csvContent,
            metadata: { source: fileName, type: fileType, rows: lines.length }
          })];
          break;

        case 'text/html':
          // Strip HTML tags for plain text content
          const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          documents = [new Document({
            pageContent: textContent,
            metadata: { source: fileName, type: fileType }
          })];
          break;

        default:
          // For unsupported types, treat as plain text
          documents = [new Document({
            pageContent: content,
            metadata: { source: fileName, type: fileType }
          })];
      }

      return documents;
    } catch (error) {
      console.error('Error loading document:', error);
      throw new Error(`Failed to load document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchDocuments(
    query: string,
    userId: string,
    limit: number = 5,
    threshold: number = 0.8
  ): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Search using the database function
      const { data, error } = await supabase.rpc('search_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_user_id: userId,
      });

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return data.map((result: any) => ({
        content: result.content,
        similarity: result.similarity,
        metadata: {
          documentId: result.document_id,
          documentTitle: result.document_title,
          documentFileType: result.document_file_type,
          chunkIndex: result.chunk_index,
          ...result.metadata,
        },
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessor();