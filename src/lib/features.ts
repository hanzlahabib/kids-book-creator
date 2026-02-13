// Feature Gating Utilities
import { prisma } from './db';

export interface PlanLimits {
  maxBooks: number;
  maxPagesPerBook: number;
  watermark: boolean;
  batchGeneration: boolean;
  batchSize?: number;
  coverDesigner: boolean;
  apiAccess: boolean;
  customTemplates?: boolean;
}

export type Feature = 
  | 'batchGeneration'
  | 'coverDesigner'
  | 'apiAccess'
  | 'customTemplates'
  | 'noWatermark'
  | 'premiumTemplates';

const DEFAULT_LIMITS: PlanLimits = {
  maxBooks: 1,
  maxPagesPerBook: 24,
  watermark: true,
  batchGeneration: false,
  coverDesigner: false,
  apiAccess: false,
};

/**
 * Get plan limits for a user
 */
export async function getUserLimits(userId: string): Promise<PlanLimits> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });
  
  if (!user?.plan) {
    return DEFAULT_LIMITS;
  }
  
  try {
    return JSON.parse(user.plan.limits) as PlanLimits;
  } catch {
    return DEFAULT_LIMITS;
  }
}

/**
 * Check if user can access a feature
 */
export async function canAccessFeature(
  userId: string,
  feature: Feature
): Promise<boolean> {
  const limits = await getUserLimits(userId);
  
  switch (feature) {
    case 'batchGeneration':
      return limits.batchGeneration;
    case 'coverDesigner':
      return limits.coverDesigner;
    case 'apiAccess':
      return limits.apiAccess;
    case 'customTemplates':
      return limits.customTemplates ?? false;
    case 'noWatermark':
      return !limits.watermark;
    case 'premiumTemplates':
      return !limits.watermark; // Same as starter+ plans
    default:
      return false;
  }
}

/**
 * Check if user can create more books
 */
export async function canCreateBook(userId: string): Promise<{
  allowed: boolean;
  current: number;
  max: number;
}> {
  const [limits, bookCount] = await Promise.all([
    getUserLimits(userId),
    prisma.book.count({ where: { userId } }),
  ]);
  
  const max = limits.maxBooks;
  const allowed = max === -1 || bookCount < max;
  
  return {
    allowed,
    current: bookCount,
    max: max === -1 ? Infinity : max,
  };
}

/**
 * Check if user can add more pages to a book
 */
export async function canAddPages(
  userId: string,
  bookId: string,
  additionalPages: number
): Promise<{
  allowed: boolean;
  current: number;
  max: number;
}> {
  const [limits, book] = await Promise.all([
    getUserLimits(userId),
    prisma.book.findUnique({
      where: { id: bookId },
      include: { _count: { select: { pages: true } } },
    }),
  ]);
  
  const current = book?._count.pages || 0;
  const max = limits.maxPagesPerBook;
  const allowed = max === -1 || current + additionalPages <= max;
  
  return {
    allowed,
    current,
    max: max === -1 ? Infinity : max,
  };
}

/**
 * Get all features available to a plan
 */
export function getPlanFeatures(limits: PlanLimits): Feature[] {
  const features: Feature[] = [];
  
  if (limits.batchGeneration) features.push('batchGeneration');
  if (limits.coverDesigner) features.push('coverDesigner');
  if (limits.apiAccess) features.push('apiAccess');
  if (limits.customTemplates) features.push('customTemplates');
  if (!limits.watermark) {
    features.push('noWatermark');
    features.push('premiumTemplates');
  }
  
  return features;
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(feature: Feature): string {
  const messages: Record<Feature, string> = {
    batchGeneration: 'Upgrade to Pro to generate up to 50 images at once',
    coverDesigner: 'Upgrade to Pro to access the cover designer',
    apiAccess: 'Upgrade to Unlimited for API access',
    customTemplates: 'Upgrade to Unlimited for custom templates',
    noWatermark: 'Upgrade to Starter to remove watermarks',
    premiumTemplates: 'Upgrade to Starter to access all templates',
  };
  
  return messages[feature];
}
