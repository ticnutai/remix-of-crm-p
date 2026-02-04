// פארסר HTML לייבוא טמפלטים מקבצי HTML
import { 
  QuoteTemplate, 
  TemplateStage, 
  TemplateStageItem,
  PaymentStep,
  TimelineStep,
  DEFAULT_DESIGN_SETTINGS 
} from './types';

// Simple ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  isRecommended: boolean;
}

interface Upgrade {
  name: string;
  price: number;
  description: string;
}

interface ParsedTemplate {
  title: string;
  subtitle: string;
  location: string;
  price: number;
  stages: TemplateStage[];
  pricingTiers: PricingTier[];
  upgrades: Upgrade[];
  payments: PaymentStep[];
  timeline: TimelineStep[];
  notes: string[];
  validityDays: number;
}

// חילוץ מספר ממחרוזת
function extractPrice(text: string): number {
  const match = text.replace(/[,₪]/g, '').match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// ניקוי טקסט
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// פירוס HTML לטמפלט
export function parseHtmlTemplate(html: string): ParsedTemplate | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // כותרת
    const titleEl = doc.querySelector('.header h1');
    const title = titleEl ? cleanText(titleEl.textContent || '') : 'טמפלט מיובא';
    
    // תת-כותרת
    const subtitleEl = doc.querySelector('.header .subtitle');
    const subtitle = subtitleEl ? cleanText(subtitleEl.textContent || '') : '';
    
    // מיקום
    const locationEl = doc.querySelector('.header .location');
    const location = locationEl ? cleanText(locationEl.textContent || '') : '';
    
    // מחיר ראשי
    const priceEl = doc.querySelector('.header .price');
    const priceText = priceEl ? priceEl.textContent || '' : '';
    const price = extractPrice(priceText);
    
    // חבילות מחיר (pricing tiers)
    const pricingTiers: PricingTier[] = [];
    const tierElements = doc.querySelectorAll('.tier');
    tierElements.forEach(tierEl => {
      const nameEl = tierEl.querySelector('h3');
      const priceEl = tierEl.querySelector('.tier-price');
      const descEl = tierEl.querySelector('.tier-description');
      const featureEls = tierEl.querySelectorAll('ul li');
      
      const features: string[] = [];
      featureEls.forEach(li => {
        features.push(cleanText(li.textContent || ''));
      });
      
      pricingTiers.push({
        name: nameEl ? cleanText(nameEl.textContent || '') : '',
        price: priceEl ? extractPrice(priceEl.textContent || '') : 0,
        description: descEl ? cleanText(descEl.textContent || '') : '',
        features,
        isRecommended: tierEl.classList.contains('recommended'),
      });
    });
    
    // שידרוגים
    const upgrades: Upgrade[] = [];
    const upgradeElements = doc.querySelectorAll('.upgrades .upgrade');
    upgradeElements.forEach(upEl => {
      const nameEl = upEl.querySelector('h4');
      const priceEl = upEl.querySelector('.upgrade-price');
      const descEl = upEl.querySelector('p');
      
      upgrades.push({
        name: nameEl ? cleanText(nameEl.textContent || '') : '',
        price: priceEl ? extractPrice(priceEl.textContent || '') : 0,
        description: descEl ? cleanText(descEl.textContent || '') : '',
      });
    });
    
    // שלבים (sections)
    const stages: TemplateStage[] = [];
    const sectionElements = doc.querySelectorAll('.section');
    sectionElements.forEach(secEl => {
      const titleEl = secEl.querySelector('.section-title');
      if (!titleEl) return;
      
      const sectionTitle = cleanText(titleEl.textContent || '');
      
      // דלג על חבילות מחיר ושידרוגים - הם נפרדים
      if (sectionTitle.includes('חבילות מחיר') || sectionTitle.includes('שידרוגים ותוספות')) {
        return;
      }
      
      const items: TemplateStageItem[] = [];
      const itemElements = secEl.querySelectorAll('.item');
      itemElements.forEach(itemEl => {
        const textEl = itemEl.querySelector('.text');
        const upgradeEl = itemEl.querySelector('.upgrade-price');
        
        let text = textEl ? cleanText(textEl.textContent || '') : '';
        if (upgradeEl) {
          text += ` (שידרוג: ${cleanText(upgradeEl.textContent || '')})`;
        }
        
        if (text) {
          items.push({
            id: generateId(),
            text,
          });
        }
      });
      
      if (items.length > 0) {
        // חילוץ אימוג'י לאייקון
        const iconMatch = sectionTitle.match(/^(\p{Emoji})/u);
        const icon = iconMatch ? iconMatch[1] : '📋';
        const name = sectionTitle.replace(/^\p{Emoji}\s*/u, '').trim();
        
        stages.push({
          id: generateId(),
          name,
          icon,
          items,
          isExpanded: true,
        });
      }
    });
    
    // תשלומים
    const payments: PaymentStep[] = [];
    const paymentElements = doc.querySelectorAll('.payment');
    paymentElements.forEach(payEl => {
      const percentEl = payEl.querySelector('.percentage');
      const descEl = payEl.querySelector('.description');
      
      const percentText = percentEl ? percentEl.textContent || '' : '';
      const percentage = parseInt(percentText.replace(/[^0-9]/g, '')) || 0;
      
      if (percentage > 0) {
        payments.push({
          id: generateId(),
          percentage,
          description: descEl ? cleanText(descEl.textContent || '') : '',
        });
      }
    });
    
    // טיימליין
    const timeline: TimelineStep[] = [];
    const timelineElements = doc.querySelectorAll('.timeline-item');
    timelineElements.forEach(tlEl => {
      const textEl = tlEl.querySelector('.text');
      if (textEl) {
        timeline.push({
          id: generateId(),
          title: cleanText(textEl.textContent || ''),
        });
      }
    });
    
    // הערות
    const notes: string[] = [];
    const noteElements = doc.querySelectorAll('.note');
    noteElements.forEach(noteEl => {
      const text = cleanText(noteEl.textContent || '');
      if (text) {
        notes.push(text);
      }
    });
    
    // תוקף
    const footerEl = doc.querySelector('.footer .validity');
    let validityDays = 30;
    if (footerEl) {
      const validityText = footerEl.textContent || '';
      const match = validityText.match(/(\d+)/);
      if (match) {
        validityDays = parseInt(match[1]);
      }
    }
    
    return {
      title,
      subtitle,
      location,
      price,
      stages,
      pricingTiers,
      upgrades,
      payments,
      timeline,
      notes,
      validityDays,
    };
  } catch (error) {
    console.error('Error parsing HTML template:', error);
    return null;
  }
}

// המרה לפורמט QuoteTemplate
export function convertToQuoteTemplate(parsed: ParsedTemplate, originalHtml?: string): Partial<QuoteTemplate> {
  // קטגוריה לפי כותרת
  let category = 'אחר';
  const titleLower = parsed.title.toLowerCase();
  if (titleLower.includes('היתר') || titleLower.includes('רישוי')) {
    category = 'היתר_בניה';
  } else if (titleLower.includes('תוספת') || titleLower.includes('הרחבה') || titleLower.includes('בניה')) {
    category = 'construction';
  } else if (titleLower.includes('שיפוץ')) {
    category = 'שיפוץ';
  } else if (titleLower.includes('פנים')) {
    category = 'תכנון_פנים';
  }
  
  return {
    name: parsed.title,
    description: parsed.subtitle || parsed.location,
    category,
    stages: parsed.stages,
    items: [], // הפריטים בשלבים
    payment_schedule: parsed.payments,
    timeline: parsed.timeline,
    important_notes: parsed.notes,
    validity_days: parsed.validityDays,
    base_price: parsed.price,
    show_vat: true,
    vat_rate: 17,
    is_active: true,
    design_settings: {
      ...DEFAULT_DESIGN_SETTINGS,
      primary_color: '#DAA520',
      secondary_color: '#B8860B',
      header_style: 'gradient',
    },
    html_content: originalHtml, // שמירת ה-HTML המקורי
  };
}

// ייבוא קובץ HTML
export async function importHtmlFile(file: File): Promise<Partial<QuoteTemplate> | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const html = e.target?.result as string;
      const parsed = parseHtmlTemplate(html);
      if (parsed) {
        resolve(convertToQuoteTemplate(parsed, html)); // שומר גם את ה-HTML המקורי
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file, 'utf-8');
  });
}
