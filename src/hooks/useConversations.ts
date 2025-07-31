import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { 
  createConversation, 
  getConversations, 
  updateConversation as dbUpdateConversation,
  deleteConversation as dbDeleteConversation,
  generateConversationTitle 
} from '../utils/db';
import { Conversation } from '../types/chat';

export function useConversations(userId: string) {
  const {
    conversations,
    currentConversationId,
    selectedModel,
    maxTokens,
    conversationCost,
    setConversations,
    addConversation,
    updateConversation,
    removeConversation,
    setCurrentConversationId,
    setConversationCost,
    clearMessages,
    setError,
  } = useChatStore();

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const userConversations = await getConversations(userId);
      const conversationsMap = userConversations.reduce((acc, conv) => {
        acc[conv.id] = conv;
        return acc;
      }, {} as Record<string, Conversation>);

      setConversations(conversationsMap);

      // Set current conversation to most recent if none selected
      if (!currentConversationId && userConversations.length > 0) {
        setCurrentConversationId(userConversations[0].id);
        setConversationCost(userConversations[0].cost);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations');
    }
  }, [userId, currentConversationId, setConversations, setCurrentConversationId, setConversationCost, setError]);

  const createNewConversation = useCallback(async (title: string = 'New Chat') => {
    if (!userId) return null;

    try {
      const newConversation = await createConversation(userId, title, selectedModel, maxTokens);
      addConversation(newConversation);
      setCurrentConversationId(newConversation.id);
      setConversationCost(0);
      clearMessages();
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create conversation');
      return null;
    }
  }, [userId, selectedModel, maxTokens, addConversation, setCurrentConversationId, setConversationCost, clearMessages, setError]);

  const switchConversation = useCallback(async (conversationId: string) => {
    if (!userId || !conversations[conversationId]) return;

    setCurrentConversationId(conversationId);
    setConversationCost(conversations[conversationId].cost);
    clearMessages(); // Messages will be loaded by useMessages hook
  }, [userId, conversations, setCurrentConversationId, setConversationCost, clearMessages]);

  const updateConversationData = useCallback(async (
    conversationId: string, 
    updates: Partial<Pick<Conversation, 'title' | 'cost' | 'lastMessageAt'>>
  ) => {
    if (!userId) return;

    try {
      await dbUpdateConversation(conversationId, updates);
      updateConversation(conversationId, updates);
      
      // Update conversation cost in store if it's the current conversation
      if (conversationId === currentConversationId && updates.cost !== undefined) {
        setConversationCost(updates.cost);
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to update conversation');
    }
  }, [userId, currentConversationId, updateConversation, setConversationCost, setError]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) return;

    const isDeletingCurrentConversation = currentConversationId === conversationId;

    try {
      await dbDeleteConversation(conversationId);
      removeConversation(conversationId);

      if (isDeletingCurrentConversation) {
        // Create new conversation if current one was deleted
        await createNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  }, [userId, currentConversationId, removeConversation, createNewConversation, setError]);

  const generateAndUpdateTitle = useCallback(async (conversationId: string, firstMessage: string) => {
    const title = generateConversationTitle(firstMessage);
    await updateConversationData(conversationId, { title });
  }, [updateConversationData]);

  return {
    conversations,
    currentConversationId,
    loadConversations,
    createNewConversation,
    switchConversation,
    updateConversationData,
    deleteConversation,
    generateAndUpdateTitle,
  };
}