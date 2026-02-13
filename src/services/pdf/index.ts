// PDF Generation Service for KDP-Compliant PDFs
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import type { TrimSize, PDFExportOptions } from '@/types';
import { KDP_SPECS } from '@/types';

const POINTS_PER_INCH = 72;

// Convert inches to PDF points
function inchesToPoints(inches: number): number {
  return inches * POINTS_PER_INCH;
}

// Calculate spine width based on page count (white paper formula)
export function calculateSpineWidth(pageCount: number): number {
  // KDP formula: page count / 444 for white paper
  return pageCount / 444;
}

// Calculate full cover width
export function calculateCoverWidth(
  trimSize: TrimSize,
  pageCount: number
): { width: number; height: number; spineWidth: number } {
  const spec = KDP_SPECS[trimSize];
  const spineWidth = calculateSpineWidth(pageCount);
  const bleed = spec.bleed;
  
  return {
    // Full cover: bleed + back cover + spine + front cover + bleed
    width: bleed + spec.width + spineWidth + spec.width + bleed,
    height: spec.height + (bleed * 2),
    spineWidth,
  };
}

export interface InteriorOptions {
  trimSize: TrimSize;
  imagePaths: string[];
  includePageNumbers?: boolean;
}

export async function generateInteriorPDF(
  options: InteriorOptions
): Promise<Buffer> {
  const { trimSize, imagePaths, includePageNumbers = true } = options;
  const spec = KDP_SPECS[trimSize];
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const pageWidth = inchesToPoints(spec.width);
  const pageHeight = inchesToPoints(spec.height);
  
  // Calculate image area (within margins)
  const imageWidth = pageWidth - inchesToPoints(spec.margins.inside + spec.margins.outside);
  const imageHeight = pageHeight - inchesToPoints(spec.margins.top + spec.margins.bottom);
  
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    
    // Add blank page for left side (coloring books typically have image on right)
    if (i === 0) {
      // Title page or first blank
      const blankPage = pdfDoc.addPage([pageWidth, pageHeight]);
      blankPage.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(1, 1, 1),
      });
    }
    
    // Add page with image
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // White background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1),
    });
    
    try {
      // Read and embed image
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      const imageBytes = await fs.readFile(fullImagePath);
      
      let embeddedImage;
      if (imagePath.toLowerCase().endsWith('.png')) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      }
      
      // Calculate scale to fit within margins while maintaining aspect ratio
      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;
      const scaleX = imageWidth / imgWidth;
      const scaleY = imageHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      
      // Center the image within the margins
      const x = inchesToPoints(spec.margins.inside) + (imageWidth - scaledWidth) / 2;
      const y = inchesToPoints(spec.margins.bottom) + (imageHeight - scaledHeight) / 2;
      
      page.drawImage(embeddedImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
    } catch (error) {
      console.error(`Failed to embed image ${imagePath}:`, error);
      // Draw placeholder if image fails
      page.drawText('Image could not be loaded', {
        x: pageWidth / 2 - 80,
        y: pageHeight / 2,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Add page number
    if (includePageNumbers) {
      const pageNum = (i + 1).toString();
      const textWidth = font.widthOfTextAtSize(pageNum, 10);
      page.drawText(pageNum, {
        x: (pageWidth - textWidth) / 2,
        y: inchesToPoints(0.25),
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Add blank page after each image (for single-sided coloring)
    const blankPage = pdfDoc.addPage([pageWidth, pageHeight]);
    blankPage.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1),
    });
  }
  
  return Buffer.from(await pdfDoc.save());
}

export interface CoverOptions {
  trimSize: TrimSize;
  pageCount: number;
  title: string;
  author: string;
  backText?: string;
  backgroundColor?: { r: number; g: number; b: number };
}

export async function generateCoverPDF(options: CoverOptions): Promise<Buffer> {
  const { trimSize, pageCount, title, author, backText, backgroundColor } = options;
  const spec = KDP_SPECS[trimSize];
  const coverDims = calculateCoverWidth(trimSize, pageCount);
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const pageWidth = inchesToPoints(coverDims.width);
  const pageHeight = inchesToPoints(coverDims.height);
  
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Background color
  const bgColor = backgroundColor || { r: 1, g: 1, b: 1 };
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(bgColor.r, bgColor.g, bgColor.b),
  });
  
  // Draw guide lines (for reference, remove in production)
  const bleedPoints = inchesToPoints(spec.bleed);
  const trimWidth = inchesToPoints(spec.width);
  const spinePoints = inchesToPoints(coverDims.spineWidth);
  
  // Spine area markers (subtle lines)
  const spineLeft = bleedPoints + trimWidth;
  const spineRight = spineLeft + spinePoints;
  
  page.drawLine({
    start: { x: spineLeft, y: 0 },
    end: { x: spineLeft, y: pageHeight },
    thickness: 0.5,
    color: rgb(0.9, 0.9, 0.9),
    dashArray: [5, 5],
  });
  
  page.drawLine({
    start: { x: spineRight, y: 0 },
    end: { x: spineRight, y: pageHeight },
    thickness: 0.5,
    color: rgb(0.9, 0.9, 0.9),
    dashArray: [5, 5],
  });
  
  // Front cover text (right side)
  const frontCenterX = spineRight + trimWidth / 2;
  const titleFontSize = Math.min(48, trimWidth * POINTS_PER_INCH / (title.length * 0.6));
  const titleWidth = font.widthOfTextAtSize(title, titleFontSize);
  
  page.drawText(title, {
    x: frontCenterX - titleWidth / 2,
    y: pageHeight * 0.65,
    size: titleFontSize,
    font,
    color: rgb(0, 0, 0),
  });
  
  // Author
  const authorFontSize = 18;
  const authorWidth = fontRegular.widthOfTextAtSize(author, authorFontSize);
  
  page.drawText(author, {
    x: frontCenterX - authorWidth / 2,
    y: pageHeight * 0.35,
    size: authorFontSize,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Spine text (if spine is wide enough)
  if (coverDims.spineWidth > 0.5) {
    const spineCenterX = spineLeft + spinePoints / 2;
    const spineFontSize = Math.min(12, spinePoints * POINTS_PER_INCH * 0.6);
    
    // Rotate text for spine
    page.pushOperators();
    // Note: For proper spine text rotation, we'd need more complex transformations
    // For now, we'll just indicate spine area
  }
  
  // Back cover text (left side)
  if (backText) {
    const backCenterX = bleedPoints + trimWidth / 2;
    const backFontSize = 12;
    const maxWidth = trimWidth * POINTS_PER_INCH - 40;
    
    // Simple text wrapping
    const words = backText.split(' ');
    let lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = fontRegular.widthOfTextAtSize(testLine, backFontSize);
      
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    const lineHeight = backFontSize * 1.4;
    const startY = pageHeight * 0.6 + (lines.length * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      const lineWidth = fontRegular.widthOfTextAtSize(line, backFontSize);
      page.drawText(line, {
        x: backCenterX - lineWidth / 2,
        y: startY - index * lineHeight,
        size: backFontSize,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
  }
  
  return Buffer.from(await pdfDoc.save());
}

// Generate both interior and cover as a combined export
export async function generateFullExport(
  interiorOptions: InteriorOptions,
  coverOptions: CoverOptions
): Promise<{ interior: Buffer; cover: Buffer }> {
  const [interior, cover] = await Promise.all([
    generateInteriorPDF(interiorOptions),
    generateCoverPDF(coverOptions),
  ]);
  
  return { interior, cover };
}
