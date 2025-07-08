import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Paperclip, Search, Lightbulb, ImagePlus, Edit, Newspaper, Users, ChevronDown } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { ImageUploader } from './ImageUploader';
import { ModelSelector } from './ModelSelector';

interface InputAreaProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'audio', imageUrl?: string, audioUrl?: string) => void;
  isLoading: boolean;
  placeholder?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function InputArea({ onSendMessage, isLoading, placeholder = "What do you want to know?", selectedModel, onModelChange }: InputAreaProps) {
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

          {/* Message Input Bar with Model Selector Inside */}
          <div className="relative bg-gray-800 rounded-3xl border border-gray-700 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-900 transition-all duration-200 shadow-lg min-h-[80px]">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none bg-transparent pl-6 pr-32 py-4 pb-16 focus:outline-none min-h-[56px] max-h-32 placeholder-gray-400 text-gray-100"
              rows={1}
              disabled={isLoading}
            />

            {/* Bottom Controls */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              {/* Left-aligned buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-100 rounded-full hover:bg-gray-600 transition-colors text-sm"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-100 rounded-full hover:bg-gray-600 transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>DeepSearch</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-100 rounded-full hover:bg-gray-600 transition-colors text-sm"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Think</span>
                </button>
              </div>

              {/* Right-aligned buttons */}
              <div className="flex items-center gap-2">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  compact={true}
                />
                
                <button
                  type="submit"
                  disabled={isLoading || (!message.trim() && !selectedImage)}
                  className="w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center ml-2"
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

          {/* Second row of buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-sm font-medium text-gray-100 shadow-sm hover:shadow-md"
            >
              <ImagePlus className="w-4 h-4" />
              Create Images
            </button>
            
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-sm font-medium text-gray-100 shadow-sm hover:shadow-md"
            >
              <Edit className="w-4 h-4" />
              Edit Image
            </button>
            
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-sm font-medium text-gray-100 shadow-sm hover:shadow-md"
            >
              <Newspaper className="w-4 h-4" />
              Latest News
            </button>
            
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-sm font-medium text-gray-100 shadow-sm hover:shadow-md"
            >
              <Users className="w-4 h-4" />
              Personas
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}