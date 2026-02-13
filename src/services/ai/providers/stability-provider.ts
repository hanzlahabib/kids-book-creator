// Stability AI Provider
import { buildPrompt } from '../prompts';
import type { AIProvider, ImageGenerationOptions, GenerationResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

export class StabilityProvider implements AIProvider {
  name = 'stability' as const;
  displayName = 'Stability AI (SDXL)';
  
  async generateImage(options: ImageGenerationOptions, apiKey?: string): Promise<GenerationResult> {
    const id = crypto.randomUUID();
    const key = apiKey || process.env.STABILITY_API_KEY;
    
    if (!key) {
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: 'Stability AI API key is required',
        provider: 'stability',
      };
    }
    
    try {
      const prompt = buildPrompt(options);
      
      console.log(`[Stability] Generating image with prompt: ${prompt.substring(0, 100)}...`);
      
      const response = await fetch(STABILITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1,
            },
            {
              text: 'photorealistic, 3d render, color, gradient, shadow, realistic, blurry, low quality',
              weight: -1,
            },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 40,
          samples: 1,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Stability API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const imageData = data.artifacts?.[0]?.base64;
      
      if (!imageData) {
        throw new Error('No image in response');
      }
      
      // Save image
      const imageBuffer = Buffer.from(imageData, 'base64');
      const fileName = `${id}.png`;
      const publicDir = path.join(process.cwd(), 'public', 'generated');
      await fs.mkdir(publicDir, { recursive: true });
      
      const filePath = path.join(publicDir, fileName);
      await fs.writeFile(filePath, imageBuffer);
      
      return {
        id,
        imagePath: `/generated/${fileName}`,
        prompt,
        success: true,
        provider: 'stability',
        estimatedCost: this.estimateCost(),
      };
    } catch (error) {
      console.error('[Stability] Generation failed:', error);
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'stability',
      };
    }
  }
  
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  estimateCost(): number {
    return 0.02; // Approximate cost per SDXL generation
  }
}
