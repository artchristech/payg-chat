import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Plus, List, Star } from 'lucide-react';
import { openRouterModels } from '../utils/api';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSelectionComplete?: () => void;
  compact?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, onSelectionComplete, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'featured' | 'all'>('featured');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize expensive computations
  const { featuredModels, selectedModelInfo, modelsToDisplay } = useMemo(() => {
    const featuredModelIds = ['x-ai/grok-4', 'meta-llama/llama-4-maverick', 'google/gemini-2.5-pro'];
    const featured = openRouterModels.filter(model => featuredModelIds.includes(model.id));
    const selected = openRouterModels.find(model => model.id === selectedModel);
    const toDisplay = displayMode === 'featured' ? featured : openRouterModels;
    
    return {
      featuredModels: featured,
      selectedModelInfo: selected,
      modelsToDisplay: toDisplay
    };
  }, [selectedModel, displayMode]);

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
        className={`flex items-center gap-2 transition-all duration-200 ${
          compact 
            ? 'px-3 py-2 rounded-full text-sm scale-[0.85] bg-gradient-to-br from-button-secondary to-button-secondary-hover border border-border shadow-md hover:from-button-secondary-hover hover:to-surface-active hover:border-border-hover gap-1.5 text-button-secondary-text' 
            : 'px-4 py-4 rounded-3xl min-h-[56px] bg-surface hover:bg-surface-hover text-text'
        }`}
      >
        <span className="text-sm font-medium">
          {selectedModelInfo?.name.split(' ')[0] || 'Model'}
        </span>
        <ChevronDown className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-text-muted`} />
      </button>

      {isOpen && (
        <div className={`absolute ${compact ? 'bottom-full right-0' : 'bottom-full left-0'} mb-2 w-80 bg-surface border border-border rounded-xl shadow-2xl backdrop-blur-sm z-50`}>
          {/* Header with Add Button */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-medium text-text-secondary">
              {displayMode === 'featured' ? 'Featured Models' : 'All Models'}
            </span>
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'featured' ? 'all' : 'featured')}
              className="w-6 h-6 bg-button-secondary hover:bg-button-secondary-hover text-button-secondary-text hover:text-text rounded-full flex items-center justify-center transition-all duration-200"
              title={displayMode === 'featured' ? 'Show all models' : 'Show featured models'}
            >
              {displayMode === 'featured' ? (
                <List className="w-3 h-3" />
              ) : (
                <Star className="w-3 h-3" />
              )}
            </button>
          </div>
          
          {/* Model List */}
          <div className="p-2 max-h-80 overflow-y-auto hide-scrollbar">
            {modelsToDisplay.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                  onSelectionComplete?.();
                }}
                className={`
                  w-full text-left p-3 rounded-lg hover:bg-surface-hover transition-all duration-200
                  ${selectedModel === model.id ? 'bg-gradient-to-r from-primary/20 to-primary/30 border-l-2 border-primary' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">{model.name}</span>
                      <span className="px-2 py-1 text-xs bg-surface-active text-text-secondary rounded">
                        {model.provider}
                      </span>
                      {model.multiModal && (
                        <span className="px-2 py-1 text-xs bg-accent/20 text-accent rounded">
                          Multimodal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{model.description}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Context: {model.contextLength.toLocaleString()} tokens
                    </p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}