import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { ThemeSelector } from './ThemeSelector';
import { useChat } from '../hooks/useChat';
import { AlertCircle, SquarePen } from 'lucide-react';

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { messages, isLoading, error, selectedModel, sendMessage, clearChat, setSelectedModel, clearError, maxTokens, setMaxTokens, conversationCost } = useChat(scrollToBottom);

  const handlePresetClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    clearChat();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500/30 via-purple-500/40 to-blue-500/30 rounded-full"></div>
          
          <div className="absolute right-0 flex items-center gap-2">
            {!isEmpty && (
              <button
                onClick={handleClearChat}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-gray-200 rounded-lg transition-colors"
                title="Clear Chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
            )}
            <ThemeSelector />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full">
          {isEmpty ? (
            <div className="flex flex-col justify-center items-center h-full min-h-[50vh] px-4 py-6">
              <div className="text-center py-12">
                <PresetButtons onPresetClick={handlePresetClick} />
              </div>
            </div>
          ) : (
            <List
              ref={listRef}
              height={window.innerHeight - 200} // Approximate height minus header and input
              width="100%"
              itemCount={messages.length}
              itemSize={120} // Approximate height per message
            >
              {Row}
            </List>
          )}
        </div>
      </div>

      {/* Bottom Section - Always present */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4">
        <div className="mx-auto max-w-4xl">
          <InputArea
            onSendMessage={sendMessage}
            isLoading={isLoading}
            placeholder={isEmpty ? "Ask me anything..." : "Continue the conversation..."}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            centered={false}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            resetHistoryNavigation={clearError}
            conversationCost={conversationCost}
          />
        </div>
      </div>
    </div>
  );
}