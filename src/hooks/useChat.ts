import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { sendMessageToGroq, convertMessagesToGroqFormat } from '../utils/groq';
import { estimateTokens, shouldChunkResponse, findChunkBreakpoint } from '../utils/tokenCounter';

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
    audioUrl?: string,
    isContinuation: boolean = false,
    continuationMessageId?: string
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
    let assistantMessage: Message;
    
    if (isContinuation && continuationMessageId) {
      // Find the message to continue
      const messageToUpdate = chatState.messages.find(msg => msg.id === continuationMessageId);
      if (!messageToUpdate) return;
      
      // Update the existing message to show loading state
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === continuationMessageId
            ? { ...msg, isLoading: true, canContinue: false }
            : msg
        ),
        isLoading: true,
      }));
      
      assistantMessage = messageToUpdate;
    } else {
      // Create new assistant message
      assistantMessage = {
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
    }

    let accumulatedContent = isContinuation ? assistantMessage.content : '';

    try {
      // Prepare messages for API (including the new user message)
      const messagesForAPI = isContinuation 
        ? [...chatState.messages.filter(msg => msg.id !== continuationMessageId), userMessage]
        : [...chatState.messages, userMessage];
        
      const groqMessages = convertMessagesToGroqFormat(messagesForAPI, chatState.selectedModel);
      
      // Add continuation prompt if this is a continuation
      if (isContinuation) {
        groqMessages.push({
          role: 'user',
          content: 'Please continue your previous response from where you left off.'
        });
      }
      
      await sendMessageToGroq(
        groqMessages, 
        chatState.selectedModel,
        // onUpdate callback - append content as it streams
        (content: string) => {
          accumulatedContent += content;
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: accumulatedContent }
                : msg
            ),
          }));
        },
        // onComplete callback - mark as finished
        () => {
          // Check if the response should be chunked
          const shouldChunk = shouldChunkResponse(accumulatedContent);
          let finalContent = accumulatedContent;
          let canContinue = false;
          
          if (shouldChunk && !isContinuation) {
            // Find a good breakpoint for the first chunk
            const breakpoint = findChunkBreakpoint(accumulatedContent);
            finalContent = accumulatedContent.substring(0, breakpoint);
            canContinue = breakpoint < accumulatedContent.length;
          }
          
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    content: finalContent,
                    isLoading: false,
                    canContinue: canContinue,
                    isChunked: shouldChunk,
                    chunkIndex: 1,
                    totalChunks: shouldChunk ? Math.ceil(estimateTokens(accumulatedContent) / 400) : 1
                  }
                : msg
            ),
            isLoading: false,
          }));
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
        messages: isContinuation 
          ? prev.messages.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, isLoading: false, canContinue: false }
                : msg
            )
          : prev.messages.filter(msg => msg.id !== assistantMessage.id),
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [chatState.messages, chatState.selectedModel]);

  const continueMessage = useCallback(async (messageId: string) => {
    const messageToUpdate = chatState.messages.find(msg => msg.id === messageId);
    if (!messageToUpdate) return;
    
    // Create a continuation prompt
    await sendMessage(
      'Continue the previous response',
      'text',
      undefined,
      undefined,
      true,
      messageId
    );
  }, [chatState.messages, sendMessage]);

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
    continueMessage,
    clearChat,
    setSelectedModel,
    clearError,
  };
}