// Type definitions for Kids Book Creator

export interface Book {
  id: string;
  title: string;
  subtitle?: string | null;
  theme?: string | null;
  ageGroup?: string | null;
  status: string;
  kdpAsin?: string | null;
  pageCount: number;
  trimSize: string;
  createdAt: Date;
  updatedAt: Date;
  pages?: Page[];
}

export interface Page {
  id: string;
  bookId?: string | null;
  pageNumber: number;
  imagePath: string;
  prompt?: string | null;
  theme?: string | null;
  style?: string | null;
  ageGroup?: string | null;
  createdAt: Date;
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  theme: string;
  ageGroup: string;
  promptBase: string;
  previewPath?: string | null;
  config?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Generation {
  id: string;
  prompt: string;
  imagePath: string;
  theme?: string | null;
  style?: string | null;
  ageGroup?: string | null;
  status: string;
  createdAt: Date;
}

export type Theme = 
  | 'animals'
  | 'alphabet'
  | 'numbers'
  | 'dinosaurs'
  | 'unicorns'
  | 'vehicles'
  | 'ocean'
  | 'nature'
  | 'islamic'
  | 'space'
  | 'food';

export type AgeGroup = '2-4' | '4-6' | '6-8' | '8+';

export type TrimSize = '8.5x11' | '8x10' | '6x9';

export type BookStatus = 'draft' | 'ready' | 'exported';

export interface GenerationRequest {
  theme: Theme;
  subject: string;
  ageGroup: AgeGroup;
  quantity?: number;
  style?: 'coloring' | 'tracing' | 'activity';
}

export interface GenerationResult {
  id: string;
  imagePath: string;
  prompt: string;
  success: boolean;
  error?: string;
}

export interface PDFExportOptions {
  trimSize: TrimSize;
  includePageNumbers: boolean;
  includeCover: boolean;
  coverTitle?: string;
  coverAuthor?: string;
  coverBackText?: string;
}

// KDP Specifications
export const KDP_SPECS: Record<TrimSize, {
  width: number;
  height: number;
  margins: { top: number; bottom: number; inside: number; outside: number };
  bleed: number;
}> = {
  '8.5x11': {
    width: 8.5,
    height: 11,
    margins: { top: 0.5, bottom: 0.5, inside: 0.5, outside: 0.375 },
    bleed: 0.125,
  },
  '8x10': {
    width: 8,
    height: 10,
    margins: { top: 0.5, bottom: 0.5, inside: 0.5, outside: 0.375 },
    bleed: 0.125,
  },
  '6x9': {
    width: 6,
    height: 9,
    margins: { top: 0.5, bottom: 0.5, inside: 0.5, outside: 0.375 },
    bleed: 0.125,
  },
};
