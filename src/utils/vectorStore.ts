import { OpenAIEmbeddings } from '@langchain/openai';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document as LangChainDocument } from 'langchain/document';
import { createDocumentChunks, updateDocumentChunkCount } from './documents';
import { DocumentChunk } from '../types/documents';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Vector operations will not work.');
}

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_API_KEY,
  modelName: 'text-embedding-3-small', // More cost-effective than text-embedding-ada-002
});

// Text splitter configuration
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
});

// In-memory FAISS stores per user (in production, you'd want persistent storage)
const userVectorStores = new Map<string, FaissStore>();

/**
 * Get or create a FAISS vector store for a user
 */
async function getUserVectorStore(userId: string): Promise<FaissStore> {
  if (userVectorStores.has(userId)) {
    return userVectorStores.get(userId)!;
  }

  // Create new empty vector store
  const vectorStore = await FaissStore.fromTexts(
    [''], // Empty initial document
    [{ userId }], // Metadata
    embeddings
  );

  userVectorStores.set(userId, vectorStore);
  return vectorStore;
}

/**
 * Process a document: split into chunks, generate embeddings, and store
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

    // Get user's vector store
    const vectorStore = await getUserVectorStore(userId);

    onProgress?.('embedding', 50);

    // Add documents to vector store
    await vectorStore.addDocuments(docs);

    onProgress?.('storing', 70);

    // Prepare chunks for database storage
    const chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[] = [];
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      
      // Generate embedding for this chunk
      const embedding = await embeddings.embedQuery(doc.pageContent);
      
      chunks.push({
        documentId,
        userId,
        content: doc.pageContent,
        chunkIndex: i,
        embedding,
        metadata: {
          ...doc.metadata,
          chunkSize: doc.pageContent.length,
        },
      });
    }

    // Store chunks in database
    await createDocumentChunks(chunks);
    
    // Update document chunk count
    await updateDocumentChunkCount(documentId, chunks.length);

    onProgress?.('complete', 100);

  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

/**
 * Search for similar documents using vector similarity
 */
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
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const vectorStore = await getUserVectorStore(userId);
    
    // Perform similarity search
    const results = await vectorStore.similaritySearchWithScore(query, k);
    
    // Filter by score threshold and format results
    return results
      .filter(([, score]) => score >= scoreThreshold)
      .map(([doc, score]) => ({
        content: doc.pageContent,
        score,
        metadata: doc.metadata,
      }));

  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

/**
 * Get document chunks for a specific document
 */
export async function getDocumentChunksFromVectorStore(
  userId: string,
  documentId: string
): Promise<Array<{
  content: string;
  metadata: Record<string, any>;
}>> {
  try {
    const vectorStore = await getUserVectorStore(userId);
    
    // This is a workaround since FAISS doesn't have direct metadata filtering
    // In production, you might want to use a different approach
    const allDocs = await vectorStore.similaritySearch('', 1000); // Get many docs
    
    return allDocs
      .filter(doc => doc.metadata.documentId === documentId)
      .map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      }));

  } catch (error) {
    console.error('Error getting document chunks:', error);
    throw error;
  }
}

/**
 * Remove a document from the vector store
 * Note: FAISS doesn't support direct deletion, so this is a limitation
 * In production, you might want to rebuild the index or use a different vector store
 */
export async function removeDocumentFromVectorStore(
  userId: string,
  documentId: string
): Promise<void> {
  console.warn('FAISS does not support direct document deletion. Consider rebuilding the index.');
  // For now, we'll just remove it from the database
  // The vector store will still contain the embeddings until rebuilt
}

/**
 * Save vector store to disk (for persistence)
 */
export async function saveVectorStore(userId: string, path: string): Promise<void> {
  try {
    const vectorStore = userVectorStores.get(userId);
    if (vectorStore) {
      await vectorStore.save(path);
    }
  } catch (error) {
    console.error('Error saving vector store:', error);
    throw error;
  }
}

/**
 * Load vector store from disk
 */
export async function loadVectorStore(userId: string, path: string): Promise<void> {
  try {
    const vectorStore = await FaissStore.load(path, embeddings);
    userVectorStores.set(userId, vectorStore);
  } catch (error) {
    console.error('Error loading vector store:', error);
    throw error;
  }
}