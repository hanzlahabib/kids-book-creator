// Admin User Detail API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Admin middleware
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        plan: true,
        books: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        apiKeys: {
          select: {
            id: true,
            provider: true,
            keyLast4: true,
            isValid: true,
            lastUsed: true,
            usageCount: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove sensitive data
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      plan: user.plan,
      credits: user.credits,
      creditsUsed: user.creditsUsed,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      billingCycleStart: user.billingCycleStart,
      preferByok: user.preferByok,
      books: user.books,
      usageRecords: user.usageRecords,
      apiKeys: user.apiKeys,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update user (role, credits, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { role, credits, creditsAdjustment, planSlug } = body;
    
    // Build update data
    const updateData: {
      role?: string;
      credits?: number;
      planId?: string | null;
    } = {};
    
    if (role !== undefined) {
      updateData.role = role;
    }
    
    if (credits !== undefined) {
      updateData.credits = credits;
    }
    
    if (creditsAdjustment !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { credits: true },
      });
      if (currentUser) {
        updateData.credits = Math.max(0, currentUser.credits + creditsAdjustment);
      }
    }
    
    if (planSlug !== undefined) {
      if (planSlug === null) {
        updateData.planId = null;
      } else {
        const plan = await prisma.plan.findUnique({
          where: { slug: planSlug },
        });
        if (plan) {
          updateData.planId = plan.id;
        }
      }
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { plan: true },
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        credits: user.credits,
        plan: user.plan?.name,
      },
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
