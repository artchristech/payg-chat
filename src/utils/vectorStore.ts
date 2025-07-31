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

// Text splitter configuration
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
});

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
 * Process a document: split into chunks, generate embeddings, and store in Supabase
 */
export async function processDocument(
  documentId: string,
  userId: string,
  title: string,
  content: string,
  fileType: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<void> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    onProgress?.('processing', 10);

    // Split document into chunks
    const docs = await textSplitter.createDocuments([content], [
      {
        documentId,
        userId,
        title,
        fileType,
      },
    ]);

    onProgress?.('processing', 30);

    if (docs.length === 0) {
      throw new Error('No content to process');
    }

    // Prepare chunks for database storage
    const chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[] = [];
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      chunks.push({
        documentId,
        userId,
        content: doc.pageContent,
        chunkIndex: i,
        metadata: {
          ...doc.metadata,
          chunkSize: doc.pageContent.length,
        },
      });
    }

    onProgress?.('embedding', 50);

    // Store chunks in database
    const savedChunks = await createDocumentChunks(chunks);
    
    onProgress?.('storing', 70);

    // Add chunks to vector store with embeddings
    await addDocumentsToVectorStore(savedChunks);
    
    // Update document chunk count
    await updateDocumentChunkCount(documentId, chunks.length);

    onProgress?.('complete', 100);

  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
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

// Legacy function for backward compatibility
export async function searchDocuments(
  userId: string,
  query: string,
  k: number = 5,
  scoreThreshold: number = 0.7
): Promise<Array<{
  content: string;
  score: number;
  metadata: Record<string, any>;
}>> {
  const results = await searchVectorStore(query, userId, k, scoreThreshold);
  return results.map(chunk => ({
    content: chunk.content,
    score: chunk.metadata.similarity || 0,
    metadata: chunk.metadata,
  }));
}