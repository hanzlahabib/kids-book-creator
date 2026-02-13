// API Route for Book Management
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get all books
export async function GET() {
  try {
    const books = await prisma.book.findMany({
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Failed to fetch books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// Create new book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, theme, ageGroup, trimSize = '8.5x11' } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const book = await prisma.book.create({
      data: {
        title,
        subtitle,
        theme,
        ageGroup,
        trimSize,
        status: 'draft',
        pageCount: 0,
      },
    });
    
    return NextResponse.json({ book });
  } catch (error) {
    console.error('Failed to create book:', error);
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}
