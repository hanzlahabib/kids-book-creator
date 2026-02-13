// Individual API Key Management
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { getProvider, isValidProvider } from '@/services/ai/providers';

// Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Verify ownership
    const key = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }
    
    await prisma.apiKey.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Key deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete key' },
      { status: 500 }
    );
  }
}

// Test an API key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Get key
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }
    
    if (!isValidProvider(apiKey.provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    // Decrypt and test
    const decryptedKey = decrypt(apiKey.encryptedKey);
    const provider = getProvider(apiKey.provider);
    const isValid = await provider.testConnection(decryptedKey);
    
    // Update validity status
    await prisma.apiKey.update({
      where: { id },
      data: { isValid },
    });
    
    return NextResponse.json({
      success: true,
      isValid,
    });
  } catch (error) {
    console.error('Key test error:', error);
    return NextResponse.json(
      { error: 'Failed to test key' },
      { status: 500 }
    );
  }
}
