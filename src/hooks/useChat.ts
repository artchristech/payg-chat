import { useState, useCallback, useMemo } from 'react';
import { Message, ChatState } from '../types/chat';
import { sendMessageToOpenRouter, convertMessagesToOpenRouterFormat } from '../utils/api';

interface ChatStateWithHistory extends ChatState {
  historyIndex: number | null;
}

export function useChat(onScrollToBottom?: () => void) {
  const [chatState, setChatState] = useState<ChatStateWithHistory>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'moonshotai/kimi-k2',
    maxTokens: 150,
    historyIndex: null,
  });

  // Memoize user messages for history navigation
  const userMessages = useMemo(() => {
    return chatState.messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);
  }, [chatState.messages]);

  const navigateHistory = useCallback((direction: 'up' | 'down'): string => {
    if (userMessages.length === 0) return '';

    setChatState(prev => {
      let newIndex: number | null;
      
      if (direction === 'up') {
        if (prev.historyIndex === null) {
          // Start from the most recent message
          newIndex = userMessages.length - 1;
        } else {
          // Go to older message, but don't go below 0
          newIndex = Math.max(0, prev.historyIndex - 1);
        }
      } else { // direction === 'down'
        if (prev.historyIndex === null) {
          // Already at newest, return empty
          return prev;
        } else if (prev.historyIndex >= userMessages.length - 1) {
          // Go to newest (empty input)
          newIndex = null;
        } else {
          // Go to newer message
          newIndex = prev.historyIndex + 1;
        }
      }
      
      return { ...prev, historyIndex: newIndex };
    });

    // Return the content for the new index
    const newIndex = direction === 'up' 
      ? (chatState.historyIndex === null ? userMessages.length - 1 : Math.max(0, chatState.historyIndex - 1))
      : (chatState.historyIndex === null ? '' : 
         chatState.historyIndex >= userMessages.length - 1 ? '' : userMessages[chatState.historyIndex + 1]);
    
    if (typeof newIndex === 'number') {
      return userMessages[newIndex] || '';
    }
    return '';
  }, [userMessages, chatState.historyIndex]);

  const resetHistoryNavigation = useCallback(() => {
    setChatState(prev => ({ ...prev, historyIndex: null }));
  }, []);

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

  // Memoize derived state to prevent unnecessary recalculations
  const memoizedState = useMemo(() => ({
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    selectedModel: chatState.selectedModel,
    maxTokens: chatState.maxTokens,
  }), [chatState]);

  return {
    ...memoizedState,
    sendMessage,
    clearChat,
    setSelectedModel,
    setMaxTokens,
    clearError,
    navigateHistory,
    resetHistoryNavigation,
  };
}