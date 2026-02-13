// Prompt Engineering System for Line Art Generation
import type { Theme, AgeGroup } from '@/types';

// Age-based complexity modifiers
const ageComplexity: Record<AgeGroup, string> = {
  '2-4': 'very simple, minimal details, extra thick lines, large shapes, easy for toddlers',
  '4-6': 'simple, moderate details, thick bold outlines, clear shapes, suitable for preschoolers',
  '6-8': 'medium complexity, good amount of detail, bold outlines, engaging for early readers',
  '8+': 'detailed, intricate patterns, fine lines with bold outlines, challenging and engaging',
};

// Theme-specific prompt additions
const themePrompts: Record<Theme, string> = {
  animals: 'cute friendly animal, cartoon style, approachable expression, single animal centered',
  alphabet: 'uppercase letter, decorative style, with small related illustrations around it, educational',
  numbers: 'large number with counting objects around it, educational, fun arrangement',
  dinosaurs: 'friendly cartoon dinosaur, not scary, prehistoric plants in background',
  unicorns: 'magical unicorn with stars and rainbows, whimsical fairy tale style',
  vehicles: 'cartoon vehicle, simple mechanical details, friendly appearance',
  ocean: 'cute sea creature, underwater scene with bubbles, coral and seaweed',
  nature: 'flowers, trees, or nature elements, garden scene, peaceful and pretty',
  islamic: 'geometric islamic patterns, arabesque designs, mosque elements, crescent and stars',
  space: 'astronaut, rocket, planets, or stars, cosmic adventure, friendly space theme',
  food: 'cute cartoon food items, happy faces optional, kitchen or picnic setting',
};

// Style modifiers
const styleModifiers = {
  coloring: 'coloring book page, areas to color in, open spaces',
  tracing: 'dotted lines for tracing, guide dots, practice writing',
  activity: 'activity page with interactive elements, puzzles or mazes',
};

// Base prompt that ensures line art output
const basePrompt = `Simple black and white line art illustration, coloring book style, thick bold outlines only, no shading, no gradients, no gray tones, no color, pure white background, clean vector-style lines, high contrast black lines on white, suitable for printing, professional coloring book quality`;

// Negative prompt to avoid unwanted elements
export const negativePrompt = 'color, shading, gradients, gray, shadows, texture, photorealistic, 3D, complex background, watermark, signature, text, blurry, low quality';

export interface PromptOptions {
  theme: Theme;
  subject: string;
  ageGroup: AgeGroup;
  style?: 'coloring' | 'tracing' | 'activity';
}

export function buildPrompt(options: PromptOptions): string {
  const { theme, subject, ageGroup, style = 'coloring' } = options;
  
  const parts = [
    basePrompt,
    themePrompts[theme] || '',
    ageComplexity[ageGroup],
    styleModifiers[style],
    subject ? `featuring: ${subject}` : '',
  ];
  
  return parts.filter(Boolean).join(', ');
}

// Pre-built prompts for batch generation
export const batchPrompts: Record<Theme, string[]> = {
  animals: [
    'cute lion with fluffy mane',
    'happy elephant with big ears',
    'playful monkey swinging',
    'friendly giraffe with long neck',
    'cuddly panda eating bamboo',
    'bouncy kangaroo with joey',
    'striped zebra standing',
    'colorful parrot on branch',
    'swimming dolphin jumping',
    'fluffy cat playing with yarn',
    'loyal dog with wagging tail',
    'hopping bunny with carrots',
    'wise owl on tree branch',
    'busy bee with flowers',
    'graceful butterfly with wings spread',
  ],
  alphabet: [
    'Letter A with apple and ant',
    'Letter B with ball and butterfly',
    'Letter C with cat and car',
    'Letter D with dog and dinosaur',
    'Letter E with elephant and egg',
    'Letter F with fish and flower',
    'Letter G with giraffe and grapes',
    'Letter H with house and heart',
    'Letter I with ice cream and igloo',
    'Letter J with jellyfish and juice',
    'Letter K with kite and king',
    'Letter L with lion and leaf',
    'Letter M with moon and mouse',
    'Letter N with nest and numbers',
    'Letter O with owl and orange',
    'Letter P with penguin and pizza',
    'Letter Q with queen and quilt',
    'Letter R with rabbit and rainbow',
    'Letter S with sun and star',
    'Letter T with tree and turtle',
    'Letter U with umbrella and unicorn',
    'Letter V with violin and vegetables',
    'Letter W with whale and watermelon',
    'Letter X with xylophone and x-ray',
    'Letter Y with yacht and yarn',
    'Letter Z with zebra and zipper',
  ],
  numbers: [
    'Number 1 with one star',
    'Number 2 with two birds',
    'Number 3 with three flowers',
    'Number 4 with four butterflies',
    'Number 5 with five apples',
    'Number 6 with six fish',
    'Number 7 with seven hearts',
    'Number 8 with eight balloons',
    'Number 9 with nine bees',
    'Number 10 with ten dots',
    'Number 11 with eleven leaves',
    'Number 12 with twelve cupcakes',
    'Number 13 with thirteen circles',
    'Number 14 with fourteen triangles',
    'Number 15 with fifteen squares',
    'Number 16 with sixteen diamonds',
    'Number 17 with seventeen moons',
    'Number 18 with eighteen suns',
    'Number 19 with nineteen rockets',
    'Number 20 with twenty happy faces',
  ],
  dinosaurs: [
    'friendly T-Rex dinosaur',
    'long-neck Brontosaurus',
    'Triceratops with three horns',
    'flying Pterodactyl',
    'Stegosaurus with back plates',
    'baby dinosaur hatching from egg',
    'Velociraptor running',
    'Ankylosaurus with armored body',
    'dinosaur family scene',
    'dinosaur in prehistoric jungle',
    'dinosaur footprints path',
    'dinosaur eating leaves',
    'two dinosaurs playing',
    'dinosaur in volcano landscape',
    'dinosaur skeleton fossil',
  ],
  unicorns: [
    'magical unicorn with rainbow mane',
    'unicorn with fairy wings',
    'baby unicorn playing',
    'unicorn in magical forest',
    'unicorn with castle background',
    'unicorn head with flowers',
    'flying unicorn with stars',
    'unicorn with princess',
    'unicorn eating magic apples',
    'unicorn family portrait',
    'unicorn in clouds',
    'unicorn with butterfly friends',
    'unicorn by enchanted lake',
    'sleeping unicorn',
    'unicorn with rainbow and sun',
  ],
  vehicles: [
    'cartoon car on road',
    'school bus with windows',
    'fire truck with ladder',
    'police car with lights',
    'airplane in sky',
    'helicopter flying',
    'train on tracks',
    'boat on water',
    'rocket ship blasting off',
    'bicycle with basket',
    'motorcycle rider',
    'construction truck',
    'ice cream truck',
    'ambulance rushing',
    'tractor on farm',
  ],
  ocean: [
    'friendly fish swimming',
    'octopus with eight arms',
    'cute sea turtle',
    'dolphin jumping waves',
    'starfish on sand',
    'seahorse in seaweed',
    'whale spouting water',
    'shark with friendly smile',
    'crab with big claws',
    'jellyfish floating',
    'clownfish in anemone',
    'mermaid with fish',
    'submarine underwater',
    'coral reef scene',
    'pirate ship on ocean',
  ],
  nature: [
    'beautiful flower bouquet',
    'big tree with leaves',
    'butterfly garden scene',
    'sunflower field',
    'mushrooms in forest',
    'bird nest with eggs',
    'waterfall and rocks',
    'mountain landscape',
    'rainbow over meadow',
    'autumn leaves falling',
    'spring flowers blooming',
    'garden with vegetables',
    'pond with lily pads',
    'forest animals scene',
    'sunny day outdoors',
  ],
  islamic: [
    'mosque with dome and minaret',
    'crescent moon and star',
    'geometric arabesque pattern',
    'Islamic lantern design',
    'prayer beads tasbih',
    'Kaaba simple illustration',
    'Islamic geometric star',
    'mosque door archway',
    'palm tree and dates',
    'Islamic tile pattern',
    'Ramadan kareem design',
    'Eid celebration scene',
    'Islamic calligraphy frame',
    'mosque silhouette sunset',
    'Islamic border pattern',
  ],
  space: [
    'astronaut in space suit',
    'rocket ship launching',
    'planet Saturn with rings',
    'smiling sun with rays',
    'moon with craters',
    'stars and constellations',
    'alien in spaceship',
    'space shuttle flying',
    'Earth from space',
    'comet with tail',
    'space station',
    'astronaut on moon',
    'solar system planets',
    'UFO flying saucer',
    'galaxy spiral design',
  ],
  food: [
    'pizza slice with toppings',
    'ice cream cone',
    'cupcake with frosting',
    'fruits basket variety',
    'birthday cake with candles',
    'hamburger with layers',
    'donut with sprinkles',
    'apple with leaf',
    'cookie jar scene',
    'candy assortment',
    'vegetables on plate',
    'breakfast pancakes',
    'popcorn box',
    'lollipop swirl',
    'sandwich layers',
  ],
};

export function getRandomPrompts(theme: Theme, count: number): string[] {
  const prompts = batchPrompts[theme] || batchPrompts.animals;
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
