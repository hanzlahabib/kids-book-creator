// OpenAI DALL-E Integration
import OpenAI from 'openai';
import { buildPrompt, type PromptOptions } from './prompts';
import type { GenerationResult } from '@/types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Initialize OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

export interface ImageGenerationOptions extends PromptOptions {
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

export async function generateImage(
  options: ImageGenerationOptions
): Promise<GenerationResult> {
  const id = crypto.randomUUID();
  
  try {
    const client = getOpenAIClient();
    const prompt = buildPrompt(options);
    
    console.log('Generating image with prompt:', prompt);
    
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: 'natural', // More suitable for line art
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
    
    // Ensure directory exists
    await fs.mkdir(publicDir, { recursive: true });
    
    const filePath = path.join(publicDir, fileName);
    await fs.writeFile(filePath, imageBuffer);
    
    return {
      id,
      imagePath: `/generated/${fileName}`,
      prompt,
      success: true,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      id,
      imagePath: '',
      prompt: buildPrompt(options),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateBatch(
  options: ImageGenerationOptions,
  subjects: string[]
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  
  for (const subject of subjects) {
    const result = await generateImage({
      ...options,
      subject,
    });
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Test connection to OpenAI
export async function testConnection(): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}
