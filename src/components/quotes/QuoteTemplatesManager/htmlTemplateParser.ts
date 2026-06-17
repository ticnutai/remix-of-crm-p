// פארסר HTML לייבוא טמפלטים מקבצי HTML
import {
  QuoteTemplate,
  TemplateStage,
  TemplateStageItem,
  PaymentStep,
  TimelineStep,
  DEFAULT_DESIGN_SETTINGS,
} from "./types";

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
  const match = text.replace(/[,₪]/g, "").match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// ניקוי טקסט
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// פירוס HTML לטמפלט
export function parseHtmlTemplate(html: string): ParsedTemplate | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // כותרת
    const titleEl = doc.querySelector(".header h1");
    const title = titleEl
      ? cleanText(titleEl.textContent || "")
      : "טמפלט מיובא";

    // תת-כותרת
    const subtitleEl = doc.querySelector(".header .subtitle");
    const subtitle = subtitleEl ? cleanText(subtitleEl.textContent || "") : "";

    // מיקום
    const locationEl = doc.querySelector(".header .location");
    const location = locationEl ? cleanText(locationEl.textContent || "") : "";

    // מחיר ראשי
    const priceEl = doc.querySelector(".header .price");
    const priceText = priceEl ? priceEl.textContent || "" : "";
    const price = extractPrice(priceText);

    // חבילות מחיר (pricing tiers)
    const pricingTiers: PricingTier[] = [];
    const tierElements = doc.querySelectorAll(".tier");
    tierElements.forEach((tierEl) => {
      const nameEl = tierEl.querySelector("h3");
      const priceEl = tierEl.querySelector(".tier-price");
      const descEl = tierEl.querySelector(".tier-description");
      const featureEls = tierEl.querySelectorAll("ul li");

      const features: string[] = [];
      featureEls.forEach((li) => {
        features.push(cleanText(li.textContent || ""));
      });

      pricingTiers.push({
        name: nameEl ? cleanText(nameEl.textContent || "") : "",
        price: priceEl ? extractPrice(priceEl.textContent || "") : 0,
        description: descEl ? cleanText(descEl.textContent || "") : "",
        features,
        isRecommended: tierEl.classList.contains("recommended"),
      });
    });

    // שידרוגים
    const upgrades: Upgrade[] = [];
    const upgradeElements = doc.querySelectorAll(".upgrades .upgrade");
    upgradeElements.forEach((upEl) => {
      const nameEl = upEl.querySelector("h4");
      const priceEl = upEl.querySelector(".upgrade-price");
      const descEl = upEl.querySelector("p");

      upgrades.push({
        name: nameEl ? cleanText(nameEl.textContent || "") : "",
        price: priceEl ? extractPrice(priceEl.textContent || "") : 0,
        description: descEl ? cleanText(descEl.textContent || "") : "",
      });
    });

    // שלבים (sections)
    const stages: TemplateStage[] = [];
    const sectionElements = doc.querySelectorAll(".section");
    sectionElements.forEach((secEl) => {
      const titleEl = secEl.querySelector(".section-title");
      if (!titleEl) return;

      const sectionTitle = cleanText(titleEl.textContent || "");

      // דלג על חבילות מחיר ושידרוגים - הם נפרדים
      if (
        sectionTitle.includes("חבילות מחיר") ||
        sectionTitle.includes("שידרוגים ותוספות")
      ) {
        return;
      }

      const items: TemplateStageItem[] = [];
      const itemElements = secEl.querySelectorAll(".item");
      itemElements.forEach((itemEl) => {
        const textEl = itemEl.querySelector(".text");
        const upgradeEl = itemEl.querySelector(".upgrade-price");

        let text = textEl ? cleanText(textEl.textContent || "") : "";
        if (upgradeEl) {
          text += ` (שידרוג: ${cleanText(upgradeEl.textContent || "")})`;
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
        const icon = iconMatch ? iconMatch[1] : "📋";
        const name = sectionTitle.replace(/^\p{Emoji}\s*/u, "").trim();

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
    const paymentElements = doc.querySelectorAll(".payment");
    paymentElements.forEach((payEl) => {
      const percentEl = payEl.querySelector(".percentage");
      const descEl = payEl.querySelector(".description");

      const percentText = percentEl ? percentEl.textContent || "" : "";
      const percentage = parseInt(percentText.replace(/[^0-9]/g, "")) || 0;

      if (percentage > 0) {
        payments.push({
          id: generateId(),
          percentage,
          description: descEl ? cleanText(descEl.textContent || "") : "",
        });
      }
    });

    // טיימליין
    const timeline: TimelineStep[] = [];
    const timelineElements = doc.querySelectorAll(".timeline-item");
    timelineElements.forEach((tlEl) => {
      const textEl = tlEl.querySelector(".text");
      if (textEl) {
        timeline.push({
          id: generateId(),
          title: cleanText(textEl.textContent || ""),
        });
      }
    });

    // הערות
    const notes: string[] = [];
    const noteElements = doc.querySelectorAll(".note");
    noteElements.forEach((noteEl) => {
      const text = cleanText(noteEl.textContent || "");
      if (text) {
        notes.push(text);
      }
    });

    // תוקף
    const footerEl = doc.querySelector(".footer .validity");
    let validityDays = 30;
    if (footerEl) {
      const validityText = footerEl.textContent || "";
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
    console.error("Error parsing HTML template:", error);
    return null;
  }
}

// המרה לפורמט QuoteTemplate
export function convertToQuoteTemplate(
  parsed: ParsedTemplate,
  originalHtml?: string,
): Partial<QuoteTemplate> {
  // קטגוריה לפי כותרת
  // category values must match DB CHECK constraint: construction, consulting, design, development, marketing, other
  let category = "other";
  const titleLower = parsed.title.toLowerCase();
  if (titleLower.includes("היתר") || titleLower.includes("רישוי")) {
    category = "development";
  } else if (
    titleLower.includes("תוספת") ||
    titleLower.includes("הרחבה") ||
    titleLower.includes("בניה") ||
    titleLower.includes("בנייה")
  ) {
    category = "construction";
  } else if (titleLower.includes("שיפוץ")) {
    category = "marketing";
  } else if (titleLower.includes("פנים") || titleLower.includes("עיצוב")) {
    category = "design";
  } else if (titleLower.includes("פיקוח") || titleLower.includes("ייעוץ")) {
    category = "consulting";
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
      primary_color: "#DAA520",
      secondary_color: "#B8860B",
      header_style: "gradient",
    },
    html_content: originalHtml, // שמירת ה-HTML המקורי
  };
}

// Extract meaningful content from generic/Word HTML (fallback when our class-based parser finds nothing)
function parseGenericHtmlToTemplate(
  html: string,
  fileName: string,
): Partial<QuoteTemplate> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove non-content elements
  doc
    .querySelectorAll("style, script, meta, link")
    .forEach((el) => el.remove());

  // Title: prefer first meaningful heading, then <title>, then filename
  let title = "תבנית מיובאת";
  const docTitle = doc.title?.trim();
  if (docTitle && docTitle.length > 1) title = docTitle;
  for (const sel of ["h1", "h2", "h3"]) {
    const el = doc.querySelector(sel);
    const t = el?.textContent?.trim();
    if (t && t.length > 1 && t.length < 120) {
      title = cleanText(t);
      break;
    }
  }
  if (title === "תבנית מיובאת" && fileName) {
    title = fileName.replace(/\.(html?|htm)$/i, "").replace(/[_-]/g, " ").trim() || title;
  }

  const stages: TemplateStage[] = [];

  // Extract table rows as a stage
  const tableRows = doc.querySelectorAll("table tr");
  if (tableRows.length > 0) {
    const tableItems: TemplateStageItem[] = [];
    tableRows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const cellTexts = cells
        .map((c) => cleanText(c.textContent || ""))
        .filter(Boolean);
      if (cellTexts.length === 0) return;
      const rowText = cellTexts.join(" | ");
      if (rowText.length > 2) {
        tableItems.push({ id: generateId(), text: rowText });
      }
    });
    if (tableItems.length > 0) {
      stages.push({
        id: generateId(),
        name: "פרטי הצעה",
        icon: "📋",
        items: tableItems,
        isExpanded: true,
      });
    }
  }

  // Extract non-table paragraph/list text
  const paraItems: TemplateStageItem[] = [];
  doc.querySelectorAll("p, li").forEach((el) => {
    if (el.closest("table")) return;
    const text = cleanText(el.textContent || "");
    if (text.length > 5) {
      paraItems.push({ id: generateId(), text });
    }
  });
  if (paraItems.length > 0) {
    stages.push({
      id: generateId(),
      name: "תוכן מיובא",
      icon: "📄",
      items: paraItems,
      isExpanded: true,
    });
  }

  // Best-effort price extraction from full body text
  const bodyText = cleanText(doc.body?.textContent || "");
  const price = extractPrice(bodyText);

  return {
    name: title,
    description: `מיובא מקובץ: ${fileName}`,
    category: "other",
    stages,
    items: [],
    payment_schedule: [
      { id: generateId(), percentage: 50, description: "חתימת חוזה" },
      { id: generateId(), percentage: 50, description: "סיום העבודה" },
    ],
    timeline: [],
    important_notes: [],
    validity_days: 30,
    base_price: price,
    show_vat: true,
    vat_rate: 17,
    is_active: true,
    html_content: html,
    design_settings: {
      ...DEFAULT_DESIGN_SETTINGS,
      primary_color: "#DAA520",
      secondary_color: "#B8860B",
      header_style: "gradient",
    },
  };
}

// ייבוא קובץ HTML
export async function importHtmlFile(
  file: File,
): Promise<Partial<QuoteTemplate> | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;

      // Detect charset from meta tag using Latin-1 (all meta tags are ASCII-safe)
      const latin1Preview = new TextDecoder("iso-8859-1").decode(
        buffer.slice(0, 4096),
      );
      const charsetMatch = latin1Preview.match(
        /charset\s*=\s*["']?([^"'\s;>\r\n]+)/i,
      );
      const detectedCharset = charsetMatch?.[1] ?? "utf-8";

      let html: string;
      try {
        html = new TextDecoder(detectedCharset).decode(buffer);
      } catch {
        // Fallback for unknown charset labels
        html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      }

      // Try our structured parser first (for templates exported from this system)
      const parsed = parseHtmlTemplate(html);
      const hasStructuredContent =
        parsed &&
        (parsed.stages.length > 0 ||
          parsed.pricingTiers.length > 0 ||
          parsed.price > 0 ||
          parsed.title !== "טמפלט מיובא");

      if (hasStructuredContent) {
        resolve(convertToQuoteTemplate(parsed!, html));
        return;
      }

      // Fallback: generic extraction for Word/arbitrary HTML files
      resolve(parseGenericHtmlToTemplate(html, file.name));
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}
