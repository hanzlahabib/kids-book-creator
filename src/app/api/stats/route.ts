// API Route for Dashboard Statistics
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalBooks,
      totalPages,
      totalGenerations,
      exportedBooks,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.page.count(),
      prisma.generation.count(),
      prisma.book.count({ where: { status: 'exported' } }),
    ]);
    
    // Get recent books
    const recentBooks = await prisma.book.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { pages: true },
        },
      },
    });
    
    return NextResponse.json({
      stats: {
        totalBooks,
        totalPages,
        totalGenerations,
        exportedBooks,
      },
      recentBooks,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
