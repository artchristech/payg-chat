/*
  # Set up pgvector for document embeddings

  1. Extensions
    - Enable pgvector extension for vector operations
    - Enable uuid-ossp for UUID generation

  2. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, document title/filename)
      - `content` (text, full document content)
      - `file_type` (text, MIME type)
      - `file_size` (integer, file size in bytes)
      - `file_url` (text, URL to stored file in Supabase Storage)
      - `chunk_count` (integer, number of chunks created)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `document_chunks`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key to documents)
      - `user_id` (uuid, foreign key to users)
      - `content` (text, chunk content)
      - `chunk_index` (integer, order of chunk in document)
      - `embedding` (vector, 1536 dimensions for OpenAI embeddings)
      - `metadata` (jsonb, additional metadata)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own documents
    - Add policies for vector similarity search

  4. Indexes
    - Vector similarity search index on embeddings
    - Performance indexes on foreign keys and search fields

  5. Functions
    - Vector similarity search function
    - Document search with metadata filtering
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  file_url text,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  chunk_index integer NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents table
CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for document_chunks table
CREATE POLICY "Users can view their own document chunks"
  ON document_chunks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document chunks"
  ON document_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document chunks"
  ON document_chunks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document chunks"
  ON document_chunks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(document_id, chunk_index);

-- Create vector similarity search index (HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
  ON document_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create updated_at trigger for documents
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Function for vector similarity search
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
  chunk_index integer,
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
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get document statistics
CREATE OR REPLACE FUNCTION get_user_document_stats(user_uuid uuid)
RETURNS TABLE (
  total_documents bigint,
  total_chunks bigint,
  total_file_size bigint,
  file_types jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT d.id) AS total_documents,
    COUNT(dc.id) AS total_chunks,
    COALESCE(SUM(d.file_size), 0) AS total_file_size,
    jsonb_agg(DISTINCT d.file_type) AS file_types
  FROM documents d
  LEFT JOIN document_chunks dc ON d.id = dc.document_id
  WHERE d.user_id = user_uuid;
END;
$$;