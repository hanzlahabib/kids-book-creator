// API Route for Book Pages Management
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Add pages to book
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: bookId } = await params;
    const body = await request.json();
    const { pages } = body; // Array of { imagePath, prompt?, theme?, style?, ageGroup? }
    
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'Pages array is required' },
        { status: 400 }
      );
    }
    
    // Get current max page number
    const existingPages = await prisma.page.findMany({
      where: { bookId },
      orderBy: { pageNumber: 'desc' },
      take: 1,
    });
    
    let nextPageNumber = existingPages.length > 0 ? existingPages[0].pageNumber + 1 : 1;
    
    // Create pages
    const createdPages = await Promise.all(
      pages.map(async (page: any) => {
        const created = await prisma.page.create({
          data: {
            bookId,
            pageNumber: nextPageNumber++,
            imagePath: page.imagePath,
            prompt: page.prompt,
            theme: page.theme,
            style: page.style,
            ageGroup: page.ageGroup,
          },
        });
        return created;
      })
    );
    
    // Update book page count
    const totalPages = await prisma.page.count({
      where: { bookId },
    });
    
    await prisma.book.update({
      where: { id: bookId },
      data: { pageCount: totalPages },
    });
    
    return NextResponse.json({ pages: createdPages });
  } catch (error) {
    console.error('Failed to add pages:', error);
    return NextResponse.json(
      { error: 'Failed to add pages' },
      { status: 500 }
    );
  }
}

// Reorder pages
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: bookId } = await params;
    const body = await request.json();
    const { pageOrder } = body; // Array of page IDs in new order
    
    if (!Array.isArray(pageOrder)) {
      return NextResponse.json(
        { error: 'pageOrder array is required' },
        { status: 400 }
      );
    }
    
    // Update each page's number based on position in array
    await Promise.all(
      pageOrder.map(async (pageId: string, index: number) => {
        await prisma.page.update({
          where: { id: pageId },
          data: { pageNumber: index + 1 },
        });
      })
    );
    
    // Fetch updated book with pages
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    });
    
    return NextResponse.json({ book });
  } catch (error) {
    console.error('Failed to reorder pages:', error);
    return NextResponse.json(
      { error: 'Failed to reorder pages' },
      { status: 500 }
    );
  }
}
