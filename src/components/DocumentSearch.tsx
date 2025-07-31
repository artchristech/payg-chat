import React, { useState } from 'react';
import { Search, Loader2, FileText, Zap } from 'lucide-react';
import { searchDocuments } from '../utils/vectorStore';

interface DocumentSearchProps {
  userId: string;
}

interface SearchResult {
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export function DocumentSearch({ userId }: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await searchDocuments(userId, query, 10, 0.5);
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Semantic Search
        </h2>
      </div>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documents semantically..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Found {results.length} relevant chunks
          </h3>
          
          {results.map((result, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {result.metadata.title || 'Unknown Document'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(result.score * 100)}% match
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {highlightText(result.content, query)}
              </p>
              
              {result.metadata.fileType && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {result.metadata.fileType}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && !error && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No relevant documents found for "{query}"
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Try different keywords or upload more documents
          </p>
        </div>
      )}
    </div>
  );
}