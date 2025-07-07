import { Message } from '../types/chat';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  multiModal: boolean;
}

export const groqModels: GroqModel[] = [
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision',
    description: 'Multimodal model with vision capabilities',
    contextLength: 8192,
    multiModal: true,
  },
  {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 11B Vision',
    description: 'Smaller multimodal model',
    contextLength: 8192,
    multiModal: true,
  },
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B',
    description: 'Large language model for complex tasks',
    contextLength: 32768,
    multiModal: false,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Fast, efficient model for quick responses',
    contextLength: 8192,
    multiModal: false,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    description: 'Mixture of experts model',
    contextLength: 32768,
    multiModal: false,
  },
];

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export async function sendMessageToGroq(
  messages: GroqMessage[],
  model: string = 'llama-3.1-8b-instant'
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your environment variables.');
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

export function convertMessagesToGroqFormat(messages: Message[], selectedModelId: string): GroqMessage[] {
  // Find the selected model to check if it supports multimodal input
  const selectedModel = groqModels.find(model => model.id === selectedModelId);
  const isMultiModal = selectedModel?.multiModal || false;

  return messages
    .filter(msg => msg.role !== 'assistant' || !msg.isLoading)
    .map(msg => {
      // Only include image content if the model supports multimodal input
      if (msg.type === 'image' && msg.imageUrl && isMultiModal) {
        const textContent = msg.content.trim() || 'User sent an image.';
        return {
          role: msg.role,
          content: [
            { type: 'text', text: textContent },
            { type: 'image_url', image_url: { url: msg.imageUrl } }
          ]
        };
      }
      // For non-multimodal models or text messages, send only text content
      // Ensure content is never empty
      const textContent = msg.content.trim() || (msg.type === 'image' ? 'User sent an image.' : 'User sent a message.');
      return {
        role: msg.role,
        content: textContent
      };
    });
}