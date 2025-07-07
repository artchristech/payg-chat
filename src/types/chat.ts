export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  isLoading?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
}

export interface GroqModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  multiModal: boolean;
}

export interface PresetOption {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}