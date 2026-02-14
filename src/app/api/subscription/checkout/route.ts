// Stripe Checkout Session API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateBody, checkoutSchema } from '@/lib/validations';
import { stripe, getOrCreateCustomer, PLAN_PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate input
    const parsed = await validateBody(request, checkoutSchema);
    if (parsed.error) return parsed.error;

    const { planSlug } = parsed.data;

    if (!PLAN_PRICE_IDS[planSlug]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      user.email,
      user.name,
      user.stripeCustomerId
    );

    if (!customerId) {
      return NextResponse.json(
        { error: 'Failed to create Stripe customer' },
        { status: 500 }
      );
    }

    // Update user with customer ID if new
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const priceId = PLAN_PRICE_IDS[planSlug];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/settings?checkout=success`,
      cancel_url: `${baseUrl}/settings?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        userId: user.id,
        planSlug,
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
