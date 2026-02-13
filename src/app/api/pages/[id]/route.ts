// API Route for Single Page Operations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get single page
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const page = await prisma.page.findUnique({
      where: { id },
    });
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Failed to fetch page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// Update page
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pageNumber, prompt } = body;
    
    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(pageNumber !== undefined && { pageNumber }),
        ...(prompt && { prompt }),
      },
    });
    
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Failed to update page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// Delete page
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Get page to find the image path and book ID
    const page = await prisma.page.findUnique({
      where: { id },
    });
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }
    
    const bookId = page.bookId;
    
    // Delete the page
    await prisma.page.delete({
      where: { id },
    });
    
    // Optionally delete the image file
    try {
      const imagePath = path.join(process.cwd(), 'public', page.imagePath);
      await fs.unlink(imagePath);
    } catch {
      // Image might not exist, that's okay
    }
    
    // Update page count and renumber remaining pages if part of a book
    if (bookId) {
      const remainingPages = await prisma.page.findMany({
        where: { bookId },
        orderBy: { pageNumber: 'asc' },
      });
      
      // Renumber pages
      await Promise.all(
        remainingPages.map(async (p, index) => {
          await prisma.page.update({
            where: { id: p.id },
            data: { pageNumber: index + 1 },
          });
        })
      );
      
      // Update book page count
      await prisma.book.update({
        where: { id: bookId },
        data: { pageCount: remainingPages.length },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
