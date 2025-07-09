import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { groqModels } from '../utils/groq';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSelectionComplete?: () => void;
  compact?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, onSelectionComplete, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModelInfo = groqModels.find(model => model.id === selectedModel);

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
            ? 'px-3 py-2 rounded-full text-sm' 
            : 'px-4 py-4 border border-gray-700 rounded-3xl hover:border-gray-600 min-h-[56px]'
        }`}
      >
        <span className="text-sm font-medium">
          {selectedModelInfo?.name.split(' ')[0] || 'Model'}
        </span>
        <ChevronDown className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${compact ? 'bottom-full right-0' : 'bottom-full left-0'} mb-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50`}>
          <div className="p-2 max-h-80 overflow-y-auto">
            {groqModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                  onSelectionComplete?.();
                }}
                className={`
                  w-full text-left p-3 rounded-lg hover:bg-gray-700 transition-colors
                  ${selectedModel === model.id ? 'bg-blue-900' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">{model.name}</span>
                      {model.multiModal && (
                        <span className="px-2 py-1 text-xs bg-purple-900 text-purple-300 rounded">
                          Multimodal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Context: {model.contextLength.toLocaleString()} tokens
                    </p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-blue-400" />
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