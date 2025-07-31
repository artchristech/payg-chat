// Legacy hook - now uses the new modular architecture
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';
import { useChatAPI } from './useChatAPI';
import { useContextBlocks } from './useContextBlocks';
import { useChatStore } from '../store/chatStore';
import { useState, useCallback, useEffect } from 'react';

export function useChat(userId: string, onScrollToBottom?: () => void) {
  const [isCompletionOnlyMode, setIsCompletionOnlyMode] = useState(false);
  
  // Get state from Zustand store
  const {
    selectedModel,
    maxTokens,
    setSelectedModel,
    setMaxTokens,
    clearError,
    error,
    messages,
    conversations,
    currentConversationId,
    currentLeafId,
    conversationCost,
    contextBlocks,
  } = useChatStore();

  // Use the new modular hooks
  const {
    loadConversations,
    createNewConversation,
    switchConversation,
    deleteConversation,
    updateConversationData,
    generateAndUpdateTitle,
  } = useConversations(userId);

  const {
    saveNewMessage,
    revealMessage,
    setCurrentLeafId,
  } = useMessages(userId);

  const {
    isLoading,
    sendTextMessage,
    generateImage,
    cancelRequest,
  } = useChatAPI();

  const {
    createContextBlock,
    deleteContextBlock,
    wireContext,
    unwireContext,
  } = useContextBlocks();

  // Initialize on mount
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  // Legacy sendMessage function that orchestrates the new hooks
  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'audio' | 'image_generation_request' = 'text',
    imageUrl?: string,
    audioUrl?: string,
    maxTokensOverride?: number,
    fileName?: string,
    fileType?: string
  ) => {
    if (!content.trim() || !currentConversationId) return;

    try {
      // Save user message
      const userMessage = await saveNewMessage({
        role: 'user',
        content,
        type,
        imageUrl,
        audioUrl,
        fileName,
        fileType,
        parentId: currentLeafId,
      });

      if (!userMessage) return;

      setTimeout(() => onScrollToBottom?.(), 100);

      if (type === 'image_generation_request') {
        // Handle image generation
        const { imageUrl: generatedImageUrl, cost } = await generateImage(content);
        
        await saveNewMessage({
          role: 'assistant',
          content: `Generated image for: "${content}"`,
          type: 'generated_image',
          imageUrl: generatedImageUrl,
          parentId: userMessage.id,
          cost,
          modelId: 'black-forest-labs/FLUX.1-schnell',
        });

        await updateConversationData(currentConversationId, {
          cost: conversationCost + cost,
          lastMessageAt: new Date(),
        });
      } else {
        // Handle text/image/audio messages
        const messagesForAPI = Object.values(messages).filter(msg => !msg.isLoading);
        messagesForAPI.push(userMessage);

        let assistantContent = '';
        let assistantMessageId: string | null = null;

        // Create temporary loading message
        const tempMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: '',
          type: 'text' as const,
          isLoading: true,
          isHidden: isCompletionOnlyMode,
          parentId: userMessage.id,
        };

        // Add to store temporarily
        useChatStore.getState().addMessage({ ...tempMessage, timestamp: new Date() });
        setCurrentLeafId(tempMessage.id);

        await sendTextMessage(
          messagesForAPI,
          maxTokensOverride || maxTokens,
          // onUpdate
          (content: string) => {
            assistantContent = content;
            useChatStore.getState().updateMessage(tempMessage.id, { content });
          },
          // onComplete
          async (usage: any) => {
            // Remove temporary message
            useChatStore.getState().removeMessage(tempMessage.id);

            // Save final message
            const finalMessage = await saveNewMessage({
              role: 'assistant',
              content: assistantContent,
              type: 'text',
              parentId: userMessage.id,
              isHidden: isCompletionOnlyMode,
              promptTokens: usage?.prompt_tokens || 0,
              completionTokens: usage?.completion_tokens || 0,
              cost: usage?.cost || 0,
              modelId: selectedModel,
            });

            if (finalMessage) {
              assistantMessageId = finalMessage.id;
              
              // Update conversation
              const isFirstExchange = Object.keys(messages).length <= 2;
              const updates: any = {
                cost: conversationCost + (usage?.cost || 0),
                lastMessageAt: new Date(),
              };
              
              if (isFirstExchange) {
                await generateAndUpdateTitle(currentConversationId, userMessage.content);
              }
              
              await updateConversationData(currentConversationId, updates);
            }

            setTimeout(() => onScrollToBottom?.(), 100);
          }
        );
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [
    currentConversationId,
    currentLeafId,
    maxTokens,
    selectedModel,
    conversationCost,
    isCompletionOnlyMode,
    messages,
    saveNewMessage,
    generateImage,
    sendTextMessage,
    updateConversationData,
    generateAndUpdateTitle,
    setCurrentLeafId,
    onScrollToBottom,
  ]);

  // Legacy wrapper functions
  const clearChat = useCallback(() => {
    createNewConversation();
  }, [createNewConversation]);

  const loadConversation = useCallback((conversationId: string) => {
    switchConversation(conversationId);
  }, [switchConversation]);

  const revealMessageContent = useCallback((messageId: string) => {
    revealMessage(messageId);
  }, [revealMessage]);

  const setCurrentLeaf = useCallback((messageId: string) => {
    setCurrentLeafId(messageId);
  }, [setCurrentLeafId]);

  const addContextBlock = useCallback((block: any) => {
    return createContextBlock(block);
  }, [createContextBlock]);

  const removeContextBlock = useCallback((blockId: string) => {
    deleteContextBlock(blockId);
  }, [deleteContextBlock]);

  const wireContextToMessage = useCallback((messageId: string, contextId: string) => {
    wireContext(messageId, contextId);
  }, [wireContext]);

  const unwireContextFromMessage = useCallback((messageId: string, contextId: string) => {
    unwireContext(messageId, contextId);
  }, [unwireContext]);

  return {
    messages,
    isLoading,
    error,
    selectedModel,
    maxTokens,
    conversationCost,
    currentLeafId,
    contextBlocks,
    currentConversationId,
    conversations,
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