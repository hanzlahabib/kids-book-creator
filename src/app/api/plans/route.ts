// Plans API
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get all available plans
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    
    // Parse JSON fields
    const parsedPlans = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features || '[]'),
      limits: JSON.parse(plan.limits || '{}'),
    }));
    
    return NextResponse.json({ plans: parsedPlans });
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
