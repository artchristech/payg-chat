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
    contextBlocks: {},
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

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('Aborting current request...'); // Log for debugging
      abortControllerRef.current.abort();
      // The finally block in sendMessage will handle isLoading and nulling abortControllerRef.current
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'audio' | 'image_generation_request' = 'text',
    imageUrl?: string,
    audioUrl?: string,
    maxTokens?: number
  ) => {
    if (!content.trim()) return;

    // Clear previous error and set loading state at the very beginning
    setChatState(prev => ({ ...prev, error: null, isLoading: true }));

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
      currentLeafId: userMessage.id,
    }));

    // Scroll to bottom after adding user message and starting AI response
    setTimeout(() => onScrollToBottom?.(), 100);

    // Initialize AbortController for the new request.
    // Store it in a local variable (`controller`) to ensure we're always referencing the controller for *this* specific request.
    // This helps prevent race conditions if multiple sendMessage calls happen rapidly.
    const controller = new AbortController();
    abortControllerRef.current = controller; // Update ref to the latest controller

    let assistantMessage: Message | null = null; // Initialize assistantMessage here, outside the try block

    try {
      if (type === 'image_generation_request') {
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
          messages: { ...prev.messages, [assistantMessage!.id]: assistantMessage },
          currentLeafId: assistantMessage!.id,
        }));

        // Generate image using Together.ai
        const defaultModel = togetherImageModels[0].id;
        const generatedImageUrl = await generateImageWithTogetherAI(content, defaultModel, 1024, 1024, controller.signal); // Use local controller signal
        
        // Calculate and add image generation cost
        const imageCost = calculateTogetherImageCost(defaultModel);

        // Update assistant message with generated image
        setChatState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [assistantMessage!.id]: {
              ...prev.messages[assistantMessage!.id],
              content: `Generated image for: "${content}"`,
              imageUrl: generatedImageUrl,
              isLoading: false
            }
          },
          conversationCost: prev.conversationCost + imageCost,
        }));

        setTimeout(() => onScrollToBottom?.(), 100);

      } else { // Handle regular text/image/audio messages with OpenRouter
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
          messages: { ...prev.messages, [assistantMessage!.id]: assistantMessage },
          currentLeafId: assistantMessage!.id,
        }));

        // Prepare messages for API (including the new user message).
        // Filter out any loading messages from previous turns to ensure clean history for API.
        const messagesForAPI = [...Object.values(chatState.messages).filter(msg => !msg.isLoading), userMessage];
        const openRouterMessages = convertMessagesToOpenRouterFormat(messagesForAPI, chatState.selectedModel, chatState.contextBlocks, maxTokens || chatState.maxTokens);
        
        await sendMessageToOpenRouter(
          openRouterMessages, 
          chatState.selectedModel,
          // onUpdate callback - append content as it streams
          (chunkContent: string) => {
            setChatState(prev => ({
              ...prev,
              messages: {
                ...prev.messages,
                [assistantMessage!.id]: {
                  ...prev.messages[assistantMessage!.id],
                  content: prev.messages[assistantMessage!.id].content + chunkContent
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
                [assistantMessage!.id]: {
                  ...prev.messages[assistantMessage!.id],
                  isLoading: false // Mark as not loading when complete
                }
              },
              conversationCost: prev.conversationCost + messageCost,
            }));
            // Scroll to bottom when AI response is complete
            setTimeout(() => onScrollToBottom?.(), 100);
          },
          controller.signal // Use local controller signal
        );
      }
    } catch (error) {
      // Check if the error is due to an intentional abort or implicit browser abort
      const isAborted = controller.signal.aborted || 
                         (error instanceof DOMException && error.name === 'AbortError') || 
                         (error instanceof TypeError && error.message.includes('BodyStreamBuffer was aborted'));

      if (isAborted) {
        console.log('Request aborted:', error);
        // If aborted, remove the assistant's loading message from the chat state
        if (assistantMessage) {
          setChatState(prev => {
            const newMessages = { ...prev.messages };
            delete newMessages[assistantMessage!.id]; // Remove the loading message
            return { ...prev, messages: newMessages };
          });
        }
      } else {
        // It's a genuine error, display it to the user
        let errorMessage = 'Failed to send message';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Error sending message:', error);
        // If an error occurred, remove the assistant's loading message and set the error state
        if (assistantMessage) {
          setChatState(prev => {
            const newMessages = { ...prev.messages };
            delete newMessages[assistantMessage!.id];
            return { ...prev, messages: newMessages, error: errorMessage };
          });
        } else {
          setChatState(prev => ({ ...prev, error: errorMessage }));
        }
      }
    } finally {
      // This finally block ensures isLoading is always reset and abortControllerRef is cleared
      // only if it's still pointing to the controller for *this* request.
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setChatState(prev => ({ ...prev, isLoading: false }));
    }
  }, [chatState.messages, chatState.selectedModel, chatState.maxTokens, isCompletionOnlyMode, onScrollToBottom]);

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

  const addContextBlock = useCallback((block: Omit<ContextBlock, 'id' | 'createdAt'>) => {
    const newBlock: ContextBlock = {
      ...block,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      contextBlocks: { ...prev.contextBlocks, [newBlock.id]: newBlock },
    }));

    return newBlock;
  }, []);

  const removeContextBlock = useCallback((blockId: string) => {
    setChatState(prev => {
      const newContextBlocks = { ...prev.contextBlocks };
      delete newContextBlocks[blockId];
      
      // Also remove this context block from any wired messages
      const newMessages = { ...prev.messages };
      Object.values(newMessages).forEach(message => {
        if (message.wiredContextIds?.includes(blockId)) {
          newMessages[message.id] = {
            ...message,
            wiredContextIds: message.wiredContextIds.filter(id => id !== blockId),
          };
        }
      });
      
      return { ...prev, contextBlocks: newContextBlocks, messages: newMessages };
    });
  }, []);

  const wireContextToMessage = useCallback((messageId: string, contextId: string) => {
    setChatState(prev => {
      const message = prev.messages[messageId];
      if (!message) return prev;
      
      const currentWiredIds = message.wiredContextIds || [];
      if (currentWiredIds.includes(contextId)) return prev; // Already wired
      
      const newMessages = {
        ...prev.messages,
        [messageId]: {
          ...message,
          wiredContextIds: [...currentWiredIds, contextId],
        },
      };
      
      return { ...prev, messages: newMessages };
    });
  }, []);

  const unwireContextFromMessage = useCallback((messageId: string, contextId: string) => {
    setChatState(prev => {
      const message = prev.messages[messageId];
      if (!message || !message.wiredContextIds) return prev;
      
      const newMessages = {
        ...prev.messages,
        [messageId]: {
          ...message,
          wiredContextIds: message.wiredContextIds.filter(id => id !== contextId),
        },
      };
      
      return { ...prev, messages: newMessages };
    });
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
    contextBlocks: chatState.contextBlocks,
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
    addContextBlock,
    removeContextBlock,
    wireContextToMessage,
    unwireContextFromMessage,
  };
}