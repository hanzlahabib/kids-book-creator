// API Route for Single Book Operations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get single book
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    });
    
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ book });
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}

// Update book
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, subtitle, theme, ageGroup, trimSize, status } = body;
    
    const book = await prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(theme && { theme }),
        ...(ageGroup && { ageGroup }),
        ...(trimSize && { trimSize }),
        ...(status && { status }),
      },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    });
    
    return NextResponse.json({ book });
  } catch (error) {
    console.error('Failed to update book:', error);
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// Delete book
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    await prisma.book.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
