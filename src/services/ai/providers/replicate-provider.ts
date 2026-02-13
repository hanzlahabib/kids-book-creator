// Replicate Provider (Stable Diffusion, SDXL, etc.)
import { buildPrompt } from '../prompts';
import type { AIProvider, ImageGenerationOptions, GenerationResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

export class ReplicateProvider implements AIProvider {
  name = 'replicate' as const;
  displayName = 'Replicate (SDXL)';
  
  async generateImage(options: ImageGenerationOptions, apiKey?: string): Promise<GenerationResult> {
    const id = crypto.randomUUID();
    const key = apiKey || process.env.REPLICATE_API_TOKEN;
    
    if (!key) {
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: 'Replicate API key is required',
        provider: 'replicate',
      };
    }
    
    try {
      const prompt = buildPrompt(options);
      
      console.log(`[Replicate] Generating image with prompt: ${prompt.substring(0, 100)}...`);
      
      // Create prediction
      const createResponse = await fetch(REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Using SDXL model
          version: 'da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf',
          input: {
            prompt: prompt,
            negative_prompt: 'photorealistic, 3d render, color, gradient, shadow, realistic texture, photograph',
            width: 1024,
            height: 1024,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50,
          },
        }),
      });
      
      if (!createResponse.ok) {
        throw new Error(`Replicate API error: ${createResponse.statusText}`);
      }
      
      const prediction = await createResponse.json();
      
      // Poll for completion
      let result = prediction;
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`${REPLICATE_API_URL}/${result.id}`, {
          headers: { 'Authorization': `Bearer ${key}` },
        });
        result = await statusResponse.json();
      }
      
      if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed');
      }
      
      const imageUrl = result.output?.[0];
      if (!imageUrl) {
        throw new Error('No image in response');
      }
      
      // Download and save image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
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
        provider: 'replicate',
        estimatedCost: this.estimateCost(),
      };
    } catch (error) {
      console.error('[Replicate] Generation failed:', error);
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'replicate',
      };
    }
  }
  
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  estimateCost(): number {
    return 0.01; // Approximate cost per SDXL generation
  }
}
