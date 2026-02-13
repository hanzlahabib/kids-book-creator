// API Route for AI Image Generation (Updated for BYOK + Credits)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { getProvider, isValidProvider, type ProviderName } from '@/services/ai/providers';
import { getRandomPrompts } from '@/services/ai/prompts';
import type { Theme, AgeGroup } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      theme, 
      subject, 
      ageGroup, 
      quantity = 1, 
      style = 'coloring',
      provider: requestedProvider = 'openai',
      mode = 'credits', // 'credits' or 'byok'
    } = body;
    
    if (!theme || !ageGroup) {
      return NextResponse.json(
        { error: 'Missing required fields: theme, ageGroup' },
        { status: 400 }
      );
    }
    
    // Get session (optional for backward compatibility)
    const session = await auth();
    const userId = session?.user?.id;
    
    // Determine provider and API key
    let providerName: ProviderName = 'openai';
    let apiKey: string | undefined;
    
    if (isValidProvider(requestedProvider)) {
      providerName = requestedProvider;
    }
    
    // Handle BYOK vs Credits mode
    if (mode === 'byok' && userId) {
      // Get user's API key for this provider
      const userKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          provider: providerName,
          isValid: true,
        },
      });
      
      if (!userKey) {
        return NextResponse.json(
          { error: `No valid API key found for ${providerName}. Please add one in Settings.` },
          { status: 400 }
        );
      }
      
      apiKey = decrypt(userKey.encryptedKey);
      
      // Update key usage
      await prisma.apiKey.update({
        where: { id: userKey.id },
        data: {
          lastUsed: new Date(),
          usageCount: { increment: quantity },
        },
      });
    } else if (mode === 'credits' && userId) {
      // Check credit balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      if (user.credits < quantity) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits', 
            credits: user.credits,
            required: quantity,
          },
          { status: 402 }
        );
      }
      
      // Check plan limits for batch generation
      const limits = user.plan ? JSON.parse(user.plan.limits || '{}') : {};
      if (quantity > 1 && !limits.batchGeneration) {
        return NextResponse.json(
          { error: 'Batch generation requires Pro plan or higher' },
          { status: 403 }
        );
      }
      
      if (limits.batchSize && quantity > limits.batchSize) {
        return NextResponse.json(
          { error: `Batch size limited to ${limits.batchSize} images` },
          { status: 400 }
        );
      }
      
      // Use system API key
      apiKey = undefined; // Provider will use env var
    }
    
    // Get the provider
    const providerInstance = getProvider(providerName);
    const results = [];
    
    if (quantity === 1 && subject) {
      // Single generation with specific subject
      const result = await providerInstance.generateImage(
        {
          theme: theme as Theme,
          subject,
          ageGroup: ageGroup as AgeGroup,
          style,
        },
        apiKey
      );
      
      if (result.success) {
        // Save to generation history
        await prisma.generation.create({
          data: {
            prompt: result.prompt,
            imagePath: result.imagePath,
            theme,
            style,
            ageGroup,
            status: 'completed',
            userId,
            provider: providerName,
            mode,
            creditsUsed: mode === 'credits' ? 1 : 0,
          },
        });
        
        // Record usage
        if (userId) {
          await prisma.usageRecord.create({
            data: {
              userId,
              provider: providerName,
              action: 'generate',
              creditsUsed: mode === 'credits' ? 1 : 0,
              estimatedCost: mode === 'byok' ? result.estimatedCost : null,
              mode,
              metadata: JSON.stringify({ theme, style, ageGroup }),
            },
          });
          
          // Deduct credits if using credits mode
          if (mode === 'credits') {
            await prisma.user.update({
              where: { id: userId },
              data: {
                credits: { decrement: 1 },
                creditsUsed: { increment: 1 },
              },
            });
          }
        }
      }
      
      results.push(result);
    } else {
      // Batch generation
      const subjects = subject 
        ? Array(quantity).fill(subject)
        : getRandomPrompts(theme as Theme, quantity);
      
      for (const subj of subjects) {
        const result = await providerInstance.generateImage(
          {
            theme: theme as Theme,
            subject: subj,
            ageGroup: ageGroup as AgeGroup,
            style,
          },
          apiKey
        );
        
        if (result.success) {
          await prisma.generation.create({
            data: {
              prompt: result.prompt,
              imagePath: result.imagePath,
              theme,
              style,
              ageGroup,
              status: 'completed',
              userId,
              provider: providerName,
              mode,
              creditsUsed: mode === 'credits' ? 1 : 0,
            },
          });
          
          if (userId) {
            await prisma.usageRecord.create({
              data: {
                userId,
                provider: providerName,
                action: 'generate',
                creditsUsed: mode === 'credits' ? 1 : 0,
                estimatedCost: mode === 'byok' ? result.estimatedCost : null,
                mode,
              },
            });
            
            if (mode === 'credits') {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  credits: { decrement: 1 },
                  creditsUsed: { increment: 1 },
                },
              });
            }
          }
        }
        
        results.push(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Get updated credit balance
    let credits: number | undefined;
    if (userId && mode === 'credits') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });
      credits = user?.credits;
    }
    
    return NextResponse.json({
      success: true,
      results,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      provider: providerName,
      mode,
      credits,
    });
  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// Get generation history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const theme = searchParams.get('theme');
    
    const where: {
      theme?: string;
      userId?: string;
    } = {};
    
    if (theme) where.theme = theme;
    if (session?.user?.id) where.userId = session.user.id;
    
    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return NextResponse.json({ generations });
  } catch (error) {
    console.error('Failed to fetch generations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generation history' },
      { status: 500 }
    );
  }
}
