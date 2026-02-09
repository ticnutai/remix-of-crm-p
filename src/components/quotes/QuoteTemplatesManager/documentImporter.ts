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
 * Parse a Word document (.docx) and extract text content
 */
async function parseWordDocument(file: File): Promise<string> {
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
  // Set the worker source for PDF.js
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
  
  // Look for common title patterns
  for (const line of lines.slice(0, 15)) {
    const trimmed = line.trim();
    if (trimmed.includes('הצעת מחיר')) {
      return trimmed;
    }
    // Look for short meaningful titles
    if (trimmed.length > 5 && trimmed.length < 80 && !trimmed.includes(':')) {
      return trimmed;
    }
  }
  
  // Use file name as fallback
  const cleanName = fileName.replace(/\.(docx?|pdf)$/i, '').replace(/[_-]/g, ' ');
  return cleanName || 'תבנית מיובאת';
}

/**
 * Try to extract quote items from text content
 */
function extractItemsFromText(text: string): ExtractedItem[] {
  const lines = text.split('\n').filter(line => line.trim());
  const items: ExtractedItem[] = [];
  
  // Pattern for prices in shekels
  const pricePattern = /[\d,]+\.?\d*\s*₪?/g;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) continue;
    
    // Skip header-like lines
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
      // Extract the last number as price
      const priceStr = priceMatches[priceMatches.length - 1]
        .replace(/[₪,\s]/g, '');
      const price = parseFloat(priceStr);
      
      if (price > 0 && price < 10000000) {
        // Extract description (everything before the numbers)
        const description = trimmedLine
          .replace(pricePattern, '')
          .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers like "1." or "1)"
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
  
  // Common section headers in Hebrew
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
    
    // Check if this is a section header
    const isHeader = sectionPatterns.some(p => p.test(trimmed)) || 
                     (trimmed.length < 50 && trimmed.endsWith(':'));
    
    if (isHeader) {
      // Save previous stage
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
      // Add as item to current stage
      currentStage.items.push({
        id: generateId(),
        text: trimmed,
      });
    }
  }
  
  // Save last stage
  if (currentStage && currentStage.items.length > 0) {
    stages.push(currentStage);
  }
  
  // If no stages found, create one default stage with content
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
  
  // Look for payment patterns
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
  
  // If no payments found, use default
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
  
  if (lowerText.includes('היתר') || lowerText.includes('רישוי')) {
    return 'היתר_בניה';
  }
  if (lowerText.includes('תוספת') || lowerText.includes('הרחבה') || lowerText.includes('בניה')) {
    return 'construction';
  }
  if (lowerText.includes('שיפוץ')) {
    return 'שיפוץ';
  }
  if (lowerText.includes('פנים') || lowerText.includes('עיצוב')) {
    return 'תכנון_פנים';
  }
  if (lowerText.includes('פיקוח')) {
    return 'פיקוח';
  }
  if (lowerText.includes('ייעוץ')) {
    return 'ייעוץ';
  }
  
  return 'אחר';
}

/**
 * Calculate base price from extracted items
 */
function calculateBasePrice(items: ExtractedItem[]): number {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
}

/**
 * Import a Word or PDF file and convert to QuoteTemplate
 */
export async function importDocumentToTemplate(file: File): Promise<Partial<QuoteTemplate> | null> {
  try {
    const fileName = file.name.toLowerCase();
    let textContent = '';
    
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      textContent = await parseWordDocument(file);
    } else if (fileName.endsWith('.pdf')) {
      textContent = await parsePdfDocument(file);
    } else {
      throw new Error('סוג קובץ לא נתמך. נא להעלות קובץ Word או PDF.');
    }
    
    if (!textContent.trim()) {
      throw new Error('לא ניתן לחלץ תוכן מהקובץ');
    }
    
    const title = extractTitle(textContent, file.name);
    const stages = extractStages(textContent);
    const extractedItems = extractItemsFromText(textContent);
    const payments = extractPaymentSchedule(textContent);
    const category = detectCategory(textContent);
    const basePrice = calculateBasePrice(extractedItems);
    
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
 * Get supported file types description
 */
export function getSupportedDocumentTypes(): string {
  return 'Word (.docx, .doc) ו-PDF (.pdf)';
}
