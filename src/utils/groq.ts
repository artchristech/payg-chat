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
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'L',
    description: 'Most capable model',
    contextLength: 8192,
    multiModal: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Instant',
    description: 'Fastest responses',
    contextLength: 8192,
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
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file and restart the development server.');
  }

  if (!GROQ_API_KEY.startsWith('gsk_')) {
    throw new Error('Invalid Groq API key format. Groq API keys should start with "gsk_".');
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
      const errorText = await response.text();
      let errorMessage = `Groq API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = 'Invalid Groq API key. Please check your VITE_GROQ_API_KEY in the .env file.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status >= 500) {
        errorMessage = 'Groq API server error. Please try again later.';
      }
      
      console.error('Groq API Response:', errorText);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to Groq API. Please check your internet connection and ensure no firewall or ad-blocker is blocking the request.');
    }
    
    console.error('Error calling Groq API:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while calling Groq API');
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
        const textContent = msg.content.trim();
        const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
        
        // Only include text content if there's actual text from the user
        if (textContent) {
          content.push({ type: 'text', text: textContent });
        }
        
        content.push({ type: 'image_url', image_url: { url: msg.imageUrl } });
        
        return {
          role: msg.role,
          content
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