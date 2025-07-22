import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { ThemeSelector } from './ThemeSelector';
import { ConversationGraph } from './ConversationGraph';
import { useChat } from '../hooks/useChat';
import { AlertCircle, SquarePen, Network } from 'lucide-react';

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'graph'>('chat');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { 
    messages, 
    isLoading, 
    error, 
    selectedModel, 
    sendMessage, 
    clearChat, 
    setSelectedModel, 
    clearError, 
    maxTokens, 
    setMaxTokens, 
    conversationCost,
    isCompletionOnlyMode,
    setIsCompletionOnlyMode,
    revealMessageContent,
    currentLeafId,
    setCurrentLeaf,
    cancelRequest,
  } = useChat(scrollToBottom);

  const handlePresetClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    clearChat();
    setViewMode('chat'); // Reset to chat view when clearing
  };

  const isEmpty = Object.keys(messages).length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500/30 via-purple-500/40 to-blue-500/30 rounded-full"></div>
          
          <div className="absolute right-0 flex items-center gap-2">
            {!isEmpty && (
              <>
                <button
                  onClick={() => setViewMode(viewMode === 'chat' ? 'graph' : 'chat')}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                    viewMode === 'graph' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-gray-200'
                  }`}
                  title={viewMode === 'chat' ? 'Switch to Graph View' : 'Switch to Chat View'}
                >
                  <Network className="w-4 h-4" />
                </button>
              <button
                onClick={handleClearChat}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-gray-200 rounded-lg transition-colors"
                title="Clear Chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              </>
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
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col justify-center items-center h-full min-h-[50vh]">
              <div className="text-center py-12">
                <PresetButtons onPresetClick={handlePresetClick} />
              </div>
            </div>
          ) : viewMode === 'chat' ? (
            <div className="space-y-6">
              {Object.values(messages)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                .map((message) => (
                <MessageBubble key={message.id} message={message} onReveal={revealMessageContent} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full min-h-[60vh]">
              <ConversationGraph 
                messages={messages}
                currentLeafId={currentLeafId}
                onNodeClick={setCurrentLeaf}
              />
            </div>
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
            isCompletionOnlyMode={isCompletionOnlyMode}
            setIsCompletionOnlyMode={setIsCompletionOnlyMode}
            onCancelRequest={cancelRequest}
          />
        </div>
      </div>
    </div>
  );
}