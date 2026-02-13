// API Route to Seed Starter Templates
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const starterTemplates = [
  {
    name: 'Animals Coloring (Ages 2-4)',
    description: 'Simple, cute animal illustrations perfect for toddlers. Extra thick lines and minimal details.',
    category: 'coloring',
    theme: 'animals',
    ageGroup: '2-4',
    promptBase: 'cute friendly {subject}, cartoon style, very simple, extra thick bold outlines',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['lion', 'elephant', 'giraffe', 'cat', 'dog', 'bunny', 'bird', 'fish', 'butterfly', 'bear'],
    }),
  },
  {
    name: 'Animals Coloring (Ages 4-6)',
    description: 'Medium complexity animal illustrations with more details for preschoolers.',
    category: 'coloring',
    theme: 'animals',
    ageGroup: '4-6',
    promptBase: 'cute animal {subject}, cartoon style, moderate details, thick bold outlines',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['lion with mane', 'elephant family', 'tall giraffe', 'playful cat', 'loyal dog', 'hopping bunny'],
    }),
  },
  {
    name: 'Alphabet Tracing (Ages 3-5)',
    description: 'Learn letters with fun illustrations. Each letter paired with related objects.',
    category: 'tracing',
    theme: 'alphabet',
    ageGroup: '4-6',
    promptBase: 'uppercase letter {subject}, decorative style, with related illustration, educational',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 26,
      subjects: ['A with apple', 'B with ball', 'C with cat', 'D with dog', 'E with elephant'],
    }),
  },
  {
    name: 'Numbers 1-20 (Ages 3-5)',
    description: 'Learn numbers with counting objects. Fun and educational.',
    category: 'educational',
    theme: 'numbers',
    ageGroup: '4-6',
    promptBase: 'number {subject}, large and clear, with counting objects, educational',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 40,
      subjects: ['1 with one star', '2 with two birds', '3 with three flowers'],
    }),
  },
  {
    name: 'Dinosaurs (Ages 4-7)',
    description: 'Friendly dinosaurs from the prehistoric era. Engaging and fun for dino lovers.',
    category: 'coloring',
    theme: 'dinosaurs',
    ageGroup: '4-6',
    promptBase: 'friendly cartoon dinosaur {subject}, not scary, prehistoric setting',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['T-Rex', 'Brontosaurus', 'Triceratops', 'Pterodactyl', 'Stegosaurus'],
    }),
  },
  {
    name: 'Unicorns & Fairies (Ages 3-6)',
    description: 'Magical creatures and fairy tale elements. Perfect for imaginative kids.',
    category: 'coloring',
    theme: 'unicorns',
    ageGroup: '4-6',
    promptBase: 'magical {subject}, fairy tale style, whimsical, rainbow and stars',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['unicorn', 'fairy', 'princess', 'castle', 'rainbow'],
    }),
  },
  {
    name: 'Vehicles (Ages 3-6)',
    description: 'Cars, trucks, planes, and more. Great for vehicle enthusiasts.',
    category: 'coloring',
    theme: 'vehicles',
    ageGroup: '4-6',
    promptBase: 'cartoon {subject}, friendly appearance, simple mechanical details',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['car', 'truck', 'airplane', 'train', 'boat', 'helicopter'],
    }),
  },
  {
    name: 'Ocean Animals (Ages 4-7)',
    description: 'Underwater adventures with sea creatures. Discover marine life.',
    category: 'coloring',
    theme: 'ocean',
    ageGroup: '4-6',
    promptBase: 'cute sea creature {subject}, underwater scene, bubbles and coral',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['fish', 'octopus', 'turtle', 'dolphin', 'whale', 'seahorse'],
    }),
  },
  {
    name: 'Flowers & Nature (Ages 4-8)',
    description: 'Beautiful flowers and nature scenes. Peaceful and calming.',
    category: 'coloring',
    theme: 'nature',
    ageGroup: '6-8',
    promptBase: 'nature scene with {subject}, peaceful garden setting, detailed but clear',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 50,
      subjects: ['flowers', 'trees', 'butterflies', 'birds', 'garden'],
    }),
  },
  {
    name: 'Islamic Patterns (Ages 5-10)',
    description: 'Beautiful geometric patterns and Islamic art. Cultural and educational.',
    category: 'coloring',
    theme: 'islamic',
    ageGroup: '6-8',
    promptBase: 'islamic {subject}, geometric patterns, arabesque designs',
    previewPath: null,
    config: JSON.stringify({
      pageCount: 40,
      subjects: ['geometric pattern', 'mosque', 'crescent moon', 'lantern', 'arabesque'],
    }),
  },
];

export async function POST() {
  try {
    // Clear existing templates
    await prisma.template.deleteMany({});
    
    // Create starter templates
    const templates = await Promise.all(
      starterTemplates.map(template =>
        prisma.template.create({
          data: {
            ...template,
            isActive: true,
          },
        })
      )
    );
    
    return NextResponse.json({
      success: true,
      message: `Created ${templates.length} starter templates`,
      templates,
    });
  } catch (error) {
    console.error('Failed to seed templates:', error);
    return NextResponse.json(
      { error: 'Failed to seed templates' },
      { status: 500 }
    );
  }
}
