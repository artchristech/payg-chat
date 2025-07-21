import React from 'react';
import { BrainCircuit, Sparkles, ChevronRight } from 'lucide-react';

interface ThinkingBubbleProps {
  messageId: string;
  onReveal: (messageId: string) => void;
}

export function ThinkingBubble({ messageId, onReveal }: ThinkingBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] w-full rounded-2xl p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulseSlow">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-[14px] p-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI is thinking...</h3>
          </div>

          {/* Animated Synapse Visualization */}
          <div className="relative h-12 w-full mb-4 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <div 
              className="absolute top-0 left-0 h-full w-[200%] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-gradient"
              style={{ backgroundSize: '200% 100%' }}
            />
            <div 
              className="absolute top-0 left-0 h-full w-[200%] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-gradient"
              style={{ animationDelay: '2s', backgroundSize: '200% 100%' }}
            />
          </div>

          {/* Reveal Button */}
          <button
            onClick={() => onReveal(messageId)}
            className="group w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 text-purple-500 transition-transform duration-300 group-hover:scale-110" />
            Reveal Response
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

        </div>
      </div>
    </div>
  );
}