import { useState, useCallback, useMemo, useRef } from 'react';
import { Message, ChatState } from '../types/chat';
import { sendMessageToOpenRouter, convertMessagesToOpenRouterFormat, generateImageWithTogetherAI, togetherImageModels, calculateOpenRouterCost, calculateTogetherImageCost } from '../utils/api';

export function useChat(onScrollToBottom?: () => void) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: {},
    isLoading: false,
    error: null,
    selectedModel: 'moonshotai/kimi-k2',
    maxTokens: 150,
    conversationCost: 0,
    currentLeafId: null,
  });
  const [isCompletionOnlyMode, setIsCompletionOnlyMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: { ...prev.messages, [newMessage.id]: newMessage },
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

    let assistantMessage: Message;

    let assistantMessage: Message;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      type,
      imageUrl,
      audioUrl,
      timestamp: new Date(),
      parentId: chatState.currentLeafId,
    };

    // Add user message first
    setChatState(prev => ({
      ...prev,
      messages: { ...prev.messages, [userMessage.id]: userMessage },
      isLoading: true,
      currentLeafId: userMessage.id,
    }));

    // Scroll to bottom after adding user message and starting AI response
    setTimeout(() => onScrollToBottom?.(), 100);

    // Handle image generation requests
    if (type === 'image_generation_request') {
      try {
        // Create abort controller for image generation
        abortControllerRef.current = new AbortController();

        // Create loading assistant message for image generation
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Generating image...',
          type: 'generated_image',
          isLoading: true,
          timestamp: new Date(),
          parentId: userMessage.id,
        };

        setChatState(prev => ({
          ...prev,
          messages: { ...prev.messages, [assistantMessage.id]: assistantMessage },
          currentLeafId: assistantMessage.id,
        }));

        // Generate image using Together.ai
        const defaultModel = togetherImageModels[0].id;
        const generatedImageUrl = await generateImageWithTogetherAI(content, defaultModel, 1024, 1024, abortControllerRef.current.signal);
        
        // Calculate and add image generation cost
        const imageCost = calculateTogetherImageCost(defaultModel);

        // Update assistant message with generated image
        setChatState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [assistantMessage.id]: {
              ...prev.messages[assistantMessage.id],
              content: `Generated image for: "${content}"`,
              imageUrl: generatedImageUrl,
              isLoading: false
            }
          },
          isLoading: false,
          conversationCost: prev.conversationCost + imageCost,
        }));

        setTimeout(() => onScrollToBottom?.(), 100);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log("Request successfully aborted.");
          return;
        }

        console.error('Error generating image:', error);
        

        let errorMessage = 'Failed to generate image';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        setChatState(prev => ({
          ...prev,
          messages: Object.fromEntries(
            Object.entries(prev.messages).filter(([id]) => id !== assistantMessage.id)
          ),
          isLoading: false,
          error: errorMessage,
        }));
      } finally {
        abortControllerRef.current = null;
      }
      return;
    }

    // Handle regular text/image/audio messages with OpenRouter
    try {
      // Create abort controller for text/image/audio messages
      abortControllerRef.current = new AbortController();

      // Create loading assistant message
      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        type: 'text',
        isLoading: true,
        isHidden: isCompletionOnlyMode,
        timestamp: new Date(),
        parentId: userMessage.id,
      };

      setChatState(prev => ({
        ...prev,
        messages: { ...prev.messages, [assistantMessage.id]: assistantMessage },
        currentLeafId: assistantMessage.id,
      }));

      // Prepare messages for API (including the new user message)
      const messagesForAPI = [...Object.values(chatState.messages), userMessage];
      const openRouterMessages = convertMessagesToOpenRouterFormat(messagesForAPI, chatState.selectedModel, maxTokens || chatState.maxTokens);
      
      await sendMessageToOpenRouter(
        openRouterMessages, 
        chatState.selectedModel,
        // onUpdate callback - append content as it streams
        (content: string) => {
          setChatState(prev => ({
            ...prev,
            messages: {
              ...prev.messages,
              [assistantMessage.id]: {
                ...prev.messages[assistantMessage.id],
                content: prev.messages[assistantMessage.id].content + content
              }
            },
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
            messages: {
              ...prev.messages,
              [assistantMessage.id]: {
                ...prev.messages[assistantMessage.id],
                isLoading: false
              }
            },
            isLoading: false,
            conversationCost: prev.conversationCost + messageCost,
          }));
          // Scroll to bottom when AI response is complete
          setTimeout(() => onScrollToBottom?.(), 100);
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log("Request successfully aborted.");
        return;
      }

      console.error('Error sending message:', error);
      

      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setChatState(prev => ({
        ...prev,
        messages: Object.fromEntries(
          Object.entries(prev.messages).filter(([id]) => id !== assistantMessage.id)
        ),
        isLoading: false,
        error: errorMessage,
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, [chatState.messages, chatState.selectedModel, chatState.maxTokens, onScrollToBottom]);

  const clearChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: {},
      error: null,
      conversationCost: 0,
      currentLeafId: null,
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

  const revealMessageContent = useCallback((messageId: string) => {
    setChatState(prev => ({
      ...prev,
      messages: {
        ...prev.messages,
        [messageId]: {
          ...prev.messages[messageId],
          isHidden: false
        }
      },
    }));
  }, []);

  const setCurrentLeaf = useCallback((messageId: string) => {
    setChatState(prev => ({
      ...prev,
      currentLeafId: messageId,
    }));
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Memoize derived state to prevent unnecessary recalculations
  const memoizedState = useMemo(() => ({
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    selectedModel: chatState.selectedModel,
    maxTokens: chatState.maxTokens,
    conversationCost: chatState.conversationCost,
    currentLeafId: chatState.currentLeafId,
  }), [chatState]);

  return {
    ...memoizedState,
    sendMessage,
    clearChat,
    setSelectedModel,
    setMaxTokens,
    clearError,
    isCompletionOnlyMode,
    setIsCompletionOnlyMode,
    revealMessageContent,
    setCurrentLeaf,
    cancelRequest,
  };
}