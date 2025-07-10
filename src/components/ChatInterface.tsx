import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { useChat } from '../hooks/useChat';
import { AlertCircle, Trash2 } from 'lucide-react';
import { ConvergenceIcon } from './ConvergenceIcon';

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, selectedModel, sendMessage, clearChat, setSelectedModel, clearError } = useChat();

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
          <h1 className="text-xl font-semibold text-gray-100">payg.chat</h1>
          
          {!isEmpty && (
            <button
              onClick={handleClearChat}
              className="absolute right-0 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
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
      <div className="flex-1 overflow-y-auto hide-scrollbar scroll-snap-type-y-mandatory">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col justify-center items-center h-full min-h-[50vh]">
              <div className="text-center py-12">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-100 mb-2">
                    all the models, no subscription
                  </h2>
                </div>
                
                <PresetButtons onPresetClick={handlePresetClick} />
              </div>
              
              {/* Centered Input Area for Welcome Screen */}
              <div className="w-full max-w-2xl mt-8">
                <InputArea
                  onSendMessage={sendMessage}
                  isLoading={isLoading}
                  placeholder="Ask me anything..."
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  centered={true}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 scroll-snap-align-start">
              {messages.map((message) => (
                <div key={message.id} className="scroll-snap-align-start">
                  <MessageBubble message={message} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Only show when there are messages */}
      {!isEmpty && (
        <InputArea
          onSendMessage={sendMessage}
          isLoading={isLoading}
          placeholder="Continue the conversation..."
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          centered={false}
        />
      )}
    </div>
  );
}