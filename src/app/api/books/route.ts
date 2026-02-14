// API Route for Book Management
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateBody, createBookSchema } from '@/lib/validations';

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
    // Validate input
    const parsed = await validateBody(request, createBookSchema);
    if (parsed.error) return parsed.error;

    const { title, theme, ageGroup, description } = parsed.data;

    const book = await prisma.book.create({
      data: {
        title,
        theme,
        ageGroup,
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
