// Fal.ai Provider
import { buildPrompt } from '../prompts';
import type { AIProvider, ImageGenerationOptions, GenerationResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const FAL_API_URL = 'https://queue.fal.run/fal-ai/flux/schnell';

export class FalProvider implements AIProvider {
  name = 'fal' as const;
  displayName = 'Fal.ai (Flux)';
  
  async generateImage(options: ImageGenerationOptions, apiKey?: string): Promise<GenerationResult> {
    const id = crypto.randomUUID();
    const key = apiKey || process.env.FAL_KEY;
    
    if (!key) {
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: 'Fal.ai API key is required',
        provider: 'fal',
      };
    }
    
    try {
      const prompt = buildPrompt(options);
      
      console.log(`[Fal] Generating image with prompt: ${prompt.substring(0, 100)}...`);
      
      // Submit request
      const submitResponse = await fetch(FAL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          image_size: 'square_hd',
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `Fal API error: ${submitResponse.statusText}`);
      }
      
      const result = await submitResponse.json();
      
      // Check if we need to poll (queue mode)
      let imageUrl = result.images?.[0]?.url;
      
      if (!imageUrl && result.request_id) {
        // Poll for result
        const statusUrl = `https://queue.fal.run/fal-ai/flux/schnell/requests/${result.request_id}`;
        let pollResult = result;
        
        while (pollResult.status === 'IN_QUEUE' || pollResult.status === 'IN_PROGRESS') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const pollResponse = await fetch(statusUrl, {
            headers: { 'Authorization': `Key ${key}` },
          });
          pollResult = await pollResponse.json();
        }
        
        if (pollResult.status === 'COMPLETED') {
          imageUrl = pollResult.response?.images?.[0]?.url;
        } else {
          throw new Error(pollResult.error || 'Generation failed');
        }
      }
      
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
        provider: 'fal',
        estimatedCost: this.estimateCost(),
      };
    } catch (error) {
      console.error('[Fal] Generation failed:', error);
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'fal',
      };
    }
  }
  
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      // Fal doesn't have a simple auth check endpoint, so we do a basic request
      const response = await fetch('https://rest.fal.run/fal-ai/flux/schnell', {
        method: 'GET',
        headers: { 'Authorization': `Key ${apiKey}` },
      });
      // Even 405 is fine - means auth worked
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }
  
  estimateCost(): number {
    return 0.015; // Approximate cost per Flux generation
  }
}
