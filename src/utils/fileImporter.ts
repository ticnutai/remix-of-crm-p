// File importer utility for Word and PDF files
// Libraries are loaded dynamically to improve initial page load

export interface ImportedContent {
  title: string;
  content: string;
  items: ImportedItem[];
}

export interface ImportedItem {
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
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
 * Try to extract quote items from text content
 * This is a simple heuristic that looks for lines with numbers
 */
function extractItemsFromText(text: string): ImportedItem[] {
  const lines = text.split('\n').filter(line => line.trim());
  const items: ImportedItem[] = [];
  
  // Look for lines that might be items (contain numbers that could be prices)
  const pricePattern = /[\d,]+\.?\d*\s*₪?/g;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) continue;
    
    // Skip header-like lines
    if (trimmedLine.includes('הצעת מחיר') || 
        trimmedLine.includes('לכבוד') ||
        trimmedLine.includes('תאריך') ||
        trimmedLine.includes('סה"כ')) {
      continue;
    }
    
    const priceMatches = trimmedLine.match(pricePattern);
    
    if (priceMatches && priceMatches.length >= 1) {
      // Extract the last number as price
      const priceStr = priceMatches[priceMatches.length - 1]
        .replace(/[₪,\s]/g, '');
      const price = parseFloat(priceStr);
      
      if (price > 0 && price < 1000000) {
        // Extract description (everything before the numbers)
        const description = trimmedLine
          .replace(pricePattern, '')
          .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers like "1." or "1)"
          .trim();
        
        if (description.length > 2) {
          items.push({
            description,
            quantity: 1,
            unitPrice: price,
          });
        }
      }
    }
  }
  
  return items;
}

/**
 * Extract a title from the text content
 */
function extractTitle(text: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Look for common title patterns
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim();
    if (trimmed.includes('הצעת מחיר')) {
      return trimmed;
    }
    if (trimmed.length > 5 && trimmed.length < 100 && !trimmed.includes(':')) {
      return trimmed;
    }
  }
  
  return 'הצעת מחיר מיובאת';
}

/**
 * Import a file and extract structured content
 */
export async function importFile(file: File): Promise<ImportedContent> {
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
  
  const title = extractTitle(textContent);
  const items = extractItemsFromText(textContent);
  
  return {
    title,
    content: textContent,
    items,
  };
}

/**
 * Get supported file types description
 */
export function getSupportedFileTypes(): string {
  return 'Word (.docx, .doc) ו-PDF (.pdf)';
}
