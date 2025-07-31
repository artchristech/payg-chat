import React, { useState, useCallback } from 'react';
import { Search, FileText, Sparkles, Loader2 } from 'lucide-react';
import { documentProcessor } from '../utils/documentProcessor';

interface DocumentSearchProps {
  userId: string;
  onResultSelect?: (content: string, metadata: any) => void;
}

interface SearchResult {
  content: string;
  similarity: number;
  metadata: any;
}

export function DocumentSearch({ userId, onResultSelect }: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await documentProcessor.searchDocuments(
        query,
        userId,
        10, // limit
        0.7  // similarity threshold
      );

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [query, userId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Document Search
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Search through your uploaded documents using semantic similarity
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Ask a question or search for content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Results ({results.length})
          </h3>
          {results.map((result, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => onResultSelect?.(result.content, result.metadata)}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {result.metadata.documentTitle || result.metadata.fileName || 'Unknown Document'}
                    </h4>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                      {formatSimilarity(result.similarity)} match
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    {truncateContent(result.content)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Type: {result.metadata.documentFileType || 'Unknown'}</span>
                    <span>Chunk: {result.metadata.chunkIndex + 1}</span>
                    {result.metadata.chunkLength && (
                      <span>Length: {result.metadata.chunkLength} chars</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query && !isSearching && results.length === 0 && !error && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No results found for "{query}"
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Try different keywords or upload more documents
          </p>
        </div>
      )}
    </div>
  );
}