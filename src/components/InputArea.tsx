import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { AttachmentMenu } from './AttachmentMenu';
import { ModelSelector } from './ModelSelector';

interface InputAreaProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'audio', imageUrl?: string, audioUrl?: string) => void;
  isLoading: boolean;
  placeholder?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function InputArea({ onSendMessage, isLoading, placeholder = "Ask me anything...", selectedModel, onModelChange }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedImage) {
      onSendMessage(
        message.trim(),
        selectedImage ? 'image' : 'text',
        selectedImage || undefined
      );
      setMessage('');
      setSelectedImage(null);
      setSelectedImageFile(null);
    }
  };

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedImage(preview);
    setSelectedImageFile(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setSelectedImageFile(null);
  };

  const handleAudioRecording = (audioBlob: Blob, audioUrl: string) => {
    onSendMessage('Audio message', 'audio', undefined, audioUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="space-y-3">
          {/* Image Preview */}
          {selectedImage && (
            <div className="flex justify-start">
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-32 max-h-32 rounded-xl object-cover border border-gray-700"
                />
                <button
                  onClick={handleImageRemove}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input Row with Model Selector and Message Bar */}
          <div className="flex items-end">
            {/* Message Input Bar with Model Selector and Send Button */}
            <div className="flex-1 relative bg-gray-800 rounded-3xl border border-gray-700 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-900 transition-all duration-200 shadow-lg">
              {/* Attachment Menu */}
              <div className="absolute left-3 bottom-3">
                <AttachmentMenu
                  onImageSelect={handleImageSelect}
                  onAudioRecordingComplete={handleAudioRecording}
                />
              </div>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full resize-none bg-transparent pl-16 pr-32 py-4 focus:outline-none min-h-[56px] max-h-32 placeholder-gray-400 text-gray-100"
                rows={1}
                disabled={isLoading}
              />

              {/* Model Selector */}
              <div className="absolute right-16 bottom-3">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  compact={true}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || (!message.trim() && !selectedImage)}
                className="absolute right-3 bottom-3 w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}