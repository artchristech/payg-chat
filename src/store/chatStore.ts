import { create } from 'zustand';
import { Message, Conversation, ContextBlock } from '../types/chat';

interface ChatState {
  // Conversations
  conversations: Record<string, Conversation>;
  currentConversationId: string | null;
  
  // Messages
  messages: Record<string, Message>;
  currentLeafId: string | null;
  
  // Chat settings
  selectedModel: string;
  maxTokens: number;
  conversationCost: number;
  
  // Context blocks
  contextBlocks: Record<string, ContextBlock>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  // Conversations
  setConversations: (conversations: Record<string, Conversation>) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setCurrentConversationId: (id: string | null) => void;
  
  // Messages
  setMessages: (messages: Record<string, Message>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setCurrentLeafId: (id: string | null) => void;
  clearMessages: () => void;
  
  // Chat settings
  setSelectedModel: (model: string) => void;
  setMaxTokens: (tokens: number) => void;
  setConversationCost: (cost: number) => void;
  
  // Context blocks
  setContextBlocks: (blocks: Record<string, ContextBlock>) => void;
  addContextBlock: (block: ContextBlock) => void;
  removeContextBlock: (id: string) => void;
  wireContextToMessage: (messageId: string, contextId: string) => void;
  unwireContextFromMessage: (messageId: string, contextId: string) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // Initial state
  conversations: {},
  currentConversationId: null,
  messages: {},
  currentLeafId: null,
  selectedModel: 'moonshotai/kimi-k2',
  maxTokens: 150,
  conversationCost: 0,
  contextBlocks: {},
  isLoading: false,
  error: null,

  // Conversations actions
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => ({
    conversations: { ...state.conversations, [conversation.id]: conversation }
  })),
  updateConversation: (id, updates) => set((state) => ({
    conversations: {
      ...state.conversations,
      [id]: { ...state.conversations[id], ...updates }
    }
  })),
  removeConversation: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.conversations;
    return { conversations: rest };
  }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  // Messages actions
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: { ...state.messages, [message.id]: message }
  })),
  updateMessage: (id, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [id]: { ...state.messages[id], ...updates }
    }
  })),
  removeMessage: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.messages;
    return { messages: rest };
  }),
  setCurrentLeafId: (id) => set({ currentLeafId: id }),
  clearMessages: () => set({ messages: {}, currentLeafId: null }),

  // Chat settings actions
  setSelectedModel: (model) => set({ selectedModel: model }),
  setMaxTokens: (tokens) => set({ maxTokens: tokens }),
  setConversationCost: (cost) => set({ conversationCost: cost }),

  // Context blocks actions
  setContextBlocks: (blocks) => set({ contextBlocks: blocks }),
  addContextBlock: (block) => set((state) => ({
    contextBlocks: { ...state.contextBlocks, [block.id]: block }
  })),
  removeContextBlock: (id) => set((state) => {
    const { [id]: removed, ...rest } = state.contextBlocks;
    // Also remove from any wired messages
    const updatedMessages = { ...state.messages };
    Object.values(updatedMessages).forEach(message => {
      if (message.wiredContextIds?.includes(id)) {
        updatedMessages[message.id] = {
          ...message,
          wiredContextIds: message.wiredContextIds.filter(contextId => contextId !== id),
        };
      }
    });
    return { contextBlocks: rest, messages: updatedMessages };
  }),
  wireContextToMessage: (messageId, contextId) => set((state) => {
    const message = state.messages[messageId];
    if (!message) return state;
    
    const currentWiredIds = message.wiredContextIds || [];
    if (currentWiredIds.includes(contextId)) return state;
    
    return {
      messages: {
        ...state.messages,
        [messageId]: {
          ...message,
          wiredContextIds: [...currentWiredIds, contextId],
        },
      },
    };
  }),
  unwireContextFromMessage: (messageId, contextId) => set((state) => {
    const message = state.messages[messageId];
    if (!message || !message.wiredContextIds) return state;
    
    return {
      messages: {
        ...state.messages,
        [messageId]: {
          ...message,
          wiredContextIds: message.wiredContextIds.filter(id => id !== contextId),
        },
      },
    };
  }),

  // UI state actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));