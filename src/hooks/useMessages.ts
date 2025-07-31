import { useCallback, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  getMessagesForConversation, 
  saveMessage, 
  updateMessage as dbUpdateMessage 
} from '../utils/db';
import { Message } from '../types/chat';

export function useMessages(userId: string) {
  const {
    messages,
    currentConversationId,
    currentLeafId,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setCurrentLeafId,
    setError,
  } = useChatStore();

  // Load messages when conversation changes
  useEffect(() => {
    if (!userId || !currentConversationId) return;

    const loadMessages = async () => {
      try {
        const conversationMessages = await getMessagesForConversation(currentConversationId);
        const messagesMap = conversationMessages.reduce((acc, msg) => {
          acc[msg.id] = msg;
          return acc;
        }, {} as Record<string, Message>);

        setMessages(messagesMap);

        // Set current leaf to last message
        const leafMessage = conversationMessages.length > 0 
          ? conversationMessages[conversationMessages.length - 1] 
          : null;
        setCurrentLeafId(leafMessage?.id || null);
      } catch (error) {
        console.error('Error loading messages:', error);
        setError(error instanceof Error ? error.message : 'Failed to load messages');
      }
    };

    loadMessages();
  }, [userId, currentConversationId, setMessages, setCurrentLeafId, setError]);

  const saveNewMessage = useCallback(async (
    messageData: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message | null> => {
    if (!userId || !currentConversationId) return null;

    try {
      const savedMessage = await saveMessage(currentConversationId, userId, messageData);
      addMessage(savedMessage);
      setCurrentLeafId(savedMessage.id);
      return savedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      setError(error instanceof Error ? error.message : 'Failed to save message');
      return null;
    }
  }, [userId, currentConversationId, addMessage, setCurrentLeafId, setError]);

  const updateMessageData = useCallback(async (
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'promptTokens' | 'completionTokens' | 'cost'>>
  ) => {
    try {
      await dbUpdateMessage(messageId, updates);
      updateMessage(messageId, updates);
    } catch (error) {
      console.error('Error updating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to update message');
    }
  }, [updateMessage, setError]);

  const addTemporaryMessage = useCallback((messageData: Omit<Message, 'timestamp'>) => {
    const tempMessage: Message = {
      ...messageData,
      timestamp: new Date(),
    };
    addMessage(tempMessage);
    setCurrentLeafId(tempMessage.id);
    return tempMessage;
  }, [addMessage, setCurrentLeafId]);

  const removeTemporaryMessage = useCallback((messageId: string) => {
    removeMessage(messageId);
  }, [removeMessage]);

  const revealMessage = useCallback((messageId: string) => {
    updateMessage(messageId, { isHidden: false });
  }, [updateMessage]);

  return {
    messages,
    currentLeafId,
    saveNewMessage,
    updateMessageData,
    addTemporaryMessage,
    removeTemporaryMessage,
    revealMessage,
    setCurrentLeafId,
  };
}