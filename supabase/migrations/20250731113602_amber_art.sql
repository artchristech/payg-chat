/*
  # Enable pgvector extension and update document_chunks table

  1. Extensions
    - Enable the vector extension for similarity search

  2. Schema Changes
    - Add vector column to document_chunks table
    - Create IVFFlat index for efficient similarity searches
    - Add RPC function for similarity search

  3. Functions
    - search_documents: Performs vector similarity search
    - get_user_document_stats: Returns user document statistics
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to document_chunks table (1536 dimensions for OpenAI embeddings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_chunks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE document_chunks ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- Create IVFFlat index for efficient similarity searches
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Function to search documents using vector similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float,
  document_title text,
  document_file_type text,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.file_type AS document_file_type,
    dc.metadata
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 
    (filter_user_id IS NULL OR dc.user_id = filter_user_id)
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get user document statistics
CREATE OR REPLACE FUNCTION get_user_document_stats(user_uuid uuid)
RETURNS TABLE (
  total_documents bigint,
  total_chunks bigint,
  total_file_size bigint,
  file_types text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT d.id) AS total_documents,
    COUNT(dc.id) AS total_chunks,
    COALESCE(SUM(d.file_size), 0) AS total_file_size,
    ARRAY_AGG(DISTINCT d.file_type) FILTER (WHERE d.file_type IS NOT NULL) AS file_types
  FROM documents d
  LEFT JOIN document_chunks dc ON d.id = dc.document_id
  WHERE d.user_id = user_uuid;
END;
$$;