import React, { useEffect, useRef } from 'react';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { ThemeSelector } from './ThemeSelector';
import { OutputCustomization } from './OutputCustomization';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { useChat } from '../hooks/useChat';
import { AlertCircle, SquarePen } from 'lucide-react';

export function ChatInterface() {
  const listRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  };

  const { messages, isLoading, error, selectedModel, sendMessage, clearChat, setSelectedModel, clearError, maxTokens, setMaxTokens } = useChat(scrollToBottom);
  const { outputFontFamily, outputLineSpacing, setOutputFontFamily, setOutputLineSpacing } = useChat(scrollToBottom);

  const handlePresetClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClearChat = () => {
    clearChat();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 relative">
      <div className="flex flex-col h-screen bg-app relative">
        {/* Header */}
        <div className="bg-app px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center relative">
            <div className="w-32 h-1 bg-gradient-to-r from-primary/30 via-accent/40 to-primary/30 rounded-full"></div>
            
            <div className="absolute right-0 flex items-center gap-2">
              {!isEmpty && (
                <button
                  onClick={handleClearChat}
                  className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-text rounded-lg transition-colors"
                  title="Clear Chat"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
              )}
              <OutputCustomization
                outputFontFamily={outputFontFamily}
                outputLineSpacing={outputLineSpacing}
                onFontFamilyChange={setOutputFontFamily}
                onLineSpacingChange={setOutputLineSpacing}
              />
              <ThemeSelector />
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-error-bg px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-error-text text-sm">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-error hover:text-error-text text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto h-full">
            {isEmpty ? (
              <div className="flex flex-col justify-center items-center h-full min-h-[50vh]">
                <div className="text-center py-12">
                  <PresetButtons onPresetClick={handlePresetClick} />
                </div>
              </div>
            ) : (
              <VirtualizedMessageList
                ref={listRef}
                messages={messages}
                height={containerRef.current?.clientHeight || 600}
                onScrollToBottom={scrollToBottom}
                outputFontFamily={outputFontFamily}
                outputLineSpacing={outputLineSpacing}
              />
            )}
          </div>
        </div>

        {/* Bottom Section - Always present */}
        <div className="bg-app p-4">
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
    </div>
  );
}