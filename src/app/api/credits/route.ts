// Credits API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Get credit balance and history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const response: {
      credits: number;
      creditsUsed: number;
      maxCredits: number;
      planName: string;
      billingCycleStart: Date | null;
      history?: unknown[];
    } = {
      credits: user.credits,
      creditsUsed: user.creditsUsed,
      maxCredits: user.plan?.credits || 0,
      planName: user.plan?.name || 'Free',
      billingCycleStart: user.billingCycleStart,
    };
    
    if (includeHistory) {
      const history = await prisma.usageRecord.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      response.history = history;
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// Deduct credits (internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { amount = 1, action = 'generate', provider = 'credits', metadata } = body;
    
    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.credits < amount) {
      return NextResponse.json(
        { error: 'Insufficient credits', credits: user.credits },
        { status: 402 }
      );
    }
    
    // Deduct credits and record usage
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          credits: { decrement: amount },
          creditsUsed: { increment: amount },
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId: session.user.id,
          provider,
          action,
          creditsUsed: amount,
          mode: 'credits',
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      credits: updatedUser.credits,
      creditsUsed: updatedUser.creditsUsed,
    });
  } catch (error) {
    console.error('Credits deduction error:', error);
    return NextResponse.json(
      { error: 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}
