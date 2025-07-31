import { supabase } from './supabaseClient';
import { Document, DocumentChunk, DocumentSearchResult, DocumentStats } from '../types/documents';

// Database document interface (matches Supabase schema)
interface DatabaseDocument {
  id: string;
  user_id: string;
  title: string;
  content: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

// Database document chunk interface
interface DatabaseDocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  chunk_index: number;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at: string;
}

// Convert database document to app document format
function dbDocumentToDocument(dbDoc: DatabaseDocument): Document {
  return {
    id: dbDoc.id,
    userId: dbDoc.user_id,
    title: dbDoc.title,
    content: dbDoc.content,
    fileType: dbDoc.file_type,
    fileSize: dbDoc.file_size,
    fileUrl: dbDoc.file_url,
    chunkCount: dbDoc.chunk_count,
    createdAt: new Date(dbDoc.created_at),
    updatedAt: new Date(dbDoc.updated_at),
  };
}

// Convert database chunk to app chunk format
function dbChunkToChunk(dbChunk: DatabaseDocumentChunk): DocumentChunk {
  return {
    id: dbChunk.id,
    documentId: dbChunk.document_id,
    userId: dbChunk.user_id,
    content: dbChunk.content,
    chunkIndex: dbChunk.chunk_index,
    embedding: dbChunk.embedding,
    metadata: dbChunk.metadata,
    createdAt: new Date(dbChunk.created_at),
  };
}

// Create a new document record
export async function createDocument(
  userId: string,
  title: string,
  content: string,
  fileType: string,
  fileSize: number,
  fileUrl?: string
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title,
      content,
      file_type: fileType,
      file_size: fileSize,
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return dbDocumentToDocument(data);
}

// Get all documents for a user
export async function getUserDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data.map(dbDocumentToDocument);
}

// Get a specific document
export async function getDocument(documentId: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Document not found
    }
    console.error('Error fetching document:', error);
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return dbDocumentToDocument(data);
}

// Update document chunk count
export async function updateDocumentChunkCount(documentId: string, chunkCount: number): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ chunk_count: chunkCount })
    .eq('id', documentId);

  if (error) {
    console.error('Error updating document chunk count:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }
}

// Create document chunks
export async function createDocumentChunks(chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[]): Promise<DocumentChunk[]> {
  const chunksToInsert = chunks.map(chunk => ({
    document_id: chunk.documentId,
    user_id: chunk.userId,
    content: chunk.content,
    chunk_index: chunk.chunkIndex,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
  }));

  const { data, error } = await supabase
    .from('document_chunks')
    .insert(chunksToInsert)
    .select();

  if (error) {
    console.error('Error creating document chunks:', error);
    throw new Error(`Failed to create document chunks: ${error.message}`);
  }

  return data.map(dbChunkToChunk);
}

// Get chunks for a document
export async function getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error('Error fetching document chunks:', error);
    throw new Error(`Failed to fetch document chunks: ${error.message}`);
  }

  return data.map(dbChunkToChunk);
}

// Search documents using vector similarity
export async function searchDocuments(
  queryEmbedding: number[],
  userId: string,
  matchThreshold: number = 0.8,
  matchCount: number = 10
): Promise<DocumentSearchResult[]> {
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_user_id: userId,
  });

  if (error) {
    console.error('Error searching documents:', error);
    throw new Error(`Failed to search documents: ${error.message}`);
  }

  return data.map((result: any) => ({
    id: result.id,
    documentId: result.document_id,
    content: result.content,
    chunkIndex: result.chunk_index,
    similarity: result.similarity,
    documentTitle: result.document_title,
    documentFileType: result.document_file_type,
    metadata: result.metadata,
  }));
}

// Get user document statistics
export async function getUserDocumentStats(userId: string): Promise<DocumentStats> {
  const { data, error } = await supabase.rpc('get_user_document_stats', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching document stats:', error);
    throw new Error(`Failed to fetch document stats: ${error.message}`);
  }

  const result = data[0];
  return {
    totalDocuments: parseInt(result.total_documents) || 0,
    totalChunks: parseInt(result.total_chunks) || 0,
    totalFileSize: parseInt(result.total_file_size) || 0,
    fileTypes: result.file_types || [],
  };
}

// Delete a document and all its chunks
export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Upload file to Supabase Storage
export async function uploadFile(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}