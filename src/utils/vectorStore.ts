import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { supabase } from './supabaseClient';
import { createDocumentChunks, updateDocumentChunkCount } from './documents';
import { DocumentChunk } from '../types/documents';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Vector operations will not work.');
}

// Generate embeddings using OpenAI API
async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Add document chunks to the vector store
 */
export async function addDocumentsToVectorStore(chunks: DocumentChunk[]): Promise<void> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Generate embeddings for each chunk
  const chunksWithEmbeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.content);
      return {
        ...chunk,
        embedding,
      };
    })
  );

  // Upsert chunks with embeddings to Supabase
  const { error } = await supabase
    .from('document_chunks')
    .upsert(
      chunksWithEmbeddings.map(chunk => ({
        id: chunk.id,
        document_id: chunk.documentId,
        user_id: chunk.userId,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      }))
    );

  if (error) {
    throw new Error(`Failed to store document chunks: ${error.message}`);
  }
}

/**
 * Search documents using vector similarity
 */
export async function searchVectorStore(
  query: string,
  userId: string,
  k: number = 5,
  matchThreshold: number = 0.8
): Promise<DocumentChunk[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform similarity search using Supabase RPC
    const { data, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: k,
      filter_user_id: userId,
    });

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    
    // Convert results to DocumentChunk format
    return data.map((result: any) => ({
      id: result.id,
      documentId: result.document_id,
      userId: userId,
      content: result.content,
      chunkIndex: result.chunk_index,
      metadata: {
        ...result.metadata,
        similarity: result.similarity,
        documentTitle: result.document_title,
        documentFileType: result.document_file_type,
      },
      createdAt: new Date(),
    }));

  } catch (error) {
    console.error('Error searching vector store:', error);
    throw error;
  }
}
