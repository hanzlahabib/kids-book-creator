// AI Provider Types
import type { Theme, AgeGroup } from '@/types';

export type ProviderName = 'openai' | 'replicate' | 'stability' | 'fal';

export interface ImageGenerationOptions {
  theme: Theme;
  subject: string;
  ageGroup: AgeGroup;
  style?: 'coloring' | 'tracing' | 'activity';
  size?: string;
  quality?: 'standard' | 'hd';
}

export interface GenerationResult {
  id: string;
  imagePath: string;
  prompt: string;
  success: boolean;
  error?: string;
  provider: ProviderName;
  estimatedCost?: number;
}

export interface AIProvider {
  name: ProviderName;
  displayName: string;
  
  /**
   * Generate an image from a prompt
   */
  generateImage(options: ImageGenerationOptions, apiKey?: string): Promise<GenerationResult>;
  
  /**
   * Test if the API key is valid
   */
  testConnection(apiKey: string): Promise<boolean>;
  
  /**
   * Estimate cost for a generation
   */
  estimateCost(options: ImageGenerationOptions): number;
}

// Provider pricing (approximate, per image)
export const PROVIDER_PRICING: Record<ProviderName, number> = {
  openai: 0.04, // DALL-E 3 standard
  replicate: 0.01, // Varies by model
  stability: 0.02, // Stable Diffusion
  fal: 0.015, // Fal.ai average
};

export const PROVIDER_DISPLAY_NAMES: Record<ProviderName, string> = {
  openai: 'OpenAI (DALL-E 3)',
  replicate: 'Replicate',
  stability: 'Stability AI',
  fal: 'Fal.ai',
};
