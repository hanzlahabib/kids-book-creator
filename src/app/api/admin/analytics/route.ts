// Admin Analytics API
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Admin middleware
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get various stats
    const [
      totalUsers,
      newUsersLast30Days,
      newUsersLast7Days,
      usersByPlan,
      totalGenerations,
      generationsLast30Days,
      totalBooks,
      revenueByPlan,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.groupBy({
        by: ['planId'],
        _count: true,
      }),
      prisma.generation.count(),
      prisma.generation.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.book.count(),
      prisma.user.groupBy({
        by: ['planId'],
        where: {
          subscriptionStatus: 'active',
        },
        _count: true,
      }),
    ]);
    
    // Get plan names for breakdown
    const plans = await prisma.plan.findMany({
      select: { id: true, name: true, price: true },
    });
    const planMap = new Map(plans.map(p => [p.id, p]));
    
    const usersByPlanNames = usersByPlan.map(group => ({
      plan: planMap.get(group.planId || '')?.name || 'No Plan',
      count: group._count,
    }));
    
    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    for (const group of revenueByPlan) {
      const plan = planMap.get(group.planId || '');
      if (plan) {
        mrr += (plan.price / 100) * group._count;
      }
    }
    
    // Get recent usage trends
    const usageLast7Days = await prisma.usageRecord.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
      _sum: { creditsUsed: true },
    });
    
    return NextResponse.json({
      users: {
        total: totalUsers,
        newLast30Days: newUsersLast30Days,
        newLast7Days: newUsersLast7Days,
        byPlan: usersByPlanNames,
      },
      generations: {
        total: totalGenerations,
        last30Days: generationsLast30Days,
      },
      books: {
        total: totalBooks,
      },
      revenue: {
        mrr,
        activeSubscriptions: revenueByPlan.reduce((acc, g) => acc + g._count, 0),
      },
      usage: {
        last7Days: usageLast7Days.map(u => ({
          provider: u.provider,
          count: u._count,
          creditsUsed: u._sum.creditsUsed || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
