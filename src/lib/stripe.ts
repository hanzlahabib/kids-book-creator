// Stripe Integration
import Stripe from 'stripe';

// Check if we have Stripe keys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Create Stripe client (will be null if no key)
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey)
  : null;

// Plan to Stripe Price ID mapping
export const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  unlimited: process.env.STRIPE_UNLIMITED_PRICE_ID,
};

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });
  
  return session;
}

/**
 * Create or get a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string | null,
  existingCustomerId?: string | null
): Promise<string | null> {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }
  
  if (existingCustomerId) {
    return existingCustomerId;
  }
  
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });
  
  return customer.id;
}

/**
 * Create a customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session | null> {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  
  return session;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }
  
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    return null;
  }
  
  return stripe.subscriptions.retrieve(subscriptionId);
}
