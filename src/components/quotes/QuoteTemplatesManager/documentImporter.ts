// ייבוא קבצי Word ו-PDF לתבניות הצעות מחיר
import { 
  QuoteTemplate, 
  TemplateStage, 
  TemplateStageItem,
  PaymentStep,
  DEFAULT_DESIGN_SETTINGS 
} from './types';

// Simple ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface ExtractedItem {
  description: string;
  price?: number;
  quantity?: number;
}

/**
 * Parse a Word document (.docx) and extract HTML content with embedded images
 */
async function parseWordDocumentToHtml(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.default.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.default.images.imgElement(function(image: any) {
        return image.read("base64").then(function(imageBuffer: string) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      }),
    }
  );
  
  return result.value;
}

/**
 * Parse a Word document (.docx) and extract raw text
 */
async function parseWordDocumentToText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.default.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Parse a PDF document and extract text content
 */
async function parsePdfDocument(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Extract a title from the text content
 */
function extractTitle(text: string, fileName: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines.slice(0, 15)) {
    const trimmed = line.trim();
    if (trimmed.includes('הצעת מחיר')) {
      return trimmed;
    }
    if (trimmed.length > 5 && trimmed.length < 80 && !trimmed.includes(':')) {
      return trimmed;
    }
  }
  
  const cleanName = fileName.replace(/\.(docx?|pdf)$/i, '').replace(/[_-]/g, ' ');
  return cleanName || 'תבנית מיובאת';
}

/**
 * Try to extract quote items from text content
 */
function extractItemsFromText(text: string): ExtractedItem[] {
  const lines = text.split('\n').filter(line => line.trim());
  const items: ExtractedItem[] = [];
  
  const pricePattern = /[\d,]+\.?\d*\s*₪?/g;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) continue;
    
    if (trimmedLine.includes('הצעת מחיר') || 
        trimmedLine.includes('לכבוד') ||
        trimmedLine.includes('תאריך') ||
        trimmedLine.includes('סה"כ') ||
        trimmedLine.includes('מע"מ') ||
        trimmedLine.includes('כולל')) {
      continue;
    }
    
    const priceMatches = trimmedLine.match(pricePattern);
    
    if (priceMatches && priceMatches.length >= 1) {
      const priceStr = priceMatches[priceMatches.length - 1]
        .replace(/[₪,\s]/g, '');
      const price = parseFloat(priceStr);
      
      if (price > 0 && price < 10000000) {
        const description = trimmedLine
          .replace(pricePattern, '')
          .replace(/^\d+[\.\)]\s*/, '')
          .trim();
        
        if (description.length > 2) {
          items.push({
            description,
            price,
            quantity: 1,
          });
        }
      }
    }
  }
  
  return items;
}

/**
 * Detect sections/stages from text
 */
function extractStages(text: string): TemplateStage[] {
  const lines = text.split('\n').filter(line => line.trim());
  const stages: TemplateStage[] = [];
  
  const sectionPatterns = [
    /^שלב\s+\d+/,
    /^\d+\.\s*[א-ת]/,
    /^[א-ת]\.\s+/,
    /פרק\s+/,
    /כולל:/,
    /שירותים:/,
    /עבודות:/,
  ];
  
  let currentStage: TemplateStage | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;
    
    const isHeader = sectionPatterns.some(p => p.test(trimmed)) || 
                     (trimmed.length < 50 && trimmed.endsWith(':'));
    
    if (isHeader) {
      if (currentStage && currentStage.items.length > 0) {
        stages.push(currentStage);
      }
      
      currentStage = {
        id: generateId(),
        name: trimmed.replace(/[:：]$/, ''),
        icon: '📋',
        items: [],
        isExpanded: true,
      };
    } else if (currentStage && trimmed.length > 5) {
      currentStage.items.push({
        id: generateId(),
        text: trimmed,
      });
    }
  }
  
  if (currentStage && currentStage.items.length > 0) {
    stages.push(currentStage);
  }
  
  if (stages.length === 0) {
    const items: TemplateStageItem[] = lines
      .filter(l => l.trim().length > 10)
      .slice(0, 20)
      .map(line => ({
        id: generateId(),
        text: line.trim(),
      }));
    
    if (items.length > 0) {
      stages.push({
        id: generateId(),
        name: 'תוכן מיובא',
        icon: '📄',
        items,
        isExpanded: true,
      });
    }
  }
  
  return stages;
}

/**
 * Detect payment schedule from text
 */
function extractPaymentSchedule(text: string): PaymentStep[] {
  const payments: PaymentStep[] = [];
  const lines = text.split('\n');
  
  const percentPattern = /(\d+)\s*%/g;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('%')) {
      const matches = [...trimmed.matchAll(percentPattern)];
      for (const match of matches) {
        const percentage = parseInt(match[1]);
        if (percentage > 0 && percentage <= 100) {
          payments.push({
            id: generateId(),
            percentage,
            description: trimmed.replace(percentPattern, '').trim() || 'תשלום',
          });
        }
      }
    }
  }
  
  if (payments.length === 0) {
    return [
      { id: generateId(), percentage: 50, description: 'חתימת חוזה' },
      { id: generateId(), percentage: 50, description: 'סיום העבודה' },
    ];
  }
  
  return payments;
}

/**
 * Detect category from content
 */
function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('היתר') || lowerText.includes('רישוי')) return 'היתר_בניה';
  if (lowerText.includes('תוספת') || lowerText.includes('הרחבה') || lowerText.includes('בניה')) return 'construction';
  if (lowerText.includes('שיפוץ')) return 'שיפוץ';
  if (lowerText.includes('פנים') || lowerText.includes('עיצוב')) return 'תכנון_פנים';
  if (lowerText.includes('פיקוח')) return 'פיקוח';
  if (lowerText.includes('ייעוץ')) return 'ייעוץ';
  
  return 'אחר';
}

/**
 * Calculate base price from extracted items
 */
function calculateBasePrice(items: ExtractedItem[]): number {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
}

/**
 * Wrap the mammoth HTML output with RTL styling for proper display
 */
function wrapHtmlWithStyling(html: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'David', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #1a1a1a;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 1.8em; }
    h2 { font-size: 1.4em; }
    h3 { font-size: 1.2em; }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    td, th {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: right;
    }
    p { margin: 0.5em 0; }
    ul, ol {
      padding-right: 20px;
      padding-left: 0;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Import a Word or PDF file and convert to QuoteTemplate
 * Now includes HTML conversion for Word files with embedded images
 */
export async function importDocumentToTemplate(file: File): Promise<Partial<QuoteTemplate> | null> {
  try {
    const fileName = file.name.toLowerCase();
    let textContent = '';
    let htmlContent: string | null = null;
    
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Get both HTML (with images) and raw text
      const [html, text] = await Promise.all([
        parseWordDocumentToHtml(file),
        parseWordDocumentToText(file),
      ]);
      textContent = text;
      htmlContent = html;
    } else if (fileName.endsWith('.pdf')) {
      textContent = await parsePdfDocument(file);
    } else {
      throw new Error('סוג קובץ לא נתמך. נא להעלות קובץ Word או PDF.');
    }
    
    if (!textContent.trim() && !htmlContent?.trim()) {
      throw new Error('לא ניתן לחלץ תוכן מהקובץ');
    }
    
    const title = extractTitle(textContent, file.name);
    const stages = extractStages(textContent);
    const extractedItems = extractItemsFromText(textContent);
    const payments = extractPaymentSchedule(textContent);
    const category = detectCategory(textContent);
    const basePrice = calculateBasePrice(extractedItems);
    
    // Wrap the HTML with proper RTL styling
    const styledHtml = htmlContent ? wrapHtmlWithStyling(htmlContent, title) : null;
    
    return {
      name: title,
      description: `מיובא מקובץ: ${file.name}`,
      category,
      stages,
      items: extractedItems.map(item => ({
        id: generateId(),
        description: item.description,
        quantity: item.quantity || 1,
        unit: 'יח׳',
        unit_price: item.price || 0,
        total: (item.price || 0) * (item.quantity || 1),
      })),
      payment_schedule: payments,
      timeline: [],
      important_notes: [],
      validity_days: 30,
      base_price: basePrice,
      show_vat: true,
      vat_rate: 17,
      is_active: true,
      html_content: styledHtml,
      design_settings: {
        ...DEFAULT_DESIGN_SETTINGS,
        primary_color: '#DAA520',
        secondary_color: '#B8860B',
        header_style: 'gradient',
      },
    };
  } catch (error) {
    console.error('Error importing document:', error);
    throw error;
  }
}

/**
 * Convert a Word file directly to styled HTML string (for standalone HTML export)
 */
export async function convertWordToHtml(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.default.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.default.images.imgElement(function(image: any) {
        return image.read("base64").then(function(imageBuffer: string) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      }),
    }
  );
  
  const title = extractTitle(result.value.replace(/<[^>]*>/g, ''), file.name);
  return wrapHtmlWithStyling(result.value, title);
}

/**
 * Get supported file types description
 */
export function getSupportedDocumentTypes(): string {
  return 'Word (.docx, .doc) ו-PDF (.pdf)';
}
