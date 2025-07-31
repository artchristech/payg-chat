import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { supabase } from './supabaseClient';
import { updateDocumentChunkCount } from './documents';
import { DocumentChunk } from '../types/documents';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Vector operations will not work.');
}

import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

let embeddings: HuggingFaceInferenceEmbeddings | null = null;

function getEmbeddingsInstance(): HuggingFaceInferenceEmbeddings {
  if (!embeddings) {
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not configured. Please add VITE_HUGGINGFACE_API_KEY to your .env file.');
    }
    embeddings = new HuggingFaceInferenceEmbeddings({ apiKey: HUGGINGFACE_API_KEY });
  }
  return embeddings;
}

/**
 * Add document chunks to the vector store
 */
export async function addDocumentsToVectorStore(chunks: DocumentChunk[]): Promise<void> {
  if (!OPENAI_API_KEY) {
    // This check is now for the old OpenAI key, should be removed or updated if needed elsewhere
    // For embeddings, we now rely on HUGGINGFACE_API_KEY
  }

  // Generate embeddings for each chunk
  const embeddingInstance = getEmbeddingsInstance();
  const embeddingsArray = await embeddingInstance.embedDocuments(chunks.map(chunk => chunk.content));

  const chunksWithEmbeddings = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddingsArray[index],
  }));

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
  query: string | number[], // Allow passing pre-computed embedding
  userId: string,
  k: number = 5,
  matchThreshold: number = 0.8
): Promise<DocumentChunk[]> {
  let queryEmbedding: number[];

  try {
    // Generate embedding for the query
    if (typeof query === 'string') {
      const embeddingInstance = getEmbeddingsInstance();
      queryEmbedding = await embeddingInstance.embedQuery(query);
    } else {
      queryEmbedding = query; // Use pre-computed embedding
    }
    
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
