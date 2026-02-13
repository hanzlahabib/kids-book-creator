// OpenAI DALL-E Provider
import OpenAI from 'openai';
import { buildPrompt } from '../prompts';
import type { AIProvider, ImageGenerationOptions, GenerationResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const;
  displayName = 'OpenAI (DALL-E 3)';
  
  private getClient(apiKey?: string): OpenAI {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required');
    }
    return new OpenAI({ apiKey: key });
  }
  
  async generateImage(options: ImageGenerationOptions, apiKey?: string): Promise<GenerationResult> {
    const id = crypto.randomUUID();
    
    try {
      const client = this.getClient(apiKey);
      const prompt = buildPrompt(options);
      
      console.log(`[OpenAI] Generating image with prompt: ${prompt.substring(0, 100)}...`);
      
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: options.quality || 'standard',
        style: 'natural',
        response_format: 'b64_json',
      });
      
      const imageData = response.data?.[0]?.b64_json;
      if (!imageData) {
        throw new Error('No image data in response');
      }
      
      // Save the image
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
        provider: 'openai',
        estimatedCost: this.estimateCost(options),
      };
    } catch (error) {
      console.error('[OpenAI] Generation failed:', error);
      return {
        id,
        imagePath: '',
        prompt: buildPrompt(options),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'openai',
      };
    }
  }
  
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const client = this.getClient(apiKey);
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
  
  estimateCost(options: ImageGenerationOptions): number {
    // DALL-E 3 pricing
    return options.quality === 'hd' ? 0.08 : 0.04;
  }
}
