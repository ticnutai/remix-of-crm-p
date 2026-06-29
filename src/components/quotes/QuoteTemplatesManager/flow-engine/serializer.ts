// Flow Engine — Layer 2: Serializer + Merger
// קלט: QuoteTemplate הקיים (ללא שינוי) + mergeData אופציונלי.
// פלט: FlowDocument זורם יחיד.
//
// כל ההיגיון של "תיבות / שדות / מיקומים" מהעורך הישן נעלם כאן —
// אנחנו מתעלמים מ-text_boxes ומ-html_content וקוראים רק את הנתונים המובנים:
// stages, items, payment_schedule, timeline, terms, notes, important_notes.

import type { QuoteTemplate, TemplateStage } from "../types";
import type {
  FlowBlock,
  FlowBranding,
  FlowDocument,
  FlowInline,
  FlowSection,
} from "./types";
import {
  applyProjectTokens,
  projectToMergeData,
  type ProjectTokenData,
} from "./projectTokens";

export type MergeData = Record<string, string | number | undefined | null>;

/** אפשרויות סריאליזציה. שומרות תאימות לאחור — ברירת מחדל = false. */
export interface SerializeOptions {
  /** שכבה 1: מיפוי סגנונות פר-פריט (צבע/פונט/גודל/Bold/Italic/Underline/יישור) מהתבנית לפלט הזורם. */
  preserveItemStyling?: boolean;
  /** פרטי פרויקט להזרמה לטוקנים כמו [גוש], [לקוח], "משפחת ___" וכו'. */
  projectDetails?: ProjectTokenData;
  /** הגדרות עיצוב חיות מהעורך, כולל לוגו/סטריפ שלא בהכרח נשמרו עדיין בתבנית. */
  designSettings?: any;
  /**
   * כשדלוק: לא לפתור טוקנים לטקסט סטטי — להשאיר אותם כשדות דינמיים
   * (`{type:"field"}`) כדי שהעורך יחליף אותם בערך החי מ"פרטי פרויקט".
   */
  keepFieldsAsPlaceholders?: boolean;
}

// מיפוי טוקנים בעברית (מסוגריים מרובעים) למפתחות שדה דינמי.
const HEBREW_TOKEN_TO_KEY: Record<string, string> = {
  "לקוח": "customer.name",
  "משפחה": "customer.name",
  "משפחת": "customer.name",
  "כתובת": "customer.address",
  "טלפון": "customer.phone",
  'דוא"ל': "customer.email",
  "דואל": "customer.email",
  "גוש": "parcel.block",
  "חלקה": "parcel.lot",
  "מגרש": "parcel.plot",
  "מושב": "parcel.moshav",
  'תב"ע': "parcel.taba",
  "תבע": "parcel.taba",
  "סוג פרויקט": "project.type",
};
function normalizeHebrewToken(raw: string): string | undefined {
  const t = String(raw || "").trim().replace(/[״“”]/g, '"');
  return HEBREW_TOKEN_TO_KEY[t];
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

/** בונה מחרוזת style מ-formatting של פריט; מחזיר ריק אם אין מה לשמור. */
function itemStyleString(it: {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  isUnderline?: boolean;
  isItalic?: boolean;
  textAlign?: "right" | "center" | "left";
}): string {
  const parts: string[] = [];
  if (it.fontColor) parts.push(`color:${it.fontColor}`);
  if (it.fontFamily) parts.push(`font-family:${it.fontFamily}`);
  if (it.fontSize) parts.push(`font-size:${it.fontSize}px`);
  if (it.isUnderline) parts.push("text-decoration:underline");
  if (it.isItalic) parts.push("font-style:italic");
  return parts.join(";");
}

/** מחליף {{path.to.value}} בתוך טקסט. ערכים חסרים נשארים כ-placeholder. */
function resolveField(key: string, data: MergeData | undefined): string {
  if (!data) return `{{${key}}}`;
  const value = data[key];
  if (value === undefined || value === null || value === "") return `{{${key}}}`;
  return String(value);
}

/**
 * מנקה טקסט שהגיע מהעורך הישן: מסיר תגיות HTML, מסיר CSS noise
 * (משתני --tw-, הצהרות style שדלפו), מצמצם רווחים.
 * זו הסיבה שבטאב Flow ראינו טקסטים כמו "--tw-translate-x: 0;".
 */
function sanitizeRaw(input: string | undefined | null): string {
  if (!input) return "";
  let s = String(input);
  // הסר בלוקי <style>...</style> ו-<script>...</script>
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  // החלף <br> ו-</p> ברווחי שורה לפני הסרת תגיות
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n");
  // הסר את כל תגיות ה-HTML
  s = s.replace(/<[^>]+>/g, "");
  // הסר רצפים של הצהרות CSS שדלפו (--tw-..., property: value;)
  s = s.replace(/--[a-z0-9-]+\s*:[^;]*;?/gi, "");
  s = s.replace(/\b(?:rgb|rgba|hsl|hsla)\s*\([^)]*\)/gi, "");
  // הסר הצהרות CSS כלליות שנותרו (key: value;) כשהן עומדות לבדן
  s = s.replace(/(?:^|\s)[a-z-]{3,30}\s*:\s*[^;\n]{1,80};/gi, " ");
  // Decode HTML entities בסיסיים
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  // נקה רווחים
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

let CURRENT_PD: ProjectTokenData | undefined;
let CURRENT_KEEP = false;

function pushFieldOrText(out: FlowInline[], text: string) {
  if (!CURRENT_KEEP) {
    if (text) out.push({ type: "text", text });
    return;
  }
  // במצב placeholder — סורקים גם טוקני [עברית] והופכים אותם לשדות דינמיים
  const re = /\[([^\[\]\n]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = normalizeHebrewToken(m[1]);
    if (!key) continue;
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push({ type: "field", key });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
}

function textToInlines(raw: string, data?: MergeData): FlowInline[] {
  let clean = sanitizeRaw(raw);
  if (CURRENT_PD && !CURRENT_KEEP) clean = applyProjectTokens(clean, CURRENT_PD);
  if (!clean) return [{ type: "text", text: "" }];
  const out: FlowInline[] = [];
  const regex = /\{\{\s*([^}\s]+)\s*\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      pushFieldOrText(out, clean.slice(lastIndex, match.index));
    }
    if (CURRENT_KEEP) {
      out.push({ type: "field", key: match[1] });
    } else {
      out.push({ type: "text", text: resolveField(match[1], data) });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < clean.length) {
    pushFieldOrText(out, clean.slice(lastIndex));
  }
  return out.length ? out : [{ type: "text", text: "" }];
}

function buildStageBlocks(
  stage: TemplateStage,
  data?: MergeData,
  opts?: SerializeOptions,
): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  if (stage.name) {
    blocks.push({
      type: "heading",
      level: stage.isSection ? 2 : 3,
      content: textToInlines(stage.name, data),
    });
  }
  const items = (stage.items || []).filter((it) => !it.isSpacer);
  if (items.length) {
    blocks.push({
      type: "list",
      ordered: stage.itemDisplayMode === "numbered",
      items: items.map((it) => {
        const inlines = textToInlines(it.text || "", data);
        if (it.isBold) inlines.forEach((n) => (n.type === "text" ? (n.bold = true) : null));
        // שכבה 1: עיטוף בסגנון פר-פריט שמרוצף עד ל-PDF
        if (opts?.preserveItemStyling) {
          const style = itemStyleString(it);
          if (style) {
            // ממירים את האינליינים למחרוזת HTML זמנית ועוטפים ב-span עם style
            const inner = inlines
              .map((n) => {
                if (n.type === "raw") return n.html;
                if (n.type === "field")
                  return `<span data-field="${esc(n.key)}">{{${esc(n.key)}}}</span>`;
                let t = esc(n.text);
                if (n.bold) t = `<strong>${t}</strong>`;
                if (n.italic) t = `<em>${t}</em>`;
                if (n.color) t = `<span style="color:${esc(n.color)}">${t}</span>`;
                return t;
              })
              .join("");
            return [
              { type: "raw", html: `<span style="${style}">${inner}</span>` } as FlowInline,
            ];
          }
        }
        return inlines;
      }),
    });
  }
  return blocks;
}

export function serializeTemplate(
  template: QuoteTemplate,
  data?: MergeData,
  opts?: SerializeOptions,
): FlowDocument {
  CURRENT_PD = opts?.projectDetails;
  CURRENT_KEEP = Boolean(opts?.keepFieldsAsPlaceholders);
  // מיזוג מפתחות {{customer.*}} / {{parcel.*}} מתוך פרטי הפרויקט.
  const mergedData: MergeData = { ...projectToMergeData(opts?.projectDetails), ...(data || {}) };
  data = mergedData;
  const ds: any = { ...(template.design_settings || {}), ...(opts?.designSettings || {}) };
  const contact = ds.contact_info || ds.contactInfo || {};
  const logoUrl = firstValue(ds.logoUrl, ds.logo_url, ds.logoURL, ds.originalLogoUrl, ds.original_logo_url);
  const logoPosition = firstValue(ds.logoPosition, ds.logo_position);
  const isStripLogo = logoPosition === "custom-strip" || logoPosition === "full-width";
  const headerStripUrl = firstValue(
    ds.headerStripUrl,
    ds.header_strip_url,
    ds.stripUrl,
    ds.strip_url,
    isStripLogo ? logoUrl : undefined,
  );
  const footerStripUrl = firstValue(
    ds.footerStripUrl,
    ds.footer_strip_url,
    ds.footerLogoUrl,
    ds.footer_logo_url,
    isStripLogo ? logoUrl : undefined,
  );
  const headerStripWidthPercent = Number(firstValue(ds.headerStripWidthPercent, ds.header_strip_width_percent));
  const footerStripWidthPercent = Number(firstValue(ds.footerStripWidthPercent, ds.footer_strip_width_percent));
  const headerStripHeightPx = Number(ds.headerStripHeight);
  const footerStripHeightPx = Number(ds.footerStripHeight);

  const branding: FlowBranding = {
    logoUrl,
    headerStripUrl,
    footerStripUrl,
    stripBgColor: firstValue(ds.stripBgColor, ds.strip_bg_color, "#ffffff"),
    headerStripHeight: Math.max(0, Number.isFinite(headerStripHeightPx) ? Math.round(headerStripHeightPx) : 150),
    footerStripHeight: Math.max(0, Number.isFinite(footerStripHeightPx) ? Math.round(footerStripHeightPx) : 90),
    headerStripWidthPercent: Number.isFinite(headerStripWidthPercent) ? Math.round(headerStripWidthPercent) : 100,
    footerStripWidthPercent: Number.isFinite(footerStripWidthPercent) ? Math.round(footerStripWidthPercent) : 100,
    companyName: firstValue(ds.companyName, ds.company_name, ""),
    companySubtitle: firstValue(ds.companySubtitle, ds.company_subtitle, ""),
    contactLine: [contact.phone, contact.email, contact.address].filter(Boolean).join("  |  "),
    primaryColor: firstValue(ds.secondaryColor, ds.secondary_color, "#162C58"),
    accentColor: firstValue(ds.primaryColor, ds.primary_color, ds.accentColor, ds.accent_color, "#d8ac27"),
    fontFamily: "Heebo, Arial, sans-serif",
  };

  const sections: FlowSection[] = [];

  // 1. כותרת ראשית
  sections.push({
    id: "title",
    keepTogether: true,
    blocks: [
      {
        type: "heading",
        level: 1,
        content: textToInlines(template.name || "הצעת מחיר", data),
      },
      ...(template.description
        ? [
            {
              type: "paragraph" as const,
              content: textToInlines(template.description, data),
            },
          ]
        : []),
      { type: "spacer", mm: 4 },
    ],
  });

  // 2. שלבי עבודה
  const stageBlocks: FlowBlock[] = [];
  if (template.stagesTitle) {
    stageBlocks.push({
      type: "heading",
      level: 2,
      content: textToInlines(template.stagesTitle, data),
    });
  }
  (template.stages || []).forEach((stage) => {
    stageBlocks.push(...buildStageBlocks(stage, data, opts));
  });
  if (stageBlocks.length) {
    sections.push({ id: "stages", blocks: stageBlocks });
  }

  // 3. פריטים (טבלה זורמת, ניתנת לחיתוך בין עמודים)
  if (template.items && template.items.length) {
    sections.push({
      id: "items",
      blocks: [
        {
          type: "heading",
          level: 2,
          content: [{ type: "text", text: "פירוט עלויות" }],
        },
        {
          type: "table",
          breakable: true,
          headers: ["תיאור", "כמות", "יחידה", 'מחיר ליח׳', 'סה"כ'],
          rows: template.items.map((it) => [
            it.description ?? "",
            String(it.quantity ?? ""),
            it.unit ?? "",
            (it.unit_price ?? 0).toLocaleString("he-IL"),
            (it.total ?? 0).toLocaleString("he-IL"),
          ]),
        },
      ],
    });
  }

  // 4. לוח תשלומים — כולל סכומי כסף ומע״מ פר שלב
  if (template.payment_schedule && template.payment_schedule.length) {
    const basePrice = Number(template.base_price) || 0;
    const defaultVat = Number(template.vat_rate) || 0;
    const showVat = template.show_vat !== false;
    const fmt = (n: number) =>
      `₪${Math.round(n).toLocaleString("he-IL")}`;

    sections.push({
      id: "payments",
      keepTogether: true,
      blocks: [
        {
          type: "heading",
          level: 2,
          content: [{ type: "text", text: "לוח תשלומים" }],
        },
        {
          type: "list",
          ordered: true,
          items: template.payment_schedule.map((p: any) => {
            const amount = basePrice * (Number(p.percentage) || 0) / 100;
            const vatRate =
              p.useCustomVat && typeof p.vatRate === "number"
                ? p.vatRate
                : defaultVat;
            const withVat = amount * (1 + vatRate / 100);

            const inlines: FlowInline[] = [
              { type: "text", text: `${p.percentage}% — `, bold: true },
              ...textToInlines(p.description || "", data),
            ];
            if (basePrice > 0) {
              const moneyText = showVat
                ? ` — ${fmt(amount)} + מע״מ ${vatRate}% = ${fmt(withVat)}`
                : ` — ${fmt(amount)}`;
              inlines.push({ type: "text", text: moneyText });
            }
            return inlines;
          }),
        },
      ],
    });
  }

  // 5. לוח זמנים
  if (template.timeline && template.timeline.length) {
    sections.push({
      id: "timeline",
      keepTogether: true,
      blocks: [
        {
          type: "heading",
          level: 2,
          content: [{ type: "text", text: "לוח זמנים" }],
        },
        {
          type: "list",
          ordered: true,
          items: template.timeline.map((s) => [
            { type: "text", text: s.title || "", bold: true },
            ...(s.duration
              ? ([{ type: "text", text: ` — ${s.duration}` }] as FlowInline[])
              : []),
          ]),
        },
      ],
    });
  }

  // 6. הערות חשובות
  if (template.important_notes && template.important_notes.length) {
    sections.push({
      id: "notes",
      keepTogether: true,
      blocks: [
        {
          type: "heading",
          level: 2,
          content: [{ type: "text", text: "הערות חשובות" }],
        },
        {
          type: "list",
          items: template.important_notes.map((n) => textToInlines(n, data)),
        },
      ],
    });
  }

  // 7. תנאים והערות
  if (template.terms) {
    sections.push({
      id: "terms",
      blocks: [
        { type: "heading", level: 2, content: [{ type: "text", text: "תנאים" }] },
        { type: "paragraph", content: textToInlines(template.terms, data) },
      ],
    });
  }
  if (template.notes) {
    sections.push({
      id: "extra-notes",
      blocks: [
        { type: "heading", level: 2, content: [{ type: "text", text: "הערות נוספות" }] },
        { type: "paragraph", content: textToInlines(template.notes, data) },
      ],
    });
  }

  return {
    title: template.name || "הצעת מחיר",
    branding,
    page: {
      size: "A4",
      marginMm: { top: headerStripUrl ? 36 : 32, right: 18, bottom: footerStripUrl ? 30 : 28, left: 18 },
      showPageNumbers: true,
    },
    sections,
  };
}
