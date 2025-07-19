import React, { useEffect } from 'react';
import { X, Check, Zap, Eye, Globe, Brain, Code, Sparkles } from 'lucide-react';
import { openRouterModels, OpenRouterModel } from '../utils/api';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelect: (modelId: string) => void;
  currentSelectedModel: string;
}

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'xai':
      return <Zap className="w-5 h-5" />;
    case 'google':
      return <Globe className="w-5 h-5" />;
    case 'anthropic':
      return <Brain className="w-5 h-5" />;
    case 'openai':
      return <Sparkles className="w-5 h-5" />;
    case 'meta':
      return <Code className="w-5 h-5" />;
    case 'moonshot ai':
      return <Eye className="w-5 h-5" />;
    default:
      return <Brain className="w-5 h-5" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'xai':
      return 'from-purple-500 to-pink-500';
    case 'google':
      return 'from-blue-500 to-green-500';
    case 'anthropic':
      return 'from-orange-500 to-red-500';
    case 'openai':
      return 'from-green-500 to-teal-500';
    case 'meta':
      return 'from-blue-600 to-purple-600';
    case 'moonshot ai':
      return 'from-indigo-500 to-purple-500';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

export function ModelSelectionModal({ isOpen, onClose, onModelSelect, currentSelectedModel }: ModelSelectionModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
    onClose();
  };

  const groupedModels = openRouterModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, OpenRouterModel[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full max-w-7xl mx-auto p-4 flex flex-col">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your AI Model</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Select from our collection of powerful AI models</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-full flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {Object.entries(groupedModels).map(([provider, models]) => (
                <div key={provider}>
                  {/* Provider Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getProviderColor(provider)} flex items-center justify-center text-white`}>
                      {getProviderIcon(provider)}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{provider}</h3>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>

                  {/* Models Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.map((model) => {
                      const isSelected = currentSelectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model.id)}
                          className={`
                            relative p-5 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                        >
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}

                          {/* Model Info */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{model.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{model.description}</p>
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                {(model.contextLength / 1000).toFixed(0)}K context
                              </span>
                              {model.multiModal && (
                                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                                  Multimodal
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}