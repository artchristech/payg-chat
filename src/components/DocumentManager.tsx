import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Search, Filter, Calendar, HardDrive, AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
import { Document, UploadProgress } from '../types/documents';
import { getUserDocuments, createDocument, deleteDocument, uploadFile, getUserDocumentStats } from '../utils/documents';
import { addDocumentsToVectorStore } from '../utils/vectorStore';
import { createDocumentChunks } from '../utils/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

interface DocumentManagerProps {
  userId: string;
}

export function DocumentManager({ userId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalDocuments: number; totalFileSize: number; fileTypes: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents and stats on mount
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [userId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const userDocs = await getUserDocuments(userId);
      setDocuments(userDocs);
      setError(null);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userStats = await getUserDocumentStats(userId);
      setStats(userStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      setUploadProgress({
        stage: 'uploading',
        progress: 0,
        message: 'Uploading file...',
      });

      // Upload file to Supabase Storage
      const fileUrl = await uploadFile(file, userId);

      setUploadProgress({
        stage: 'storing',
        progress: 80,
        message: 'Saving document metadata...',
      });

      // Read file content for text files
      let content = '';
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        content = await file.text();
      }

      // Create document record
      const newDocument = await createDocument(
        userId,
        file.name,
        content,
        file.type || 'application/octet-stream',
        file.size,
        fileUrl
      );

      // Process document with LangChain if it has content
      if (content.trim()) {
        setUploadProgress({
          stage: 'processing',
          progress: 60,
          message: 'Processing document with AI...',
        });

        try {
          // Split document into chunks
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
          });

          const docs = await textSplitter.createDocuments([content]);
          
          setUploadProgress({
            stage: 'embedding',
            progress: 70,
            message: 'Generating embeddings...',
          });

          // Create chunks for database
          const chunks = docs.map((doc, index) => ({
            documentId: newDocument.id,
            userId,
            content: doc.pageContent,
            chunkIndex: index,
            metadata: {
              title: file.name,
              fileType: file.type || 'application/octet-stream',
              chunkSize: doc.pageContent.length,
            },
          }));

          // Save chunks to database
          const savedChunks = await createDocumentChunks(chunks);
          
          setUploadProgress({
            stage: 'storing',
            progress: 90,
            message: 'Storing in vector database...',
          });

          // Add to vector store
          await addDocumentsToVectorStore(savedChunks);
          
          // Update document chunk count
          await updateDocumentChunkCount(newDocument.id, chunks.length);
        } catch (embeddingError) {
          console.error('Error processing document embeddings:', embeddingError);
          // Don't fail the entire upload if embedding fails
          setUploadProgress({
            stage: 'complete',
            progress: 100,
            message: 'Document uploaded (AI processing failed)',
          });
        }
      } else {
        setUploadProgress({
          stage: 'complete',
          progress: 100,
          message: 'Document uploaded successfully!',
        });
      }

      // Add to documents list
      setDocuments(prev => [newDocument, ...prev]);
      
      // Reload stats
      loadStats();

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadProgress({
        stage: 'error',
        progress: 0,
        message: 'Upload failed',
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      });

      // Clear error after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      loadStats();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const handleDownload = (document: Document) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  // Filter documents based on search and file type
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFileType = selectedFileType === 'all' || doc.fileType.includes(selectedFileType);
    return matchesSearch && matchesFileType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('text/') || fileType.includes('markdown')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const uniqueFileTypes = Array.from(new Set(documents.map(doc => doc.fileType.split('/')[0]))).filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload and manage your documents for AI-powered search and retrieval
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploadProgress}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.totalDocuments}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatFileSize(stats.totalFileSize)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">File Types</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.fileTypes.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <div className={`p-4 rounded-lg border ${
            uploadProgress.stage === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : uploadProgress.stage === 'complete'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              {uploadProgress.stage === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : uploadProgress.stage === 'complete' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  uploadProgress.stage === 'error' 
                    ? 'text-red-800 dark:text-red-200' 
                    : uploadProgress.stage === 'complete'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {uploadProgress.message}
                </p>
                {uploadProgress.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{uploadProgress.error}</p>
                )}
                {uploadProgress.stage !== 'error' && uploadProgress.stage !== 'complete' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {uniqueFileTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {documents.length === 0 
                ? 'Upload your first document to get started with AI-powered search and retrieval'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Upload Your First Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(document.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {document.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(document.fileSize)} • {document.fileType}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                    {document.chunkCount > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          {document.chunkCount} chunks
                        </span>
                      </div>
                    )}
                    {document.content && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {document.content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {document.fileUrl && (
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(document.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".txt,.md,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml,.pdf,.doc,.docx"
        className="hidden"
      />
    </div>
  );
}