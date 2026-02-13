import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import type { Config } from '@libsql/client';
import path from 'path';

// Get absolute path to database
const dbPath = path.join(process.cwd(), 'prisma', 'data', 'app.db');

// Config for libSQL adapter
const config: Config = {
  url: `file:${dbPath}`,
};

// Create Prisma adapter
const adapter = new PrismaLibSql(config);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

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
    price: 900,
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
    displayOrder: 1,
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: 2900,
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
      maxBooks: -1,
      maxPagesPerBook: 100,
      watermark: false,
      batchGeneration: true,
      batchSize: 50,
      coverDesigner: true,
      apiAccess: false,
    }),
    displayOrder: 2,
  },
  {
    name: 'Unlimited',
    slug: 'unlimited',
    price: 7900,
    credits: 99999,
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
    displayOrder: 3,
  },
];

async function main() {
  console.log('Seeding plans...');
  
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ ${plan.name}`);
  }
  
  console.log('Plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
