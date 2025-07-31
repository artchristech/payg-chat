import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Download, Search, Plus, Calendar, HardDrive } from 'lucide-react';
import { getUserDocuments, deleteDocument, getUserDocumentStats } from '../utils/documents';
import { Document, DocumentStats } from '../types/documents';
import { DocumentUpload } from './DocumentUpload';

interface DocumentManagerProps {
  userId: string;
}

export function DocumentManager({ userId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const [docsData, statsData] = await Promise.all([
        getUserDocuments(userId),
        getUserDocumentStats(userId)
      ]);
      setDocuments(docsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadDocuments();
    }
  }, [userId]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      await loadDocuments(); // Reload the list
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleUploadComplete = async () => {
    setShowUpload(false);
    await loadDocuments(); // Reload the list
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (showUpload) {
    return (
      <DocumentUpload
        userId={userId}
        onUploadComplete={handleUploadComplete}
        onClose={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Library</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your uploaded documents and files
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalDocuments}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatFileSize(stats.totalFileSize)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chunks</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalChunks}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">File Types</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.fileTypes.length}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {document.title}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{document.fileType}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(document.createdAt)}
                  </span>
                  {document.chunkCount > 0 && (
                    <span>{document.chunkCount} chunks</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {document.fileUrl && (
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(document.id)}
                  className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}