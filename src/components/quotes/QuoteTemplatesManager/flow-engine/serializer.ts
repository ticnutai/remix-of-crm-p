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
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

function textToInlines(raw: string, data?: MergeData): FlowInline[] {
  let clean = sanitizeRaw(raw);
  if (CURRENT_PD) clean = applyProjectTokens(clean, CURRENT_PD);
  if (!clean) return [{ type: "text", text: "" }];
  const out: FlowInline[] = [];
  const regex = /\{\{\s*([^}\s]+)\s*\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      out.push({ type: "text", text: clean.slice(lastIndex, match.index) });
    }
    out.push({ type: "text", text: resolveField(match[1], data) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < clean.length) {
    out.push({ type: "text", text: clean.slice(lastIndex) });
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
  // מיזוג מפתחות {{customer.*}} / {{parcel.*}} מתוך פרטי הפרויקט.
  const mergedData: MergeData = { ...projectToMergeData(opts?.projectDetails), ...(data || {}) };
  data = mergedData;
  const ds = template.design_settings;

  const branding: FlowBranding = {
    logoUrl: ds.logo_url,
    companyName: ds.company_name || "",
    companySubtitle: ds.company_subtitle || "",
    contactLine: [ds.contact_info?.phone, ds.contact_info?.email, ds.contact_info?.address]
      .filter(Boolean)
      .join("  |  "),
    primaryColor: ds.secondary_color || "#162C58",
    accentColor: ds.primary_color || "#d8ac27",
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
      marginMm: { top: 32, right: 18, bottom: 28, left: 18 },
      showPageNumbers: true,
    },
    sections,
  };
}
