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

export type MergeData = Record<string, string | number | undefined | null>;

/** מחליף {{path.to.value}} בתוך טקסט. ערכים חסרים נשארים כ-placeholder. */
function resolveField(key: string, data: MergeData | undefined): string {
  if (!data) return `{{${key}}}`;
  const value = data[key];
  if (value === undefined || value === null || value === "") return `{{${key}}}`;
  return String(value);
}

function textToInlines(raw: string, data?: MergeData): FlowInline[] {
  if (!raw) return [];
  const out: FlowInline[] = [];
  const regex = /\{\{\s*([^}\s]+)\s*\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      out.push({ type: "text", text: raw.slice(lastIndex, match.index) });
    }
    out.push({ type: "text", text: resolveField(match[1], data) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) {
    out.push({ type: "text", text: raw.slice(lastIndex) });
  }
  return out.length ? out : [{ type: "text", text: "" }];
}

function buildStageBlocks(
  stage: TemplateStage,
  data?: MergeData,
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
        return inlines;
      }),
    });
  }
  return blocks;
}

export function serializeTemplate(
  template: QuoteTemplate,
  data?: MergeData,
): FlowDocument {
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
    stageBlocks.push(...buildStageBlocks(stage, data));
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

  // 4. לוח תשלומים
  if (template.payment_schedule && template.payment_schedule.length) {
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
          items: template.payment_schedule.map((p) => [
            { type: "text", text: `${p.percentage}% — `, bold: true },
            ...textToInlines(p.description || "", data),
          ]),
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
