// API Keys Management
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt, getLast4, maskKey } from '@/lib/encryption';
import { getProvider, isValidProvider } from '@/services/ai/providers';

// Get all user's API keys
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        keyLast4: true,
        name: true,
        isValid: true,
        lastUsed: true,
        usageCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Add masked key display
    const keysWithMask = keys.map(key => ({
      ...key,
      maskedKey: maskKey('x'.repeat(20) + key.keyLast4),
    }));
    
    return NextResponse.json({ keys: keysWithMask });
  } catch (error) {
    console.error('Keys fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// Add a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { provider, key, name } = body;
    
    if (!provider || !key) {
      return NextResponse.json(
        { error: 'Provider and key are required' },
        { status: 400 }
      );
    }
    
    if (!isValidProvider(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    // Validate the key
    const providerInstance = getProvider(provider);
    const isValid = await providerInstance.testConnection(key);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key - could not connect to provider' },
        { status: 400 }
      );
    }
    
    // Check for duplicate
    const keyLast4 = getLast4(key);
    const existing = await prisma.apiKey.findFirst({
      where: {
        userId: session.user.id,
        provider,
        keyLast4,
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'This key already exists' },
        { status: 409 }
      );
    }
    
    // Encrypt and store
    const encryptedKey = encrypt(key);
    
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        provider,
        encryptedKey,
        keyLast4,
        name: name || `${provider} key`,
        isValid: true,
      },
      select: {
        id: true,
        provider: true,
        keyLast4: true,
        name: true,
        isValid: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      key: {
        ...apiKey,
        maskedKey: maskKey('x'.repeat(20) + apiKey.keyLast4),
      },
    });
  } catch (error) {
    console.error('Key creation error:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}
