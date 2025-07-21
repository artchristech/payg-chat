import { useState, useCallback, useMemo } from 'react';
import { Message, ChatState } from '../types/chat';
import { sendMessageToOpenRouter, convertMessagesToOpenRouterFormat, generateImageWithTogetherAI, togetherImageModels, calculateOpenRouterCost, calculateTogetherImageCost } from '../utils/api';

export function useChat(onScrollToBottom?: () => void) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'moonshotai/kimi-k2',
    maxTokens: 150,
    conversationCost: 0,
  });

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    return newMessage;
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'audio' | 'image_generation_request' = 'text',
    imageUrl?: string,
    audioUrl?: string,
    maxTokens?: number
  ) => {
    if (!content.trim()) return;

    setChatState(prev => ({ ...prev, error: null }));

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      type,
      imageUrl,
      audioUrl,
      timestamp: new Date(),
    };

    // Add user message first
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    // Scroll to bottom after adding user message and starting AI response
    setTimeout(() => onScrollToBottom?.(), 100);

    // Handle image generation requests
    if (type === 'image_generation_request') {
      try {
        // Create loading assistant message for image generation
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Generating image...',
          type: 'generated_image',
          isLoading: true,
          timestamp: new Date(),
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));

        // Generate image using Together.ai
        const defaultModel = togetherImageModels[0].id;
        const generatedImageUrl = await generateImageWithTogetherAI(content, defaultModel);
        
        // Calculate and add image generation cost
        const imageCost = calculateTogetherImageCost(defaultModel);

        // Update assistant message with generated image
        setChatState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === assistantMessage.id
              ? { 
                  ...msg, 
                  content: `Generated image for: "${content}"`,
                  imageUrl: generatedImageUrl,
                  isLoading: false 
                }
              : msg
          ),
          isLoading: false,
          conversationCost: prev.conversationCost + imageCost,
        }));

        setTimeout(() => onScrollToBottom?.(), 100);
      } catch (error) {
        console.error('Error generating image:', error);
        
        let errorMessage = 'Failed to generate image';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        setChatState(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1), // Remove the loading message
          isLoading: false,
          error: errorMessage,
        }));
      }
      return;
    }

    // Handle regular text/image/audio messages with OpenRouter
    try {
      // Create loading assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        type: 'text',
        isLoading: true,
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Prepare messages for API (including the new user message)
      const messagesForAPI = [...chatState.messages, userMessage];
      const openRouterMessages = convertMessagesToOpenRouterFormat(messagesForAPI, chatState.selectedModel, maxTokens || chatState.maxTokens);
      
      await sendMessageToOpenRouter(
        openRouterMessages, 
        chatState.selectedModel,
        // onUpdate callback - append content as it streams
        (content: string) => {
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + content }
                : msg
            ),
          }));
        },
        // onComplete callback - mark as finished
        (usage) => {
          // Calculate cost based on token usage
          let messageCost = 0;
          if (usage) {
            messageCost = calculateOpenRouterCost(
              chatState.selectedModel,
              usage.prompt_tokens,
              usage.completion_tokens
            );
          }
          
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, isLoading: false }
                : msg
            ),
            isLoading: false,
            conversationCost: prev.conversationCost + messageCost,
          }));
          // Scroll to bottom when AI response is complete
          setTimeout(() => onScrollToBottom?.(), 100);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1), // Remove the loading message
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [chatState.messages, chatState.selectedModel, chatState.maxTokens, onScrollToBottom]);

  const clearChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      error: null,
      conversationCost: 0,
    }));
  }, []);

  const setSelectedModel = useCallback((model: string) => {
    setChatState(prev => ({ ...prev, selectedModel: model }));
  }, []);

  const setMaxTokens = useCallback((maxTokens: number) => {
    setChatState(prev => ({ ...prev, maxTokens }));
  }, []);
  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoize derived state to prevent unnecessary recalculations
  const memoizedState = useMemo(() => ({
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    selectedModel: chatState.selectedModel,
    maxTokens: chatState.maxTokens,
    conversationCost: chatState.conversationCost,
  }), [chatState]);

  return {
    ...memoizedState,
    sendMessage,
    clearChat,
    setSelectedModel,
    setMaxTokens,
    clearError,
  };
}