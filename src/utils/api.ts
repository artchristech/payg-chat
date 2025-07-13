import { Message } from '../types/chat';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  multiModal: boolean;
  provider: string;
  inputCostPerToken: number;
  outputCostPerToken: number;
}

export const openRouterModels: OpenRouterModel[] = [
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    description: 'xAI\'s latest reasoning model with a 256k context window. Supports parallel tool calling, structured outputs, and both image and text inputs.',
    contextLength: 256000,
    multiModal: true,
    provider: 'xAI',
    inputCostPerToken: 0.000005,
    outputCostPerToken: 0.000015,
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    description: 'High-capacity multimodal language model from Meta, built on MoE architecture. Supports multilingual text and image input. Optimized for vision-language tasks.',
    contextLength: 128000,
    multiModal: true,
    provider: 'Meta',
    inputCostPerToken: 0.000003,
    outputCostPerToken: 0.000009,
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google\'s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks.',
    contextLength: 1000000,
    multiModal: true,
    provider: 'Google',
    inputCostPerToken: 0.00000125,
    outputCostPerToken: 0.000005,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Most capable Claude model with vision',
    contextLength: 200000,
    multiModal: true,
    provider: 'Anthropic',
    inputCostPerToken: 0.000003,
    outputCostPerToken: 0.000015,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Latest GPT-4 with vision and audio',
    contextLength: 128000,
    multiModal: true,
    provider: 'OpenAI',
    inputCostPerToken: 0.0000025,
    outputCostPerToken: 0.00001,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster, cheaper GPT-4 variant',
    contextLength: 128000,
    multiModal: true,
    provider: 'OpenAI',
    inputCostPerToken: 0.00000015,
    outputCostPerToken: 0.0000006,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Meta\'s powerful open-source model',
    contextLength: 131072,
    multiModal: false,
    provider: 'Meta',
    inputCostPerToken: 0.00000088,
    outputCostPerToken: 0.00000088,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    description: 'Fast and efficient Llama model',
    contextLength: 131072,
    multiModal: false,
    provider: 'Meta',
    inputCostPerToken: 0.00000018,
    outputCostPerToken: 0.00000018,
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    description: 'Efficient instruction-following model',
    contextLength: 32768,
    multiModal: false,
    provider: 'Mistral AI',
    inputCostPerToken: 0.00000025,
    outputCostPerToken: 0.00000025,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google\'s advanced multimodal model',
    contextLength: 2000000,
    multiModal: true,
    provider: 'Google',
    inputCostPerToken: 0.00000125,
    outputCostPerToken: 0.000005,
  },
  {
    id: 'perplexity/llama-3.1-sonar-large-128k-online',
    name: 'Sonar Large Online',
    description: 'Real-time web search capabilities',
    contextLength: 127072,
    multiModal: false,
    provider: 'Perplexity',
    inputCostPerToken: 0.000001,
    outputCostPerToken: 0.000001,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and cost-effective Claude model',
    contextLength: 200000,
    multiModal: true,
    provider: 'Anthropic',
    inputCostPerToken: 0.00000025,
    outputCostPerToken: 0.00000125,
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    description: 'Cohere\'s most capable model',
    contextLength: 128000,
    multiModal: false,
    provider: 'Cohere',
    inputCostPerToken: 0.000003,
    outputCostPerToken: 0.000015,
  },
];

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface UsageData {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export async function sendMessageToOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'mistralai/mistral-7b-instruct',
  maxTokens: number = 1024,
  onUpdate?: (content: string) => void,
  onComplete?: (usage?: UsageData) => void
): Promise<void> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file and restart the development server.');
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'payg-chat',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
        top_p: 1,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = 'Invalid OpenRouter API key. Please check your VITE_OPENROUTER_API_KEY in the .env file.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status >= 500) {
        errorMessage = 'OpenRouter API server error. Please try again later.';
      } else if (response.status === 402) {
        errorMessage = 'Insufficient credits. Please add credits to your OpenRouter account.';
      }
      
      console.error('OpenRouter API Response:', errorText);
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalUsage: UsageData | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.(finalUsage);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              // Capture usage data from the final chunk
              if (parsed.usage) {
                finalUsage = parsed.usage;
              }
              
              if (content) {
                onUpdate?.(content);
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
      
      onComplete?.(finalUsage);
    } catch (error) {
      console.error('Error reading stream:', error);
      throw error;
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to OpenRouter API. Please check your internet connection and ensure no firewall or ad-blocker is blocking the request.');
    }
    
    console.error('Error calling OpenRouter API:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while calling OpenRouter API');
  }
}

export function convertMessagesToOpenRouterFormat(messages: Message[], selectedModelId: string): OpenRouterMessage[] {
  // Find the selected model to check if it supports multimodal input
  const selectedModel = openRouterModels.find(model => model.id === selectedModelId);
  const isMultiModal = selectedModel?.multiModal || false;

  const convertedMessages = messages
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

  return convertedMessages;
}