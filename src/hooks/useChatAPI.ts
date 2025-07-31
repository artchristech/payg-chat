import { useCallback, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  sendMessageToOpenRouter, 
  convertMessagesToOpenRouterFormat, 
  generateImageWithTogetherAI, 
  togetherImageModels, 
  OpenRouterMessage,
  calculateOpenRouterCost,
  calculateTogetherImageCost 
} from '../utils/api';
import { Message } from '../types/chat';

export function useChatAPI() {
  const {
    messages,
    selectedModel,
    contextBlocks,
    isLoading,
    setLoading,
    setError,
    clearError,
  } = useChatStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('Aborting current request...');
      abortControllerRef.current.abort();
    }
  }, []);

  const sendTextMessage = useCallback(async (
    messagesForAPI: Message[],
    maxTokens?: number,
    onUpdate?: (content: string) => void,
    onComplete?: (usage?: { prompt_tokens: number; completion_tokens: number }) => void
  ) => {
    clearError();
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Determine the content for RAG search: user's text message or uploaded file content
      const lastUserMessage = messagesForAPI[messagesForAPI.length - 1];
      const ragSearchQuery = lastUserMessage.fileContent || lastUserMessage.content;

      let ragContext = '';
      if (ragSearchQuery) {
        try {
          const relevantChunks = await searchVectorStore(ragSearchQuery, 'user_id_placeholder', 5, 0.7); // TODO: Replace 'user_id_placeholder' with actual userId
          if (relevantChunks.length > 0) {
            ragContext = relevantChunks.map(chunk => chunk.content).join('\n\n');
          }
        } catch (ragError) {
          console.warn('Failed to retrieve RAG context:', ragError);
        }
      }

      const openRouterMessages = convertMessagesToOpenRouterFormat(
        messagesForAPI, 
        selectedModel, 
        contextBlocks, // Wired context blocks
        maxTokens
        ragContext // Automatic RAG context
      );

      let assistantContent = '';
      
      await sendMessageToOpenRouter(
        openRouterMessages,
        selectedModel,
        // onUpdate callback
        (chunkContent: string) => {
          assistantContent += chunkContent;
          onUpdate?.(assistantContent);
        },
        // onComplete callback
        async (usage) => {
          let messageCost = 0;
          if (usage) {
            messageCost = calculateOpenRouterCost(
              selectedModel,
              usage.prompt_tokens,
              usage.completion_tokens
            );
          }
          
          onComplete?.({ 
            ...usage, 
            cost: messageCost,
            content: assistantContent 
          });
        },
        controller.signal
      );
    } catch (error) {
      const isAborted = controller.signal.aborted || 
                       (error instanceof DOMException && error.name === 'AbortError') || 
                       (error instanceof TypeError && error.message.includes('BodyStreamBuffer was aborted'));

      if (!isAborted) {
        let errorMessage = 'Failed to send message';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Error sending message:', error);
        setError(errorMessage);
      }
      
      throw error;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  }, [selectedModel, contextBlocks, setLoading, setError, clearError]);

  const generateImage = useCallback(async (
    prompt: string,
    onComplete?: (imageUrl: string, cost: number) => void
  ) => {
    clearError();
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const defaultModel = togetherImageModels[0].id;
      const generatedImageUrl = await generateImageWithTogetherAI(
        prompt, 
        defaultModel, 
        1024, 
        1024, 
        controller.signal
      );
      
      const imageCost = calculateTogetherImageCost(defaultModel);
      onComplete?.(generatedImageUrl, imageCost);
      
      return { imageUrl: generatedImageUrl, cost: imageCost };
    } catch (error) {
      const isAborted = controller.signal.aborted || 
                       (error instanceof DOMException && error.name === 'AbortError');

      if (!isAborted) {
        let errorMessage = 'Failed to generate image';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Error generating image:', error);
        setError(errorMessage);
      }
      
      throw error;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  }, [setLoading, setError, clearError]);

  return {
    isLoading,
    sendTextMessage,
    generateImage,
    cancelRequest,
  };
}