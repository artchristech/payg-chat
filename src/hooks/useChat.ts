import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { sendMessageToGroq, convertMessagesToGroqFormat } from '../utils/groq';

export function useChat() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'llama-3.1-8b-instant',
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
    audioUrl?: string
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

    try {
      // Prepare messages for API (including the new user message)
      const messagesForAPI = [...chatState.messages, userMessage];
      const groqMessages = convertMessagesToGroqFormat(messagesForAPI);
      const response = await sendMessageToGroq(groqMessages, chatState.selectedModel);

      // Update assistant message with response
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: response, isLoading: false }
            : msg
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== assistantMessage.id),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [chatState.messages, chatState.selectedModel]);

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

  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...chatState,
    sendMessage,
    clearChat,
    setSelectedModel,
    clearError,
  };
}