export interface HuggingFaceModel {
  id: string;
  author?: string;
  sha: string;
  created_at: string;
  last_modified: string;
  private: boolean;
  disabled?: boolean;
  gated?: boolean;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  modelId?: string;
  config?: {
    model_type?: string;
    architectures?: string[];
  };
  cardData?: {
    language?: string[];
    license?: string;
    datasets?: string[];
    metrics?: string[];
  };
}

export interface HuggingFaceApiResponse {
  models: HuggingFaceModel[];
  hasMore: boolean;
}

const HUGGING_FACE_API_BASE = 'https://huggingface.co/api/models';

export async function fetchHuggingFaceModels(
  options: {
    search?: string;
    author?: string;
    pipeline_tag?: string;
    sort?: 'downloads' | 'created_at' | 'last_modified';
    direction?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}
): Promise<HuggingFaceModel[]> {
  const {
    search,
    author,
    pipeline_tag,
    sort = 'downloads',
    direction = 'desc',
    limit = 20,
    offset = 0
  } = options;

  const params = new URLSearchParams();
  
  if (search) params.append('search', search);
  if (author) params.append('author', author);
  if (pipeline_tag) params.append('pipeline_tag', pipeline_tag);
  params.append('sort', sort);
  params.append('direction', direction);
  params.append('limit', limit.toString());
  if (offset > 0) params.append('offset', offset.toString());

  try {
    const response = await fetch(`${HUGGING_FACE_API_BASE}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const models: HuggingFaceModel[] = await response.json();
    return models;
  } catch (error) {
    console.error('Error fetching Hugging Face models:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching models');
  }
}

export function getModelCategories(): string[] {
  return [
    'text-generation',
    'text-classification',
    'token-classification',
    'question-answering',
    'summarization',
    'translation',
    'text2text-generation',
    'fill-mask',
    'sentence-similarity',
    'conversational',
    'image-classification',
    'object-detection',
    'image-segmentation',
    'text-to-image',
    'image-to-text',
    'automatic-speech-recognition',
    'audio-classification',
    'text-to-speech',
    'audio-to-audio',
    'voice-activity-detection',
    'depth-estimation',
    'image-to-image',
    'unconditional-image-generation',
    'video-classification',
    'reinforcement-learning',
    'robotics',
    'tabular-classification',
    'tabular-regression',
    'time-series-forecasting',
    'graph-ml'
  ];
}