import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Grid3X3 } from 'lucide-react';
import { openRouterModels } from '../utils/api';
import { ModelSelectionModal } from './ModelSelectionModal';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSelectionComplete?: () => void;
  compact?: boolean;
  conversationCost: number;
}

export function ModelSelector({ selectedModel, onModelChange, onSelectionComplete, compact = false, conversationCost }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize featured models and selected model info
  const { featuredModels, selectedModelInfo } = useMemo(() => {
    const featuredModelIds = ['x-ai/grok-4', 'moonshotai/kimi-k2', 'google/gemini-2.5-pro'];
    const featured = openRouterModels.filter(model => featuredModelIds.includes(model.id));
    const selected = openRouterModels.find(model => model.id === selectedModel);
    
    return {
      featuredModels: featured,
      selectedModelInfo: selected,
    };
  }, [selectedModel]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsOpen(false);
  };
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-all duration-200 text-gray-100 ${
          compact 
            ? 'px-3 py-2 rounded-full text-sm scale-[0.85] bg-gradient-to-br from-gray-300 dark:from-gray-700 to-gray-400 dark:to-gray-800 border border-gray-400/30 dark:border-gray-500/30 shadow-md hover:from-gray-400 dark:hover:from-gray-600 hover:to-gray-500 dark:hover:to-gray-700 hover:border-gray-500/40 dark:hover:border-gray-400/40 gap-1.5 text-gray-800 dark:text-gray-100' 
            : 'px-4 py-4 rounded-3xl min-h-[56px]'
        }`}
      >
        <span className="text-sm font-medium">
          {selectedModelInfo?.name.split(' ')[0] || 'Model'}
        </span>
        <ChevronDown className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-gray-300`} />
      </button>

      {isOpen && (
        <div className={`absolute ${compact ? 'bottom-full right-0' : 'bottom-full left-0'} mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600/50 rounded-xl shadow-2xl backdrop-blur-sm z-50`}>
          {/* Header with Explore Button */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Featured Models
              </span>
              <span className="text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                ${conversationCost.toFixed(4)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-6 h-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              title="Explore all models"
            >
              <Grid3X3 className="w-3 h-3" />
            </button>
          </div>
          
          {/* Model List */}
          <div className="p-2 max-h-80 overflow-y-auto hide-scrollbar">
            {featuredModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                  onSelectionComplete?.();
                }}
                className={`
                  w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-all duration-200
                  ${selectedModel === model.id ? 'bg-gradient-to-r from-blue-100 dark:from-blue-800/80 to-blue-200 dark:to-blue-700/80 border-l-2 border-blue-500 dark:border-blue-400' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{model.name}</span>
                      <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {model.provider}
                      </span>
                      {model.multiModal && (
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded">
                          Multimodal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{model.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Context: {model.contextLength.toLocaleString()} tokens
                    </p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen Modal */}
      <ModelSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onModelSelect={onModelChange}
        currentSelectedModel={selectedModel}
      />
    </div>
  );
}