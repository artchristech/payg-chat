import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { PresetButtons } from './PresetButtons';
import { useChat } from '../hooks/useChat';
import { AlertCircle, SquarePen } from 'lucide-react';
import { ConvergenceIcon } from './ConvergenceIcon';
import { ResponseLengthSlider } from './ResponseLengthSlider';

export function ChatInterface() {
  const [responseLength, setResponseLength] = React.useState(200);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { messages, isLoading, error, selectedModel, sendMessage, clearChat, setSelectedModel, clearError } = useChat(scrollToBottom, responseLength);

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
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-100 mb-2">
                    Pay As You Go, no subscription
                  </h2>
                </div>
                
                <PresetButtons onPresetClick={handlePresetClick} />
              </div>
              
              {/* Centered Input Area for Welcome Screen */}
              <div className="w-full max-w-2xl mt-8">
                {/* Slider for Welcome Screen */}
                <div className="w-full flex justify-start mb-4">
                  <div className="w-40">
                    <ResponseLengthSlider
                      value={responseLength}
                      onChange={setResponseLength}
                    />
                  </div>
                </div>
                
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
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Always show */}
      {!isEmpty && (
        <div className="bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Slider for Ongoing Conversation */}
            <div className="w-full flex justify-start mb-4">
              <div className="w-48">
                <ResponseLengthSlider
                  value={responseLength}
                  onChange={setResponseLength}
                />
              </div>
            </div>
            
            <InputArea
              onSendMessage={sendMessage}
              isLoading={isLoading}
              placeholder="Continue the conversation..."
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              centered={false}
            />
          </div>
        </div>
      )}

      {/* Input Area for Welcome Screen */}
      {isEmpty && (
        <div className="bg-gray-900 p-4">
          <div className="max-w-2xl mx-auto">
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
      )}
    </div>
  );
}