// API Route for Templates
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const ageGroup = searchParams.get('ageGroup');
    
    const where = {
      isActive: true,
      ...(category && { category }),
      ...(ageGroup && { ageGroup }),
    };
    
    const templates = await prisma.template.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Create template (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, theme, ageGroup, promptBase, previewPath, config } = body;
    
    if (!name || !category || !theme || !ageGroup || !promptBase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        theme,
        ageGroup,
        promptBase,
        previewPath,
        config: config ? JSON.stringify(config) : null,
        isActive: true,
      },
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
