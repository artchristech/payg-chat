import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { useChat } from '../hooks/useChat';
import { AlertCircle, SquarePen } from 'lucide-react';
import { ConvergenceIcon } from './ConvergenceIcon';

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { messages, isLoading, error, selectedModel, sendMessage, clearChat, setSelectedModel, clearError } = useChat(scrollToBottom);
  const { maxTokens, setMaxTokens } = useChat(scrollToBottom);

  const handlePresetClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    clearChat();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500/30 via-purple-500/40 to-blue-500/30 rounded-full"></div>
          
          {!isEmpty && (
            <button
              onClick={handleClearChat}
              className="absolute right-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded-lg transition-colors"
              title="Clear Chat"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200 text-sm">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-200 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col justify-center items-center h-full min-h-[50vh]">
              <div className="text-center py-12">
                <PresetButtons onPresetClick={handlePresetClick} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Always present */}
      <div className="bg-gray-900 p-4">
        <div className={`mx-auto ${isEmpty ? 'max-w-2xl' : 'max-w-4xl'}`}>
          <InputArea
            onSendMessage={sendMessage}
            isLoading={isLoading}
            placeholder={isEmpty ? "Ask me anything..." : "Continue the conversation..."}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            centered={isEmpty}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
          />
        </div>
      </div>
    </div>
  );
}