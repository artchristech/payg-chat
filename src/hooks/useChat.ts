import { useState, useCallback, useMemo, useRef } from 'react';
import { Message, ChatState, Conversation } from '../types/chat';
import { sendMessageToOpenRouter, convertMessagesToOpenRouterFormat, generateImageWithTogetherAI, togetherImageModels, calculateOpenRouterCost, calculateTogetherImageCost } from '../utils/api';
import { 
  createConversation, 
  getConversations, 
  getMessagesForConversation, 
  saveMessage, 
  updateMessage, 
  updateConversation, 
  deleteConversation as dbDeleteConversation,
  generateConversationTitle 
} from '../utils/db';

export function useChat(userId: string, onScrollToBottom?: () => void) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: {},
    isLoading: false,
    error: null,
    selectedModel: 'moonshotai/kimi-k2',
    maxTokens: 150,
    conversationCost: 0,
    currentLeafId: null,
    contextBlocks: {},
    currentConversationId: null,
    conversations: {},
  });
  const [isCompletionOnlyMode, setIsCompletionOnlyMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chat - load conversations and create new one if needed
  const initializeChat = useCallback(async () => {
    if (!userId || isInitialized) return;

    try {
      // Load all conversations
      const conversations = await getConversations(userId);
      const conversationsMap = conversations.reduce((acc, conv) => {
        acc[conv.id] = conv;
        return acc;
      }, {} as Record<string, Conversation>);

      // Create a new conversation if none exist
      let currentConversationId: string | null = null;
      if (conversations.length === 0) {
        const newConversation = await createConversation(
          userId,
          'New Chat',
          chatState.selectedModel,
          chatState.maxTokens
        );
        conversationsMap[newConversation.id] = newConversation;
        currentConversationId = newConversation.id;
      } else {
        // Use the most recent conversation
        currentConversationId = conversations[0].id;
        
        // Load messages for the current conversation
        const messages = await getMessagesForConversation(currentConversationId);
        const messagesMap = messages.reduce((acc, msg) => {
          acc[msg.id] = msg;
          return acc;
        }, {} as Record<string, Message>);

        // Find the current leaf (last message in the conversation)
        const leafMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        setChatState(prev => ({
          ...prev,
          messages: messagesMap,
          currentLeafId: leafMessage?.id || null,
          conversationCost: conversations[0].cost,
        }));
      }

      setChatState(prev => ({
        ...prev,
        conversations: conversationsMap,
        currentConversationId,
      }));

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize chat',
      }));
    }
  }, [userId, isInitialized, chatState.selectedModel, chatState.maxTokens]);

  // Initialize on mount or when userId changes
  React.useEffect(() => {
    if (userId) {
      initializeChat();
    }
  }, [userId, initializeChat]);

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
    maxTokens?: number,
    fileName?: string,
    fileType?: string
  ) => {
    if (!content.trim()) return;
    if (!chatState.currentConversationId) {
      setChatState(prev => ({ ...prev, error: 'No active conversation' }));
      return;
    }

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
      fileName,
      fileType,
      timestamp: new Date(),
      parentId: chatState.currentLeafId,
    };

    let savedUserMessage: Message | null = null;

    try {
      // Save user message to database
      savedUserMessage = await saveMessage(chatState.currentConversationId, userId, {
        role: userMessage.role,
        content: userMessage.content,
        type: userMessage.type,
        imageUrl: userMessage.imageUrl,
        audioUrl: userMessage.audioUrl,
        fileName: userMessage.fileName,
        fileType: userMessage.fileType,
        parentId: userMessage.parentId,
      });

      // Update local state with the saved message
      setChatState(prev => ({
        ...prev,
        messages: { ...prev.messages, [savedUserMessage!.id]: savedUserMessage! },
        currentLeafId: savedUserMessage!.id,
      }));
    } catch (error) {
      console.error('Error saving user message:', error);
      setChatState(prev => ({ 
        ...prev, 
        error: 'Failed to save message',
        isLoading: false 
      }));
      return;
    }

    // Add user message first

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
          parentId: savedUserMessage.id,
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

        // Save assistant message to database
        const finalAssistantMessage = await saveMessage(chatState.currentConversationId, userId, {
          role: 'assistant',
          content: `Generated image for: "${content}"`,
          type: 'generated_image',
          imageUrl: generatedImageUrl,
          parentId: savedUserMessage.id,
          cost: imageCost,
          modelId: defaultModel,
        });

        // Update local state and conversation cost
        setChatState(prev => {
          const newConversationCost = prev.conversationCost + imageCost;
          return {
            ...prev,
            messages: {
              ...prev.messages,
              [finalAssistantMessage.id]: finalAssistantMessage
            },
            conversationCost: newConversationCost,
            currentLeafId: finalAssistantMessage.id,
          };
        });

        // Update conversation in database
        await updateConversation(chatState.currentConversationId, {
          cost: chatState.conversationCost + imageCost,
          lastMessageAt: new Date(),
        });

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
          parentId: savedUserMessage.id,
        };

        setChatState(prev => ({
          ...prev,
          messages: { ...prev.messages, [assistantMessage!.id]: assistantMessage },
          currentLeafId: assistantMessage!.id,
        }));

        // Prepare messages for API (including the new user message).
        // Filter out any loading messages from previous turns to ensure clean history for API.
        const messagesForAPI = [...Object.values(chatState.messages).filter(msg => !msg.isLoading), savedUserMessage];
        const openRouterMessages = convertMessagesToOpenRouterFormat(messagesForAPI, chatState.selectedModel, chatState.contextBlocks, maxTokens || chatState.maxTokens);
        
        let assistantContent = '';
        let savedAssistantMessage: Message | null = null;
        
        await sendMessageToOpenRouter(
          openRouterMessages, 
          chatState.selectedModel,
          // onUpdate callback - append content as it streams
          (chunkContent: string) => {
            assistantContent += chunkContent;
            setChatState(prev => ({
              ...prev,
              messages: {
                ...prev.messages,
                [assistantMessage!.id]: {
                  ...prev.messages[assistantMessage!.id],
                  content: assistantContent
                }
              },
            }));
          },
          // onComplete callback - mark as finished
          async (usage) => {
            // Calculate cost based on token usage
            let messageCost = 0;
            if (usage) {
              messageCost = calculateOpenRouterCost(
                chatState.selectedModel,
                usage.prompt_tokens,
                usage.completion_tokens
              );
            }
            
            try {
              // Save assistant message to database
              savedAssistantMessage = await saveMessage(chatState.currentConversationId, userId, {
                role: 'assistant',
                content: assistantContent,
                type: 'text',
                parentId: savedUserMessage.id,
                isHidden: isCompletionOnlyMode,
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                cost: messageCost,
                modelId: chatState.selectedModel,
              });

              // Update local state
              setChatState(prev => {
                const newConversationCost = prev.conversationCost + messageCost;
                return {
                  ...prev,
                  messages: {
                    ...prev.messages,
                    [savedAssistantMessage!.id]: savedAssistantMessage!
                  },
                  conversationCost: newConversationCost,
                  currentLeafId: savedAssistantMessage!.id,
                };
              });

              // Update conversation title if this is the first exchange
              const isFirstExchange = Object.keys(chatState.messages).length === 0;
              const conversationUpdates: any = {
                cost: chatState.conversationCost + messageCost,
                lastMessageAt: new Date(),
              };
              
              if (isFirstExchange) {
                conversationUpdates.title = generateConversationTitle(savedUserMessage.content);
              }

              await updateConversation(chatState.currentConversationId, conversationUpdates);
              
              // Update conversation title in local state if it was the first exchange
              if (isFirstExchange) {
                setChatState(prev => ({
                  ...prev,
                  conversations: {
                    ...prev.conversations,
                    [chatState.currentConversationId!]: {
                      ...prev.conversations[chatState.currentConversationId!],
                      title: conversationUpdates.title,
                    }
                  }
                }));
              }
            } catch (error) {
              console.error('Error saving assistant message:', error);
            }
            
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
  }, [chatState.messages, chatState.selectedModel, chatState.maxTokens, chatState.currentConversationId, chatState.conversationCost, isCompletionOnlyMode, userId, onScrollToBottom]);

  const clearChat = useCallback(async () => {
    if (!userId) return;

    try {
      // Create a new conversation
      const newConversation = await createConversation(
        userId,
        'New Chat',
        chatState.selectedModel,
        chatState.maxTokens
      );

      setChatState(prev => ({
        ...prev,
        messages: {},
        error: null,
        conversationCost: 0,
        currentLeafId: null,
        currentConversationId: newConversation.id,
        conversations: {
          ...prev.conversations,
          [newConversation.id]: newConversation,
        },
      }));
    } catch (error) {
      console.error('Error creating new conversation:', error);
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create new conversation',
      }));
    }
  }, [userId, chatState.selectedModel, chatState.maxTokens]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      setChatState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load messages for the conversation
      const messages = await getMessagesForConversation(conversationId);
      const messagesMap = messages.reduce((acc, msg) => {
        acc[msg.id] = msg;
        return acc;
      }, {} as Record<string, Message>);

      // Find the current leaf (last message in the conversation)
      const leafMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      // Get conversation cost
      const conversation = chatState.conversations[conversationId];
      const conversationCost = conversation?.cost || 0;

      setChatState(prev => ({
        ...prev,
        messages: messagesMap,
        currentLeafId: leafMessage?.id || null,
        currentConversationId: conversationId,
        conversationCost,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading conversation:', error);
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoading: false,
      }));
    }
  }, [userId, chatState.conversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      await dbDeleteConversation(conversationId);

      setChatState(prev => {
        const newConversations = { ...prev.conversations };
        delete newConversations[conversationId];

        // If we're deleting the current conversation, clear the chat
        const isCurrentConversation = prev.currentConversationId === conversationId;
        
        return {
          ...prev,
          conversations: newConversations,
          ...(isCurrentConversation && {
            messages: {},
            currentLeafId: null,
            currentConversationId: null,
            conversationCost: 0,
          }),
        };
      });

      // If we deleted the current conversation, create a new one
      if (chatState.currentConversationId === conversationId) {
        await clearChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      }));
    }
  }, [userId, chatState.currentConversationId, clearChat]);

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
    currentConversationId: chatState.currentConversationId,
    conversations: chatState.conversations,
  }), [chatState]);

  return {
    ...memoizedState,
    sendMessage,
    clearChat,
    loadConversation,
    deleteConversation,
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