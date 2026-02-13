// Seed Plans API
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    price: 0,
    credits: 10,
    features: JSON.stringify([
      '10 images/month',
      'Watermarked exports',
      'Basic templates',
      '1 book max',
    ]),
    limits: JSON.stringify({
      maxBooks: 1,
      maxPagesPerBook: 24,
      watermark: true,
      batchGeneration: false,
      coverDesigner: false,
      apiAccess: false,
    }),
    displayOrder: 0,
  },
  {
    name: 'Starter',
    slug: 'starter',
    price: 900, // $9.00
    credits: 100,
    features: JSON.stringify([
      '100 images/month',
      'No watermark',
      'All templates',
      '10 books max',
      'Email support',
    ]),
    limits: JSON.stringify({
      maxBooks: 10,
      maxPagesPerBook: 50,
      watermark: false,
      batchGeneration: false,
      coverDesigner: false,
      apiAccess: false,
    }),
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    displayOrder: 1,
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: 2900, // $29.00
    credits: 500,
    features: JSON.stringify([
      '500 images/month',
      'No watermark',
      'All templates',
      'Unlimited books',
      'Priority support',
      'Batch generation (50 at once)',
      'Cover designer',
    ]),
    limits: JSON.stringify({
      maxBooks: -1, // unlimited
      maxPagesPerBook: 100,
      watermark: false,
      batchGeneration: true,
      batchSize: 50,
      coverDesigner: true,
      apiAccess: false,
    }),
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    displayOrder: 2,
  },
  {
    name: 'Unlimited',
    slug: 'unlimited',
    price: 7900, // $79.00
    credits: 99999, // Effectively unlimited
    features: JSON.stringify([
      'Unlimited images',
      'Everything in Pro',
      'API access',
      'White-label exports',
      'Custom templates',
      'Priority queue',
    ]),
    limits: JSON.stringify({
      maxBooks: -1,
      maxPagesPerBook: -1,
      watermark: false,
      batchGeneration: true,
      batchSize: 100,
      coverDesigner: true,
      apiAccess: true,
      customTemplates: true,
    }),
    stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    displayOrder: 3,
  },
];

export async function POST() {
  try {
    // Upsert all plans
    for (const plan of PLANS) {
      await prisma.plan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
      });
    }
    
    const plans = await prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Plans seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed plans' },
      { status: 500 }
    );
  }
}
