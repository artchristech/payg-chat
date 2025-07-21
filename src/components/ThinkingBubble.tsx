import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface ThinkingBubbleProps {
  messageId: string;
  onReveal: (messageId: string) => void;
}

export function ThinkingBubble({ messageId, onReveal }: ThinkingBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-blue-200 dark:border-blue-700/50 rounded-2xl px-6 py-4 shadow-sm">
        {/* Header with brain icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI is generating a response...
          </span>
        </div>

        {/* Animated thinking dots */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:from-blue-700 dark:via-purple-700 dark:to-pink-700"></div>
        </div>

        {/* Neural network animation */}
        <div className="relative mb-4 h-8 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-3">
              {/* Input nodes */}
              <div className="flex flex-col gap-1">
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              </div>
              
              {/* Connection lines */}
              <div className="flex items-center">
                <div className="w-6 h-px bg-gradient-to-r from-blue-300 to-purple-300 opacity-60"></div>
              </div>
              
              {/* Hidden nodes */}
              <div className="flex flex-col gap-1">
                <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
              
              {/* Connection lines */}
              <div className="flex items-center">
                <div className="w-6 h-px bg-gradient-to-r from-purple-300 to-pink-300 opacity-60"></div>
              </div>
              
              {/* Output node */}
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Reveal button */}
        <div className="flex justify-center">
          <button
            onClick={() => onReveal(messageId)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Reveal Response
          </button>
        </div>
      </div>
    </div>
  );
}