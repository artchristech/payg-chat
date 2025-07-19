import React from 'react';
import { Image, ChevronRight } from 'lucide-react';

interface AutocompleteOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AutocompleteMenuProps {
  options: AutocompleteOption[];
  query: string;
  onSelect: (option: AutocompleteOption) => void;
  isVisible: boolean;
}

export function AutocompleteMenu({ options, query, onSelect, isVisible }: AutocompleteMenuProps) {
  if (!isVisible || options.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 overflow-hidden">
      <div className="p-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
          Available Commands
        </div>
        {options.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  @{option.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const autocompleteCommands: AutocompleteOption[] = [
  {
    id: 'image',
    label: 'image',
    description: 'Generate an image using AI',
    icon: Image,
  },
];