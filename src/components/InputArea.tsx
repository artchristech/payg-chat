import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Loader2, X, Sparkles, Wand2 } from 'lucide-react';
import { AttachmentMenu } from './AttachmentMenu';
import { ModelSelector } from './ModelSelector';
import { ResponseLengthSlider } from './ResponseLengthSlider';

interface InputAreaProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'audio', imageUrl?: string, audioUrl?: string, maxTokens?: number) => void;
  isLoading: boolean;
  placeholder?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  centered?: boolean;
  maxTokens: number;
  onMaxTokensChange: (value: number) => void;
  resetHistoryNavigation?: () => void;
}

export function InputArea({ onSendMessage, isLoading, placeholder = "Ask me anything...", selectedModel, onModelChange, centered = false, maxTokens, onMaxTokensChange, resetHistoryNavigation }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isImageGenerationMode, setIsImageGenerationMode] = useState(false);
  const [detectedCommand, setDetectedCommand] = useState<string | null>(null);
  const [isImageGenerationMode, setIsImageGenerationMode] = useState(false);
  const [detectedCommand, setDetectedCommand] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Command detection
  const imageCommands = ['/imagine', '/generate', '/image', '/draw', '/create'];
  
  const detectCommand = useCallback((text: string) => {
    const trimmedText = text.trim().toLowerCase();
    for (const command of imageCommands) {
      if (trimmedText.startsWith(command)) {
        return command;
      }
    }
    return null;
  }, []);

  // Handle message change and command detection
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    const command = detectCommand(newMessage);
    setDetectedCommand(command);
    
    // Auto-switch to image generation mode when command is detected
    if (command && !isImageGenerationMode) {
      setIsImageGenerationMode(true);
    } else if (!command && isImageGenerationMode && detectedCommand) {
      // Only exit image generation mode if we were in it due to a command
      setIsImageGenerationMode(false);
    }
    
    // Reset history navigation when user types
    resetHistoryNavigation?.();
  }, [isImageGenerationMode, detectedCommand, resetHistoryNavigation, detectCommand]);

  // Command detection
  const imageCommands = ['/imagine', '/generate', '/image', '/draw', '/create'];
  
  const detectCommand = useCallback((text: string) => {
    const trimmedText = text.trim().toLowerCase();
    for (const command of imageCommands) {
      if (trimmedText.startsWith(command)) {
        return command;
      }
    }
    return null;
  }, []);

  // Handle message change and command detection
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    const command = detectCommand(newMessage);
    setDetectedCommand(command);
    
    // Auto-switch to image generation mode when command is detected
    if (command && !isImageGenerationMode) {
      setIsImageGenerationMode(true);
    } else if (!command && isImageGenerationMode && detectedCommand) {
      // Only exit image generation mode if we were in it due to a command
      setIsImageGenerationMode(false);
    }
    
    // Reset history navigation when user types
    resetHistoryNavigation?.();
  }, [isImageGenerationMode, detectedCommand, resetHistoryNavigation, detectCommand]);

  const focusMessageInput = useCallback(() => {
    // Small delay to ensure the dropdown has closed
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedImage) {
      let finalMessage = message.trim();
      let messageType: 'text' | 'image' | 'audio' | 'image_generation_request' = 'text';

      // Handle command-based image generation
      if (detectedCommand && isImageGenerationMode) {
        // Remove the command from the message
        finalMessage = finalMessage.substring(detectedCommand.length).trim();
        messageType = 'image_generation_request';
      } else if (selectedImage) {
        messageType = 'image';
      }
      
      // Handle command-based image generation
      if (detectedCommand && isImageGenerationMode) {
        // Remove the command from the message
        finalMessage = finalMessage.substring(detectedCommand.length).trim();
        messageType = 'image_generation_request';
      } else if (selectedImage) {
        messageType = 'image';
      }
      
      onSendMessage(
        finalMessage,
        messageType,
        selectedImage || undefined,
        undefined,
        maxTokens
      );
      
      setMessage('');
      setSelectedImage(null);
      setSelectedImageFile(null);
      setIsImageGenerationMode(false);
      setDetectedCommand(null);
      setIsImageGenerationMode(false);
      setDetectedCommand(null);
    }
  }, [message, selectedImage, isImageGenerationMode, detectedCommand, onSendMessage, maxTokens]);

  const handleImageSelect = useCallback((file: File, preview: string) => {
    setSelectedImage(preview);
    setSelectedImageFile(file);
  }, []);

  const handleImageRemove = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageFile(null);
  }, []);

  const handleGenerateImageClick = useCallback(() => {
    setIsImageGenerationMode(true);
    setMessage('');
    setMessage('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleCancelImageGeneration = useCallback(() => {
    setIsImageGenerationMode(false);
    setMessage('');
    setDetectedCommand(null);
  }, []);

  const handleCancelImageGeneration = useCallback(() => {
    setIsImageGenerationMode(false);
    setMessage('');
    setDetectedCommand(null);
  }, []);

  const handleAudioRecording = useCallback((audioBlob: Blob, audioUrl: string) => {
    onSendMessage('Audio message', 'audio', undefined, audioUrl, maxTokens);
  }, [onSendMessage, maxTokens]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Re-focus when transitioning back to welcome screen
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 600); // Wait for animation to complete
    
    return () => clearTimeout(timer);
  }, [placeholder]); // Trigger when placeholder changes (indicates welcome screen state change)

  // Get appropriate placeholder text
  const getPlaceholder = () => {
    if (isImageGenerationMode && detectedCommand) {
      return `${detectedCommand} - Describe the image you want to generate...`;
    } else if (isImageGenerationMode) {
      return "Describe the image you want to generate...";
    }
    return placeholder;
  };

  // Get appropriate placeholder text
  const getPlaceholder = () => {
    if (isImageGenerationMode && detectedCommand) {
      return `${detectedCommand} - Describe the image you want to generate...`;
    } else if (isImageGenerationMode) {
      return "Describe the image you want to generate...";
    }
    return placeholder;
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={`${centered ? 'w-full' : 'max-w-4xl mx-auto'}`}>
        <div className="space-y-3">
          {/* Image Generation Mode Indicator */}
          {isImageGenerationMode && (
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  {detectedCommand ? `${detectedCommand.toUpperCase()} - Image Generation` : 'Image Generation Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelImageGeneration}
                className="w-6 h-6 bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <div className="flex justify-start">
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-32 max-h-32 rounded-xl object-cover"
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
        <div className="space-y-3">
          {/* Image Generation Mode Indicator */}
          {isImageGenerationMode && (
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  {detectedCommand ? `${detectedCommand.toUpperCase()} - Image Generation` : 'Image Generation Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelImageGeneration}
                className="w-6 h-6 bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <div className="flex justify-start">
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-32 max-h-32 rounded-xl object-cover"
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

          {/* Main Input Container */}
          <div className={`bg-white dark:bg-gray-800 rounded-3xl transition-all duration-200 p-4 ${centered ? 'shadow-2xl border border-gray-200 dark:border-gray-700' : 'border border-gray-200 dark:border-gray-700'}`}>
            {/* Text Input Area */}
            <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="w-full resize-none bg-transparent focus:outline-none min-h-[48px] max-h-32 placeholder-gray-400 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
              rows={1}
              disabled={isLoading}
            />
            </div>

            {/* Attachment and Model Section */}
            <div className="flex items-center justify-between mt-3">
              {/* Left side - Attachment */}
              <div className="flex items-center gap-3">
                <AttachmentMenu
                  onImageSelect={handleImageSelect}
                  onAudioRecordingComplete={handleAudioRecording}
            {/* Attachment and Model Section */}
            <div className="flex items-center justify-between mt-3">
              {/* Left side - Attachment */}
              <div className="flex items-center gap-3">
                <AttachmentMenu
                  onImageSelect={handleImageSelect}
                  onAudioRecordingComplete={handleAudioRecording}
                  onGenerateImageClick={handleGenerateImageClick}
                />
                <ResponseLengthSlider
                  maxTokens={maxTokens}
                  onValueChange={onMaxTokensChange}
                />
              </div>
              
              {/* Right side - Model Selector and Send Button */}
              <div className="flex items-center gap-2">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                onSelectionComplete={focusMessageInput}
                compact={true}
              />
              
              <button
                type="submit"
                disabled={isLoading || (!message.trim() && !selectedImage)}
                className="w-10 h-10 bg-gray-400 dark:bg-gray-500/85 text-white rounded-full hover:bg-gray-500 dark:hover:bg-gray-600/85 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}