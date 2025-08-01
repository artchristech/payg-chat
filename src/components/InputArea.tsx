import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Loader2, X, Wand2, Eye, EyeOff, Square, FileText } from 'lucide-react';
import { AttachmentMenu } from './AttachmentMenu';
import { ModelSelector } from './ModelSelector';
import { ResponseLengthSlider } from './ResponseLengthSlider';
import { AutocompleteMenu, autocompleteCommands, type AutocompleteOption } from './AutocompleteMenu';

interface InputAreaProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'audio' | 'image_generation_request', imageUrl?: string, audioUrl?: string, maxTokens?: number, fileName?: string, fileType?: string) => void;
  isLoading: boolean;
  placeholder?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  centered?: boolean;
  maxTokens: number;
  onMaxTokensChange: (value: number) => void;
  resetHistoryNavigation?: () => void;
  conversationCost: number;
  isCompletionOnlyMode: boolean;
  setIsCompletionOnlyMode: (value: boolean) => void;
  onCancelRequest: () => void;
}

export function InputArea({ onSendMessage, isLoading, placeholder = "Ask me anything...", selectedModel, onModelChange, centered = false, maxTokens, onMaxTokensChange, resetHistoryNavigation, conversationCost, isCompletionOnlyMode, setIsCompletionOnlyMode, onCancelRequest }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImageGenerationMode, setIsImageGenerationMode] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([]);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [detectedCommand, setDetectedCommand] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('Autocomplete state:', { showAutocomplete, autocompleteOptions, autocompleteQuery });
  }, [showAutocomplete, autocompleteOptions, autocompleteQuery]);
  // Command detection
  const detectCommand = useCallback((text: string) => {
    const trimmedText = text.trim().toLowerCase();
    if (trimmedText.startsWith('@image')) {
      return '@image';
    }
    return null;
  }, []);
  
  // Handle message change and command detection
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    console.log('Message changed:', newMessage);
    
    // Handle autocomplete for @ commands
    const atIndex = newMessage.lastIndexOf('@');
    console.log('At index:', atIndex);
    
    if (atIndex !== -1 && atIndex === newMessage.length - 1) {
      // Just typed @, show all options
      console.log('Just typed @, showing all options');
      setShowAutocomplete(true);
      setAutocompleteOptions(autocompleteCommands);
      setAutocompleteQuery('');
    } else if (atIndex !== -1) {
      // Extract text after the last @ symbol
      const afterAt = newMessage.substring(atIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      
      if (spaceIndex === -1) {
        // Still typing the command, filter options
        const query = afterAt.toLowerCase();
        console.log('Filtering with query:', query);
        const filteredOptions = autocompleteCommands.filter(cmd =>
          cmd.label.toLowerCase().startsWith(query)
        );
        
        setShowAutocomplete(true);
        setAutocompleteOptions(filteredOptions);
        setAutocompleteQuery(afterAt);
      } else {
        // Command is complete, hide autocomplete
        console.log('Command complete, hiding autocomplete');
        setShowAutocomplete(false);
        setAutocompleteOptions([]);
        setAutocompleteQuery('');
      }
    } else {
      // No @ symbol, hide autocomplete
      console.log('No @ symbol, hiding autocomplete');
      setShowAutocomplete(false);
      setAutocompleteOptions([]);
      setAutocompleteQuery('');
    }
    
    // Detect complete commands for mode switching
    const command = detectCommand(newMessage);
    setDetectedCommand(command);
    
    // Auto-switch to image generation mode when @image command is detected
    if (command === '@image' && !isImageGenerationMode) {
      setIsImageGenerationMode(true);
    } else if (!command && isImageGenerationMode && detectedCommand) {
      // Only exit image generation mode if we were in it due to a command
      setIsImageGenerationMode(false);
    }
    
    // Reset history navigation when user types
    resetHistoryNavigation?.();
  }, [isImageGenerationMode, detectedCommand, resetHistoryNavigation, detectCommand]);

  const handleAutocompleteSelect = useCallback((option: AutocompleteOption) => {
    const atIndex = message.lastIndexOf('@');
    if (atIndex !== -1) {
      const beforeAt = message.substring(0, atIndex);
      const newMessage = `${beforeAt}@${option.label} `;
      console.log('Selected option, new message:', newMessage);
      setMessage(newMessage);
      setDetectedCommand(`@${option.label}`);
      setIsImageGenerationMode(option.id === 'image');
    }
    
    setShowAutocomplete(false);
    setAutocompleteOptions([]);
    setAutocompleteQuery('');
    
    // Focus back to textarea
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [message]);

  const focusMessageInput = useCallback(() => {
    // Small delay to ensure the dropdown has closed
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedImage || selectedFile) {
      let finalMessage = message.trim();
      let messageType: 'text' | 'image' | 'audio' | 'image_generation_request' = 'text';

      // Handle command-based image generation
      if (detectedCommand && isImageGenerationMode) {
        // Remove the command from the message
        const commandIndex = finalMessage.toLowerCase().indexOf(detectedCommand.toLowerCase());
        if (commandIndex !== -1) {
          finalMessage = finalMessage.substring(commandIndex + detectedCommand.length).trim();
        }
        messageType = 'image_generation_request';
      } else if (selectedImage) {
        messageType = 'image';
      }
      
      onSendMessage(
        finalMessage,
        messageType,
        selectedImage || undefined,
        undefined,
        maxTokens,
        selectedFile?.name,
        selectedFile?.type
      );
      
      setMessage('');
      setSelectedImage(null);
      setSelectedImageFile(null);
      setSelectedFile(null);
      setIsImageGenerationMode(false);
      setDetectedCommand(null);
      setShowAutocomplete(false);
      setAutocompleteOptions([]);
      setAutocompleteQuery('');
    }
  }, [message, selectedImage, selectedFile, isImageGenerationMode, detectedCommand, onSendMessage, maxTokens]);

  const handleImageSelect = useCallback((file: File, preview: string) => {
    setSelectedImage(preview);
    setSelectedImageFile(file);
  }, []);

  const handleImageRemove = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageFile(null);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      // Handle image files
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setSelectedImage(preview);
        setSelectedImageFile(file);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle non-image files
      setSelectedFile(file);
    }
  }, []);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleGenerateImageClick = useCallback(() => {
    setIsImageGenerationMode(true);
    setMessage('@image ');
    setDetectedCommand('@image');
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleCancelImageGeneration = useCallback(() => {
    setIsImageGenerationMode(false);
    setMessage('');
    setDetectedCommand(null);
    setShowAutocomplete(false);
    setAutocompleteOptions([]);
    setAutocompleteQuery('');
  }, []);

  const handleAudioRecording = useCallback((audioBlob: Blob, audioUrl: string) => {
    onSendMessage('Audio message', 'audio', undefined, audioUrl, maxTokens);
  }, [onSendMessage, maxTokens]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // If autocomplete is showing and has options, select the first one
      if (showAutocomplete && autocompleteOptions.length > 0) {
        handleAutocompleteSelect(autocompleteOptions[0]);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape' && showAutocomplete) {
      // Hide autocomplete on escape
      setShowAutocomplete(false);
      setAutocompleteOptions([]);
      setAutocompleteQuery('');
    }
  }, [handleSubmit, showAutocomplete, autocompleteOptions, handleAutocompleteSelect]);

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
      return `${detectedCommand.toUpperCase()} - Describe the image you want to generate...`;
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
              {isLoading ? (
                <button
                  type="button"
                  onClick={onCancelRequest}
                  className="w-10 h-10 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-md border border-gray-300 dark:border-gray-600"
                  title="Stop generation"
                >
                  <Square className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!message.trim() && !selectedImage}
                  className="w-10 h-10 bg-gray-400 dark:bg-gray-500/85 text-white rounded-full hover:bg-gray-500 dark:hover:bg-gray-600/85 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center shadow-md"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              )}
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

          {/* File Preview */}
          {selectedFile && (
            <div className="flex justify-start">
              <div className="relative inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-gray-200 max-w-48 truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({selectedFile.type || 'unknown'})
                </span>
                <button
                  onClick={handleFileRemove}
                  className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-sm ml-2"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            </div>
          )}

          {/* Main Input Container */}
          <div className={`bg-white dark:bg-gray-800 rounded-3xl transition-all duration-200 p-4 ${centered ? 'shadow-2xl border border-gray-200 dark:border-gray-700' : 'border border-gray-200 dark:border-gray-700'}`}>
            {/* Autocomplete Menu */}
            <div className="relative">
              <AutocompleteMenu
                options={autocompleteOptions}
                query={autocompleteQuery}
                onSelect={handleAutocompleteSelect}
                isVisible={showAutocomplete}
              />
            </div>
            
            {/* Text Input Area */}
            <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              rows={2}
              disabled={isLoading}
              className="w-full resize-none border-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
            />
            </div>

            {/* Attachment and Model Section */}
            <div className="flex items-center justify-between mt-3">
              {/* Left side - Attachment */}
              <div className="flex items-center gap-3">
                <AttachmentMenu
                  onImageSelect={handleImageSelect}
                  onAudioRecordingComplete={handleAudioRecording}
                  onFileSelect={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => setIsCompletionOnlyMode(!isCompletionOnlyMode)}
                  className={`w-8 h-8 rounded-full hover:scale-105 transition-all duration-200 flex items-center justify-center ${
                    isCompletionOnlyMode 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  title={isCompletionOnlyMode ? "Disable Completion-Only Mode" : "Enable Completion-Only Mode"}
                >
                  {isCompletionOnlyMode ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
                conversationCost={conversationCost}
              />
              
              {isLoading ? (
                <button
                  type="button"
                  onClick={onCancelRequest}
                  className="w-10 h-10 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-md border border-gray-300 dark:border-gray-600"
                  title="Stop generation"
                >
                  <Square className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!message.trim() && !selectedImage && !selectedFile}
                  className="w-10 h-10 bg-gray-400 dark:bg-gray-500/85 text-white rounded-full hover:bg-gray-500 dark:hover:bg-gray-600/85 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center shadow-md"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}