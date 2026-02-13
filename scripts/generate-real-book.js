import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function createRealColoringBook() {
  console.log('Creating real coloring book with actual images...');
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 612;  // 8.5 inches
  const pageHeight = 792; // 11 inches
  
  const primary = rgb(0.878, 0.478, 0.373);
  const secondary = rgb(0.24, 0.25, 0.36);
  const gray = rgb(0.5, 0.5, 0.5);
  
  // Free line art images from public sources (openclipart, etc.)
  const coloringPages = [
    {
      name: 'Lion',
      url: 'https://openclipart.org/image/800px/167157',
      fact: 'Lions can sleep up to 20 hours a day!'
    },
    {
      name: 'Elephant',
      url: 'https://openclipart.org/image/800px/16941',
      fact: 'Elephants are the largest land animals!'
    },
    {
      name: 'Cat',
      url: 'https://openclipart.org/image/800px/213806',
      fact: 'Cats spend 70% of their lives sleeping!'
    },
    {
      name: 'Dog',
      url: 'https://openclipart.org/image/800px/189959', 
      fact: 'Dogs have wet noses to absorb scent!'
    },
    {
      name: 'Fish',
      url: 'https://openclipart.org/image/800px/171583',
      fact: 'Fish can taste with their whole body!'
    },
    {
      name: 'Bird',
      url: 'https://openclipart.org/image/800px/28035',
      fact: 'Some birds can fly backwards!'
    },
    {
      name: 'Butterfly',
      url: 'https://openclipart.org/image/800px/296686',
      fact: 'Butterflies taste with their feet!'
    },
    {
      name: 'Turtle',
      url: 'https://openclipart.org/image/800px/171426',
      fact: 'Turtles have been on Earth for 200 million years!'
    }
  ];

  // Title Page
  console.log('Creating title page...');
  const titlePage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  titlePage.drawRectangle({
    x: 40,
    y: pageHeight - 350,
    width: pageWidth - 80,
    height: 280,
    borderColor: primary,
    borderWidth: 4,
  });
  
  titlePage.drawText('ANIMALS', {
    x: 190,
    y: pageHeight - 150,
    size: 56,
    font: boldFont,
    color: primary,
  });
  
  titlePage.drawText('Coloring Book', {
    x: 180,
    y: pageHeight - 220,
    size: 36,
    font: boldFont,
    color: secondary,
  });
  
  titlePage.drawText('For Kids Ages 4-8', {
    x: 220,
    y: pageHeight - 280,
    size: 20,
    font: font,
    color: gray,
  });
  
  titlePage.drawText('This book belongs to:', {
    x: 200,
    y: 200,
    size: 16,
    font: font,
    color: gray,
  });
  
  titlePage.drawLine({
    start: { x: 180, y: 160 },
    end: { x: 432, y: 160 },
    thickness: 1,
    color: gray,
  });
  
  titlePage.drawText('Kids Book Creator', {
    x: 230,
    y: 60,
    size: 12,
    font: font,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Create coloring pages
  for (let i = 0; i < coloringPages.length; i++) {
    const item = coloringPages[i];
    console.log(`Creating page ${i + 1}: ${item.name}...`);
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Header
    page.drawText(`Color the ${item.name}!`, {
      x: 200,
      y: pageHeight - 50,
      size: 28,
      font: boldFont,
      color: primary,
    });
    
    // Main coloring area border
    page.drawRectangle({
      x: 56,
      y: 140,
      width: 500,
      height: 550,
      borderColor: secondary,
      borderWidth: 2,
    });
    
    // Try to download and embed image
    try {
      console.log(`  Downloading image for ${item.name}...`);
      const imageBytes = await downloadImage(item.url);
      
      let image;
      if (item.url.includes('.png') || imageBytes[0] === 0x89) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      
      // Calculate dimensions to fit in box while maintaining aspect ratio
      const maxWidth = 460;
      const maxHeight = 480;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const imgWidth = image.width * scale;
      const imgHeight = image.height * scale;
      
      // Center the image
      const imgX = 56 + (500 - imgWidth) / 2;
      const imgY = 140 + (550 - imgHeight) / 2;
      
      page.drawImage(image, {
        x: imgX,
        y: imgY,
        width: imgWidth,
        height: imgHeight,
      });
      
      console.log(`  Added image for ${item.name}`);
    } catch (err) {
      console.log(`  Could not load image for ${item.name}: ${err.message}`);
      // Fallback: draw placeholder text
      page.drawText(item.name.toUpperCase(), {
        x: 250,
        y: 400,
        size: 48,
        font: boldFont,
        color: rgb(0.9, 0.9, 0.9),
      });
    }
    
    // Fun fact box
    page.drawRectangle({
      x: 56,
      y: 60,
      width: 500,
      height: 50,
      color: rgb(0.98, 0.97, 0.95),
      borderColor: rgb(0.506, 0.698, 0.604),
      borderWidth: 1,
    });
    
    page.drawText('Fun Fact: ' + item.fact, {
      x: 70,
      y: 80,
      size: 12,
      font: font,
      color: gray,
    });
    
    // Page number
    page.drawText(`- ${i + 2} -`, {
      x: 290,
      y: 30,
      size: 10,
      font: font,
      color: gray,
    });
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  
  const outputDir = path.join(process.cwd(), 'public', 'exports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'animals-coloring-book-real.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log('');
  console.log('PDF created successfully!');
  console.log('Location: ' + outputPath);
  console.log('Total pages: ' + pdfDoc.getPageCount());
  
  return outputPath;
}

createRealColoringBook().catch(console.error);
