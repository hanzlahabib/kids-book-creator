import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createSampleColoringBook() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Page dimensions (8.5 x 11 inches at 72 DPI)
  const pageWidth = 612;
  const pageHeight = 792;
  
  // Colors
  const primary = rgb(0.878, 0.478, 0.373); // Terracotta
  const secondary = rgb(0.24, 0.25, 0.36); // Dark slate
  const accent = rgb(0.506, 0.698, 0.604); // Sage green
  const gray = rgb(0.6, 0.6, 0.6);
  const lightGray = rgb(0.85, 0.85, 0.85);
  
  // Title Page
  const titlePage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Title box
  titlePage.drawRectangle({
    x: 50,
    y: pageHeight - 300,
    width: pageWidth - 100,
    height: 200,
    color: rgb(0.98, 0.98, 0.96),
    borderColor: primary,
    borderWidth: 3,
  });
  
  titlePage.drawText('ANIMALS', {
    x: 200,
    y: pageHeight - 180,
    size: 48,
    font: boldFont,
    color: primary,
  });
  titlePage.drawText('COLORING BOOK', {
    x: 150,
    y: pageHeight - 230,
    size: 32,
    font: boldFont,
    color: secondary,
  });
  titlePage.drawText('For Kids Ages 4-6', {
    x: 220,
    y: pageHeight - 280,
    size: 18,
    font: font,
    color: gray,
  });
  
  // Decorative circles
  titlePage.drawCircle({
    x: 100,
    y: pageHeight - 450,
    size: 40,
    borderColor: primary,
    borderWidth: 3,
  });
  titlePage.drawCircle({
    x: 306,
    y: pageHeight - 500,
    size: 60,
    borderColor: accent,
    borderWidth: 4,
  });
  titlePage.drawCircle({
    x: 512,
    y: pageHeight - 450,
    size: 40,
    borderColor: secondary,
    borderWidth: 3,
  });
  
  titlePage.drawText('Created with Kids Book Creator', {
    x: 180,
    y: 80,
    size: 12,
    font: font,
    color: gray,
  });

  // Animal pages data
  const animals = [
    { name: 'LION', fact: 'Lions are called the King of the Jungle!' },
    { name: 'ELEPHANT', fact: 'Elephants never forget!' },
    { name: 'GIRAFFE', fact: 'Giraffes are the tallest animals!' },
    { name: 'PENGUIN', fact: 'Penguins cannot fly but they swim!' },
    { name: 'BUTTERFLY', fact: 'Butterflies taste with their feet!' },
    { name: 'DOLPHIN', fact: 'Dolphins sleep with one eye open!' },
    { name: 'OWL', fact: 'Owls can turn their heads 270 degrees!' },
    { name: 'RABBIT', fact: 'A rabbits teeth never stop growing!' },
  ];

  // Create coloring pages
  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Page header
    page.drawText('Color the', {
      x: 240,
      y: pageHeight - 50,
      size: 20,
      font: font,
      color: gray,
    });
    page.drawText(animal.name, {
      x: 306 - (animal.name.length * 12),
      y: pageHeight - 85,
      size: 36,
      font: boldFont,
      color: primary,
    });
    
    // Main coloring area - decorative border
    const boxX = 80;
    const boxY = 180;
    const boxW = pageWidth - 160;
    const boxH = 480;
    
    // Outer border
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      borderColor: secondary,
      borderWidth: 2,
    });
    
    // Inner decorative border
    page.drawRectangle({
      x: boxX + 10,
      y: boxY + 10,
      width: boxW - 20,
      height: boxH - 20,
      borderColor: lightGray,
      borderWidth: 1,
    });
    
    // Placeholder shapes to color (simple geometric shapes)
    const centerX = pageWidth / 2;
    const centerY = boxY + boxH / 2;
    
    // Main circle (body)
    page.drawCircle({
      x: centerX,
      y: centerY,
      size: 100,
      borderColor: secondary,
      borderWidth: 2,
    });
    
    // Head circle
    page.drawCircle({
      x: centerX,
      y: centerY + 120,
      size: 60,
      borderColor: secondary,
      borderWidth: 2,
    });
    
    // Eyes
    page.drawCircle({
      x: centerX - 20,
      y: centerY + 130,
      size: 10,
      borderColor: secondary,
      borderWidth: 1.5,
    });
    page.drawCircle({
      x: centerX + 20,
      y: centerY + 130,
      size: 10,
      borderColor: secondary,
      borderWidth: 1.5,
    });
    
    // Legs
    page.drawRectangle({
      x: centerX - 60,
      y: centerY - 150,
      width: 20,
      height: 60,
      borderColor: secondary,
      borderWidth: 2,
    });
    page.drawRectangle({
      x: centerX + 40,
      y: centerY - 150,
      width: 20,
      height: 60,
      borderColor: secondary,
      borderWidth: 2,
    });
    
    // Animal name in coloring area
    page.drawText(animal.name, {
      x: centerX - (animal.name.length * 8),
      y: boxY + 30,
      size: 24,
      font: boldFont,
      color: lightGray,
    });
    
    // Fun fact at bottom
    page.drawRectangle({
      x: 80,
      y: 80,
      width: pageWidth - 160,
      height: 60,
      color: rgb(0.98, 0.98, 0.96),
      borderColor: accent,
      borderWidth: 1,
    });
    page.drawText('Fun Fact:', {
      x: 100,
      y: 115,
      size: 12,
      font: boldFont,
      color: accent,
    });
    page.drawText(animal.fact, {
      x: 100,
      y: 95,
      size: 11,
      font: font,
      color: gray,
    });
    
    // Page number
    page.drawText(`- ${i + 2} -`, {
      x: 290,
      y: 40,
      size: 10,
      font: font,
      color: gray,
    });
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'public', 'exports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'animals-coloring-book.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log('PDF created: ' + outputPath);
  console.log('Total pages: ' + pdfDoc.getPageCount());
  
  return outputPath;
}

createSampleColoringBook().catch(console.error);
