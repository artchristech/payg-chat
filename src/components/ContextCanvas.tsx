import React, { useCallback, useRef, useState } from 'react';
import { Plus, FileText, Type, X, Trash2 } from 'lucide-react';
import { ContextBlock } from '../types/chat';

interface ContextCanvasProps {
  contextBlocks: Record<string, ContextBlock>;
  onAddContextBlock: (block: Omit<ContextBlock, 'id' | 'createdAt'>) => void;
  onRemoveContextBlock: (blockId: string) => void;
}

export function ContextCanvas({ contextBlocks, onAddContextBlock, onRemoveContextBlock }: ContextCanvasProps) {
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTextTitle, setNewTextTitle] = useState('');
  const [newTextContent, setNewTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTextBlock = useCallback(() => {
    if (newTextTitle.trim() && newTextContent.trim()) {
      onAddContextBlock({
        type: 'text',
        title: newTextTitle.trim(),
        content: newTextContent.trim(),
      });
      setNewTextTitle('');
      setNewTextContent('');
      setIsAddingText(false);
    }
  }, [newTextTitle, newTextContent, onAddContextBlock]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onAddContextBlock({
          type: 'file',
          title: file.name,
          content: content,
        });
      };
      reader.readAsText(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onAddContextBlock]);

  const handleDragStart = useCallback((e: React.DragEvent, contextBlock: ContextBlock) => {
    e.dataTransfer.setData('application/context-block', JSON.stringify({
      id: contextBlock.id,
      title: contextBlock.title,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Context Canvas</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag context blocks to message nodes to provide additional context for AI responses.
        </p>
      </div>

      {/* Add Context Buttons */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingText(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
          >
            <Type className="w-4 h-4" />
            Add Text
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Add File
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Add Text Form */}
      {isAddingText && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Context title..."
              value={newTextTitle}
              onChange={(e) => setNewTextTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            <textarea
              placeholder="Context content..."
              value={newTextContent}
              onChange={(e) => setNewTextContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTextBlock}
                disabled={!newTextTitle.trim() || !newTextContent.trim()}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingText(false);
                  setNewTextTitle('');
                  setNewTextContent('');
                }}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Blocks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.values(contextBlocks).length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No context blocks yet</p>
            <p className="text-xs mt-1">Add text or files to get started</p>
          </div>
        ) : (
          Object.values(contextBlocks).map((block) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              className="group relative p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {block.type === 'file' ? (
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {block.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {block.content.length > 100 
                      ? `${block.content.substring(0, 100)}...` 
                      : block.content
                    }
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {block.type === 'file' ? 'File' : 'Text'} • {new Date(block.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveContextBlock(block.id)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                  title="Remove context block"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}