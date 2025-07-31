import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, createDocument } from '../utils/documents';
import { UploadProgress } from '../types/documents';
import { documentProcessor, ProcessingProgress } from '../utils/documentProcessor';

interface DocumentUploadProps {
  userId: string;
  onUploadComplete?: (documentId: string) => void;
  onClose?: () => void;
}

export function DocumentUpload({ userId, onUploadComplete, onClose }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'text/csv',
    'application/json',
    'text/html',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const isFileSupported = useCallback((file: File) => {
    return supportedTypes.includes(file.type) || 
           file.name.endsWith('.txt') || 
           file.name.endsWith('.md') ||
           file.name.endsWith('.json') ||
           file.name.endsWith('.csv');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (isFileSupported(file)) {
        setSelectedFile(file);
      } else {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: 'Unsupported file type',
          error: 'Please select a supported file type (TXT, MD, PDF, CSV, JSON, HTML, DOC, DOCX)'
        });
      }
    }
  }, [isFileSupported]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isFileSupported(file)) {
        setSelectedFile(file);
      } else {
        setUploadProgress({
          stage: 'error',
          progress: 0,
          message: 'Unsupported file type',
          error: 'Please select a supported file type (TXT, MD, PDF, CSV, JSON, HTML, DOC, DOCX)'
        });
      }
    }
  }, [isFileSupported]);

  const processFile = useCallback(async (file: File) => {
    try {
      setUploadProgress({
        stage: 'uploading',
        progress: 25,
        message: 'Uploading file...'
      });

      // Upload file to Supabase Storage
      const fileUrl = await uploadFile(file, userId);

      setUploadProgress({
        stage: 'processing',
        progress: 50,
        message: 'Processing document...'
      });

      // Read file content for text files
      let content = '';
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
        content = await file.text();
      } else {
        // For other file types, we'll store metadata and process later
        content = `Document: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes\nUploaded: ${new Date().toISOString()}`;
      }

      setUploadProgress({
        stage: 'storing',
        progress: 75,
        message: 'Saving to database...'
      });

      // Create document record
      const document = await createDocument(
        userId,
        file.name,
        content,
        file.type,
        file.size,
        fileUrl
      );

      setUploadProgress({
        stage: 'complete',
        progress: 100,
        message: 'File uploaded! Processing document...'
      });

      // Start document processing with LangChain
      try {
        await documentProcessor.processDocument(
          document.id,
          userId,
          fileUrl,
          file.name,
          file.type,
          (progress) => {
            setProcessingProgress(progress);
          }
        );
      } catch (processingError) {
        console.error('Document processing failed:', processingError);
        setProcessingProgress({
          stage: 'error',
          progress: 0,
          message: 'Document processing failed',
          error: processingError instanceof Error ? processingError.message : 'Unknown processing error'
        });
      }

      // Call completion callback
      onUploadComplete?.(document.id);

      // Reset after a short delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(null);
        setProcessingProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({
        stage: 'error',
        progress: 0,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }, [userId, onUploadComplete]);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, [selectedFile, processFile]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(null);
    setProcessingProgress(null);
    onClose?.();
  }, [onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Document</h3>
        <button
          onClick={handleCancel}
          className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!selectedFile && !uploadProgress && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop a file here, or click to select
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Supports: TXT, MD, PDF, CSV, JSON, HTML, DOC, DOCX
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.md,.pdf,.csv,.json,.html,.doc,.docx,text/*,application/pdf,application/json"
            className="hidden"
          />
        </div>
      )}

      {selectedFile && !uploadProgress && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <File className="w-8 h-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Upload
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {uploadProgress && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {uploadProgress.stage === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : uploadProgress.stage === 'error' ? (
              <AlertCircle className="w-6 h-6 text-red-500" />
            ) : (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {uploadProgress.message}
              </p>
              {uploadProgress.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {uploadProgress.error}
                </p>
              )}
            </div>
          </div>
          
          {uploadProgress.stage !== 'error' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  uploadProgress.stage === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
      {/* Document Processing Progress */}
      {processingProgress && (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {processingProgress.stage === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : processingProgress.stage === 'error' ? (
              <AlertCircle className="w-6 h-6 text-red-500" />
            ) : (
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {processingProgress.message}
              </p>
              {processingProgress.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {processingProgress.error}
                </p>
              )}
            </div>
          </div>
          
          {processingProgress.stage !== 'error' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  processingProgress.stage === 'complete' ? 'bg-green-500' : 'bg-purple-500'
                }`}
                style={{ width: `${processingProgress.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
  );
}