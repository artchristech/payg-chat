import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { sendMessageToOpenRouter, convertMessagesToOpenRouterFormat } from '../utils/api';

export function useChat(onScrollToBottom?: () => void) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'mistralai/mistral-7b-instruct',
    maxTokens: 1024,
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
    type: 'text' | 'image' | 'audio' = 'text',
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

    // Create loading assistant message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      type: 'text',
      isLoading: true,
      timestamp: new Date(),
    };

    // Add both messages to state at once
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true,
    }));

    // Scroll to bottom after adding user message and starting AI response
    setTimeout(() => onScrollToBottom?.(), 100);
    try {
      // Prepare messages for API (including the new user message)
      const messagesForAPI = [...chatState.messages, userMessage];
      const openRouterMessages = convertMessagesToOpenRouterFormat(messagesForAPI, chatState.selectedModel);
      
      await sendMessageToOpenRouter(
        openRouterMessages, 
        chatState.selectedModel,
        maxTokens || chatState.maxTokens,
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
        () => {
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, isLoading: false }
                : msg
            ),
            isLoading: false,
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
        messages: prev.messages.filter(msg => msg.id !== assistantMessage.id),
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

  return {
    ...chatState,
    sendMessage,
    clearChat,
    setSelectedModel,
    setMaxTokens,
    clearError,
  };
  maxTokens: number;
}