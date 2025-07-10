export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date;
  isLoading?: boolean;
  canContinue?: boolean;
  isChunked?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
}