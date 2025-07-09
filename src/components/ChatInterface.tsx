import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { useChat } from '../hooks/useChat';
import { AlertCircle, Trash2, Zap } from 'lucide-react';

export function ChatInterface() {
  const { messages, isLoading, error, selectedModel, sendMessage, clearChat, setSelectedModel, clearError } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = React.useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Control welcome screen visibility based on messages
    if (messages.length > 0) {
      setShowWelcomeScreen(false);
    } else {
      setShowWelcomeScreen(true);
    }
  }, [messages, showWelcomeScreen]);

  const handlePresetClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    clearChat();
    // Small delay to ensure state updates, then focus will be handled by InputArea
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-100">SuperGroq</h1>
          </div>
          
          {!isEmpty && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded-lg transition-colors"
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

      {/* Welcome Screen Overlay */}
      <div className={`
        absolute inset-x-0 bottom-0 top-0 flex flex-col justify-center items-center
        transition-opacity duration-500 z-10
        ${showWelcomeScreen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="text-center py-12">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">
              What's on your mind?
            </h2>
            <p className="text-gray-400">
              Start a conversation with AI powered by Groq
            </p>
          </div>
          
          <PresetButtons onPresetClick={handlePresetClick} />
        </div>
      </div>
      {/* Messages */}
      <div className={`
        flex-1 overflow-y-auto transition-opacity duration-500
        ${showWelcomeScreen ? 'opacity-0' : 'opacity-100'}
      `}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <InputArea
        onSendMessage={sendMessage}
        isLoading={isLoading}
        placeholder={showWelcomeScreen ? "Ask me anything..." : "Continue the conversation..."}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}