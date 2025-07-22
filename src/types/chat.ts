export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'image_generation_request' | 'generated_image';
  imageUrl?: string;
  audioUrl?: string;
  isLoading?: boolean;
  isHidden?: boolean;
  parentId: string | null;
  wiredContextIds?: string[];
}

export interface ContextBlock {
  id: string;
  type: 'file' | 'text';
  title: string;
  content: string;
  createdAt: Date;
}

export interface ChatState {
  messages: Record<string, Message>;
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
  maxTokens: number;
  conversationCost: number;
  currentLeafId: string | null;
  contextBlocks: Record<string, ContextBlock>;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  multiModal: boolean;
  provider: string;
}

export interface TogetherImageModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface PresetOption {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}