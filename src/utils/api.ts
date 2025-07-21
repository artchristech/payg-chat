import { Message } from '../types/chat';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY;
const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

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

export const togetherImageModels: TogetherImageModel[] = [
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX.1 Schnell',
    description: 'Fast, high-quality image generation model',
    provider: 'Black Forest Labs',
  },
  {
    id: 'black-forest-labs/FLUX.1-dev',
    name: 'FLUX.1 Dev',
    description: 'Development version with enhanced capabilities',
    provider: 'Black Forest Labs',
  },
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL',
    description: 'High-resolution image generation',
    provider: 'Stability AI',
  },
];

export const openRouterModels: OpenRouterModel[] = [
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    description: 'xAI\'s latest reasoning model with a 256k context window. Supports parallel tool calling, structured outputs, and both image and text inputs.',
    contextLength: 256000,
    multiModal: true,
    provider: 'xAI',
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.06,
  },
  {
    id: 'moonshotai/kimi-k2',
    name: 'Kimi K2',
    description: 'Moonshot AI\'s advanced language model with strong reasoning capabilities and multilingual support.',
    contextLength: 128000,
    multiModal: false,
    provider: 'Moonshot AI',
    inputCostPer1kTokens: 0.0015,
    outputCostPer1kTokens: 0.006,
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google\'s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks.',
    contextLength: 1000000,
    multiModal: true,
    provider: 'Google',
    inputCostPer1kTokens: 0.00125,
    outputCostPer1kTokens: 0.005,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Most capable Claude model with vision',
    contextLength: 200000,
    multiModal: true,
    provider: 'Anthropic',
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Latest GPT-4 with vision and audio',
    contextLength: 128000,
    multiModal: true,
    provider: 'OpenAI',
    inputCostPer1kTokens: 0.0025,
    outputCostPer1kTokens: 0.01,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster, cheaper GPT-4 variant',
    contextLength: 128000,
    multiModal: true,
    provider: 'OpenAI',
    inputCostPer1kTokens: 0.00015,
    outputCostPer1kTokens: 0.0006,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Meta\'s powerful open-source model',
    contextLength: 131072,
    multiModal: false,
    provider: 'Meta',
    inputCostPer1kTokens: 0.00088,
    outputCostPer1kTokens: 0.00088,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    description: 'Fast and efficient Llama model',
    contextLength: 131072,
    multiModal: false,
    provider: 'Meta',
    inputCostPer1kTokens: 0.00018,
    outputCostPer1kTokens: 0.00018,
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    description: 'Efficient instruction-following model',
    contextLength: 32768,
    multiModal: false,
    provider: 'Mistral AI',
    inputCostPer1kTokens: 0.00025,
    outputCostPer1kTokens: 0.00025,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google\'s advanced multimodal model',
    contextLength: 2000000,
    multiModal: true,
    provider: 'Google',
    inputCostPer1kTokens: 0.00125,
    outputCostPer1kTokens: 0.005,
  },
  {
    id: 'perplexity/llama-3.1-sonar-large-128k-online',
    name: 'Sonar Large Online',
    description: 'Real-time web search capabilities',
    contextLength: 127072,
    multiModal: false,
    provider: 'Perplexity',
    inputCostPer1kTokens: 0.001,
    outputCostPer1kTokens: 0.001,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and cost-effective Claude model',
    contextLength: 200000,
    multiModal: true,
    provider: 'Anthropic',
    inputCostPer1kTokens: 0.00025,
    outputCostPer1kTokens: 0.00125,
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    description: 'Cohere\'s most capable model',
    contextLength: 128000,
    multiModal: false,
    provider: 'Cohere',
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
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

// Together.ai image generation costs (fixed per image)
export const togetherImageCosts: Record<string, number> = {
  'black-forest-labs/FLUX.1-schnell': 0.003,
  'black-forest-labs/FLUX.1-dev': 0.025,
  'stabilityai/stable-diffusion-xl-base-1.0': 0.004,
};

export function calculateOpenRouterCost(modelId: string, usage: UsageData): number {
  const model = openRouterModels.find(m => m.id === modelId);
  if (!model) return 0;

  const inputCost = (usage.prompt_tokens / 1000) * model.inputCostPer1kTokens;
  const outputCost = (usage.completion_tokens / 1000) * model.outputCostPer1kTokens;
  
  return inputCost + outputCost;
}

export function calculateTogetherImageCost(modelId: string): number {
  return togetherImageCosts[modelId] || 0.003; // Default to FLUX.1-schnell cost
}

export async function sendMessageToOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'mistralai/mistral-7b-instruct',
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
              
              // Capture usage data when available
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

export function convertMessagesToOpenRouterFormat(messages: Message[], selectedModelId: string, desiredResponseTokens?: number): OpenRouterMessage[] {
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

  // Add system message for response length if specified
  if (desiredResponseTokens && desiredResponseTokens > 0) {
    const approximateWords = Math.round(desiredResponseTokens * 0.75);
    const lengthInstruction: OpenRouterMessage = {
      role: 'system',
      content: `Please aim for approximately ${approximateWords} words in your response. This is a guideline to help provide an appropriately sized answer.`
    };
    
    // Prepend the system message to ensure it guides the entire conversation
    return [lengthInstruction, ...convertedMessages];
  }

  return convertedMessages;
}

export async function generateImageWithTogetherAI(
  prompt: string,
  model: string = 'black-forest-labs/FLUX.1-schnell',
  width: number = 1024,
  height: number = 1024
): Promise<string> {
  if (!TOGETHER_API_KEY) {
    throw new Error('Together.ai API key not configured. Please add VITE_TOGETHER_API_KEY to your .env file and restart the development server.');
  }

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        width,
        height,
        steps: 4,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Together.ai API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = 'Invalid Together.ai API key. Please check your VITE_TOGETHER_API_KEY in the .env file.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status >= 500) {
        errorMessage = 'Together.ai API server error. Please try again later.';
      } else if (response.status === 402) {
        errorMessage = 'Insufficient credits. Please add credits to your Together.ai account.';
      }
      
      console.error('Together.ai API Response:', errorText);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response format from Together.ai API');
    }

    return data.data[0].url;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to Together.ai API. Please check your internet connection.');
    }
    
    console.error('Error calling Together.ai API:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while calling Together.ai API');
  }
}