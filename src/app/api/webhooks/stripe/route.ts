// Stripe Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook not configured' },
      { status: 503 }
    );
  }
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  console.log(`[Stripe Webhook] Received event: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error handling event:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;
  const planSlug = session.metadata?.planSlug;
  
  if (!userId || !planSlug) {
    console.error('[Stripe] Missing metadata in checkout session');
    return;
  }
  
  // Get plan
  const plan = await prisma.plan.findUnique({
    where: { slug: planSlug },
  });
  
  if (!plan) {
    console.error(`[Stripe] Plan not found: ${planSlug}`);
    return;
  }
  
  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      planId: plan.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      credits: plan.credits,
      creditsUsed: 0,
      billingCycleStart: new Date(),
    },
  });
  
  console.log(`[Stripe] User ${userId} subscribed to ${planSlug}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  
  // Find user by customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  
  if (!user) {
    console.error(`[Stripe] User not found for customer: ${customerId}`);
    return;
  }
  
  // Find plan by price ID
  const plan = await prisma.plan.findFirst({
    where: { stripePriceId: priceId },
  });
  
  // Update subscription status
  // Handle different Stripe API versions for current_period_end
  const periodEnd = (subscription as { currentPeriodEnd?: number; current_period_end?: number }).currentPeriodEnd 
    ?? (subscription as { currentPeriodEnd?: number; current_period_end?: number }).current_period_end;
    
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      planId: plan?.id,
    },
  });
  
  console.log(`[Stripe] Subscription updated for user ${user.id}: ${subscription.status}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  
  if (!user) {
    console.error(`[Stripe] User not found for customer: ${customerId}`);
    return;
  }
  
  // Get free plan
  const freePlan = await prisma.plan.findUnique({
    where: { slug: 'free' },
  });
  
  // Downgrade to free
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planId: freePlan?.id,
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      credits: freePlan?.credits || 10,
    },
  });
  
  console.log(`[Stripe] User ${user.id} subscription canceled, downgraded to free`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  const subscriptionId = (invoice as { subscription?: string | { id: string } | null }).subscription;
  const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId?.id;
  
  if (!customerId || !subId) return; // One-time payment or missing data
  
  // Find user
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    include: { plan: true },
  });
  
  if (!user || !user.plan) return;
  
  // Reset credits on new billing cycle
  await prisma.user.update({
    where: { id: user.id },
    data: {
      credits: user.plan.credits,
      creditsUsed: 0,
      billingCycleStart: new Date(),
    },
  });
  
  console.log(`[Stripe] Credits reset for user ${user.id}: ${user.plan.credits}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  
  // Find user
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  
  if (!user) return;
  
  // Mark subscription as past due
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  });
  
  console.log(`[Stripe] Payment failed for user ${user.id}`);
}
