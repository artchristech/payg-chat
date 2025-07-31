export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface DocumentSearchResult {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
  documentTitle: string;
  documentFileType: string;
  metadata: Record<string, any>;
}

export interface DocumentStats {
  totalDocuments: number;
  totalChunks: number;
  totalFileSize: number;
  fileTypes: string[];
}

export interface UploadProgress {
  stage: 'uploading' | 'processing' | 'embedding' | 'storing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}