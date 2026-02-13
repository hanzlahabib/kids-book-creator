// Admin Users API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Admin middleware
async function isAdmin() {
  const session = await auth();
  return session?.user?.role === 'admin';
}

// Get all users
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          plan: true,
          _count: {
            select: {
              books: true,
              generations: true,
              apiKeys: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      plan: user.plan?.name,
      credits: user.credits,
      creditsUsed: user.creditsUsed,
      subscriptionStatus: user.subscriptionStatus,
      booksCount: user._count.books,
      generationsCount: user._count.generations,
      apiKeysCount: user._count.apiKeys,
      createdAt: user.createdAt,
    }));
    
    return NextResponse.json({
      users: safeUsers,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
